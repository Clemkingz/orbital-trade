/**
 * Landing-page mocks only (bot widget, market strip, news) until the market-data feed and
 * licensed news API are connected. All account, trader and admin data comes from the API.
 */
import type { BotTrade, NewsItem } from "../types";

export function prng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ANCHOR = Math.floor(Date.now() / 3_600_000) * 3_600_000;
const ago = (ms: number) => new Date(ANCHOR - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const BASE_BTC_PRICE = 96_420;
export const PROP_STARTING_EQUITY = 250_000;

/* ── Bot trades (prop account) ───────────────────────────────── */
export const BOT_TRADES: BotTrade[] = (() => {
  const r = prng(7);
  const out: BotTrade[] = [];
  let price = BASE_BTC_PRICE - 900;
  for (let i = 0; i < 14; i++) {
    const side = r() > 0.45 ? "BUY" : "SELL";
    const entry = Math.round(price + (r() - 0.5) * 300);
    const move = (r() - 0.38) * 420;
    const exit = Math.round(entry + (side === "BUY" ? move : -move));
    const size = +(0.05 + r() * 0.25).toFixed(3);
    const opened = (14 - i) * 37 * MIN + 18 * MIN;
    out.push({ id: `b${i}`, side, entry, exit, size, pnl: +((exit - entry) * size * (side === "BUY" ? 1 : -1)).toFixed(2), openedAt: ago(opened), closedAt: ago(opened - 22 * MIN) });
    price = exit;
  }
  out.push({ id: "b-open-1", side: "BUY", entry: BASE_BTC_PRICE - 140, exit: null, size: 0.18, pnl: null, openedAt: ago(12 * MIN), closedAt: null });
  out.push({ id: "b-open-2", side: "SELL", entry: BASE_BTC_PRICE + 220, exit: null, size: 0.07, pnl: null, openedAt: ago(4 * MIN), closedAt: null });
  return out.reverse();
})();

/* ── News (mock adapter) ─────────────────────────────────────── */
export const NEWS: NewsItem[] = [
  { id: "n1", category: "Crypto", source: "Market Wire", headline: "Bitcoin holds above key support as ETF inflows extend weekly streak", summary: "Spot fund inflows topped expectations for a fourth straight week.", url: "https://example.com/news/1", publishedAt: ago(8 * MIN) },
  { id: "n2", category: "Stocks", source: "Street Desk", headline: "S&P 500 edges higher as megacap tech leads early gains", summary: "Chipmakers rallied after upbeat guidance from a sector bellwether.", url: "https://example.com/news/2", publishedAt: ago(16 * MIN) },
  { id: "n3", category: "Macro", source: "Global Econ", headline: "Treasury yields slip ahead of Fed minutes release", summary: "Traders trimmed bets on further tightening into year-end.", url: "https://example.com/news/3", publishedAt: ago(27 * MIN) },
  { id: "n4", category: "Crypto", source: "Chain Report", headline: "Hashrate reaches new high as miners expand capacity", summary: "Network security metrics continued their steady climb.", url: "https://example.com/news/4", publishedAt: ago(41 * MIN) },
  { id: "n5", category: "Stocks", source: "Street Desk", headline: "Nasdaq volatility gauge falls to three-month low", summary: "Options markets priced calmer conditions into earnings season.", url: "https://example.com/news/5", publishedAt: ago(58 * MIN) },
  { id: "n6", category: "Macro", source: "Global Econ", headline: "Dollar index softens as euro-area PMI surprises to the upside", summary: "Manufacturing activity beat forecasts in the bloc's largest economies.", url: "https://example.com/news/6", publishedAt: ago(74 * MIN) },
  { id: "n7", category: "Crypto", source: "Market Wire", headline: "Ether options open interest climbs ahead of monthly expiry", summary: "Call skew widened modestly through the session.", url: "https://example.com/news/7", publishedAt: ago(96 * MIN) },
  { id: "n8", category: "Stocks", source: "Street Desk", headline: "Dow futures flat as investors weigh retail earnings", summary: "Big-box retailers posted mixed same-store sales.", url: "https://example.com/news/8", publishedAt: ago(2 * HOUR) },
  { id: "n9", category: "Macro", source: "Global Econ", headline: "Oil steadies after inventory data shows surprise draw", summary: "Crude stocks fell for a second week, supporting prices.", url: "https://example.com/news/9", publishedAt: ago(3 * HOUR) },
  { id: "n10", category: "Crypto", source: "Chain Report", headline: "Stablecoin supply expands as on-chain settlement volumes rise", summary: "Dollar-pegged token supply grew for the sixth straight month.", url: "https://example.com/news/10", publishedAt: ago(4 * HOUR) },
  { id: "n11", category: "Stocks", source: "Street Desk", headline: "Banks rally on steeper yield curve outlook", summary: "Regional lenders outperformed the broader financial sector.", url: "https://example.com/news/11", publishedAt: ago(5 * HOUR) },
  { id: "n12", category: "Macro", source: "Global Econ", headline: "African markets watch naira as FX reforms continue", summary: "Analysts expect steadier liquidity in the official window.", url: "https://example.com/news/12", publishedAt: ago(6 * HOUR) },
];
