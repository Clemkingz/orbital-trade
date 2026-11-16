"use client";

import { useApi } from "@orbit/ui/lib/api";
import type { ApiUser, AuditEntry } from "@orbit/ui/lib/types";

export const useAdminMe = () => useApi<{ user: ApiUser }>("/admin/auth/me", { shouldRetryOnError: false });

export interface Overview {
  kyc: number;
  oldestKycAt: string | null;
  claims: number;
  adjustments: number;
  withdrawals: number;
  newUsers: number;
  pendingAdmins: number;
  liveVisitors: number;
  audit: AuditEntry[];
}

export const useOverview = () => useApi<Overview>("/admin/overview", { refreshInterval: 20_000 });
