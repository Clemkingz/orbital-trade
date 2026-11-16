"use client";

import { useMemo, useState } from "react";
import { Bot, Info } from "lucide-react";
import { FlashNumber, LiveDot, Segmented } from "@orbit/ui/components/ui/misc";
import { useLiveBtc } from "@/lib/adapters/market";
import { PROP_ACCOUNT_LABEL } from "@orbit/ui/lib/config";
import { cn } from "@orbit/ui/lib/cn";
import { fmtPct, fmtTime, fmtUsd } from "@orbit/ui/lib/format";
import { BOT_TRADES, PROP_STARTING_EQUITY } from "@orbit/ui/lib/mock/seed";
import { botSummary } from "@orbit/ui/lib/stats";
import { CandleChart } from "./CandleChart";

/**
 * FR-1.2–1.4 — Live trading bot widget. Every figure is computed from `bot_trades`
 * (prop account only, never client funds). No invented "user just earned" ticker.
 */
export function BotWidget() {
  const { price, candles, direction, changePct } = useLiveBtc(36);
  const [tab, setTab] = useState<"Trades" | "Positions">("Trades");
  const summary = useMemo(() => botSummary(BOT_TRADES, PROP_STARTING_EQUITY, price), [price]);
  const closed = BOT_TRADES.filter((t) => t.closedAt).slice(0, 6);
  const totalPnl = summary.realised + summary.unrealised;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur-xl">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/30 ring-1 ring-primary/50">
            <Bot className="size-4 text-cyan" />
          </span>
          <div>
            <p className="text-sm font-semibold">Orbit trading bot</p>
            <p className="flex items-center gap-1.5 text-[11px] text-white/50">
              <LiveDot /> Live · BTC/USD · 1m
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[11px] font-semibold text-cyan" title="The bot trades the firm's own account, never client funds.">
          <Info className="size-3" />
          {PROP_ACCOUNT_LABEL}
        </span>
      </div>

      {/* price */}
      <div className="flex flex-wrap items-end justify-between gap-2 px-4 pt-4 sm:px-5">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/45">BTC / USD</p>
          <FlashNumber value={price} className={cn("text-2xl font-bold sm:text-3xl", direction === "down" ? "text-[#ff4d6d]" : "text-white")}>
            {fmtUsd(price)}
          </FlashNumber>
        </div>
        <span className={cn("tabular rounded-md px-2 py-1 text-xs font-semibold", changePct >= 0 ? "bg-cyan/10 text-cyan" : "bg-[#ff4d6d]/10 text-[#ff4d6d]")}>{fmtPct(changePct)} (36m)</span>
      </div>

      <div className="px-2 pt-2 sm:px-3">
        <CandleChart candles={candles} price={price} height={200} />
      </div>

      {/* equity */}
      <div className="grid grid-cols-3 divide-x divide-white/10 border-y border-white/10">
        {[
          { label: "Equity", value: fmtUsd(summary.equity, 0) },
          { label: "Total P&L", value: fmtUsd(totalPnl, 0), tone: totalPnl >= 0 },
          { label: "Open", value: `${summary.open.length} pos.` },
        ].map((s) => (
          <div key={s.label} className="px-3 py-3 sm:px-4">
            <p className="text-[10px] uppercase tracking-wider text-white/45 sm:text-[11px]">{s.label}</p>
            <p className={cn("tabular mt-0.5 truncate text-sm font-semibold sm:text-base", s.tone === undefined ? "text-white" : s.tone ? "text-cyan" : "text-[#ff4d6d]")}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* trades / positions */}
      <div className="px-4 pb-4 pt-3 sm:px-5">
        <Segmented dark value={tab} onChange={setTab} options={["Trades", "Positions"] as const} />
        <div className="scroll-thin mt-3 max-h-44 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-white/40">
              <tr>
                <th className="pb-2 font-medium">Side</th>
                <th className="pb-2 font-medium">Entry</th>
                <th className="pb-2 font-medium">{tab === "Trades" ? "Exit" : "Mark"}</th>
                <th className="pb-2 text-right font-medium">{tab === "Trades" ? "P&L" : "Unreal."}</th>
                <th className="hidden pb-2 text-right font-medium sm:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {(tab === "Trades" ? closed : summary.open).map((t, i) => {
                const pnl = t.pnl ?? (price - t.entry) * t.size * (t.side === "BUY" ? 1 : -1);
                return (
                  <tr key={t.id} className="animate-rise border-t border-white/5" style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="py-1.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", t.side === "BUY" ? "bg-cyan/15 text-cyan" : "bg-[#ff4d6d]/15 text-[#ff4d6d]")}>{t.side}</span>
                    </td>
                    <td className="py-1.5 text-white/80">{t.entry.toLocaleString("en-US")}</td>
                    <td className="py-1.5 text-white/80">{(t.exit ?? Math.round(price)).toLocaleString("en-US")}</td>
                    <td className={cn("py-1.5 text-right font-semibold", pnl >= 0 ? "text-cyan" : "text-[#ff4d6d]")}>{fmtUsd(pnl)}</td>
                    <td className="hidden py-1.5 text-right text-white/45 sm:table-cell" suppressHydrationWarning>
                      {fmtTime(t.closedAt ?? t.openedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-white/35">Figures come from the bot&apos;s recorded trades on the firm&apos;s own account. Not client funds. Past performance does not guarantee future results.</p>
      </div>
    </div>
  );
}
