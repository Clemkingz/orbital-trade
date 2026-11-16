"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowDownToLine, Bitcoin, Clock, Download, Hash, KeyRound, MailCheck, Plus, Receipt, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { LedgerList } from "@orbit/ui/components/account/AccountCards";
import { Button } from "@orbit/ui/components/ui/Button";
import { Field } from "@orbit/ui/components/ui/Field";
import { Modal } from "@orbit/ui/components/ui/Modal";
import { toast } from "@orbit/ui/components/ui/Toast";
import { TX_LABEL } from "@orbit/ui/components/ui/TxIcon";
import { Badge, Card, CardHeader, CopyButton, EmptyState, Segmented, Skeleton } from "@orbit/ui/components/ui/misc";
import { api, errorMessage, useApi } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";
import { CURRENCY_NAME, downloadFile, fmtBtc, fmtFiat, shortHash, timeAgo, toCsv } from "@orbit/ui/lib/format";
import type { LedgerEntry, Withdrawal, WithdrawalAddress } from "@orbit/ui/lib/types";
import { refreshAccount, useDashboard, useMe } from "@/lib/data";
import { PageHeader } from "./AppShell";
import { DepositAddress } from "./DepositAddress";
import { RequireVerified } from "./Gate";

const BTC_ADDR = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;
const TX_HASH = /^[a-fA-F0-9]{64}$/;

const CLAIM_TONE = { PENDING: "warning", MATCHED: "success", REJECTED: "danger", NEEDS_INFO: "primary" } as const;
const CLAIM_LABEL = { PENDING: "Pending match", MATCHED: "Credited", REJECTED: "Rejected", NEEDS_INFO: "More info needed" } as const;

/* ── Deposit ─────────────────────────────────────────────────── */
export function DepositView() {
  const { data: d } = useDashboard();
  const [v, setV] = useState({ amount: "", hash: "", from: "" });
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const errors = {
    amount: !v.amount || Number(v.amount) <= 0 ? "Enter the amount you sent." : undefined,
    hash: !TX_HASH.test(v.hash.trim()) ? "A transaction hash is 64 hexadecimal characters." : undefined,
    from: !BTC_ADDR.test(v.from.trim()) ? "Enter the Bitcoin address you sent from." : undefined,
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (errors.amount || errors.hash || errors.from) return;
    setLoading(true);
    try {
      await api("/me/deposit-claims", { json: { amountBtc: Number(v.amount), txHash: v.hash.trim(), fromAddress: v.from.trim() } });
      await refreshAccount();
      setDone(true);
      setTimeout(() => setDone(false), 1600);
      toast.success("Deposit claim submitted", { description: "We'll credit it after 2 network confirmations once it matches." });
      setV({ amount: "", hash: "", from: "" });
      setTouched(false);
    } catch (err) {
      toast.error("Claim not submitted", { description: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  const fiatPreview = d && Number(v.amount) > 0 ? fmtFiat(Number(v.amount) * d.btcPrice, d.currency) : null;

  return (
    <>
      <PageHeader title="Deposit BTC" subtitle="Send BTC to the platform address, then tell us about it so we can match it to you." />
      <RequireVerified feature="Depositing">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="animate-rise p-5 sm:p-6">
            <h2 className="font-semibold">1. Send BTC to this address</h2>
            <p className="mb-5 mt-1 text-sm text-text-muted">It&apos;s the same address for every customer, so the claim step matters.</p>
            <DepositAddress />
          </Card>
          <Card id="claim" className="animate-rise p-5 sm:p-6" style={{ animationDelay: "80ms" }}>
            <h2 className="font-semibold">2. Submit a deposit claim</h2>
            <p className="mb-5 mt-1 text-sm text-text-muted">We match your claim to the on-chain transaction by hash and amount. Each hash can be credited once.</p>
            <form onSubmit={submit} noValidate className="space-y-4">
              <Field label="Amount sent (BTC)" icon={<Bitcoin />} inputMode="decimal" placeholder="0.0125" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value.replace(/[^\d.]/g, "") })} error={touched ? errors.amount : undefined} hint={fiatPreview ? `≈ ${fiatPreview}` : undefined} />
              <Field label="Transaction hash" icon={<Hash />} placeholder="64-character hash from the platform" value={v.hash} onChange={(e) => setV({ ...v, hash: e.target.value })} error={touched ? errors.hash : undefined} hint="Find it in your purchase history on the buy platform." />
              <Field label="Sending address" icon={<Wallet />} placeholder="bc1q…" value={v.from} onChange={(e) => setV({ ...v, from: e.target.value })} error={touched ? errors.from : undefined} />
              <Button type="submit" fullWidth loading={loading} loadingText="Submitting claim…" done={done}>
                Submit claim
              </Button>
            </form>
          </Card>
        </div>
        <Card className="mt-5 animate-rise" style={{ animationDelay: "140ms" }}>
          <CardHeader title="Your claims" />
          {!d ? (
            <div className="p-5"><Skeleton className="h-16" /></div>
          ) : d.claims.length === 0 ? (
            <EmptyState icon={<Receipt className="size-5" />} title="No claims yet" body="After you send BTC, submit a claim above." />
          ) : (
            <ul className="divide-y divide-border px-5 pb-2 pt-3">
              {d.claims.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <span className="tabular font-semibold">{fmtBtc(c.amountBtc, 6)}</span>
                  <span className="font-mono text-xs text-text-muted">{shortHash(c.txHash, 8)}</span>
                  <span className="text-xs text-text-muted" suppressHydrationWarning>{timeAgo(c.createdAt)}</span>
                  {c.note && <span className="text-xs text-warning">{c.note}</span>}
                  <Badge tone={CLAIM_TONE[c.status]} dot className="ml-auto">{CLAIM_LABEL[c.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </RequireVerified>
    </>
  );
}

/* ── Transactions ────────────────────────────────────────────── */
const TYPES = ["All", "Deposits", "Withdrawals", "Profit", "Fees", "Adjustments"] as const;
const TYPE_MAP: Record<(typeof TYPES)[number], LedgerEntry["type"][] | null> = { All: null, Deposits: ["DEPOSIT"], Withdrawals: ["WITHDRAWAL"], Profit: ["TRADE_PNL"], Fees: ["FEE"], Adjustments: ["ADJUSTMENT"] };

export function TransactionsView() {
  const { data: ledger, error } = useApi<LedgerEntry[]>("/me/transactions");
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "All">("All");

  const rows = useMemo(() => {
    const since = range === "All" ? 0 : Date.now() - { "7d": 7, "30d": 30, "90d": 90 }[range] * 86_400_000;
    const types = TYPE_MAP[type];
    return (ledger ?? []).filter((e) => (!types || types.includes(e.type)) && +new Date(e.createdAt) >= since);
  }, [ledger, type, range]);

  function exportCsv() {
    downloadFile(
      `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(rows.map((r) => ({ date: r.createdAt, type: TX_LABEL[r.type], amount_btc: r.amountBtc, fiat_amount: r.fiatAmount ?? "", currency: r.fiatCurrency ?? "", btc_price: r.btcPrice ?? "", reason: r.adjustmentReason ?? "", note: r.note ?? "", reference: r.reference ?? "" }))),
    );
    toast.success("CSV exported", { description: `${rows.length} transactions downloaded.` });
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every entry in your ledger. Your balance is the sum of these."
        action={<Button size="md" variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>}
      />
      <Card className="animate-rise">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="scroll-thin -mx-1 overflow-x-auto px-1">
            <Segmented value={type} onChange={setType} options={TYPES} className="whitespace-nowrap" />
          </div>
          <Segmented value={range} onChange={setRange} options={["7d", "30d", "90d", "All"] as const} />
        </div>
        {error ? (
          <EmptyState icon={<Receipt className="size-5" />} title="Couldn't load transactions" body={error.message} />
        ) : !ledger ? (
          <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <LedgerList entries={rows} empty="No transactions match these filters." />
        )}
      </Card>
    </>
  );
}

/* ── Withdraw ────────────────────────────────────────────────── */
interface WithdrawData {
  withdrawals: Withdrawal[];
  addresses: WithdrawalAddress[];
  feeBtc: number;
  approvalThresholdBtc: number;
}

function WithdrawInner() {
  const { data: me } = useMe();
  const { data: d } = useDashboard();
  const { data: w, mutate } = useApi<WithdrawData>("/me/withdrawals");
  const [amount, setAmount] = useState("");
  const [addr, setAddr] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [totp, setTotp] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAddr, setNewAddr] = useState({ open: false, address: "", label: "", saving: false });

  if (!w || !d || !me) return <Skeleton className="h-96" />;
  const fee = w.feeBtc;
  const n = Number(amount);
  const available = d.available.btc;
  const amountError = touched && (!n || n <= 0 ? "Enter an amount." : n + fee > available + 1e-9 ? "Amount plus fee exceeds your available balance." : undefined);
  const addrError = touched && !addr ? "Choose a withdrawal address." : undefined;

  async function sendCode() {
    setSendingCode(true);
    try {
      const r = await api<{ devCode?: string }>("/me/withdrawals/email-code", { method: "POST" });
      setDevCode(r.devCode ?? null);
      toast.info("Code sent", { description: `Check ${me!.user.email}.` });
    } catch (e) {
      toast.error("Couldn't send the code", { description: errorMessage(e) });
    } finally {
      setSendingCode(false);
    }
  }

  function start(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!n || n <= 0 || n + fee > available + 1e-9 || !addr) return;
    if (!me!.user.totpEnabled) return toast.warning("Turn on 2FA first", { description: "Withdrawals need two-factor authentication. Turn it on in Settings." });
    setConfirmOpen(true);
    sendCode();
  }

  async function confirm() {
    setLoading(true);
    try {
      const res = await api<Withdrawal>("/me/withdrawals", { json: { amountBtc: n, address: addr, totp, emailCode } });
      await Promise.all([mutate(), refreshAccount()]);
      setConfirmOpen(false);
      setAmount("");
      setTotp("");
      setEmailCode("");
      setDevCode(null);
      setTouched(false);
      toast.success(res.status === "AWAITING_APPROVAL" ? "Withdrawal awaiting admin approval" : "Withdrawal is processing", {
        description: res.status === "AWAITING_APPROVAL" ? `Amounts above ${w!.approvalThresholdBtc} BTC get a quick extra check.` : "You'll get an email when it's sent.",
      });
    } catch (err) {
      toast.error("Withdrawal not sent", { description: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  async function addAddress() {
    if (!BTC_ADDR.test(newAddr.address.trim())) return toast.error("That doesn't look like a Bitcoin address");
    setNewAddr((s) => ({ ...s, saving: true }));
    try {
      await api("/me/withdrawal-addresses", { json: { address: newAddr.address.trim(), label: newAddr.label.trim() || "My wallet" } });
      await mutate();
      setNewAddr({ open: false, address: "", label: "", saving: false });
      toast.info("Address saved", { description: "For your security, new addresses can be used after 24 hours." });
    } catch (e) {
      setNewAddr((s) => ({ ...s, saving: false }));
      toast.error("Couldn't save the address", { description: errorMessage(e) });
    }
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="animate-rise p-5 sm:p-6">
          <form onSubmit={start} noValidate className="space-y-4">
            <div className="grid gap-3 rounded-xl bg-night p-4 text-white sm:grid-cols-2">
              <div>
                <p className="text-xs text-white/60">Available to withdraw</p>
                <p className="tabular mt-1 text-xl font-bold">{fmtBtc(available, 8)}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-white/60">{CURRENCY_NAME[d.currency] ?? d.currency}</p>
                <p className="tabular mt-1 text-xl font-bold">{fmtFiat(d.available.fiat, d.currency)}</p>
              </div>
            </div>
            <Field
              label="Amount (BTC)"
              icon={<Bitcoin />}
              inputMode="decimal"
              placeholder="0.005"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              error={amountError || undefined}
              hint={
                <span className="flex justify-between gap-2">
                  <span>
                    Network fee {fmtBtc(fee, 4)}
                    {n > 0 && ` · ≈ ${fmtFiat(n * d.btcPrice, d.currency)}`}
                  </span>
                  <button type="button" className="font-semibold text-primary" onClick={() => setAmount(Math.max(0, available - fee).toFixed(8))}>
                    Max
                  </button>
                </span>
              }
            />
            <div>
              <p className="mb-1.5 text-sm font-medium">To address</p>
              <div className="space-y-2">
                {w.addresses.length === 0 && <p className="rounded-xl bg-surface-alt p-3 text-sm text-text-muted">No saved addresses yet.</p>}
                {w.addresses.map((a) => {
                  const held = Date.now() < +new Date(a.usableFrom);
                  return (
                    <label key={a.id} className={cn("flex items-center gap-3 rounded-xl border p-3 transition", addr === a.address ? "border-primary bg-primary-soft/40" : "border-border", held ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-primary/40")}>
                      <input type="radio" name="addr" disabled={held} checked={addr === a.address} onChange={() => setAddr(a.address)} className="accent-[#5501ff]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{a.label}</span>
                        <span className="block truncate font-mono text-xs text-text-muted">{a.address}</span>
                      </span>
                      {held && (
                        <Badge tone="warning">
                          <Clock className="size-3" /> usable {timeAgo(a.usableFrom).replace(" ago", "")}
                        </Badge>
                      )}
                    </label>
                  );
                })}
                {addrError && <p className="text-[13px] text-danger">{addrError}</p>}
                <Button type="button" variant="ghost" size="sm" icon={<Plus className="size-4" />} onClick={() => setNewAddr((s) => ({ ...s, open: true }))}>
                  Add address
                </Button>
              </div>
            </div>
            <Button type="submit" fullWidth icon={<ArrowDownToLine className="size-4" />}>
              Review withdrawal
            </Button>
            {!me.user.totpEnabled && <p className="text-center text-xs text-warning">2FA is required for withdrawals. Turn it on in Settings.</p>}
          </form>
        </Card>
        <Card className="animate-rise" style={{ animationDelay: "80ms" }}>
          <CardHeader title="Recent withdrawals" />
          {w.withdrawals.length === 0 ? (
            <EmptyState icon={<ArrowDownToLine className="size-5" />} title="No withdrawals yet" />
          ) : (
            <ul className="divide-y divide-border px-5 pb-2 pt-3">
              {w.withdrawals.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
                  <span className="tabular font-semibold">{fmtBtc(x.amountBtc, 6)}</span>
                  <span className="truncate font-mono text-xs text-text-muted">{shortHash(x.address)}</span>
                  <Badge tone={x.status === "AWAITING_APPROVAL" ? "warning" : x.status === "REJECTED" ? "danger" : "primary"} dot className="ml-auto">
                    {{ AWAITING_APPROVAL: "Awaiting approval", PROCESSING: "Processing", COMPLETED: "Completed", REJECTED: "Rejected · refunded" }[x.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm withdrawal"
        description={`${fmtBtc(n || 0, 8)} + ${fmtBtc(fee, 4)} fee`}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button size="md" loading={loading} loadingText="Confirming…" onClick={confirm} disabled={totp.length !== 6 || emailCode.length !== 6}>Confirm withdrawal</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="break-all rounded-xl bg-surface-alt p-3 font-mono text-xs">{addr}</p>
          <Field label="Authenticator code" icon={<KeyRound />} inputMode="numeric" maxLength={6} placeholder="6-digit code" value={totp} onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))} />
          <Field
            label="Code from your email"
            icon={<MailCheck />}
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={emailCode}
            onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
            hint={
              <span className="flex justify-between gap-2">
                <span>{devCode ? <>Dev mode: your code is <b className="tabular">{devCode}</b></> : `Sent to ${me.user.email}`}</span>
                <button type="button" className="font-semibold text-primary disabled:opacity-50" disabled={sendingCode} onClick={sendCode}>Resend</button>
              </span>
            }
          />
        </div>
      </Modal>

      <Modal
        open={newAddr.open}
        onOpenChange={(o) => setNewAddr((s) => ({ ...s, open: o }))}
        title="Add withdrawal address"
        description="For your security, new addresses can be used 24 hours after you add them."
        footer={<Button size="md" loading={newAddr.saving} onClick={addAddress}>Save address</Button>}
      >
        <div className="space-y-4">
          <Field label="Label" placeholder="e.g. Hardware wallet" value={newAddr.label} onChange={(e) => setNewAddr((s) => ({ ...s, label: e.target.value }))} />
          <Field label="Bitcoin address" icon={<Wallet />} placeholder="bc1q…" value={newAddr.address} onChange={(e) => setNewAddr((s) => ({ ...s, address: e.target.value }))} />
        </div>
      </Modal>
    </>
  );
}

export function WithdrawView() {
  return (
    <>
      <PageHeader title="Withdraw" subtitle="Withdraw your available balance at any time. The only charge is the published network fee." />
      <RequireVerified feature="Withdrawing">
        <WithdrawInner />
      </RequireVerified>
    </>
  );
}

/* ── Settings ────────────────────────────────────────────────── */
export function SettingsView() {
  const { data } = useMe();
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [disable, setDisable] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!data) return <Skeleton className="h-80" />;
  const u = data.user;

  async function begin() {
    setLoading(true);
    try {
      setSetup(await api("/me/2fa/setup", { method: "POST" }));
    } catch (e) {
      toast.error("Couldn't start setup", { description: errorMessage(e) });
    } finally {
      setLoading(false);
    }
  }

  async function finish(path: "enable" | "disable") {
    setLoading(true);
    try {
      await api(`/me/2fa/${path}`, { json: { code } });
      await refreshAccount();
      toast.success(path === "enable" ? "Two-factor authentication is on" : "Two-factor authentication is off");
      setSetup(null);
      setDisable(false);
      setCode("");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile and security." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="animate-rise p-5 sm:p-6">
          <h2 className="font-semibold">Profile</h2>
          <dl className="mt-4 divide-y divide-border text-sm">
            {[
              ["Name", `${u.firstName} ${u.lastName}`],
              ["Email", u.email],
              ["Phone", u.phone ?? "—"],
              ["Country", u.country ?? "—"],
              ["Display currency", `${CURRENCY_NAME[u.currency] ?? u.currency} (${u.currency})`],
              ["ID verification", u.kycStatus.replace(/_/g, " ").toLowerCase()],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3">
                <dt className="text-text-muted">{k}</dt>
                <dd className="text-right font-medium first-letter:uppercase">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="animate-rise p-5 sm:p-6" style={{ animationDelay: "80ms" }}>
          <h2 className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5 text-primary" /> Two-factor authentication
          </h2>
          <p className="mt-1 text-sm text-text-muted">Use an authenticator app (Google Authenticator, Authy, 1Password) to protect sign-in and withdrawals.</p>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-alt p-4">
            <span className="flex items-center gap-3 text-sm">
              <Smartphone className="size-5 text-text-muted" /> Authenticator app
            </span>
            {u.totpEnabled ? <Badge tone="success" dot>On</Badge> : <Button size="sm" loading={loading && !setup} onClick={begin}>Turn on</Button>}
          </div>
          {u.totpEnabled && (
            <Button variant="ghost" size="sm" className="mt-3 text-danger" onClick={() => setDisable(true)}>
              Turn off 2FA
            </Button>
          )}
        </Card>
      </div>
      <Modal
        open={!!setup}
        onOpenChange={(o) => !o && setSetup(null)}
        title="Set up two-factor authentication"
        description="Scan the QR code with your authenticator app, then enter the 6-digit code it shows."
        footer={<Button size="md" loading={loading} loadingText="Verifying…" onClick={() => finish("enable")} disabled={code.length !== 6}>Verify and turn on</Button>}
      >
        {setup && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl border border-border p-3">
              <QRCodeSVG value={setup.otpauthUrl} size={168} fgColor="#0d0020" />
            </div>
            <div className="flex w-full items-center justify-between gap-2 rounded-xl bg-surface-alt px-3 py-2">
              <code className="truncate text-xs">{setup.secret}</code>
              <CopyButton value={setup.secret} label="Copy key" />
            </div>
            <Field className="w-full" label="6-digit code" icon={<KeyRound />} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
          </div>
        )}
      </Modal>
      <Modal open={disable} onOpenChange={setDisable} title="Turn off 2FA" description="Enter a current code from your authenticator app to confirm." footer={<Button size="md" variant="danger" loading={loading} onClick={() => finish("disable")} disabled={code.length !== 6}>Turn off</Button>}>
        <Field label="6-digit code" icon={<KeyRound />} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
      </Modal>
    </>
  );
}
