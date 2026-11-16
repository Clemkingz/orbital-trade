"use client";

import { refresh, useApi } from "@orbit/ui/lib/api";
import type { ApiUser, Dashboard, Trader } from "@orbit/ui/lib/types";

export const useMe = () => useApi<{ user: ApiUser }>("/auth/me", { shouldRetryOnError: false });

/** Dashboard numbers come from the API ledger summary and refresh every 15 s. */
export const useDashboard = () => useApi<Dashboard>("/me/dashboard", { refreshInterval: 15_000 });

export const useTraders = () => useApi<Trader[]>("/traders");

/** Re-fetch everything that depends on the user's ledger or status. */
export const refreshAccount = () => refresh("/me", "/auth/me", "/traders");
