/**
 * Landing-page mock for the bot widget's simulated trades. All account, trader and admin data comes from the API.
 */
import type { BotTrade } from "../types";

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

export const PROP_STARTING_EQUITY = 250_000;

/* ── Bot trades (prop account, simulated) ─────────────────────── */
/**
 * Simulated prop-account trades, anchored on the current real BTC price so entries, exits and
 * open-position P&L sit next to the live chart. The widget labels these "Simulated".
 */
export function makeBotTrades(base: number): BotTrade[] {
  const r = prng(7);
  const out: BotTrade[] = [];
  const step = base / 320; // keep moves proportional to the price level
  let price = base - step * 3;
  for (let i = 0; i < 14; i++) {
    const side = r() > 0.45 ? "BUY" : "SELL";
    const entry = Math.round(price + (r() - 0.5) * step * 3);
    const move = (r() - 0.38) * step * 4.4;
    const exit = Math.round(entry + (side === "BUY" ? move : -move));
    const size = +(0.05 + r() * 0.25).toFixed(3);
    const opened = (14 - i) * 37 * MIN + 18 * MIN;
    out.push({ id: `b${i}`, side, entry, exit, size, pnl: +((exit - entry) * size * (side === "BUY" ? 1 : -1)).toFixed(2), openedAt: ago(opened), closedAt: ago(opened - 22 * MIN) });
    price = exit;
  }
  out.push({ id: "b-open-1", side: "BUY", entry: Math.round(base - step * 1.4), exit: null, size: 0.18, pnl: null, openedAt: ago(12 * MIN), closedAt: null });
  out.push({ id: "b-open-2", side: "SELL", entry: Math.round(base + step * 2.2), exit: null, size: 0.07, pnl: null, openedAt: ago(4 * MIN), closedAt: null });
  return out.reverse();
}
