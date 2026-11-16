import { Injectable } from "@nestjs/common";

/** Append-only ledger. Balance = SUM(amount_btc). FR-8.6 Adjust balance with second approval above threshold. */
@Injectable()
export class LedgerService {}
