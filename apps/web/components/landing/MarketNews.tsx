"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { Badge, EmptyState, Reveal, Segmented, Skeleton } from "@orbit/ui/components/ui/misc";
import { useNews, type NewsFilter } from "@/lib/adapters/news";
import { cn } from "@orbit/ui/lib/cn";
import { timeAgo } from "@orbit/ui/lib/format";

const FILTERS = ["All", "Stocks", "Crypto", "Macro"] as const;
const TONE = { Stocks: "primary", Crypto: "success", Macro: "warning" } as const;

/** FR-1.5 — 10 latest headlines, filterable, refreshed every 60 s. */
export function MarketNews() {
  const { items, updatedAt, refreshing, reload, error } = useNews(60_000);
  const [filter, setFilter] = useState<NewsFilter>("All");
  const shown = useMemo(() => (items ?? []).filter((n) => filter === "All" || n.category === filter).slice(0, 10), [items, filter]);

  return (
    <section id="news" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Market news</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">What Wall Street is watching</h2>
            <p className="mt-2 text-text-muted" suppressHydrationWarning>
              Live headlines from CNBC, MarketWatch, CoinDesk, Cointelegraph and the Federal Reserve. {updatedAt ? `Updated ${timeAgo(updatedAt)}.` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Segmented value={filter} onChange={setFilter} options={FILTERS} />
            <button onClick={reload} className="rounded-lg p-2 text-text-muted transition hover:bg-muted hover:text-primary" aria-label="Refresh news">
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            </button>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {!items
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="rounded-[var(--radius-card)] border border-border p-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-3 h-5 w-full" />
                  <Skeleton className="mt-2 h-5 w-3/4" />
                  <Skeleton className="mt-4 h-3 w-1/3" />
                </div>
              ))
            : shown.length === 0
              ? (
                <div className="md:col-span-2">
                  <EmptyState icon={<Newspaper className="size-5" />} title={error ? "Couldn't load headlines" : "No headlines in this category right now"} body={error ? "The news feeds didn't respond. We'll try again in a minute." : "Check back soon. The feed refreshes every minute."} />
                </div>
              )
              : shown.map((n, i) => (
                  <a
                    key={n.id}
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex animate-rise flex-col rounded-[var(--radius-card)] border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_32px_-12px_rgba(85,1,255,0.25)]"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Badge tone={TONE[n.category]}>{n.category}</Badge>
                      <span className="font-medium text-text">{n.source}</span>
                      <span>·</span>
                      <time dateTime={n.publishedAt} suppressHydrationWarning>
                        {timeAgo(n.publishedAt)}
                      </time>
                    </div>
                    <h3 className="mt-3 font-semibold leading-snug text-text group-hover:text-primary">{n.headline}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-text-muted">{n.summary}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-primary">
                      Read on {n.source} <ExternalLink className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </a>
                ))}
        </div>
      </div>
    </section>
  );
}
