import { ArrowDownLeft, ArrowUpRight, Coins, ReceiptText, Users } from "lucide-react";
import { cn } from "../../lib/cn";
import type { LedgerEntry } from "../../lib/types";

export const TX_LABEL: Record<LedgerEntry["type"], string> = {
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  TRADE_PNL: "Copy-trade P&L",
  FEE: "Fee",
  ADJUSTMENT: "Adjustment",
};

export function TxIcon({ type, amount }: { type: LedgerEntry["type"]; amount: number }) {
  const Icon = type === "DEPOSIT" ? ArrowDownLeft : type === "WITHDRAWAL" ? ArrowUpRight : type === "FEE" ? ReceiptText : type === "ADJUSTMENT" ? Coins : Users;
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", amount >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
      <Icon className="size-4" />
    </span>
  );
}
