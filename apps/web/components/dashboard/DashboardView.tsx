"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Pause, Play, ShoppingCart, Square, Users } from "lucide-react";
import { AllocationCard, BalanceCard, DepositedCard, LedgerList, ProfitCard } from "@orbit/ui/components/account/AccountCards";
import { Button, ButtonLink } from "@orbit/ui/components/ui/Button";
import { toast } from "@orbit/ui/components/ui/Toast";
import { TX_LABEL, TxIcon } from "@orbit/ui/components/ui/TxIcon";
import { Avatar, Badge, Card, CardHeader, EmptyState, Skeleton } from "@orbit/ui/components/ui/misc";
import { api, errorMessage } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";
import { fmtBtc, fmtFiat } from "@orbit/ui/lib/format";
import type { Dashboard, TileConfig } from "@orbit/ui/lib/types";
import { refreshAccount, useDashboard, useMe } from "@/lib/data";
import { PageHeader } from "./AppShell";
import { BuyCryptoModal } from "./BuyCryptoModal";
import { DepositAddress } from "./DepositAddress";
import { AnnouncementList, Banners, ClaimNudge, KycBanner, Locked } from "./Gate";

export { TX_LABEL, TxIcon };

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function CopiedTile({ d, label }: { d: Dashboard; label: string }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function change(id: string, status: "ACTIVE" | "PAUSED" | "STOPPED", name: string) {
    setBusy(id + status);
    try {
      await api(`/me/copies/${id}`, { method: "PATCH", json: { status } });
      await refreshAccount();
      toast.success(status === "PAUSED" ? `Paused copying ${name}` : status === "ACTIVE" ? `Resumed copying ${name}` : `Stopped copying ${name}`, {
        description: status === "STOPPED" ? "The allocation is back in your available balance." : undefined,
      });
    } catch (e) {
      toast.error("Couldn't update", { description: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="h-full">
      <CardHeader title={label} subtitle={`${d.copies.length} trader${d.copies.length === 1 ? "" : "s"}`} action={<Link href="/traders" className="text-xs font-semibold text-primary hover:underline">Find traders</Link>} />
      {d.copies.length === 0 ? (
        <EmptyState icon={<Users className="size-5" />} title="You're not copying anyone yet" body="Browse the directory and copy one or several traders." action={<ButtonLink href="/traders" size="sm">Browse traders</ButtonLink>} />
      ) : (
        <ul className="divide-y divide-border px-5 pb-2">
          {d.copies.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-3.5">
              <Avatar name={s.trader.name} initials={initials(s.trader.name)} hue={s.trader.hue} src={s.trader.photoUrl} size={40} />
              <div className="min-w-0 flex-1">
                <Link href={`/traders/${s.trader.id}`} className="block truncate text-sm font-semibold hover:text-primary">
                  {s.trader.name}
                </Link>
                <p className="tabular text-xs text-text-muted">
                  {fmtBtc(s.allocationBtc, 4)} allocated{s.stopLossPct ? ` · SL ${s.stopLossPct}%` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className={cn("tabular text-sm font-semibold", s.pnlBtc >= 0 ? "text-success" : "text-danger")}>
                  {s.pnlBtc >= 0 ? "+" : ""}
                  {fmtBtc(s.pnlBtc, 6)}
                </p>
                <p className="tabular text-[11px] text-text-muted">{fmtFiat(s.pnlBtc * d.btcPrice, d.currency)}</p>
                <Badge tone={s.status === "ACTIVE" ? "success" : "warning"} dot>
                  {s.status === "ACTIVE" ? "Active" : "Paused"}
                </Badge>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                {s.status === "ACTIVE" ? (
                  <Button size="sm" variant="secondary" loading={busy === s.id + "PAUSED"} onClick={() => change(s.id, "PAUSED", s.trader.name)} icon={<Pause className="size-3.5" />} className="flex-1 sm:flex-none">
                    Pause
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" loading={busy === s.id + "ACTIVE"} onClick={() => change(s.id, "ACTIVE", s.trader.name)} icon={<Play className="size-3.5" />} className="flex-1 sm:flex-none">
                    Resume
                  </Button>
                )}
                <Button size="sm" variant="secondary" loading={busy === s.id + "STOPPED"} onClick={() => change(s.id, "STOPPED", s.trader.name)} icon={<Square className="size-3.5" />} className="flex-1 text-danger sm:flex-none">
                  Stop
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function BuyTile({ label, onBuy }: { label: string; onBuy: () => void }) {
  return (
    <Card className="relative h-full overflow-hidden border-0 bg-gradient-to-br from-primary-deep via-primary to-sidebar-ring text-white">
      <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 size-40 animate-glow rounded-full bg-cyan/30 blur-2xl" />
      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <ShoppingCart className="size-6 text-cyan" />
        <p className="mt-3 text-lg font-semibold">{label}</p>
        <p className="mt-1 text-sm text-white/75">Buy BTC on MoonPay, Coinmama, Quidax and more, then send it to your deposit address.</p>
        <Button variant="secondary" size="md" onClick={onBuy} className="mt-5 w-full border-transparent text-primary-deep sm:mt-auto">
          Buy crypto <ArrowRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

const SPAN: Partial<Record<TileConfig["id"], string>> = {
  balance: "md:col-span-2 xl:col-span-2",
  deposit: "md:col-span-2 xl:col-span-2",
  copied: "md:col-span-2 xl:col-span-2",
  transactions: "md:col-span-2 xl:col-span-2",
};
const LOCKED = new Set(["deposit", "buy", "copied"]);

export function DashboardView() {
  const { data: me } = useMe();
  const { data: d, error } = useDashboard();
  const [buyOpen, setBuyOpen] = useState(false);
  const tiles = useMemo(() => [...(d?.tiles ?? [])].filter((t) => t.visible).sort((a, b) => a.order - b.order), [d?.tiles]);

  if (error) return <EmptyState icon={<Users className="size-5" />} title="Couldn't load your dashboard" body={error.message} />;
  if (!d || !me) return <DashboardSkeleton />;
  const verified = me.user.kycStatus === "APPROVED";

  const render = (t: TileConfig) => {
    switch (t.id) {
      case "balance": return <BalanceCard d={d} label={t.label} />;
      case "deposited": return <DepositedCard d={d} label={t.label} />;
      case "profit": return <ProfitCard d={d} label={t.label} />;
      case "allocation": return <AllocationCard d={d} label={t.label} />;
      case "deposit": return <Card className="h-full"><CardHeader title={t.label} action={<Link href="/deposit#claim" className="text-xs font-semibold text-primary hover:underline">Submit claim</Link>} /><div className="p-5 pt-4">{verified ? <DepositAddress size={112} /> : <Skeleton className="h-32" />}</div></Card>;
      case "copied": return <CopiedTile d={d} label={t.label} />;
      case "transactions": return <Card className="h-full"><CardHeader title={t.label} action={<Link href="/transactions" className="text-xs font-semibold text-primary hover:underline">View all</Link>} /><div className="pt-2"><LedgerList entries={d.recent.slice(0, 5)} empty="No transactions yet. Deposits and trades will appear here." /></div></Card>;
      case "announcements": return <Card className="h-full"><CardHeader title={t.label} /><div className="pt-4"><AnnouncementList items={d.announcements.filter((a) => a.kind === "announcement")} /></div></Card>;
      case "buy": return <BuyTile label={t.label} onBuy={() => (verified ? setBuyOpen(true) : toast.warning("Verify your ID first", { description: "Buying and depositing unlock after approval." }))} />;
      default: return null;
    }
  };

  return (
    <>
      <PageHeader
        title={`Welcome, ${me.user.firstName}`}
        subtitle="Your balance, deposits and profit at a glance."
        action={
          verified && (
            <Button size="md" onClick={() => setBuyOpen(true)} icon={<ShoppingCart className="size-4" />}>
              Buy crypto
            </Button>
          )
        }
      />
      <KycBanner user={me.user} />
      <ClaimNudge />
      <Banners items={d.announcements.filter((a) => a.kind === "banner")} />
      <div className="grid grid-flow-row-dense gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t, i) => (
          <div key={t.id} className={cn("animate-rise", SPAN[t.id])} style={{ animationDelay: `${i * 60}ms` }}>
            <Locked locked={!verified && LOCKED.has(t.id)}>{render(t)}</Locked>
          </div>
        ))}
      </div>
      {verified && <BuyCryptoModal open={buyOpen} onOpenChange={setBuyOpen} />}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-48 md:col-span-2" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-56 md:col-span-2" />
        <Skeleton className="h-56 md:col-span-2" />
      </div>
    </div>
  );
}
