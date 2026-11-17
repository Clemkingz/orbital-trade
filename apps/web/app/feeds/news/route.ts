/**
 * GET /feeds/news — real Wall Street, crypto and macro headlines from public publisher RSS feeds.
 *
 * Browsers can't read these feeds directly (cross-origin), so this route fetches them on the
 * server, keeps only what feeds are meant for (headline, short summary, source, link to the
 * original) and caches the result for 60 s (FR-1.5, FR-1.7).
 *
 * Before launch, confirm each publisher's terms, or switch to a licensed news API (PRD).
 */
import { NextResponse } from "next/server";

export const revalidate = 60;

type Category = "Stocks" | "Crypto" | "Macro";

const FEEDS: { source: string; category: Category; url: string }[] = [
  { source: "CNBC", category: "Stocks", url: "https://www.cnbc.com/id/15839069/device/rss/rss.html" },
  { source: "MarketWatch", category: "Stocks", url: "https://feeds.content.dowjones.io/public/rss/mw_marketpulse" },
  { source: "CoinDesk", category: "Crypto", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { source: "Cointelegraph", category: "Crypto", url: "https://cointelegraph.com/rss" },
  { source: "CNBC", category: "Macro", url: "https://www.cnbc.com/id/20910258/device/rss/rss.html" },
  { source: "Federal Reserve", category: "Macro", url: "https://www.federalreserve.gov/feeds/press_all.xml" },
];

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

const stripHtml = (s: string) => decode(decode(s)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function tag(item: string, name: string) {
  const m = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1].trim() : "";
}

function summarise(text: string, max = 180) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

async function readFeed(feed: (typeof FEEDS)[number]) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; OrbitTradeNews/1.0)", Accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`${feed.source} ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].slice(0, 12).flatMap(([item]) => {
    const headline = stripHtml(tag(item, "title"));
    const url = decode(tag(item, "link")).trim();
    const date = new Date(decode(tag(item, "pubDate") || tag(item, "dc:date")).trim());
    if (!headline || !/^https:\/\//.test(url) || isNaN(+date)) return [];
    return [{ headline, summary: summarise(stripHtml(tag(item, "description"))), url, source: feed.source, category: feed.category, publishedAt: date.toISOString() }];
  });
}

export async function GET() {
  const results = await Promise.allSettled(FEEDS.map(readFeed));
  const seen = new Set<string>();
  const items = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((n) => +new Date(n.publishedAt) <= Date.now() + 5 * 60_000) // ignore future-dated items
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .filter((n) => {
      const key = n.headline.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    // Keep up to 20 per category so every filter (Stocks / Crypto / Macro) has enough to show.
    .filter((n, _, all) => all.filter((x) => x.category === n.category).indexOf(n) < 20)
    .map((n, i) => ({ id: `${i}-${n.url}`, ...n }));

  const failed = results.flatMap((r, i) => (r.status === "rejected" ? [FEEDS[i].url] : []));
  if (!items.length) return NextResponse.json({ items: [], updatedAt: new Date().toISOString(), error: "News feeds are unavailable right now." }, { status: 502 });
  return NextResponse.json({ items, updatedAt: new Date().toISOString(), failed }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
