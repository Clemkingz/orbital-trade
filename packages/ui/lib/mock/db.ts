/**
 * Mock database for the front-end-only build. Lives in localStorage so the user site and the
 * admin console (served on the same origin at /admin) share one set of data, across tabs.
 * Seeds reference data only — users and admins are created through the sign-up pages.
 */
import type { AdjustmentReason, DepositClaimStatus, IdType, KycStatus, LedgerEntryType } from "@orbit/shared";
import type { Announcement, BuyPlatform, Side, TileConfig } from "../types";
import { prng } from "./seed";

export interface MUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  currency: string;
  salt: string;
  passwordHash: string;
  totpSecret: string | null;
  totpEnabled: boolean;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED" | "SUSPENDED";
  kycStatus: KycStatus;
  kycReason: string | null;
  emailVerifiedAt: string | null;
  lastBuyRedirectAt: string | null;
  createdAt: string;
}

export interface MFile {
  name: string;
  mime: string;
  url: string | null; // downscaled data URL for images
}

export interface MKyc {
  id: string;
  userId: string;
  idType: IdType;
  files: { front: MFile; back: MFile | null; selfie: MFile };
  status: KycStatus;
  reviewerId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface MLedger {
  id: string;
  userId: string;
  type: LedgerEntryType;
  amountBtc: number;
  fiatAmount: number;
  fiatCurrency: string;
  btcPrice: number;
  reference: string | null;
  adjustmentReason: AdjustmentReason | null;
  note: string | null;
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
}

export interface MTrader {
  id: string;
  name: string;
  photoUrl: string | null;
  hue: number;
  yearsExperience: number;
  typicalTradeSizeBtc: number;
  bio: string;
  strategy: string;
  riskLevel: number;
  minAllocation: number;
  feePct: number;
  active: boolean;
  demo: boolean;
  createdAt: string;
}

export interface MTrade {
  id: string;
  traderId: string;
  side: Side;
  entry: number;
  exit: number;
  size: number;
  openedAt: string;
  closedAt: string;
  mirroredAt: string | null;
}

export interface MState {
  version: 2;
  users: MUser[];
  sessions: { user: string | null; admin: string | null };
  codes: { userId: string; purpose: "email" | "reset" | "withdrawal"; code: string; expiresAt: number; used: boolean }[];
  kyc: MKyc[];
  wallets: { id: string; address: string; activeFrom: string; activeTo: string | null; setBy: string; reason: string }[];
  claims: { id: string; userId: string; txHash: string; amountBtc: number; fromAddress: string; status: DepositClaimStatus; note: string | null; createdAt: string }[];
  ledger: MLedger[];
  pending: { id: string; userId: string; amountBtc: number; fiatAmount: number; fiatCurrency: string; reason: AdjustmentReason; note: string; requestedBy: string; status: "PENDING" | "APPROVED" | "REJECTED"; createdAt: string }[];
  withdrawals: { id: string; userId: string; amountBtc: number; feeBtc: number; address: string; status: "AWAITING_APPROVAL" | "PROCESSING" | "COMPLETED" | "REJECTED"; createdAt: string }[];
  addresses: { id: string; userId: string; address: string; label: string; createdAt: string }[];
  platforms: (BuyPlatform & { id: string; sortOrder: number })[];
  traders: MTrader[];
  trades: MTrade[];
  copies: { id: string; userId: string; traderId: string; allocationBtc: number; stopLossPct: number | null; status: "ACTIVE" | "PAUSED" | "STOPPED"; createdAt: string }[];
  config: { version: number; tiles: TileConfig[]; announcements: Announcement[]; publishedBy: string; publishedAt: string };
  notifications: { id: string; userId: string; title: string; body: string; read: boolean; createdAt: string }[];
  audit: { id: string; actorName: string; action: string; target: string; ip: string; createdAt: string }[];
  presence: Record<string, { page: string; userName: string | null; ua: string; startedAt: string; last: number }>;
}

const KEY = "orbit-mock-db-v2";
const DAY = 86_400_000;
const HOUR = 3_600_000;

function seed(): MState {
  const now = Date.now();
  const iso = (t: number) => new Date(t).toISOString();
  const traders: MTrader[] = [
    { id: "t-amaka", name: "Amaka Eze", hue: 262, yearsExperience: 7, typicalTradeSizeBtc: 0.35, riskLevel: 2, minAllocation: 0.005, feePct: 15, bio: "Former FX desk analyst in Lagos. Trades BTC swing structure on the 4-hour chart and keeps risk per trade under 1%.", strategy: "Swing trading on 4H market structure with tight invalidation." },
    { id: "t-david", name: "David Mensah", hue: 190, yearsExperience: 5, typicalTradeSizeBtc: 0.6, riskLevel: 4, minAllocation: 0.01, feePct: 20, bio: "Momentum trader focused on high-volume sessions around US market open. Cuts losers fast and lets runners trail.", strategy: "Momentum breakouts during the New York session." },
    { id: "t-sofia", name: "Sofia Lindqvist", hue: 320, yearsExperience: 9, typicalTradeSizeBtc: 0.2, riskLevel: 3, minAllocation: 0.003, feePct: 12, bio: "Quant background. Mean-reversion on funding-rate extremes with small, frequent positions.", strategy: "Mean reversion around funding and basis extremes." },
  ].map((t) => ({ ...t, photoUrl: null, active: true, demo: true, createdAt: iso(now - 120 * DAY) }));

  const trades: MTrade[] = [];
  traders.forEach((tr, ti) => {
    const r = prng(100 + ti);
    const edge = [0.62, 0.55, 0.58][ti];
    let price = 96_420 * 0.86;
    for (let i = 0; i < 48; i++) {
      const side: Side = r() > 0.4 ? "BUY" : "SELL";
      const entry = Math.round(price * (1 + (r() - 0.5) * 0.01));
      const pct = (r() < edge ? 0.004 + r() * 0.025 : -(0.003 + r() * 0.018)) * (side === "BUY" ? 1 : -1);
      const opened = now - ((110 - i * 2.2) * DAY + r() * DAY);
      const closed = opened + (2 + r() * 30) * HOUR;
      // Historic trades are marked mirrored so they never credit later copiers.
      trades.push({ id: `${tr.id}-${i}`, traderId: tr.id, side, entry, exit: Math.round(entry * (1 + pct)), size: +(tr.typicalTradeSizeBtc * (0.6 + r() * 0.8)).toFixed(3), openedAt: iso(opened), closedAt: iso(closed), mirroredAt: iso(closed) });
      price *= 1 + (r() - 0.46) * 0.012;
    }
  });

  const platforms = (
    [
      ["MoonPay", "M", "#7d00ff", "https://www.moonpay.com/buy/btc", ["Card", "Bank transfer"]],
      ["Coinmama", "C", "#f39200", "https://www.coinmama.com/", ["Card", "Bank transfer"]],
      ["Transak", "T", "#0a6cff", "https://global.transak.com/", ["Card", "Bank transfer"]],
      ["Ramp Network", "R", "#21bf73", "https://ramp.network/buy", ["Card", "Bank transfer"]],
      ["Paybis", "P", "#3f51ff", "https://paybis.com/", ["Card", "Bank transfer"]],
      ["Banxa", "B", "#0d1a3a", "https://banxa.com/", ["Card", "Bank transfer"]],
      ["Quidax", "Q", "#1e2b6f", "https://www.quidax.com/", ["Bank transfer", "P2P"]],
    ] as const
  ).map(([name, logoText, color, linkUrl, pm], i) => ({ id: `p${i}`, name, logoText, color, linkUrl, paymentMethods: [...pm], sortOrder: i, active: true }));

  return {
    version: 2,
    users: [],
    sessions: { user: null, admin: null },
    codes: [],
    kyc: [],
    wallets: [{ id: "w1", address: "bc1qorb1t7rad3dep0s1tx9k4m2c8v6n0p5q3r7s9t2", activeFrom: iso(now - 40 * DAY), activeTo: null, setBy: "System", reason: "Initial custodian address" }],
    claims: [],
    ledger: [],
    pending: [],
    withdrawals: [],
    addresses: [],
    platforms,
    traders,
    trades,
    copies: [],
    config: {
      version: 1,
      publishedBy: "System",
      publishedAt: iso(now),
      tiles: [
        { id: "balance", visible: true, order: 0, label: "Total balance" },
        { id: "deposited", visible: true, order: 1, label: "Amount deposited" },
        { id: "profit", visible: true, order: 2, label: "Profit" },
        { id: "allocation", visible: true, order: 3, label: "Available vs allocated" },
        { id: "deposit", visible: true, order: 4, label: "Deposit address" },
        { id: "copied", visible: true, order: 5, label: "Traders you copy" },
        { id: "transactions", visible: true, order: 6, label: "Recent transactions" },
        { id: "announcements", visible: true, order: 7, label: "Announcements" },
        { id: "buy", visible: true, order: 8, label: "Buy crypto" },
      ],
      announcements: [{ id: "an1", kind: "announcement", tone: "info", segment: "unverified", title: "Welcome to the platform", body: "Verify your ID to unlock deposits, copy trading and withdrawals.", createdAt: iso(now) }],
    },
    notifications: [],
    audit: [],
    presence: {},
  };
}

let cache: MState | null = null;

export function load(): MState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MState;
      if (parsed.version === 2) return (cache = parsed);
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return (cache = seed());
}

export function save(state: MState) {
  cache = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded (large ID images): drop image previews, keep the records.
    state.kyc.forEach((k) => Object.values(k.files).forEach((f) => f && (f.url = null)));
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* give up silently; data stays in memory for this tab */
    }
  }
}

/** Another tab changed the data: drop our cache so the next read picks it up. */
export function onExternalChange(cb: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function resetDb() {
  cache = seed();
  save(cache);
}
