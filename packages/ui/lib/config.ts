/**
 * Single source for brand + product switches.
 * Change BRAND.name here (or via NEXT_PUBLIC_BRAND_NAME) and every page, title and label follows.
 */
export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Orbit Trade",
  tagline: "Trade Bitcoin with traders you can verify.",
  description:
    "Buy Bitcoin on trusted platforms, verify your ID, and copy vetted traders whose every win and loss comes from recorded trades.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  supportEmail: "support@example.com",
  registration: "Registration details pending SEC Nigeria approval.",
} as const;

/** FR-1.4 — label must say "Simulated" unless the prop account is real firm capital. */
export const PROP_ACCOUNT_LABEL =
  process.env.NEXT_PUBLIC_PROP_ACCOUNT_MODE === "firm" ? "Prop account · firm capital" : "Simulated";

/** FR-1.6 — set NEXT_PUBLIC_INDEX_DELAYED=false once the licence gives real-time index data. */
export const INDEX_DATA_DELAYED = process.env.NEXT_PUBLIC_INDEX_DELAYED !== "false";

export const LIMITS = {
  adjustmentSecondApprovalBtc: Number(process.env.NEXT_PUBLIC_ADJUSTMENT_APPROVAL_BTC ?? 0.05),
  withdrawalAdminApprovalBtc: Number(process.env.NEXT_PUBLIC_WITHDRAWAL_APPROVAL_BTC ?? 0.1),
  withdrawalFeeBtc: 0.0001,
  claimNudgeHours: 48,
} as const;

export const RISK_WARNING =
  "Crypto trading carries a high level of risk and may not be suitable for every investor. You could lose some or all of your capital. Past performance does not guarantee future results.";
