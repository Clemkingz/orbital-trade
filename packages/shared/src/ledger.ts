/** Ledger is the single source of truth: balance = sum(entries). */
export const LedgerEntryType = {
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  TRADE_PNL: "TRADE_PNL",
  FEE: "FEE",
  ADJUSTMENT: "ADJUSTMENT",
} as const;
export type LedgerEntryType = (typeof LedgerEntryType)[keyof typeof LedgerEntryType];

/** FR-8.6 reason types for Adjust balance */
export const AdjustmentReason = {
  DEPOSIT_CREDIT: "DEPOSIT_CREDIT",
  CORRECTION: "CORRECTION",
  BONUS: "BONUS",
  REFUND: "REFUND",
} as const;
export type AdjustmentReason = (typeof AdjustmentReason)[keyof typeof AdjustmentReason];

export const DepositClaimStatus = {
  PENDING: "PENDING",
  MATCHED: "MATCHED",
  REJECTED: "REJECTED",
  NEEDS_INFO: "NEEDS_INFO",
} as const;
export type DepositClaimStatus = (typeof DepositClaimStatus)[keyof typeof DepositClaimStatus];
