import type { BotTrade } from "./types";

/** Prop-account summary for the landing-page bot widget (from bot_trades). */
export function botSummary(trades: BotTrade[], startingEquity: number, markPrice: number) {
  const realised = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const open = trades.filter((t) => !t.closedAt);
  const unrealised = open.reduce((s, t) => s + (markPrice - t.entry) * t.size * (t.side === "BUY" ? 1 : -1), 0);
  return { equity: startingEquity + realised + unrealised, realised, unrealised, open };
}
