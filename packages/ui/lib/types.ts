import type { AdjustmentReason, DepositClaimStatus, IdType, KycStatus, LedgerEntryType } from "@orbit/shared";

/* ── API shapes ───────────────────────────────────────────────── */
export interface ApiUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  currency: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED" | "SUSPENDED";
  kycStatus: KycStatus;
  kycReason: string | null;
  totpEnabled: boolean;
  createdAt: string;
  emailVerified?: boolean;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  type: LedgerEntryType;
  amountBtc: number;
  fiatAmount: number | null;
  fiatCurrency: string | null;
  btcPrice: number | null;
  reference: string | null;
  adjustmentReason: AdjustmentReason | null;
  note: string | null;
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
}

export interface Money {
  btc: number;
  fiat: number;
}

export type TileId = "balance" | "deposited" | "profit" | "allocation" | "deposit" | "copied" | "transactions" | "announcements" | "buy";

export interface TileConfig {
  id: TileId;
  visible: boolean;
  order: number;
  label: string;
}

export type Segment = "all" | "unverified" | "verified" | "copiers";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  segment: Segment;
  kind: "banner" | "announcement";
  tone: "info" | "warning" | "success";
  createdAt: string;
}

export interface CopyRow {
  id: string;
  status: "ACTIVE" | "PAUSED" | "STOPPED";
  allocationBtc: number;
  stopLossPct: number | null;
  pnlBtc: number;
  trader: { id: string; name: string; photoUrl: string | null; hue: number };
}

export interface DepositClaim {
  id: string;
  userId: string;
  txHash: string;
  amountBtc: number;
  fromAddress: string;
  status: DepositClaimStatus;
  note: string | null;
  createdAt: string;
  user?: ApiUser;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Dashboard {
  currency: string;
  btcPrice: number;
  btcUsd: number;
  balance: Money;
  deposited: Money;
  profit: Money;
  allocated: Money;
  available: Money;
  recent: LedgerEntry[];
  tiles: TileConfig[];
  announcements: Announcement[];
  copies: CopyRow[];
  depositAddress: string | null;
  notifications: AppNotification[];
  claims: DepositClaim[];
  lastBuyRedirectAt: string | null;
}

export interface TraderStats {
  wins: number;
  losses: number;
  winRate: number;
  return30: number;
  return90: number;
  maxDrawdown: number;
  closedTrades: number;
}

export interface Trader {
  id: string;
  name: string;
  photoUrl: string | null;
  hue: number;
  yearsExperience: number;
  typicalTradeSizeBtc: number;
  bio: string;
  strategy: string;
  riskLevel: number;
  minAllocation: number;
  feePct: number;
  active: boolean;
  demo: boolean;
  copiers: number;
  stats: TraderStats;
}

export interface Trade {
  id: string;
  traderId: string;
  side: Side;
  entry: number;
  exit: number | null;
  size: number;
  openedAt: string;
  closedAt: string | null;
}

export interface BuyPlatform {
  id?: string;
  name: string;
  logoText: string;
  color: string;
  linkUrl: string;
  paymentMethods: ("Card" | "Bank transfer" | "P2P")[];
  sortOrder?: number;
  active: boolean;
}

export interface Withdrawal {
  id: string;
  amountBtc: number;
  feeBtc: number;
  address: string;
  status: "AWAITING_APPROVAL" | "PROCESSING" | "COMPLETED" | "REJECTED";
  createdAt: string;
  user?: ApiUser;
}

export interface WithdrawalAddress {
  id: string;
  address: string;
  label: string;
  createdAt: string;
  usableFrom: string;
}

export interface KycQueueItem {
  id: string;
  idType: IdType;
  createdAt: string;
  files: { front: { mime: string } | null; back: { mime: string } | null; selfie: { mime: string } | null };
  vendorResult: { connected?: boolean } | null;
  user: ApiUser;
}

export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  target: string;
  ip: string;
  createdAt: string;
}

export interface WalletAddressRecord {
  id: string;
  address: string;
  activeFrom: string;
  activeTo: string | null;
  setBy: string;
  reason: string;
}

export interface Visitor {
  sessionId: string;
  userName: string | null;
  country: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  page: string;
  device: "Desktop" | "Mobile" | "Tablet";
  browser: string;
  startedAt: string;
}

export interface PendingAdjustment {
  id: string;
  userId: string;
  amountBtc: number;
  fiatAmount: number;
  fiatCurrency: string;
  reason: AdjustmentReason;
  note: string;
  requestedBy: string;
  requestedByName?: string;
  createdAt: string;
  user?: ApiUser;
}

/* ── Landing-page market mocks ────────────────────────────────── */
export type Side = "BUY" | "SELL";

export interface BotTrade {
  id: string;
  side: Side;
  entry: number;
  exit: number | null;
  size: number;
  pnl: number | null;
  openedAt: string;
  closedAt: string | null;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  category: "Stocks" | "Crypto" | "Macro";
  publishedAt: string;
}

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  delayed: boolean;
}

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}
