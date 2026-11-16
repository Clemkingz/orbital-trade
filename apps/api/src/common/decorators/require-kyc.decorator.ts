import { SetMetadata } from "@nestjs/common";
export const REQUIRE_KYC = "requireKyc";
/** FR-3.7: mark endpoints that must reject users whose KYC is not APPROVED. */
export const RequireKyc = () => SetMetadata(REQUIRE_KYC, true);
