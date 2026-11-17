/**
 * Live BTC/ETH prices from Coinbase's public market data (no API key, CORS-enabled).
 * One shared connection per tab: WebSocket ticker for live ticks, REST polling as a fallback.
 * Used by the landing-page bot widget, the market strip and the mock data layer's conversions.
 */
import type { Candle } from "./types";

export type Product = "BTC-USD" | "ETH-USD";
export interface Quote {
  price: number;
  open24h: number | null;
  t: number;
}
export type FeedStatus = "connecting" | "live" | "polling" | "offline";

const REST = "https://api.exchange.coinbase.com";
const WS = "wss://ws-feed.exchange.coinbase.com";
const PRODUCTS: Product[] = ["BTC-USD", "ETH-USD"];

const quotes: Partial<Record<Product, Quote>> = {};
let status: FeedStatus = "connecting";
const listeners = new Set<() => void>();
let started = false;
let ws: WebSocket | null = null;
let poll: ReturnType<typeof setInterval> | null = null;

const emit = () => listeners.forEach((l) => l());

async function fetchStats(product: Product) {
  const r = await fetch(`${REST}/products/${product}/stats`);
  if (!r.ok) throw new Error(String(r.status));
  const j = (await r.json()) as { open: string; last: string };
  quotes[product] = { price: Number(j.last), open24h: Number(j.open), t: Date.now() };
}

async function pollOnce() {
  try {
    await Promise.all(PRODUCTS.map(fetchStats));
    if (status !== "live") status = "polling";
  } catch {
    if (!quotes["BTC-USD"]) status = "offline";
  }
  emit();
}

function startPolling() {
  if (poll) return;
  pollOnce();
  poll = setInterval(pollOnce, 3000);
}

function stopPolling() {
  if (poll) clearInterval(poll);
  poll = null;
}

function connect() {
  try {
    ws = new WebSocket(WS);
  } catch {
    startPolling();
    return;
  }
  ws.onopen = () => ws?.send(JSON.stringify({ type: "subscribe", product_ids: PRODUCTS, channels: ["ticker"] }));
  ws.onmessage = (e) => {
    const m = JSON.parse(String(e.data)) as { type: string; product_id?: Product; price?: string; open_24h?: string };
    if (m.type !== "ticker" || !m.product_id || !m.price) return;
    quotes[m.product_id] = { price: Number(m.price), open24h: m.open_24h ? Number(m.open_24h) : quotes[m.product_id]?.open24h ?? null, t: Date.now() };
    if (status !== "live") {
      status = "live";
      stopPolling();
    }
    emit();
  };
  ws.onclose = () => {
    ws = null;
    status = quotes["BTC-USD"] ? "polling" : "connecting";
    startPolling();
    setTimeout(connect, 5000); // try the live feed again
  };
  ws.onerror = () => ws?.close();
}

/** Starts the shared feed (once per tab). Safe to call repeatedly; no-op on the server. */
export function startLiveFeed() {
  if (started || typeof window === "undefined") return;
  started = true;
  pollOnce(); // first price fast, while the socket connects
  connect();
}

export function subscribeLive(fn: () => void) {
  startLiveFeed();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const getQuote = (p: Product) => quotes[p] ?? null;
export const getStatus = () => status;
/** Latest real BTC price in USD, or null until the first quote arrives. */
export const getBtcUsd = () => quotes["BTC-USD"]?.price ?? null;

/** Last `count` one-minute candles (oldest first). */
export async function fetchCandles(count = 36): Promise<Candle[]> {
  const r = await fetch(`${REST}/products/BTC-USD/candles?granularity=60`);
  if (!r.ok) throw new Error(String(r.status));
  const rows = (await r.json()) as [number, number, number, number, number, number][]; // [time, low, high, open, close, volume], newest first
  return rows
    .slice(0, count)
    .reverse()
    .map(([time, low, high, open, close]) => ({ t: time * 1000, o: open, h: high, l: low, c: close }));
}
