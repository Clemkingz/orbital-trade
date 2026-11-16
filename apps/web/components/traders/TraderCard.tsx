"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { RiskMeter } from "@orbit/ui/components/ui/RiskMeter";
import { Avatar, Badge } from "@orbit/ui/components/ui/misc";
import { cn } from "@orbit/ui/lib/cn";
import { fmtBtc, fmtPct } from "@orbit/ui/lib/format";
import type { Trader } from "@orbit/ui/lib/types";

export { RiskMeter };

export const PAST_PERFORMANCE = "Past performance does not guarantee future results.";
export const initialsOf = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "up" | "down" }) {
  return (
    <div>
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className={cn("tabular text-sm font-semibold", tone === "up" && "text-success", tone === "down" && "text-danger")}>{value}</p>
    </div>
  );
}

/** FR-7.1 photo card. Every number comes from `trader.stats`, computed by the API from recorded trades. */
export function TraderCard({ trader, href, action, compact }: { trader: Trader; href: string; action?: ReactNode; compact?: boolean }) {
  const s = trader.stats;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_40px_-16px_rgba(85,1,255,0.3)]">
      <div className="relative h-20 bg-gradient-to-br from-night via-primary-deep to-primary">
        <div className="bg-dot-grid absolute inset-0 opacity-60" />
        {trader.demo && (
          <Badge tone="dark" className="absolute right-3 top-3 border border-white/20 backdrop-blur">
            Demo trader
          </Badge>
        )}
      </div>
      <div className="-mt-9 flex flex-1 flex-col px-5 pb-5">
        <Link href={href} className="flex items-end gap-3">
          <Avatar name={trader.name} initials={initialsOf(trader.name)} hue={trader.hue} src={trader.photoUrl} size={72} className="ring-4 ring-surface transition-transform duration-300 group-hover:scale-105" />
          <div className="min-w-0 pb-1">
            <h3 className="truncate font-semibold text-text group-hover:text-primary">{trader.name}</h3>
            <p className="text-xs text-text-muted">{trader.yearsExperience} yrs experience</p>
          </div>
        </Link>

        {!compact && <p className="mt-3 line-clamp-2 text-sm text-text-muted">{trader.strategy}</p>}

        <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-surface-alt p-3">
          <Stat label="30d return" value={fmtPct(s.return30, 1)} tone={s.return30 >= 0 ? "up" : "down"} />
          <Stat label="90d return" value={fmtPct(s.return90, 1)} tone={s.return90 >= 0 ? "up" : "down"} />
          <Stat label="Win rate" value={`${s.winRate.toFixed(0)}%`} />
          <Stat label="Wins / losses" value={<><span className="text-success">{s.wins}</span> / <span className="text-danger">{s.losses}</span></>} />
          <Stat label="Max drawdown" value={`${s.maxDrawdown.toFixed(1)}%`} tone="down" />
          <Stat label="Typical size" value={fmtBtc(trader.typicalTradeSizeBtc, 2)} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            Risk <RiskMeter level={trader.riskLevel} />
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {trader.copiers.toLocaleString()} copiers
          </span>
          <span>Min {fmtBtc(trader.minAllocation, 3)}</span>
        </div>

        {action && <div className="mt-5">{action}</div>}
        <p className="mt-3 text-[11px] text-text-muted/80">{PAST_PERFORMANCE}</p>
      </div>
    </article>
  );
}
