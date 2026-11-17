"use client";

import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { FlashNumber } from "@orbit/ui/components/ui/misc";
import { useMarketStrip } from "@/lib/adapters/market";
import { cn } from "@orbit/ui/lib/cn";
import { fmtPct } from "@orbit/ui/lib/format";
import { useNews } from "@/lib/adapters/news";

/** FR-1.5 scrolling headline ticker + FR-1.6 market strip, directly under the hero. */
export function MarketBand() {
  const quotes = useMarketStrip();
  const anyDelayed = quotes.some((q) => q.delayed);
  const { items } = useNews();
  const latest = (items ?? []).slice(0, 15);
  const headlines = [...latest, ...latest];

  return (
    <div className="border-y border-white/10 bg-[#120430] text-white">
      {/* ticker */}
      <div className="group relative flex overflow-hidden border-b border-white/5 py-2.5" aria-label="Latest market headlines">
        <span className="absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-[#120430] via-[#120430] to-transparent pl-4 pr-8 text-[11px] font-bold uppercase tracking-wider text-cyan">Live news</span>
        <div className="flex shrink-0 animate-marquee gap-10 whitespace-nowrap pl-36 group-hover:[animation-play-state:paused]">
          {headlines.map((n, i) => (
            <a key={`${n.id}-${i}`} href={n.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-white/70 transition hover:text-white" tabIndex={i >= latest.length ? -1 : 0}>
              <span className="mr-2 text-white/35">{n.source}</span>
              {n.headline}
            </a>
          ))}
        </div>
        <span className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#120430] to-transparent" />
      </div>

      {/* strip */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <div className="scroll-thin -mx-1 flex flex-1 gap-1 overflow-x-auto">
          {quotes.map((q) => (
            <div key={q.symbol} className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-1.5 transition hover:bg-white/5">
              <div>
                <p className="text-[11px] text-white/45">{q.name}</p>
                <FlashNumber value={q.price} className="text-sm font-semibold">
                  {q.price.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </FlashNumber>
              </div>
              <span className={cn("tabular inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold", q.changePct >= 0 ? "bg-cyan/10 text-cyan" : "bg-[#ff4d6d]/10 text-[#ff4d6d]")}>
                {q.changePct >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {fmtPct(q.changePct)}
              </span>
            </div>
          ))}
        </div>
        {anyDelayed && (
          <span className="flex items-center gap-1 text-[11px] text-white/40">
            <Clock className="size-3" /> Indices delayed 15 min
          </span>
        )}
      </div>
    </div>
  );
}
