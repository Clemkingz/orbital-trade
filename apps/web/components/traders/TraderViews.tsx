"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/AppShell";
import { Button } from "@orbit/ui/components/ui/Button";
import { toast } from "@orbit/ui/components/ui/Toast";
import { Avatar, Badge, Card, CardHeader, EmptyState, Reveal, Segmented, Skeleton } from "@orbit/ui/components/ui/misc";
import { useApi } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";
import { fmtBtc, fmtDateTime, fmtPct } from "@orbit/ui/lib/format";
import type { Trade, Trader } from "@orbit/ui/lib/types";
import { useDashboard, useMe, useTraders } from "@/lib/data";
import { CopyModal } from "./CopyModal";
import { initialsOf, PAST_PERFORMANCE, RiskMeter, TraderCard } from "./TraderCard";

const SORTS = ["30d return", "Win rate", "Lowest risk", "Most copied"] as const;

function CopyAction({ trader, size = "md" }: { trader: Trader; size?: "md" | "lg" }) {
  const { data: me } = useMe();
  const { data: d } = useDashboard();
  const [open, setOpen] = useState(false);
  const verified = me?.user.kycStatus === "APPROVED";
  if (d?.copies.some((c) => c.trader.id === trader.id))
    return (
      <Button variant="secondary" size={size} fullWidth disabled>
        Already copying
      </Button>
    );
  return (
    <>
      <Button size={size} fullWidth icon={<Copy className="size-4" />} onClick={() => (verified ? setOpen(true) : toast.warning("Verify your ID first", { description: "Copy trading unlocks after an admin approves your ID." }))}>
        Copy trader
      </Button>
      {verified && <CopyModal trader={trader} open={open} onOpenChange={setOpen} />}
    </>
  );
}

export function TraderDirectory() {
  const { data, error } = useTraders();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("30d return");

  const shown = useMemo(() => {
    const filtered = (data ?? []).filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
    const key = { "30d return": (t: Trader) => -t.stats.return30, "Win rate": (t: Trader) => -t.stats.winRate, "Lowest risk": (t: Trader) => t.riskLevel, "Most copied": (t: Trader) => -t.copiers }[sort];
    return [...filtered].sort((a, b) => key(a) - key(b));
  }, [data, q, sort]);

  return (
    <>
      <PageHeader title="Traders" subtitle="Every statistic is counted from recorded trades. Copy one or several." />
      <div className="mb-6 flex animate-rise flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search traders" className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
        </div>
        <div className="scroll-thin -mx-1 overflow-x-auto px-1">
          <Segmented value={sort} onChange={setSort} options={SORTS} className="whitespace-nowrap" />
        </div>
      </div>
      {error ? (
        <EmptyState icon={<Users className="size-5" />} title="Couldn't load traders" body={error.message} />
      ) : !data ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[420px]" />)}</div>
      ) : shown.length === 0 ? (
        <EmptyState icon={<Users className="size-5" />} title="No traders match your search" />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((trader, i) => (
            <Reveal key={trader.id} delay={i * 70}>
              <TraderCard trader={trader} href={`/traders/${trader.id}`} action={<CopyAction trader={trader} />} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}

export function TraderProfile({ id }: { id: string }) {
  const { data: trader, error } = useApi<Trader & { trades: Trade[] }>(`/traders/${id}`);
  const [filter, setFilter] = useState<"All" | "Wins" | "Losses">("All");
  const trades = useMemo(
    () =>
      (trader?.trades ?? [])
        .filter((t) => t.closedAt && t.exit != null)
        .map((t) => ({ ...t, ret: ((t.exit! - t.entry) / t.entry) * (t.side === "BUY" ? 100 : -100) }))
        .filter((t) => (filter === "All" ? true : filter === "Wins" ? t.ret > 0 : t.ret < 0)),
    [trader, filter],
  );

  if (error) return <EmptyState icon={<Users className="size-5" />} title="Trader not found" body={error.message} action={<Link href="/traders" className="text-sm font-semibold text-primary">Back to traders</Link>} />;
  if (!trader) return <Skeleton className="h-[600px]" />;
  const s = trader.stats;

  const STATS = [
    ["30-day return", fmtPct(s.return30, 1), s.return30 >= 0],
    ["90-day return", fmtPct(s.return90, 1), s.return90 >= 0],
    ["Win rate", `${s.winRate.toFixed(1)}%`, null],
    ["Wins", String(s.wins), true],
    ["Losses", String(s.losses), false],
    ["Max drawdown", `${s.maxDrawdown.toFixed(1)}%`, false],
  ] as const;

  return (
    <>
      <Link href="/traders" className="mb-5 inline-flex animate-fade items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary">
        <ArrowLeft className="size-4" /> All traders
      </Link>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit animate-rise overflow-hidden lg:sticky lg:top-24">
          <div className="relative h-28 bg-gradient-to-br from-night via-primary-deep to-primary">
            <div className="bg-dot-grid absolute inset-0 opacity-60" />
            {trader.demo && <Badge tone="dark" className="absolute right-3 top-3 border border-white/20">Demo trader</Badge>}
          </div>
          <div className="-mt-14 px-6 pb-6">
            <Avatar name={trader.name} initials={initialsOf(trader.name)} hue={trader.hue} src={trader.photoUrl} size={112} className="ring-4 ring-surface" />
            <h1 className="mt-3 text-xl font-semibold">{trader.name}</h1>
            <p className="text-sm text-text-muted">{trader.yearsExperience} years experience · {trader.copiers} copiers</p>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">{trader.bio}</p>
            <dl className="mt-5 space-y-2.5 text-sm">
              {[
                ["Strategy", trader.strategy],
                ["Risk level", <RiskMeter key="r" level={trader.riskLevel} />],
                ["Typical trade size", fmtBtc(trader.typicalTradeSizeBtc, 2)],
                ["Minimum allocation", fmtBtc(trader.minAllocation, 3)],
                ["Performance fee", `${trader.feePct}%`],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-4">
                  <dt className="text-text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6"><CopyAction trader={trader} size="lg" /></div>
            <p className="mt-3 text-center text-[11px] text-text-muted">{PAST_PERFORMANCE}</p>
          </div>
        </Card>

        <div className="min-w-0 space-y-5">
          <div className="grid animate-rise grid-cols-2 gap-3 sm:grid-cols-3" style={{ animationDelay: "80ms" }}>
            {STATS.map(([label, value, up]) => (
              <Card key={label} className="p-4">
                <p className="text-xs text-text-muted">{label}</p>
                <p className={cn("tabular mt-1 text-xl font-semibold", up === true && "text-success", up === false && "text-danger")}>{value}</p>
              </Card>
            ))}
          </div>
          <Card className="animate-rise" style={{ animationDelay: "140ms" }}>
            <CardHeader title="Trade history" subtitle={`${s.closedTrades} closed trades. Wins and losses are counted from these records.`} action={<Segmented value={filter} onChange={setFilter} options={["All", "Wins", "Losses"] as const} />} />
            <div className="scroll-thin mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-y border-border bg-surface-alt text-xs text-text-muted">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Side</th>
                    <th className="px-3 py-2.5 font-medium">Entry</th>
                    <th className="px-3 py-2.5 font-medium">Exit</th>
                    <th className="px-3 py-2.5 font-medium">Size</th>
                    <th className="px-3 py-2.5 font-medium">Result</th>
                    <th className="px-5 py-2.5 text-right font-medium">Closed</th>
                  </tr>
                </thead>
                <tbody className="tabular divide-y divide-border">
                  {trades.slice(0, 25).map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-surface-alt">
                      <td className="px-5 py-3"><Badge tone={t.side === "BUY" ? "success" : "danger"}>{t.side}</Badge></td>
                      <td className="px-3 py-3">${t.entry.toLocaleString()}</td>
                      <td className="px-3 py-3">${t.exit?.toLocaleString()}</td>
                      <td className="px-3 py-3">{fmtBtc(t.size, 3)}</td>
                      <td className={cn("px-3 py-3 font-semibold", t.ret >= 0 ? "text-success" : "text-danger")}>{fmtPct(t.ret)}</td>
                      <td className="px-5 py-3 text-right text-text-muted" suppressHydrationWarning>{fmtDateTime(t.closedAt!)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-4 text-xs text-text-muted">Showing the latest {Math.min(25, trades.length)} trades.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
