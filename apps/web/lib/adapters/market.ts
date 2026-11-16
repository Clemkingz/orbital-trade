"use client";

/**
 * Market data adapter (FR-1.3). The mock emits a tick every second, like a WebSocket feed.
 * Swap `createMockFeed` for a real WebSocket client with the same `subscribe` contract.
 */
import { useEffect, useRef, useState } from "react";
import { INDEX_DATA_DELAYED } from "@orbit/ui/lib/config";
import { BASE_BTC_PRICE, prng } from "@orbit/ui/lib/mock/seed";
import type { Candle, MarketQuote } from "@orbit/ui/lib/types";

type Tick = { price: number; t: number };
type Listener = (tick: Tick) => void;

const MINUTE = 60_000;

function seedCandles(count: number, endPrice: number): Candle[] {
  const r = prng(42);
  const now = Math.floor(Date.now() / MINUTE) * MINUTE;
  const out: Candle[] = [];
  let c = endPrice;
  for (let i = 0; i < count; i++) {
    const o = c - (r() - 0.5) * 70;
    const h = Math.max(o, c) + r() * 35;
    const l = Math.min(o, c) - r() * 35;
    out.unshift({ t: now - (i + 1) * MINUTE, o, h, l, c });
    c = o;
  }
  return out;
}

function createMockFeed() {
  const listeners = new Set<Listener>();
  let price = BASE_BTC_PRICE;
  let timer: ReturnType<typeof setInterval> | null = null;
  const r = prng(Date.now() % 100000);
  return {
    subscribe(fn: Listener) {
      listeners.add(fn);
      if (!timer) {
        timer = setInterval(() => {
          price = Math.max(1000, price + (r() - 0.5) * 38);
          const tick = { price, t: Date.now() };
          listeners.forEach((l) => l(tick));
        }, 1000);
      }
      return () => {
        listeners.delete(fn);
        if (!listeners.size && timer) {
          clearInterval(timer);
          timer = null;
        }
      };
    },
    last: () => price,
  };
}

const feed = createMockFeed();

/** Live BTC/USD price + rolling 1-minute candles. */
export function useLiveBtc(candleCount = 40) {
  const [candles, setCandles] = useState<Candle[]>(() => seedCandles(candleCount, BASE_BTC_PRICE));
  const [price, setPrice] = useState(BASE_BTC_PRICE);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const prev = useRef(BASE_BTC_PRICE);

  useEffect(
    () =>
      feed.subscribe(({ price: p, t }) => {
        setDirection(p >= prev.current ? "up" : "down");
        prev.current = p;
        setPrice(p);
        setCandles((cs) => {
          const bucket = Math.floor(t / MINUTE) * MINUTE;
          const last = cs[cs.length - 1];
          if (last && last.t === bucket) {
            return [...cs.slice(0, -1), { ...last, c: p, h: Math.max(last.h, p), l: Math.min(last.l, p) }];
          }
          return [...cs.slice(1), { t: bucket, o: last?.c ?? p, h: p, l: p, c: p }];
        });
      }),
    [],
  );

  const open24 = candles[0]?.o ?? price;
  return { price, candles, direction, changePct: ((price - open24) / open24) * 100 };
}

const STRIP_BASE: Omit<MarketQuote, "delayed">[] = [
  { symbol: "SPX", name: "S&P 500", price: 5_982.4, changePct: 0.42 },
  { symbol: "IXIC", name: "Nasdaq", price: 19_214.7, changePct: 0.71 },
  { symbol: "DJI", name: "Dow Jones", price: 43_870.1, changePct: -0.12 },
  { symbol: "BTC", name: "Bitcoin", price: BASE_BTC_PRICE, changePct: 1.84 },
  { symbol: "ETH", name: "Ethereum", price: 3_412.6, changePct: -0.63 },
];

/** FR-1.6 market strip. Index quotes are flagged as delayed when the licence requires it. */
export function useMarketStrip(btcPrice?: number) {
  const [quotes, setQuotes] = useState<MarketQuote[]>(() =>
    STRIP_BASE.map((q) => ({ ...q, delayed: INDEX_DATA_DELAYED && !["BTC", "ETH"].includes(q.symbol) })),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setQuotes((qs) =>
        qs.map((q) => {
          if (q.symbol === "BTC") return q;
          const drift = (Math.random() - 0.5) * 0.04;
          return { ...q, price: q.price * (1 + drift / 100), changePct: +(q.changePct + drift).toFixed(2) };
        }),
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);
  if (btcPrice) {
    return quotes.map((q) => (q.symbol === "BTC" ? { ...q, price: btcPrice, changePct: q.changePct + ((btcPrice - BASE_BTC_PRICE) / BASE_BTC_PRICE) * 100 } : q));
  }
  return quotes;
}
