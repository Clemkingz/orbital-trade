/**
 * Mock API that runs in the browser. Implements the same routes the screens call
 * (`/auth/*`, `/me/*`, `/admin/*` …) on top of localStorage, so the product works end to end
 * without a backend. Replace with the real API by setting NEXT_PUBLIC_API_MODE=live.
 *
 * The PRD's hard rules are still modelled here:
 *  - balances are only ever SUM(ledger); admins change them only by posting ledger entries
 *  - profit comes from trader trades mirrored to copiers, converted to BTC at the exit price
 *  - KYC gates every money route; every admin action is written to the audit log
 */
import type { AdjustmentReason } from "@orbit/shared";
import { BRAND } from "../config";
import type { MLedger, MState, MTrade, MUser } from "./db";
import { load, save } from "./db";
import { checkPassword, generateTotpSecret, hashPassword, imageToDataUrl, otpauthUrl, randomId, sixDigitCode, verifyTotp } from "./crypto";

export class MockHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const fail = (status: number, message: string): never => {
  throw new MockHttpError(status, message);
};

/* ── Money ────────────────────────────────────────────────────── */
const COUNTRY_CURRENCY: Record<string, string> = { NG: "NGN", GH: "GHS", KE: "KES", ZA: "ZAR", GB: "GBP", US: "USD", CA: "CAD", AE: "AED" };
const FX: Record<string, number> = { USD: 1, NGN: 1560, GHS: 15.4, KES: 129.5, ZAR: 18.2, GBP: 0.79, CAD: 1.38, AED: 3.6725 };
const BTC_USD = Number(process.env.NEXT_PUBLIC_BTC_USD_PRICE) || 96_420;
const r8 = (n: number) => Math.round(n * 1e8) / 1e8;
const r2 = (n: number) => Math.round(n * 100) / 100;
const btcPriceIn = (cur: string) => BTC_USD * (FX[cur] ?? 1);

export const LIMITS = { adjustmentSecondApprovalBtc: 0.05, withdrawalAdminApprovalBtc: 0.1, withdrawalFeeBtc: 0.0001, positionFraction: 0.25 };

/* ── Helpers ──────────────────────────────────────────────────── */
const now = () => new Date().toISOString();
const isAdmin = (u: MUser) => u.role === "ADMIN" || u.role === "SUPER_ADMIN";
const fullName = (u: MUser) => `${u.firstName} ${u.lastName}`;
const tickets = new Map<string, { userId: string; purpose: "signin" | "setup"; expires: number }>();

const publicUser = (u: MUser) => ({
  id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone, country: u.country, currency: u.currency,
  role: u.role, status: u.status, kycStatus: u.kycStatus, kycReason: u.kycReason, totpEnabled: u.totpEnabled, createdAt: u.createdAt, emailVerified: !!u.emailVerifiedAt,
});

function post(s: MState, user: MUser, e: Omit<MLedger, "id" | "userId" | "fiatAmount" | "fiatCurrency" | "btcPrice" | "createdAt" | "approvedBy" | "adjustmentReason" | "note" | "reference"> & Partial<Pick<MLedger, "approvedBy" | "adjustmentReason" | "note" | "reference">>) {
  const price = btcPriceIn(user.currency);
  const amountBtc = r8(e.amountBtc);
  s.ledger.push({ id: randomId("l"), userId: user.id, reference: null, adjustmentReason: null, note: null, approvedBy: null, ...e, amountBtc, fiatAmount: r2(amountBtc * price), fiatCurrency: user.currency, btcPrice: price, createdAt: now() });
}

function notify(s: MState, user: MUser, title: string, body: string) {
  s.notifications.push({ id: randomId("n"), userId: user.id, title, body, read: false, createdAt: now() });
}

function audit(s: MState, actor: MUser, action: string, target: string) {
  const role = actor.role === "SUPER_ADMIN" ? " (super admin)" : " (admin)";
  s.audit.unshift({ id: randomId("a"), actorName: fullName(actor) + role, action, target, ip: "127.0.0.1", createdAt: now() });
}

/** Balance, deposited and profit — all derived from ledger entries. */
function summary(s: MState, user: MUser) {
  const entries = s.ledger.filter((e) => e.userId === user.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const sum = (f: (e: MLedger) => boolean) => r8(entries.filter(f).reduce((t, e) => t + e.amountBtc, 0));
  const total = sum(() => true);
  const deposited = sum((e) => e.type === "DEPOSIT" || (e.type === "ADJUSTMENT" && e.adjustmentReason === "DEPOSIT_CREDIT"));
  const profit = sum((e) => e.type === "TRADE_PNL" || e.type === "FEE");
  const allocated = r8(s.copies.filter((c) => c.userId === user.id && c.status !== "STOPPED").reduce((t, c) => t + c.allocationBtc, 0));
  const price = btcPriceIn(user.currency);
  const both = (btc: number) => ({ btc, fiat: r2(btc * price) });
  return { currency: user.currency, btcPrice: r2(price), btcUsd: BTC_USD, balance: both(total), deposited: both(deposited), profit: both(profit), allocated: both(allocated), available: both(Math.max(0, r8(total - allocated))), entries };
}

function dashboardFor(s: MState, user: MUser) {
  const sm = summary(s, user);
  const copies = s.copies.filter((c) => c.userId === user.id && c.status !== "STOPPED");
  const verified = user.kycStatus === "APPROVED";
  const segments = ["all", verified ? "verified" : "unverified", ...(copies.some((c) => c.status === "ACTIVE") ? ["copiers"] : [])];
  const pnl: Record<string, number> = {};
  for (const e of sm.entries) if (e.reference?.startsWith("trader:") && (e.type === "TRADE_PNL" || e.type === "FEE")) pnl[e.reference.slice(7)] = r8((pnl[e.reference.slice(7)] ?? 0) + e.amountBtc);
  const { entries, ...balances } = sm;
  return {
    ...balances,
    recent: entries.slice(0, 8),
    tiles: s.config.tiles,
    announcements: s.config.announcements.filter((a) => segments.includes(a.segment)),
    copies: copies.map((c) => {
      const t = s.traders.find((x) => x.id === c.traderId)!;
      return { id: c.id, status: c.status, allocationBtc: c.allocationBtc, stopLossPct: c.stopLossPct, pnlBtc: pnl[c.traderId] ?? 0, trader: { id: t.id, name: t.name, photoUrl: t.photoUrl, hue: t.hue } };
    }),
    depositAddress: verified ? activeWallet(s)?.address ?? null : null,
    notifications: s.notifications.filter((n) => n.userId === user.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 20),
    claims: s.claims.filter((c) => c.userId === user.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    lastBuyRedirectAt: user.lastBuyRedirectAt,
  };
}

const activeWallet = (s: MState) => s.wallets.find((w) => !w.activeTo) ?? s.wallets[0];

const tradeReturn = (t: Pick<MTrade, "entry" | "exit" | "side">) => ((t.exit - t.entry) / t.entry) * (t.side === "BUY" ? 1 : -1);

function traderStats(trades: MTrade[]) {
  const closed = [...trades].sort((a, b) => +new Date(a.closedAt) - +new Date(b.closedAt));
  const wins = closed.filter((t) => tradeReturn(t) > 0).length;
  const losses = closed.filter((t) => tradeReturn(t) < 0).length;
  const windowReturn = (days: number) => (closed.filter((t) => +new Date(t.closedAt) >= Date.now() - days * 86_400_000).reduce((eq, t) => eq * (1 + tradeReturn(t) * LIMITS.positionFraction), 1) - 1) * 100;
  let eq = 1, peak = 1, dd = 0;
  for (const t of closed) {
    eq *= 1 + tradeReturn(t) * LIMITS.positionFraction;
    peak = Math.max(peak, eq);
    dd = Math.max(dd, (peak - eq) / peak);
  }
  return { wins, losses, winRate: closed.length ? (wins / closed.length) * 100 : 0, return30: windowReturn(30), return90: windowReturn(90), maxDrawdown: dd * 100, closedTrades: closed.length };
}

const traderView = (s: MState, id: string) => {
  const t = s.traders.find((x) => x.id === id)!;
  const trades = s.trades.filter((x) => x.traderId === id);
  return { ...t, copiers: s.copies.filter((c) => c.traderId === id && c.status !== "STOPPED").length, stats: traderStats(trades) };
};

/**
 * FR-7.4 — mirror a closed trade to every active copier. Each copier's profit is calculated in
 * USD from the trade prices, converted to BTC at the exit price, and posted as TRADE_PNL (+ FEE).
 */
function mirror(s: MState, trade: MTrade) {
  const trader = s.traders.find((t) => t.id === trade.traderId)!;
  const r = tradeReturn(trade);
  const subs = s.copies.filter((c) => c.traderId === trade.traderId && c.status === "ACTIVE" && +new Date(c.createdAt) <= +new Date(trade.openedAt));
  for (const sub of subs) {
    const user = s.users.find((u) => u.id === sub.userId)!;
    const pnlBtc = r8((sub.allocationBtc * LIMITS.positionFraction * trade.entry * r) / trade.exit);
    if (pnlBtc === 0) continue;
    post(s, user, { type: "TRADE_PNL", amountBtc: pnlBtc, reference: `trader:${trader.id}`, note: `${trader.name} · ${trade.side} ${trade.entry.toLocaleString()} → ${trade.exit.toLocaleString()}`, createdBy: "system" });
    if (pnlBtc > 0 && trader.feePct > 0) post(s, user, { type: "FEE", amountBtc: -r8(pnlBtc * (trader.feePct / 100)), reference: `trader:${trader.id}`, note: `Performance fee ${trader.feePct}%`, createdBy: "system" });
    const fiat = r2(pnlBtc * btcPriceIn(user.currency));
    notify(s, user, pnlBtc > 0 ? `Profit from ${trader.name}` : `Loss from ${trader.name}`, `A copied trade closed: ${pnlBtc > 0 ? "+" : ""}${pnlBtc} BTC (≈ ${fiat.toLocaleString()} ${user.currency}).`);
    // Stop-loss
    if (sub.stopLossPct) {
      const total = s.ledger.filter((e) => e.userId === user.id && e.reference === `trader:${trader.id}` && +new Date(e.createdAt) >= +new Date(sub.createdAt)).reduce((t, e) => t + e.amountBtc, 0);
      if (total <= -sub.allocationBtc * (sub.stopLossPct / 100)) {
        sub.status = "STOPPED";
        notify(s, user, "Stop-loss triggered", `We stopped copying ${trader.name} because your ${sub.stopLossPct}% stop-loss was reached.`);
      }
    }
  }
  trade.mirroredAt = now();
  return subs.length;
}

/* ── Session guards ───────────────────────────────────────────── */
function requireUser(s: MState) {
  const u = s.users.find((x) => x.id === s.sessions.user && x.role === "USER");
  if (!u) fail(401, "Please sign in.");
  if (u!.status === "SUSPENDED") fail(403, "This account is suspended. Contact support.");
  return u!;
}
function requireKyc(u: MUser) {
  if (u.kycStatus !== "APPROVED") fail(403, "Verify your ID to unlock deposits and copy trading.");
}
function requireAdmin(s: MState) {
  const u = s.users.find((x) => x.id === s.sessions.admin);
  if (!u) fail(401, "Please sign in to the console.");
  if (!isAdmin(u!) || u!.status !== "ACTIVE") fail(403, "Admin access required.");
  return u!;
}
const requireSuper = (u: MUser) => u.role !== "SUPER_ADMIN" && fail(403, "Super admin access required.");

const BTC_ADDR = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COMMON_PASSWORDS = new Set(["password123", "1234567890", "qwertyuiop", "password1234", "bitcoin1234"]);

function checkNewPassword(pw: unknown) {
  if (typeof pw !== "string" || pw.length < 10) fail(400, "Use at least 10 characters.");
  if (COMMON_PASSWORDS.has(String(pw).toLowerCase())) fail(400, "This password appears in known data breaches. Choose a different one.");
}

function issueCode(s: MState, user: MUser, purpose: "email" | "reset" | "withdrawal", ttlMin: number) {
  const code = purpose === "reset" ? randomId("r") + randomId() : sixDigitCode();
  s.codes.push({ userId: user.id, purpose, code, expiresAt: Date.now() + ttlMin * 60_000, used: false });
  return code;
}
function useCode(s: MState, user: MUser | undefined, purpose: string, code: string) {
  const c = s.codes.find((x) => (!user || x.userId === user.id) && x.purpose === purpose && !x.used && x.expiresAt > Date.now() && x.code === code);
  if (c) c.used = true;
  return c;
}

/* ── Routes ───────────────────────────────────────────────────── */
type Body = Record<string, unknown>;
type Ctx = { s: MState; body: Body; form: FormData | null; params: string[]; query: URLSearchParams };
type Handler = (c: Ctx) => unknown | Promise<unknown>;
const routes: [string, RegExp, Handler][] = [];
const on = (method: string, path: string, h: Handler) => routes.push([method, new RegExp(`^${path.replace(/:[a-z]+/gi, "([^/]+)")}$`), h]);

/* Auth — users */
on("POST", "/auth/sign-up", async ({ s, body: b }) => {
  if (!b.acceptTerms) fail(400, "Accept the terms and risk disclosure to continue.");
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) fail(400, "Enter a valid email address.");
  checkNewPassword(b.password);
  if (s.users.some((u) => u.email === email)) fail(409, "An account with this email already exists. Sign in instead.");
  const { salt, hash } = await hashPassword(String(b.password));
  const user: MUser = {
    id: randomId("u"), firstName: String(b.firstName).trim(), lastName: String(b.lastName).trim(), email, phone: String(b.phone ?? ""), country: String(b.country ?? ""),
    currency: COUNTRY_CURRENCY[String(b.country)] ?? "USD", salt, passwordHash: hash, totpSecret: null, totpEnabled: false, role: "USER", status: "ACTIVE",
    kycStatus: "NOT_SUBMITTED", kycReason: null, emailVerifiedAt: null, lastBuyRedirectAt: null, createdAt: now(),
  };
  s.users.push(user);
  notify(s, user, "Welcome aboard", "Verify your ID to unlock deposits, copy trading and withdrawals.");
  return { ok: true, devCode: issueCode(s, user, "email", 15) };
});

on("POST", "/auth/verify-email", ({ s, body: b }) => {
  const user = s.users.find((u) => u.email === String(b.email).toLowerCase());
  if (!user || !useCode(s, user, "email", String(b.code))) fail(400, "That code is incorrect or has expired. Request a new one.");
  user!.emailVerifiedAt = now();
  return { ok: true };
});

on("POST", "/auth/resend-code", ({ s, body: b }) => {
  const user = s.users.find((u) => u.email === String(b.email).toLowerCase());
  if (!user || user.emailVerifiedAt) return { ok: true };
  return { ok: true, devCode: issueCode(s, user, "email", 15) };
});

on("POST", "/auth/sign-in", async ({ s, body: b }) => {
  const user = s.users.find((u) => u.email === String(b.email).toLowerCase() && u.role === "USER");
  if (!user || !(await checkPassword(String(b.password), user.salt, user.passwordHash))) fail(401, "Email or password is incorrect.");
  if (user!.status === "SUSPENDED") fail(403, "This account is suspended. Contact support.");
  if (!user!.emailVerifiedAt) return { emailUnverified: true, devCode: issueCode(s, user!, "email", 15) };
  if (user!.totpEnabled) {
    if (!b.totp) return { requires2fa: true };
    if (!(await verifyTotp(user!.totpSecret!, String(b.totp)))) fail(401, "That authenticator code is incorrect.");
  }
  s.sessions.user = user!.id;
  return { user: publicUser(user!) };
});

on("POST", "/auth/sign-out", ({ s }) => {
  s.sessions.user = null;
  return { ok: true };
});
on("GET", "/auth/me", ({ s }) => ({ user: publicUser(requireUser(s)) }));

on("POST", "/auth/forgot-password", ({ s, body: b }) => {
  const user = s.users.find((u) => u.email === String(b.email).toLowerCase() && u.role === "USER");
  if (!user) return { ok: true };
  return { ok: true, devLink: `/reset-password?token=${issueCode(s, user, "reset", 30)}` };
});

on("POST", "/auth/reset-password", async ({ s, body: b }) => {
  checkNewPassword(b.password);
  const c = useCode(s, undefined, "reset", String(b.token));
  if (!c) fail(400, "This reset link is invalid or has expired. Request a new one.");
  const user = s.users.find((u) => u.id === c!.userId)!;
  Object.assign(user, await hashPassword(String(b.password)).then((h) => ({ salt: h.salt, passwordHash: h.hash })));
  if (s.sessions.user === user.id) s.sessions.user = null;
  return { ok: true };
});

/* Auth — admins (TOTP mandatory) */
on("POST", "/admin/auth/sign-up", async ({ s, body: b }) => {
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) fail(400, "Enter a valid email address.");
  checkNewPassword(b.password);
  if (s.users.some((u) => u.email === email)) fail(409, "An account with this email already exists.");
  const first = !s.users.some((u) => isAdmin(u) && u.totpEnabled);
  const { salt, hash } = await hashPassword(String(b.password));
  const secret = generateTotpSecret();
  const user: MUser = {
    id: randomId("adm"), firstName: String(b.firstName).trim(), lastName: String(b.lastName).trim(), email, phone: null, country: null, currency: "USD", salt, passwordHash: hash,
    totpSecret: secret, totpEnabled: false, role: first ? "SUPER_ADMIN" : "ADMIN", status: first ? "ACTIVE" : "PENDING_APPROVAL", kycStatus: "APPROVED", kycReason: null,
    emailVerifiedAt: now(), lastBuyRedirectAt: null, createdAt: now(),
  };
  s.users.push(user);
  const ticket = randomId("tk");
  tickets.set(ticket, { userId: user.id, purpose: "setup", expires: Date.now() + 15 * 60_000 });
  return { ticket, otpauthUrl: otpauthUrl(secret, email, `${BRAND.name} Admin`), secret, firstAdmin: first };
});

on("POST", "/admin/auth/sign-up/confirm", async ({ s, body: b }) => {
  const t = tickets.get(String(b.ticket));
  if (!t || t.purpose !== "setup" || t.expires < Date.now()) fail(400, "This setup session expired. Sign up again.");
  const user = s.users.find((u) => u.id === t!.userId)!;
  if (!(await verifyTotp(user.totpSecret!, String(b.code)))) fail(400, "That code doesn't match. Check the time on your phone and try again.");
  tickets.delete(String(b.ticket));
  user.totpEnabled = true;
  audit(s, user, "admin.sign_up", `${user.email} as ${user.role}`);
  return { status: user.status };
});

on("POST", "/admin/auth/sign-in", async ({ s, body: b }) => {
  const user = s.users.find((u) => u.email === String(b.email).toLowerCase() && isAdmin(u));
  if (!user || !(await checkPassword(String(b.password), user.salt, user.passwordHash))) fail(401, "Email or password is incorrect.");
  if (!user!.totpEnabled) fail(403, "Finish setting up your authenticator app first. Sign up again to restart setup.");
  if (user!.status === "PENDING_APPROVAL") fail(403, "Your admin account is waiting for a super admin to approve it.");
  if (user!.status !== "ACTIVE") fail(403, "This admin account is not active.");
  const ticket = randomId("tk");
  tickets.set(ticket, { userId: user!.id, purpose: "signin", expires: Date.now() + 10 * 60_000 });
  return { ticket };
});

on("POST", "/admin/auth/verify", async ({ s, body: b }) => {
  const t = tickets.get(String(b.ticket));
  if (!t || t.purpose !== "signin" || t.expires < Date.now()) fail(401, "Your sign-in expired. Start again.");
  const user = s.users.find((u) => u.id === t!.userId)!;
  if (!(await verifyTotp(user.totpSecret!, String(b.code)))) fail(401, "That code is incorrect. Codes refresh every 30 seconds.");
  tickets.delete(String(b.ticket));
  s.sessions.admin = user.id;
  audit(s, user, "admin.sign_in", user.email);
  return { user: publicUser(user) };
});

on("POST", "/admin/auth/sign-out", ({ s }) => {
  s.sessions.admin = null;
  return { ok: true };
});
on("GET", "/admin/auth/me", ({ s }) => ({ user: publicUser(requireAdmin(s)) }));

/* Me */
on("GET", "/me/dashboard", ({ s }) => dashboardFor(s, requireUser(s)));
on("GET", "/me/transactions", ({ s }) => summary(s, requireUser(s)).entries);
on("POST", "/me/notifications/read", ({ s }) => {
  const u = requireUser(s);
  s.notifications.filter((n) => n.userId === u.id).forEach((n) => (n.read = true));
  return { ok: true };
});

on("POST", "/me/kyc", async ({ s, form }) => {
  const u = requireUser(s);
  if (u.kycStatus === "APPROVED" || u.kycStatus === "PENDING_REVIEW") fail(409, "Your ID is already submitted.");
  const idType = String(form?.get("idType")) as MState["kyc"][number]["idType"];
  const front = form?.get("front") as File | null;
  const back = form?.get("back") as File | null;
  const selfie = form?.get("selfie") as File | null;
  if (!front || !selfie) fail(400, "Upload your ID and a selfie.");
  if (idType !== "PASSPORT" && !back) fail(400, "Upload the back of your ID.");
  const file = async (f: File) => ({ name: f.name, mime: f.type, url: await imageToDataUrl(f) });
  s.kyc.push({ id: randomId("k"), userId: u.id, idType, files: { front: await file(front!), back: back ? await file(back) : null, selfie: await file(selfie!) }, status: "PENDING_REVIEW", reviewerId: null, reason: null, createdAt: now() });
  u.kycStatus = "PENDING_REVIEW";
  u.kycReason = null;
  notify(s, u, "ID submitted", "We're reviewing your documents. Most reviews finish within 4 hours.");
  return { status: "PENDING_REVIEW" };
});

on("POST", "/me/2fa/setup", ({ s }) => {
  const u = requireUser(s);
  if (u.totpEnabled) fail(409, "Two-factor authentication is already on.");
  u.totpSecret = generateTotpSecret();
  return { secret: u.totpSecret, otpauthUrl: otpauthUrl(u.totpSecret, u.email, BRAND.name) };
});
on("POST", "/me/2fa/enable", async ({ s, body: b }) => {
  const u = requireUser(s);
  if (!u.totpSecret || !(await verifyTotp(u.totpSecret, String(b.code)))) fail(400, "That code doesn't match. Try the newest code in your app.");
  u.totpEnabled = true;
  return { ok: true };
});
on("POST", "/me/2fa/disable", async ({ s, body: b }) => {
  const u = requireUser(s);
  if (!u.totpEnabled || !(await verifyTotp(u.totpSecret!, String(b.code)))) fail(400, "That code is incorrect.");
  u.totpEnabled = false;
  u.totpSecret = null;
  return { ok: true };
});

on("GET", "/me/wallet", ({ s }) => {
  requireKyc(requireUser(s));
  return { address: activeWallet(s)?.address ?? null, network: "bitcoin" };
});
on("POST", "/me/buy-redirect", ({ s }) => {
  const u = requireUser(s);
  requireKyc(u);
  u.lastBuyRedirectAt = now();
  return { ok: true };
});

on("POST", "/me/deposit-claims", ({ s, body: b }) => {
  const u = requireUser(s);
  requireKyc(u);
  const txHash = String(b.txHash).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(txHash)) fail(400, "A transaction hash is 64 hexadecimal characters.");
  if (!BTC_ADDR.test(String(b.fromAddress))) fail(400, "Enter a valid Bitcoin address.");
  if (!(Number(b.amountBtc) > 0)) fail(400, "Enter the amount you sent.");
  if (s.claims.some((c) => c.txHash === txHash) || s.ledger.some((e) => e.reference === txHash)) fail(409, "This transaction hash has already been submitted. Each deposit can be credited once.");
  const c = { id: randomId("c"), userId: u.id, txHash, amountBtc: Number(b.amountBtc), fromAddress: String(b.fromAddress), status: "PENDING" as const, note: null, createdAt: now() };
  s.claims.push(c);
  u.lastBuyRedirectAt = null;
  return c;
});

on("GET", "/me/withdrawals", ({ s }) => {
  const u = requireUser(s);
  requireKyc(u);
  return {
    withdrawals: s.withdrawals.filter((w) => w.userId === u.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    addresses: s.addresses.filter((a) => a.userId === u.id).map((a) => ({ ...a, usableFrom: new Date(+new Date(a.createdAt) + 24 * 3_600_000).toISOString() })),
    feeBtc: LIMITS.withdrawalFeeBtc,
    approvalThresholdBtc: LIMITS.withdrawalAdminApprovalBtc,
  };
});
on("POST", "/me/withdrawal-addresses", ({ s, body: b }) => {
  const u = requireUser(s);
  requireKyc(u);
  if (!BTC_ADDR.test(String(b.address))) fail(400, "Enter a valid Bitcoin address.");
  if (s.addresses.some((a) => a.userId === u.id && a.address === b.address)) fail(409, "You've already saved this address.");
  const a = { id: randomId("wa"), userId: u.id, address: String(b.address), label: String(b.label || "My wallet"), createdAt: now() };
  s.addresses.push(a);
  return a;
});
on("POST", "/me/withdrawals/email-code", ({ s }) => {
  const u = requireUser(s);
  requireKyc(u);
  return { ok: true, devCode: issueCode(s, u, "withdrawal", 10) };
});
on("POST", "/me/withdrawals", async ({ s, body: b }) => {
  const u = requireUser(s);
  requireKyc(u);
  if (!u.totpEnabled || !(await verifyTotp(u.totpSecret!, String(b.totp)))) fail(403, "Turn on 2FA and enter a valid authenticator code.");
  if (!useCode(s, u, "withdrawal", String(b.emailCode))) fail(400, "The email code is incorrect or expired.");
  const addr = s.addresses.find((a) => a.userId === u.id && a.address === b.address);
  if (!addr) fail(400, "Withdraw only to a saved address.");
  if (Date.now() - +new Date(addr!.createdAt) < 24 * 3_600_000) fail(400, "New addresses can be used 24 hours after you add them.");
  const amount = Number(b.amountBtc);
  if (!(amount > 0) || amount + LIMITS.withdrawalFeeBtc > summary(s, u).available.btc + 1e-9) fail(400, "Amount plus fee exceeds your available balance.");
  const needs = amount > LIMITS.withdrawalAdminApprovalBtc;
  const w = { id: randomId("w"), userId: u.id, amountBtc: amount, feeBtc: LIMITS.withdrawalFeeBtc, address: addr!.address, status: needs ? ("AWAITING_APPROVAL" as const) : ("PROCESSING" as const), createdAt: now() };
  s.withdrawals.push(w);
  post(s, u, { type: "WITHDRAWAL", amountBtc: -amount, reference: w.id, note: `To ${addr!.address.slice(0, 10)}…`, createdBy: u.id });
  post(s, u, { type: "FEE", amountBtc: -LIMITS.withdrawalFeeBtc, reference: w.id, note: "Network fee", createdBy: "system" });
  notify(s, u, needs ? "Withdrawal awaiting approval" : "Withdrawal processing", `${amount} BTC to ${addr!.address}.`);
  return w;
});

on("POST", "/me/copies", ({ s, body: b }) => {
  const u = requireUser(s);
  requireKyc(u);
  if (!b.acknowledgeRisk) fail(400, "Please acknowledge the risks.");
  const t = s.traders.find((x) => x.id === b.traderId && x.active);
  if (!t) fail(404, "Trader not found.");
  const alloc = Number(b.allocationBtc);
  if (alloc < t!.minAllocation) fail(400, `Minimum allocation is ${t!.minAllocation} BTC.`);
  if (s.copies.some((c) => c.userId === u.id && c.traderId === t!.id && c.status !== "STOPPED")) fail(409, "You're already copying this trader.");
  if (alloc > summary(s, u).available.btc + 1e-9) fail(400, "Allocation exceeds your available balance.");
  const c = { id: randomId("cp"), userId: u.id, traderId: t!.id, allocationBtc: alloc, stopLossPct: b.stopLossPct ? Number(b.stopLossPct) : null, status: "ACTIVE" as const, createdAt: now() };
  s.copies.push(c);
  return { id: c.id };
});
on("PATCH", "/me/copies/:id", ({ s, body: b, params: [id] }) => {
  const u = requireUser(s);
  requireKyc(u);
  const c = s.copies.find((x) => x.id === id && x.userId === u.id);
  if (!c || c.status === "STOPPED") fail(404, "Copy not found.");
  c!.status = b.status as "ACTIVE" | "PAUSED" | "STOPPED";
  return { ok: true };
});

/* Public */
on("GET", "/traders", ({ s }) => s.traders.filter((t) => t.active).map((t) => traderView(s, t.id)));
on("GET", "/traders/:id", ({ s, params: [id] }) => {
  const t = s.traders.find((x) => x.id === id && x.active);
  if (!t) fail(404, "Trader not found.");
  return { ...traderView(s, id), trades: s.trades.filter((x) => x.traderId === id).sort((a, b) => +new Date(b.closedAt) - +new Date(a.closedAt)) };
});
on("GET", "/buy-platforms", ({ s }) => {
  requireKyc(requireUser(s));
  return s.platforms.filter((p) => p.active).sort((a, b) => a.sortOrder - b.sortOrder);
});
on("POST", "/visitors/heartbeat", ({ s, body: b }) => {
  const u = s.users.find((x) => x.id === s.sessions.user);
  const prev = s.presence[String(b.sessionId)];
  s.presence[String(b.sessionId)] = { page: String(b.page), userName: u ? fullName(u) : null, ua: navigator.userAgent, startedAt: prev?.startedAt ?? now(), last: Date.now() };
  return null;
});

/* Admin */
on("GET", "/admin/overview", ({ s }) => {
  requireAdmin(s);
  const pendingKyc = s.kyc.filter((k) => k.status === "PENDING_REVIEW").sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  return {
    kyc: pendingKyc.length,
    oldestKycAt: pendingKyc[0]?.createdAt ?? null,
    claims: s.claims.filter((c) => c.status === "PENDING" || c.status === "NEEDS_INFO").length,
    adjustments: s.pending.filter((p) => p.status === "PENDING").length,
    withdrawals: s.withdrawals.filter((w) => w.status === "AWAITING_APPROVAL").length,
    newUsers: s.users.filter((u) => u.role === "USER" && Date.now() - +new Date(u.createdAt) < 7 * 86_400_000).length,
    pendingAdmins: s.users.filter((u) => isAdmin(u) && u.status === "PENDING_APPROVAL" && u.totpEnabled).length,
    liveVisitors: liveVisitors(s).length,
    audit: s.audit.slice(0, 8),
  };
});

on("GET", "/admin/kyc", ({ s }) => {
  requireAdmin(s);
  return s.kyc
    .filter((k) => k.status === "PENDING_REVIEW")
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((k) => ({ id: k.id, idType: k.idType, createdAt: k.createdAt, files: k.files, vendorResult: { connected: false }, user: publicUser(s.users.find((u) => u.id === k.userId)!) }));
});
on("POST", "/admin/kyc/:id/view", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  const k = s.kyc.find((x) => x.id === id);
  if (k) audit(s, a, "kyc.document.view", `${String(b.kind)} · ${s.users.find((u) => u.id === k.userId)?.email}`);
  return { ok: true };
});
on("POST", "/admin/kyc/:id/decision", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  const k = s.kyc.find((x) => x.id === id && x.status === "PENDING_REVIEW");
  if (!k) fail(404, "Submission not found or already reviewed.");
  const decision = String(b.decision) as "APPROVED" | "REJECTED" | "RESUBMISSION_REQUESTED";
  const reason = b.reason ? String(b.reason).trim() : null;
  if (decision !== "APPROVED" && (!reason || reason.length < 5)) fail(400, "A reason is required.");
  const u = s.users.find((x) => x.id === k!.userId)!;
  Object.assign(k!, { status: decision, reviewerId: a.id, reason });
  u.kycStatus = decision;
  u.kycReason = reason;
  notify(s, u, `ID ${{ APPROVED: "approved", REJECTED: "rejected", RESUBMISSION_REQUESTED: "resubmission requested" }[decision]}`, decision === "APPROVED" ? "Deposits, copy trading and withdrawals are now unlocked." : reason!);
  audit(s, a, `kyc.${decision.toLowerCase()}`, `${fullName(u)} <${u.email}>${reason ? ` — ${reason}` : ""}`);
  return { ok: true };
});

on("GET", "/admin/users", ({ s, query }) => {
  requireAdmin(s);
  const q = (query.get("q") ?? "").toLowerCase();
  return s.users
    .filter((u) => u.role === "USER" && `${fullName(u)} ${u.email} ${u.phone}`.toLowerCase().includes(q))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((u) => {
      const sm = summary(s, u);
      return { ...publicUser(u), balanceBtc: sm.balance.btc, balanceFiat: sm.balance.fiat };
    });
});

/** The admin's view of a user — the same dashboard data the user sees. */
on("GET", "/admin/users/:id", ({ s, params: [id] }) => {
  const a = requireAdmin(s);
  const u = s.users.find((x) => x.id === id && x.role === "USER");
  if (!u) fail(404, "User not found.");
  const k = [...s.kyc].reverse().find((x) => x.userId === id);
  const nameOf = (uid: string) => s.users.find((x) => x.id === uid);
  const recent = s.audit.find((x) => x.action === "user.view" && x.target === u!.email && Date.now() - +new Date(x.createdAt) < 5 * 60_000);
  if (!recent) audit(s, a, "user.view", u!.email);
  return {
    user: publicUser(u!),
    dashboard: dashboardFor(s, u!),
    ledger: summary(s, u!).entries.map((e) => ({ ...e, createdBy: nameOf(e.createdBy) ? fullName(nameOf(e.createdBy)!) : e.createdBy, approvedBy: e.approvedBy && nameOf(e.approvedBy) ? fullName(nameOf(e.approvedBy)!) : e.approvedBy })),
    sessions: s.sessions.user === id ? [{ id: "current", ip: "127.0.0.1", userAgent: navigator.userAgent, createdAt: now() }] : [],
    kycSubmission: k ? { id: k.id, idType: k.idType, status: k.status, createdAt: k.createdAt } : null,
    pendingAdjustments: s.pending.filter((p) => p.userId === id && p.status === "PENDING"),
    limits: { adjustmentSecondApprovalBtc: LIMITS.adjustmentSecondApprovalBtc },
  };
});

/** FR-8.6 — admins change balances only by posting a ledger entry. Amount in BTC or the user's currency. */
on("POST", "/admin/users/:id/adjust", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  const u = s.users.find((x) => x.id === id && x.role === "USER");
  if (!u) fail(404, "User not found.");
  const amount = Number(b.amount);
  if (!(amount > 0)) fail(400, "Enter an amount greater than zero.");
  const note = String(b.note ?? "").trim();
  if (note.length < 5) fail(400, "Write a note the user will see.");
  const reason = String(b.reason) as AdjustmentReason;
  const btc = r8((b.unit === "FIAT" ? amount / btcPriceIn(u!.currency) : amount) * (b.direction === "debit" ? -1 : 1));
  if (btc === 0) fail(400, "Amount is too small.");
  if (btc < 0 && -btc > summary(s, u!).balance.btc + 1e-9) fail(400, "A debit can't take the balance below zero.");
  if (Math.abs(btc) > LIMITS.adjustmentSecondApprovalBtc) {
    s.pending.push({ id: randomId("pa"), userId: u!.id, amountBtc: btc, fiatAmount: r2(btc * btcPriceIn(u!.currency)), fiatCurrency: u!.currency, reason, note, requestedBy: a.id, status: "PENDING", createdAt: now() });
    audit(s, a, "balance.adjust.request", `${u!.email} ${btc} BTC (${reason.toLowerCase()})`);
    return { status: "pending", amountBtc: btc };
  }
  post(s, u!, { type: "ADJUSTMENT", amountBtc: btc, adjustmentReason: reason, note, createdBy: a.id });
  notify(s, u!, "Your balance was adjusted", `${btc > 0 ? "+" : ""}${btc} BTC · ${note}`);
  audit(s, a, "balance.adjust", `${u!.email} ${btc > 0 ? "+" : ""}${btc} BTC (${reason.toLowerCase()})`);
  return { status: "posted", amountBtc: btc };
});

on("GET", "/admin/adjustments", ({ s }) => {
  requireAdmin(s);
  return s.pending
    .filter((p) => p.status === "PENDING")
    .map((p) => {
      const req = s.users.find((x) => x.id === p.requestedBy);
      return { ...p, user: publicUser(s.users.find((x) => x.id === p.userId)!), requestedByName: req ? fullName(req) : p.requestedBy };
    });
});
on("POST", "/admin/adjustments/:id/decide", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  requireSuper(a);
  const p = s.pending.find((x) => x.id === id && x.status === "PENDING");
  if (!p) fail(404, "Adjustment not found.");
  if (p!.requestedBy === a.id) fail(403, "A different admin must approve an adjustment you requested.");
  const u = s.users.find((x) => x.id === p!.userId)!;
  p!.status = b.approve ? "APPROVED" : "REJECTED";
  if (b.approve) {
    post(s, u, { type: "ADJUSTMENT", amountBtc: p!.amountBtc, adjustmentReason: p!.reason, note: p!.note, createdBy: p!.requestedBy, approvedBy: a.id });
    notify(s, u, "Your balance was adjusted", `${p!.amountBtc > 0 ? "+" : ""}${p!.amountBtc} BTC · ${p!.note}`);
  }
  audit(s, a, `balance.adjust.${b.approve ? "approve" : "reject"}`, `${u.email} ${p!.amountBtc} BTC`);
  return { ok: true };
});

on("POST", "/admin/users/:id/suspend", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  const u = s.users.find((x) => x.id === id && x.role === "USER");
  if (!u) fail(404, "User not found.");
  u!.status = b.suspended ? "SUSPENDED" : "ACTIVE";
  if (b.suspended && s.sessions.user === id) s.sessions.user = null;
  audit(s, a, b.suspended ? "user.suspend" : "user.unsuspend", u!.email);
  return { ok: true };
});

on("GET", "/admin/wallets", ({ s }) => {
  requireAdmin(s);
  return {
    history: [...s.wallets].sort((a, b) => +new Date(b.activeFrom) - +new Date(a.activeFrom)),
    claims: [...s.claims].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).map((c) => ({ ...c, user: publicUser(s.users.find((u) => u.id === c.userId)!) })),
  };
});
on("POST", "/admin/wallets", async ({ s, body: b }) => {
  const a = requireAdmin(s);
  requireSuper(a);
  if (!BTC_ADDR.test(String(b.address))) fail(400, "Enter a valid Bitcoin address.");
  if (String(b.reason ?? "").trim().length < 5) fail(400, "A reason is required.");
  if (!(await verifyTotp(a.totpSecret!, String(b.totp)))) fail(403, "That authenticator code is incorrect.");
  s.wallets.forEach((w) => !w.activeTo && (w.activeTo = now()));
  s.wallets.push({ id: randomId("w"), address: String(b.address), activeFrom: now(), activeTo: null, setBy: fullName(a), reason: String(b.reason) });
  s.users.filter((u) => u.role === "USER").forEach((u) => notify(s, u, "Our deposit address changed", "Always copy the BTC deposit address from your dashboard. The old address is still monitored for 90 days."));
  audit(s, a, "wallet.address.change", String(b.address));
  return { ok: true };
});
on("POST", "/admin/claims/:id/decision", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  const c = s.claims.find((x) => x.id === id && (x.status === "PENDING" || x.status === "NEEDS_INFO"));
  if (!c) fail(404, "Claim not found or already closed.");
  const u = s.users.find((x) => x.id === c!.userId)!;
  const decision = String(b.decision) as "MATCHED" | "REJECTED" | "NEEDS_INFO";
  if (decision === "MATCHED") {
    if (s.ledger.some((e) => e.reference === c!.txHash)) fail(400, "This transaction hash was already credited.");
    post(s, u, { type: "DEPOSIT", amountBtc: c!.amountBtc, reference: c!.txHash, note: "Deposit matched to on-chain transaction", createdBy: a.id });
    notify(s, u, "Deposit credited", `${c!.amountBtc} BTC has been added to your balance.`);
  } else {
    notify(s, u, decision === "REJECTED" ? "Deposit claim rejected" : "We need more information", b.note ? String(b.note) : "Please contact support about your deposit claim.");
  }
  c!.status = decision;
  c!.note = b.note ? String(b.note) : c!.note;
  audit(s, a, `claim.${decision.toLowerCase()}`, `${u.email} ${c!.amountBtc} BTC tx ${c!.txHash.slice(0, 10)}…`);
  return { ok: true };
});

on("GET", "/admin/withdrawals", ({ s }) => {
  requireAdmin(s);
  return [...s.withdrawals].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).map((w) => ({ ...w, user: publicUser(s.users.find((u) => u.id === w.userId)!) }));
});
on("POST", "/admin/withdrawals/:id/decide", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  const w = s.withdrawals.find((x) => x.id === id && x.status === "AWAITING_APPROVAL");
  if (!w) fail(404, "Withdrawal not found.");
  const u = s.users.find((x) => x.id === w!.userId)!;
  w!.status = b.approve ? "PROCESSING" : "REJECTED";
  if (!b.approve) post(s, u, { type: "ADJUSTMENT", adjustmentReason: "REFUND", amountBtc: w!.amountBtc + w!.feeBtc, reference: w!.id, note: "Withdrawal rejected — funds returned", createdBy: a.id });
  notify(s, u, b.approve ? "Withdrawal approved" : "Withdrawal rejected", b.approve ? `${w!.amountBtc} BTC is on its way.` : "The amount and fee were returned to your balance.");
  audit(s, a, `withdrawal.${b.approve ? "approve" : "reject"}`, `${u.email} ${w!.amountBtc} BTC`);
  return { ok: true };
});

on("GET", "/admin/traders", ({ s }) => {
  requireAdmin(s);
  return s.traders.map((t) => traderView(s, t.id));
});
const traderFields = (b: Body) => ({
  name: String(b.name).trim(), photoUrl: (b.photoUrl as string) || null, hue: Number(b.hue) || 262, yearsExperience: Number(b.yearsExperience) || 0, typicalTradeSizeBtc: Number(b.typicalTradeSizeBtc) || 0.1,
  bio: String(b.bio ?? ""), strategy: String(b.strategy ?? ""), riskLevel: Math.min(5, Math.max(1, Number(b.riskLevel) || 3)), minAllocation: Number(b.minAllocation) || 0.001, feePct: Number(b.feePct) || 0, active: b.active !== false,
});
on("POST", "/admin/traders", ({ s, body: b }) => {
  const a = requireAdmin(s);
  if (!String(b.name ?? "").trim()) fail(400, "Name is required.");
  const t = { id: randomId("t"), ...traderFields(b), demo: false, createdAt: now() };
  s.traders.push(t);
  audit(s, a, "trader.create", t.name);
  return traderView(s, t.id);
});
on("PUT", "/admin/traders/:id", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  const t = s.traders.find((x) => x.id === id);
  if (!t) fail(404, "Trader not found.");
  Object.assign(t!, traderFields(b));
  audit(s, a, "trader.update", t!.name);
  return traderView(s, id);
});
on("POST", "/admin/traders/:id/trades", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  const t = s.traders.find((x) => x.id === id);
  if (!t) fail(404, "Trader not found.");
  const openedAt = new Date(String(b.openedAt));
  const closedAt = new Date(String(b.closedAt));
  if (!(+closedAt > +openedAt)) fail(400, "Close time must be after open time.");
  if (+closedAt > Date.now() + 60_000) fail(400, "Close time can't be in the future.");
  const trade: MTrade = { id: randomId("tr"), traderId: id, side: b.side === "SELL" ? "SELL" : "BUY", entry: Number(b.entry), exit: Number(b.exit), size: Number(b.size), openedAt: openedAt.toISOString(), closedAt: closedAt.toISOString(), mirroredAt: null };
  if (!(trade.entry > 0 && trade.exit > 0 && trade.size > 0)) fail(400, "Entry, exit and size must be positive.");
  s.trades.push(trade);
  const copiers = mirror(s, trade);
  audit(s, a, "trade.log", `${t!.name} ${trade.side} ${trade.entry} → ${trade.exit} · mirrored to ${copiers} copier(s)`);
  return { trade, mirroredTo: copiers };
});

on("GET", "/admin/buy-platforms", ({ s }) => {
  requireAdmin(s);
  return [...s.platforms].sort((a, b) => a.sortOrder - b.sortOrder);
});
on("PUT", "/admin/buy-platforms", ({ s, body: b }) => {
  const a = requireAdmin(s);
  const list = (b.platforms as MState["platforms"]) ?? [];
  for (const p of list) if (!p.name?.trim() || !/^https:\/\//.test(p.linkUrl)) fail(400, "Each platform needs a name and an https:// link.");
  s.platforms = list.map((p, i) => ({ ...p, id: p.id ?? randomId("p"), sortOrder: i }));
  audit(s, a, "buy_platforms.update", `${list.length} platforms`);
  return s.platforms;
});

on("GET", "/admin/dashboard-config", ({ s }) => {
  requireAdmin(s);
  return s.config;
});
on("POST", "/admin/dashboard-config", ({ s, body: b }) => {
  const a = requireAdmin(s);
  s.config = { version: s.config.version + 1, tiles: b.tiles as MState["config"]["tiles"], announcements: b.announcements as MState["config"]["announcements"], publishedBy: fullName(a), publishedAt: now() };
  audit(s, a, "dashboard.publish", `dashboard_config v${s.config.version}`);
  return s.config;
});

on("GET", "/admin/audit", ({ s, query }) => {
  requireAdmin(s);
  const q = (query.get("q") ?? "").toLowerCase();
  return s.audit.filter((x) => `${x.actorName} ${x.action} ${x.target}`.toLowerCase().includes(q)).slice(0, 500);
});

function liveVisitors(s: MState) {
  const cutoff = Date.now() - 45_000;
  return Object.entries(s.presence)
    .filter(([, v]) => v.last >= cutoff)
    .map(([sessionId, v]) => ({
      sessionId, userName: v.userName, country: "Nigeria", region: "Lagos", city: "Lagos", lat: 6.52, lng: 3.38, page: v.page,
      device: /Mobi|Android|iPhone/i.test(v.ua) ? "Mobile" : /iPad|Tablet/i.test(v.ua) ? "Tablet" : "Desktop",
      browser: /Edg\//.test(v.ua) ? "Edge" : /Firefox\//.test(v.ua) ? "Firefox" : /Chrome\//.test(v.ua) ? "Chrome" : /Safari\//.test(v.ua) ? "Safari" : "Other",
      startedAt: v.startedAt,
    }));
}
on("GET", "/admin/visitors", ({ s }) => {
  requireAdmin(s);
  return liveVisitors(s);
});

on("GET", "/admin/admins", ({ s }) => {
  requireAdmin(s);
  return s.users.filter((u) => isAdmin(u) && u.totpEnabled).map(publicUser);
});
on("POST", "/admin/admins/:id/approve", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  requireSuper(a);
  const t = s.users.find((u) => u.id === id && isAdmin(u));
  if (!t) fail(404, "Admin not found.");
  if (t!.id === a.id) fail(403, "You can't change your own access.");
  t!.status = b.approve ? "ACTIVE" : "REJECTED";
  if (!b.approve && s.sessions.admin === id) s.sessions.admin = null;
  audit(s, a, b.approve ? "admin.approve" : "admin.revoke", t!.email);
  return { ok: true };
});
on("POST", "/admin/admins/:id/role", ({ s, body: b, params: [id] }) => {
  const a = requireAdmin(s);
  requireSuper(a);
  if (id === a.id) fail(403, "You can't change your own role.");
  const t = s.users.find((u) => u.id === id && isAdmin(u));
  if (!t) fail(404, "Admin not found.");
  t!.role = b.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
  audit(s, a, "admin.role", `${t!.email} → ${t!.role}`);
  return { ok: true };
});

/* ── Dispatcher ───────────────────────────────────────────────── */
export async function handle(method: string, fullPath: string, json: unknown, form: FormData | null) {
  const [path, qs] = fullPath.split("?");
  for (const [m, re, h] of routes) {
    if (m !== method) continue;
    const match = path.match(re);
    if (!match) continue;
    const s = load();
    const snapshot = JSON.stringify(s);
    try {
      const result = await h({ s, body: (json as Body) ?? {}, form, params: match.slice(1).map(decodeURIComponent), query: new URLSearchParams(qs) });
      if (method !== "GET" || JSON.stringify(s) !== snapshot) save(s);
      return result;
    } catch (e) {
      // Roll back partial writes on any error.
      save(JSON.parse(snapshot));
      throw e;
    }
  }
  throw new MockHttpError(404, `No mock route for ${method} ${path}`);
}
