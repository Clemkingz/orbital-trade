"use client";

import type { ReactNode } from "react";
import { ArrowDownLeft, Bitcoin, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "../../lib/cn";
import { CURRENCY_NAME, fmtBtc, fmtDateTime, fmtFiat, shortHash } from "../../lib/format";
import type { Dashboard, LedgerEntry, Money } from "../../lib/types";
import { Badge, Card, CardHeader } from "../ui/misc";
import { TX_LABEL, TxIcon } from "../ui/TxIcon";

/** Two balances side by side: Bitcoin and the user's own currency. */
export function BalanceCard({ d, label = "Total balance" }: { d: Dashboard; label?: string }) {
  return (
    <Card className="relative h-full overflow-hidden border-0 bg-night text-white">
      <div className="pointer-events-none absolute -right-16 -top-20 size-64 animate-glow rounded-full bg-primary/50 blur-3xl" />
      <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative p-5 sm:p-6">
        <p className="flex items-center gap-2 text-sm text-white/65">
          <Wallet className="size-4 text-cyan" /> {label}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-white/50">
              <Bitcoin className="size-3.5" /> Bitcoin
            </p>
            <p className="tabular mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{fmtBtc(d.balance.btc, 8)}</p>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">
              {CURRENCY_NAME[d.currency] ?? d.currency} ({d.currency})
            </p>
            <p className="tabular mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{fmtFiat(d.balance.fiat, d.currency)}</p>
          </div>
        </div>
        <p className="tabular mt-5 text-[11px] text-white/45">
          1 BTC = {fmtFiat(d.btcPrice, d.currency, 0)} · computed from the ledger
        </p>
      </div>
    </Card>
  );
}

function MoneyCard({ icon, label, value, currency, hint, tone }: { icon: ReactNode; label: string; value: Money; currency: string; hint: string; tone?: "up" | "down" }) {
  return (
    <Card className="h-full p-5">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", tone === "down" ? "bg-danger/10 text-danger" : tone === "up" ? "bg-success/10 text-success" : "bg-primary-soft text-primary")}>{icon}</span>
        {label}
      </p>
      <p className={cn("tabular mt-4 text-xl font-bold", tone === "up" && "text-success", tone === "down" && "text-danger")}>
        {tone === "up" && value.btc > 0 ? "+" : ""}
        {fmtBtc(value.btc, 8)}
      </p>
      <p className="tabular mt-0.5 text-sm font-medium text-text-muted">≈ {fmtFiat(value.fiat, currency)}</p>
      <p className="mt-3 text-[11px] text-text-muted">{hint}</p>
    </Card>
  );
}

export function DepositedCard({ d, label = "Amount deposited" }: { d: Dashboard; label?: string }) {
  return <MoneyCard icon={<ArrowDownLeft className="size-4" />} label={label} value={d.deposited} currency={d.currency} hint="Matched deposits and deposit credits." />;
}

export function ProfitCard({ d, label = "Profit" }: { d: Dashboard; label?: string }) {
  const down = d.profit.btc < 0;
  return (
    <MoneyCard
      icon={down ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
      label={label}
      value={d.profit}
      currency={d.currency}
      tone={d.profit.btc === 0 ? undefined : down ? "down" : "up"}
      hint="From copied trades, after fees. Converted to BTC when each trade closes."
    />
  );
}

export function AllocationCard({ d, label = "Available vs allocated" }: { d: Dashboard; label?: string }) {
  const pct = d.balance.btc > 0 ? Math.min(100, (d.allocated.btc / d.balance.btc) * 100) : 0;
  return (
    <Card className="h-full">
      <CardHeader title={label} />
      <div className="p-5 pt-4">
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-sidebar-ring transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            ["Available", d.available, "bg-border"],
            ["Copy trading", d.allocated, "bg-primary"],
          ].map(([k, v, dot]) => (
            <div key={k as string} className="rounded-xl bg-surface-alt p-3">
              <p className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className={cn("size-2 rounded-full", dot as string)} /> {k as string}
              </p>
              <p className="tabular mt-1 text-sm font-semibold">{fmtBtc((v as Money).btc, 6)}</p>
              <p className="tabular text-[11px] text-text-muted">{fmtFiat((v as Money).fiat, d.currency)}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

const reasonLabel = (r: string | null) => (r ? r.replace("_", " ").toLowerCase() : null);

/** Ledger rows with BTC and the fiat value recorded at posting time. */
export function LedgerList({ entries, empty = "No transactions yet." }: { entries: LedgerEntry[]; empty?: string }) {
  if (!entries.length) return <p className="px-5 py-8 text-center text-sm text-text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-border">
      {entries.map((e, i) => (
        <li key={e.id} className="flex animate-fade flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap sm:px-5" style={{ animationDelay: `${Math.min(i, 15) * 25}ms` }}>
          <TxIcon type={e.type} amount={e.amountBtc} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {TX_LABEL[e.type]}
              {e.adjustmentReason && <Badge className="ml-2 capitalize">{reasonLabel(e.adjustmentReason)}</Badge>}
            </p>
            <p className="truncate text-xs text-text-muted">{e.note ?? (e.reference ? `Ref ${shortHash(e.reference)}` : "—")}</p>
          </div>
          <p className="w-full text-xs text-text-muted sm:w-40 sm:text-right" suppressHydrationWarning>
            {fmtDateTime(e.createdAt)}
          </p>
          <div className="w-36 text-right">
            <p className={cn("tabular text-sm font-semibold", e.amountBtc >= 0 ? "text-success" : "text-danger")}>
              {e.amountBtc >= 0 ? "+" : ""}
              {fmtBtc(e.amountBtc, 8)}
            </p>
            {e.fiatAmount != null && e.fiatCurrency && <p className="tabular text-[11px] text-text-muted">{fmtFiat(e.fiatAmount, e.fiatCurrency)}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
