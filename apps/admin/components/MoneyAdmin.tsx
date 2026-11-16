"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Ban, Bitcoin, Check, CircleCheck, Coins, ExternalLink, Eye, HelpCircle, Inbox, KeyRound, Search, ShieldAlert, X } from "lucide-react";
import type { AdjustmentReason } from "@orbit/shared";
import { AllocationCard, BalanceCard, DepositedCard, LedgerList, ProfitCard } from "@orbit/ui/components/account/AccountCards";
import { Button } from "@orbit/ui/components/ui/Button";
import { Field, TextArea } from "@orbit/ui/components/ui/Field";
import { Modal } from "@orbit/ui/components/ui/Modal";
import { PageHeader } from "@orbit/ui/components/ui/PageHeader";
import { SelectField } from "@orbit/ui/components/ui/SelectField";
import { toast } from "@orbit/ui/components/ui/Toast";
import { Avatar, Badge, Card, CardHeader, CopyButton, EmptyState, KycBadge, Segmented, Skeleton } from "@orbit/ui/components/ui/misc";
import { api, errorMessage, refresh, useApi } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";
import { CURRENCY_NAME, fmtBtc, fmtDate, fmtDateTime, fmtFiat, shortHash, timeAgo } from "@orbit/ui/lib/format";
import type { ApiUser, Dashboard, DepositClaim, LedgerEntry, PendingAdjustment, WalletAddressRecord, Withdrawal } from "@orbit/ui/lib/types";
import { useAdminMe } from "@/lib/data";

type UserRow = ApiUser & { balanceBtc: number; balanceFiat: number };

/* ── Users list (FR-8.2) ─────────────────────────────────────── */
export function UsersAdmin() {
  const [q, setQ] = useState("");
  const { data: users, error } = useApi<UserRow[]>(`/admin/users?q=${encodeURIComponent(q)}`, { keepPreviousData: true });
  const { data: pending } = useApi<PendingAdjustment[]>("/admin/adjustments");
  const { data: me } = useAdminMe();
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(p: PendingAdjustment, approve: boolean) {
    setBusy(p.id + approve);
    try {
      await api(`/admin/adjustments/${p.id}/decide`, { json: { approve } });
      await refresh("/admin");
      toast.success(approve ? "Adjustment approved and posted to the ledger" : "Adjustment rejected");
    } catch (e) {
      toast.error("Couldn't decide", { description: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Users" subtitle="Everyone who signed up. Open a user to see their dashboard and adjust their balance." />
      {!!pending?.length && (
        <Card className="mb-5 animate-rise border-warning/30">
          <CardHeader title={`Adjustments awaiting a super admin (${pending.length})`} subtitle="Large adjustments need a different admin to approve them." />
          <ul className="divide-y divide-border px-5 pb-2 pt-3">
            {pending.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className={cn("tabular font-semibold", p.amountBtc >= 0 ? "text-success" : "text-danger")}>
                  {p.amountBtc > 0 ? "+" : ""}
                  {fmtBtc(p.amountBtc, 8)}
                </span>
                <span className="tabular text-xs text-text-muted">{fmtFiat(p.fiatAmount, p.fiatCurrency)}</span>
                <span className="font-medium">{p.user?.firstName} {p.user?.lastName}</span>
                <Badge className="capitalize">{p.reason.replace("_", " ").toLowerCase()}</Badge>
                <span className="min-w-0 flex-1 truncate text-text-muted">“{p.note}” · requested by {p.requestedByName}</span>
                {me?.user.role === "SUPER_ADMIN" && me.user.id !== p.requestedBy ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" loading={busy === p.id + false} icon={<X className="size-3.5" />} onClick={() => decide(p, false)}>Reject</Button>
                    <Button size="sm" variant="success" loading={busy === p.id + true} icon={<Check className="size-3.5" />} onClick={() => decide(p, true)}>Approve</Button>
                  </div>
                ) : (
                  <Badge tone="warning">{me?.user.id === p.requestedBy ? "Needs another super admin" : "Super admin only"}</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card className="animate-rise overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone" className="h-10 w-full rounded-[var(--radius-control)] border border-border bg-surface-alt pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-surface" />
          </div>
        </div>
        {error ? (
          <EmptyState icon={<Inbox className="size-5" />} title="Couldn't load users" body={error.message} />
        ) : !users ? (
          <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Inbox className="size-5" />} title={q ? "No users match" : "No users yet"} body={q ? undefined : "Users appear here as soon as they sign up on the website."} />
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Country</th>
                  <th className="px-3 py-3 font-medium">ID status</th>
                  <th className="px-3 py-3 text-right font-medium">Balance (BTC)</th>
                  <th className="px-3 py-3 text-right font-medium">Balance (local)</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className={cn("transition-colors hover:bg-surface-alt", u.status === "SUSPENDED" && "opacity-60")}>
                    <td className="px-5 py-3">
                      <p className="font-medium">
                        {u.firstName} {u.lastName} {u.status === "SUSPENDED" && <Badge tone="danger">Suspended</Badge>} {!u.emailVerified && <Badge>Email unverified</Badge>}
                      </p>
                      <p className="text-xs text-text-muted">{u.email}</p>
                    </td>
                    <td className="px-3 py-3">{u.country ?? "—"}</td>
                    <td className="px-3 py-3"><KycBadge status={u.kycStatus} /></td>
                    <td className="tabular px-3 py-3 text-right font-medium">{fmtBtc(u.balanceBtc, 6)}</td>
                    <td className="tabular px-3 py-3 text-right text-text-muted">{fmtFiat(u.balanceFiat, u.currency)}</td>
                    <td className="px-3 py-3 text-text-muted">{fmtDate(u.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/users/${u.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                        <Eye className="size-4" /> Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

/* ── User detail: their dashboard + Adjust balance (FR-8.6) ──── */
interface UserDetail {
  user: ApiUser;
  dashboard: Dashboard;
  ledger: LedgerEntry[];
  kycSubmission: { id: string; idType: string; status: string; createdAt: string } | null;
  pendingAdjustments: PendingAdjustment[];
  limits: { adjustmentSecondApprovalBtc: number };
}

const REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: "DEPOSIT_CREDIT", label: "Deposit credit (counts as amount deposited)" },
  { value: "CORRECTION", label: "Correction" },
  { value: "BONUS", label: "Bonus" },
  { value: "REFUND", label: "Refund" },
];

export function UserDetailAdmin({ id }: { id: string }) {
  const { data, error, mutate } = useApi<UserDetail>(`/admin/users/${id}`, { refreshInterval: 15_000 });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ direction: "credit" as "credit" | "debit", unit: "FIAT" as "BTC" | "FIAT", amount: "", reason: "DEPOSIT_CREDIT" as AdjustmentReason, note: "" });
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suspending, setSuspending] = useState(false);

  if (error) return <EmptyState icon={<Inbox className="size-5" />} title="User not found" body={error.message} action={<Link href="/users" className="text-sm font-semibold text-primary">Back to users</Link>} />;
  if (!data) return <Skeleton className="h-[600px]" />;
  const { user: u, dashboard: d } = data;

  const n = Number(form.amount);
  const btc = n > 0 ? (form.unit === "BTC" ? n : n / d.btcPrice) : 0;
  const fiat = n > 0 ? (form.unit === "FIAT" ? n : n * d.btcPrice) : 0;
  const amountErr = touched && !(n > 0) ? "Enter an amount greater than zero." : undefined;
  const noteErr = touched && form.note.trim().length < 5 ? "Write a note the user will see in their history." : undefined;
  const needsSecond = btc > data.limits.adjustmentSecondApprovalBtc;

  async function submit() {
    setTouched(true);
    if (!(n > 0) || form.note.trim().length < 5) return;
    setLoading(true);
    try {
      const r = await api<{ status: "posted" | "pending"; amountBtc: number }>(`/admin/users/${id}/adjust`, { json: { direction: form.direction, unit: form.unit, amount: n, reason: form.reason, note: form.note.trim() } });
      await Promise.all([mutate(), refresh("/admin")]);
      setOpen(false);
      setForm((f) => ({ ...f, amount: "", note: "" }));
      setTouched(false);
      if (r.status === "pending") toast.info("Sent for super-admin approval", { description: `${fmtBtc(r.amountBtc, 8)} is above the ${data!.limits.adjustmentSecondApprovalBtc} BTC limit.` });
      else toast.success("Balance updated", { description: `${r.amountBtc > 0 ? "+" : ""}${fmtBtc(r.amountBtc, 8)} posted to the ledger. The user sees it now.` });
    } catch (e) {
      toast.error("Adjustment not posted", { description: errorMessage(e) });
    } finally {
      setLoading(false);
    }
  }

  async function toggleSuspend() {
    setSuspending(true);
    try {
      await api(`/admin/users/${id}/suspend`, { json: { suspended: u.status !== "SUSPENDED" } });
      await mutate();
      toast.success(u.status === "SUSPENDED" ? "User unsuspended" : "User suspended");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSuspending(false);
    }
  }

  return (
    <>
      <Link href="/users" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary">
        <ArrowLeft className="size-4" /> All users
      </Link>
      <PageHeader
        title={`${u.firstName} ${u.lastName}`}
        subtitle={`${u.email} · ${u.phone ?? "no phone"} · ${u.country ?? "—"} · ${CURRENCY_NAME[u.currency] ?? u.currency}`}
        action={
          <div className="flex flex-wrap gap-2">
            {u.kycStatus === "PENDING_REVIEW" && (
              <Link href="/kyc" className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] border border-warning/40 bg-warning/10 px-4 text-sm font-semibold text-[#92400e]">
                Review ID <ExternalLink className="size-4" />
              </Link>
            )}
            <Button size="md" variant="secondary" loading={suspending} icon={<Ban className="size-4" />} onClick={toggleSuspend}>
              {u.status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
            </Button>
            <Button size="md" icon={<Coins className="size-4" />} onClick={() => setOpen(true)}>Adjust balance</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <KycBadge status={u.kycStatus} />
        {u.kycReason && <span className="text-text-muted">“{u.kycReason}”</span>}
        <Badge tone="primary"><Eye className="size-3" /> You&apos;re seeing this user&apos;s dashboard</Badge>
      </div>

      {/* The user's dashboard — same components and numbers they see */}
      <div className="grid grid-flow-row-dense gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="animate-rise md:col-span-2"><BalanceCard d={d} /></div>
        <div className="animate-rise" style={{ animationDelay: "60ms" }}><DepositedCard d={d} /></div>
        <div className="animate-rise" style={{ animationDelay: "120ms" }}><ProfitCard d={d} /></div>
        <div className="animate-rise md:col-span-2" style={{ animationDelay: "180ms" }}><AllocationCard d={d} /></div>
        <Card className="animate-rise md:col-span-2" style={{ animationDelay: "240ms" }}>
          <CardHeader title="Traders they copy" />
          {d.copies.length === 0 ? (
            <p className="px-5 py-6 text-sm text-text-muted">Not copying anyone.</p>
          ) : (
            <ul className="divide-y divide-border px-5 pb-2">
              {d.copies.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3 text-sm">
                  <Avatar name={c.trader.name} initials={c.trader.name.split(" ").map((p) => p[0]).join("")} hue={c.trader.hue} src={c.trader.photoUrl} size={32} />
                  <span className="flex-1 font-medium">{c.trader.name}</span>
                  <span className="tabular text-text-muted">{fmtBtc(c.allocationBtc, 4)}</span>
                  <span className={cn("tabular font-semibold", c.pnlBtc >= 0 ? "text-success" : "text-danger")}>{c.pnlBtc >= 0 ? "+" : ""}{fmtBtc(c.pnlBtc, 6)}</span>
                  <Badge tone={c.status === "ACTIVE" ? "success" : "warning"}>{c.status.toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {data.pendingAdjustments.length > 0 && (
        <Card className="mt-5 border-warning/30 p-4 text-sm">
          <p className="font-semibold text-[#92400e]">Waiting for super-admin approval</p>
          {data.pendingAdjustments.map((p) => (
            <p key={p.id} className="mt-1 text-text-muted">{p.amountBtc > 0 ? "+" : ""}{fmtBtc(p.amountBtc, 8)} ({fmtFiat(p.fiatAmount, p.fiatCurrency)}) · {p.reason.toLowerCase()} · “{p.note}”</p>
          ))}
        </Card>
      )}

      <Card className="mt-5 animate-rise">
        <CardHeader title="Ledger" subtitle="Read-only. Every balance change is an entry here, with who made it and why." />
        <div className="pt-2"><LedgerList entries={data.ledger} empty="No ledger entries yet. Credit a deposit or post an adjustment." /></div>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={`Adjust ${u.firstName}'s balance`}
        description="This posts a ledger entry. The user sees it in their transaction history with your note, and it's written to the audit log."
        footer={
          <>
            <Button size="md" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="md" loading={loading} loadingText="Posting…" onClick={submit}>{needsSecond ? "Send for approval" : "Post to ledger"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Segmented value={form.direction === "credit" ? "Credit" : "Debit"} onChange={(v) => setForm({ ...form, direction: v === "Credit" ? "credit" : "debit" })} options={["Credit", "Debit"] as const} />
            <Segmented value={form.unit === "BTC" ? "BTC" : u.currency} onChange={(v) => setForm({ ...form, unit: v === "BTC" ? "BTC" : "FIAT", amount: "" })} options={[u.currency, "BTC"] as const} />
          </div>
          <Field
            label={`Amount (${form.unit === "BTC" ? "BTC" : u.currency})`}
            icon={form.unit === "BTC" ? <Bitcoin /> : <Coins />}
            inputMode="decimal"
            placeholder={form.unit === "BTC" ? "0.001" : "50000"}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })}
            error={amountErr}
            hint={n > 0 ? <span className="tabular">= {fmtBtc(btc, 8)} · {fmtFiat(fiat, u.currency)} at 1 BTC = {fmtFiat(d.btcPrice, u.currency, 0)}</span> : `Balances are kept in BTC. ${u.currency} amounts are converted at the current rate.`}
          />
          <SelectField label="Reason type" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value as AdjustmentReason })} options={REASONS} />
          <TextArea label="Note (visible to the user)" placeholder="e.g. Bank deposit received 13 Nov, ref 2231" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} error={noteErr} />
          {needsSecond && (
            <p className="flex animate-pop items-start gap-2 rounded-xl border border-warning/30 bg-warning/[0.07] p-3 text-sm text-[#92400e]">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              Above {data.limits.adjustmentSecondApprovalBtc} BTC, a different super admin must approve this before it posts.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}

/* ── Wallet + deposit claims (FR-8.4) ────────────────────────── */
const CLAIM_TONE = { PENDING: "warning", MATCHED: "success", REJECTED: "danger", NEEDS_INFO: "primary" } as const;
const BTC_ADDR = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;

export function WalletsAdmin() {
  const { data, mutate } = useApi<{ history: WalletAddressRecord[]; claims: DepositClaim[] }>("/admin/wallets", { refreshInterval: 15_000 });
  const { data: me } = useAdminMe();
  const [tab, setTab] = useState<"Open" | "All">("Open");
  const [change, setChange] = useState({ open: false, address: "", reason: "", code: "" });
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  if (!data) return <Skeleton className="h-96" />;
  const active = data.history.find((w) => !w.activeTo) ?? data.history[0];
  const list = data.claims.filter((c) => tab === "All" || c.status === "PENDING" || c.status === "NEEDS_INFO");

  async function resolve(id: string, decision: "MATCHED" | "REJECTED" | "NEEDS_INFO") {
    setBusy(id + decision);
    try {
      await api(`/admin/claims/${id}/decision`, { json: { decision } });
      await Promise.all([mutate(), refresh("/admin/overview")]);
      toast.success(decision === "MATCHED" ? "Deposit credited to the user's ledger" : decision === "REJECTED" ? "Claim rejected" : "Asked the user for more info");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function saveAddress() {
    setTouched(true);
    if (!BTC_ADDR.test(change.address.trim()) || change.reason.trim().length < 5 || change.code.length !== 6) return;
    setLoading(true);
    try {
      await api("/admin/wallets", { json: { address: change.address.trim(), reason: change.reason.trim(), totp: change.code } });
      await mutate();
      setChange({ open: false, address: "", reason: "", code: "" });
      setTouched(false);
      toast.success("Deposit address updated", { description: "Every user was notified. The old address stays monitored for 90 days." });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Deposits and wallet" subtitle="One shared platform address. Every deposit is matched to a user by transaction hash before it's credited." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card className="animate-rise p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Active deposit address</p>
            <Badge tone="success" dot>Live</Badge>
          </div>
          <p className="mt-3 break-all rounded-xl bg-surface-alt p-3 font-mono text-sm">{active.address}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton value={active.address} />
            {me?.user.role === "SUPER_ADMIN" && (
              <Button size="sm" variant="secondary" icon={<KeyRound className="size-3.5" />} onClick={() => setChange((c) => ({ ...c, open: true }))}>Change address</Button>
            )}
          </div>
          <p className="mt-5 text-sm font-semibold">History</p>
          <ul className="mt-2 space-y-2">
            {data.history.map((w) => (
              <li key={w.id} className="rounded-xl border border-border p-3 text-xs">
                <p className="truncate font-mono">{w.address}</p>
                <p className="mt-1 text-text-muted">{fmtDate(w.activeFrom)} → {w.activeTo ? fmtDate(w.activeTo) : "now"} · {w.setBy}</p>
                <p className="text-text-muted">“{w.reason}”</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="animate-rise" style={{ animationDelay: "80ms" }}>
          <CardHeader title="Deposit claims" subtitle="Submitted by users after they send BTC" action={<Segmented value={tab} onChange={setTab} options={["Open", "All"] as const} />} />
          {list.length === 0 ? (
            <EmptyState icon={<CircleCheck className="size-5" />} title="No open claims" body="When a user submits a deposit claim it appears here." />
          ) : (
            <ul className="divide-y divide-border px-5 pb-3 pt-3">
              {list.map((c) => (
                <li key={c.id} className="animate-fade py-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Link href={`/users/${c.userId}`} className="font-semibold hover:text-primary">{c.user?.firstName} {c.user?.lastName}</Link>
                    <span className="tabular font-semibold text-primary">{fmtBtc(c.amountBtc, 6)}</span>
                    <Badge tone={CLAIM_TONE[c.status]} dot className="ml-auto">{c.status.replace("_", " ").toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-text-muted">tx {shortHash(c.txHash, 10)} · from {shortHash(c.fromAddress, 8)} · {timeAgo(c.createdAt)}</p>
                  {(c.status === "PENDING" || c.status === "NEEDS_INFO") && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="success" loading={busy === c.id + "MATCHED"} icon={<Check className="size-3.5" />} onClick={() => resolve(c.id, "MATCHED")}>Match and credit</Button>
                      <Button size="sm" variant="secondary" loading={busy === c.id + "NEEDS_INFO"} icon={<HelpCircle className="size-3.5" />} onClick={() => resolve(c.id, "NEEDS_INFO")}>Request info</Button>
                      <Button size="sm" variant="secondary" className="text-danger" loading={busy === c.id + "REJECTED"} icon={<X className="size-3.5" />} onClick={() => resolve(c.id, "REJECTED")}>Reject</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={change.open}
        onOpenChange={(o) => setChange((c) => ({ ...c, open: o }))}
        title="Change platform deposit address"
        description="Every user's dashboard updates at once, and every user is notified."
        footer={<Button size="md" variant="danger" loading={loading} loadingText="Updating…" onClick={saveAddress}>Change address for all users</Button>}
      >
        <div className="space-y-4">
          <Field label="New BTC address (from the custodian)" placeholder="bc1q…" value={change.address} onChange={(e) => setChange((c) => ({ ...c, address: e.target.value }))} error={touched && !BTC_ADDR.test(change.address.trim()) ? "Enter a valid Bitcoin address." : undefined} />
          <TextArea label="Reason (audit-logged)" value={change.reason} onChange={(e) => setChange((c) => ({ ...c, reason: e.target.value }))} error={touched && change.reason.trim().length < 5 ? "A reason is required." : undefined} />
          <Field label="Your authenticator code" icon={<KeyRound />} inputMode="numeric" maxLength={6} value={change.code} onChange={(e) => setChange((c) => ({ ...c, code: e.target.value.replace(/\D/g, "") }))} error={touched && change.code.length !== 6 ? "Enter your 6-digit code." : undefined} />
        </div>
      </Modal>
    </>
  );
}

/* ── Withdrawals (approval above threshold) ──────────────────── */
export function WithdrawalsAdmin() {
  const { data, mutate } = useApi<Withdrawal[]>("/admin/withdrawals", { refreshInterval: 15_000 });
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(id: string, approve: boolean) {
    setBusy(id + approve);
    try {
      await api(`/admin/withdrawals/${id}/decide`, { json: { approve } });
      await Promise.all([mutate(), refresh("/admin/overview")]);
      toast.success(approve ? "Withdrawal approved" : "Withdrawal rejected and refunded");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Withdrawals" subtitle="Withdrawals above 0.1 BTC wait here for approval. Rejecting one returns the amount and fee to the user." />
      <Card className="animate-rise overflow-hidden">
        {!data ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon={<Inbox className="size-5" />} title="No withdrawals yet" />
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">To</th>
                  <th className="px-3 py-3 font-medium">Requested</th>
                  <th className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((w) => (
                  <tr key={w.id} className="hover:bg-surface-alt">
                    <td className="px-5 py-3 font-medium">{w.user?.firstName} {w.user?.lastName}</td>
                    <td className="tabular px-3 py-3">{fmtBtc(w.amountBtc, 6)}</td>
                    <td className="px-3 py-3 font-mono text-xs text-text-muted">{shortHash(w.address, 8)}</td>
                    <td className="px-3 py-3 text-text-muted">{fmtDateTime(w.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      {w.status === "AWAITING_APPROVAL" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" loading={busy === w.id + false} onClick={() => decide(w.id, false)}>Reject</Button>
                          <Button size="sm" variant="success" loading={busy === w.id + true} onClick={() => decide(w.id, true)}>Approve</Button>
                        </div>
                      ) : (
                        <Badge tone={w.status === "REJECTED" ? "danger" : "success"}>{w.status.toLowerCase()}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
