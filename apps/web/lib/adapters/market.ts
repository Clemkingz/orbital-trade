"use client";

/**
 * Market data adapter (FR-1.3). BTC and ETH come from Coinbase's live public feed
 * (packages/ui/lib/live-btc.ts). Stock indices are still sample values until an
 * index-data licence is in place.
 */
import { useEffect, useRef, useState } from "react";
import { INDEX_DATA_DELAYED } from "@orbit/ui/lib/config";
import { fetchCandles, getQuote, getStatus, subscribeLive, type FeedStatus, type Product } from "@orbit/ui/lib/live-btc";
import type { Candle, MarketQuote } from "@orbit/ui/lib/types";

const MINUTE = 60_000;

/** Live BTC/USD price + rolling 1-minute candles. `price` is null until the first real quote. */
export function useLiveBtc(candleCount = 36) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [open24h, setOpen24h] = useState<number | null>(null);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [status, setStatus] = useState<FeedStatus>("connecting");
  const prev = useRef<number | null>(null);

  // Real 1-minute history to start the chart.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchCandles(candleCount)
        .then((c) => !cancelled && setCandles(c))
        .catch(() => !cancelled && setTimeout(load, 5000));
    load();
    return () => {
      cancelled = true;
    };
  }, [candleCount]);

  // Live ticks: update the price and the current minute's candle.
  useEffect(
    () =>
      subscribeLive(() => {
        setStatus(getStatus());
        const q = getQuote("BTC-USD");
        if (!q) return;
        if (prev.current != null && q.price !== prev.current) setDirection(q.price > prev.current ? "up" : "down");
        prev.current = q.price;
        setPrice(q.price);
        setOpen24h(q.open24h);
        setCandles((cs) => {
          if (!cs.length) return cs;
          const bucket = Math.floor(q.t / MINUTE) * MINUTE;
          const last = cs[cs.length - 1];
          if (last.t === bucket) return [...cs.slice(0, -1), { ...last, c: q.price, h: Math.max(last.h, q.price), l: Math.min(last.l, q.price) }];
          if (bucket > last.t) return [...cs.slice(-(candleCount - 1)), { t: bucket, o: last.c, h: Math.max(last.c, q.price), l: Math.min(last.c, q.price), c: q.price }];
          return cs;
        });
      }),
    [candleCount],
  );

  return { price, candles, direction, status, changePct: price != null && open24h ? ((price - open24h) / open24h) * 100 : null };
}

const INDICES: Omit<MarketQuote, "delayed">[] = [
  { symbol: "SPX", name: "S&P 500", price: 5_982.4, changePct: 0.42 },
  { symbol: "IXIC", name: "Nasdaq", price: 19_214.7, changePct: 0.71 },
  { symbol: "DJI", name: "Dow Jones", price: 43_870.1, changePct: -0.12 },
];

const live = (p: Product, symbol: string, name: string): MarketQuote | null => {
  const q = getQuote(p);
  return q ? { symbol, name, price: q.price, changePct: q.open24h ? ((q.price - q.open24h) / q.open24h) * 100 : 0, delayed: false } : null;
};

/** FR-1.6 market strip: live BTC/ETH (24h change), indices flagged as delayed. */
export function useMarketStrip() {
  const [indices, setIndices] = useState<MarketQuote[]>(() => INDICES.map((q) => ({ ...q, delayed: INDEX_DATA_DELAYED })));
  const [, force] = useState(0);

  useEffect(() => subscribeLive(() => force((n) => n + 1)), []);
  useEffect(() => {
    const id = setInterval(() => {
      setIndices((qs) =>
        qs.map((q) => {
          const drift = (Math.random() - 0.5) * 0.04;
          return { ...q, price: q.price * (1 + drift / 100), changePct: +(q.changePct + drift).toFixed(2) };
        }),
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return [...indices, live("BTC-USD", "BTC", "Bitcoin"), live("ETH-USD", "ETH", "Ethereum")].filter(Boolean) as MarketQuote[];
}
