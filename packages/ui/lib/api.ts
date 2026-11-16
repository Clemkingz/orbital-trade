"use client";

import useSWR, { mutate as globalMutate, type SWRConfiguration } from "swr";
import { onExternalChange } from "./mock/db";
import { handle, MockHttpError } from "./mock/server";

/**
 * Base URL for "live" mode. Defaults to the same origin (`/api/v1`), which is where the API would be
 * mounted on Vercel. Set NEXT_PUBLIC_API_URL only to point at a separately running API in local dev.
 * The API is called from the browser, so it must be public (bindings only work server-side).
 */
export const API_URL = `${(process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")}/api/v1`;

/**
 * "mock" (default): requests are answered in the browser by lib/mock/server.ts, using localStorage.
 * "live": requests go to the real API at NEXT_PUBLIC_API_URL once it exists.
 */
export const API_MODE = process.env.NEXT_PUBLIC_API_MODE === "live" ? "live" : "mock";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function messageFrom(body: unknown, status: number) {
  const m = (body as { message?: string | string[] } | null)?.message;
  if (Array.isArray(m)) return m[0];
  if (typeof m === "string") return m;
  return status >= 500 ? "Something went wrong on our side. Try again." : "Request failed.";
}

/** JSON/FormData fetch with the session cookie. Throws ApiError with a user-readable message. */
export async function api<T = unknown>(path: string, init: { method?: string; json?: unknown; form?: FormData; signal?: AbortSignal } = {}): Promise<T> {
  const method = init.method ?? (init.json !== undefined || init.form ? "POST" : "GET");
  if (API_MODE === "mock") {
    await new Promise((r) => setTimeout(r, method === "GET" ? 120 : 450)); // feel like a network
    try {
      return (await handle(method, path, init.json ?? null, init.form ?? null)) as T;
    } catch (e) {
      if (e instanceof MockHttpError) throw new ApiError(e.status, e.message);
      throw new ApiError(500, "Something went wrong. Try again.");
    }
  }
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      credentials: "include",
      headers: init.json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.form ?? (init.json !== undefined ? JSON.stringify(init.json) : undefined),
      signal: init.signal,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check that the API is running and try again.");
  }
  const text = await res.text();
  const body = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) throw new ApiError(res.status, messageFrom(body, res.status));
  return body as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

/** SWR wrapper: `useApi<T>("/me/dashboard")`. Pass null to skip. */
export function useApi<T>(path: string | null, config?: SWRConfiguration<T, ApiError>) {
  return useSWR<T, ApiError>(path, (p: string) => api<T>(p), { revalidateOnFocus: true, shouldRetryOnError: (e) => e.status >= 500, ...config });
}

/** Revalidate every cached query whose path starts with one of the prefixes. */
export function refresh(...prefixes: string[]) {
  return globalMutate((key) => typeof key === "string" && prefixes.some((p) => key.startsWith(p)));
}

/** In mock mode, refresh every screen when another tab (e.g. the admin console) changes the data. */
if (typeof window !== "undefined" && API_MODE === "mock") onExternalChange(() => globalMutate(() => true));
