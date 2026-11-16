/** FR-3.5 */
export const KycStatus = {
  NOT_SUBMITTED: "NOT_SUBMITTED",
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RESUBMISSION_REQUESTED: "RESUBMISSION_REQUESTED",
} as const;
export type KycStatus = (typeof KycStatus)[keyof typeof KycStatus];

/** FR-3.2 */
export const IdType = {
  PASSPORT: "PASSPORT",
  NATIONAL_ID: "NATIONAL_ID",
  DRIVERS_LICENCE: "DRIVERS_LICENCE",
  VOTERS_CARD: "VOTERS_CARD",
} as const;
export type IdType = (typeof IdType)[keyof typeof IdType];

export const KYC_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const KYC_ACCEPTED_MIME = ["image/jpeg", "image/png", "application/pdf"];
