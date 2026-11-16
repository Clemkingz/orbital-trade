/**
 * Auth client — calls the API (POST /v1/auth/*). Sessions are httpOnly cookies set by the API.
 * In development the API also returns `devCode` / `devLink` so you can test without an email provider.
 */
import { api, ApiError } from "@orbit/ui/lib/api";
import type { ApiUser } from "@orbit/ui/lib/types";

export { ApiError as AuthError };

const DEV_CODE_KEY = "orbit-dev-code";

export function rememberDevCode(code?: string) {
  try {
    if (code) sessionStorage.setItem(DEV_CODE_KEY, code);
  } catch {
    /* ignore */
  }
}

export function readDevCode() {
  try {
    return sessionStorage.getItem(DEV_CODE_KEY);
  } catch {
    return null;
  }
}

export async function signUp(input: { firstName: string; lastName: string; email: string; phone: string; country: string; password: string; referralCode?: string; acceptTerms: boolean }) {
  const res = await api<{ ok: true; devCode?: string }>("/auth/sign-up", { json: { ...input, referralCode: input.referralCode || undefined } });
  rememberDevCode(res.devCode);
  return res;
}

export async function signIn(input: { email: string; password: string; totp?: string }) {
  const res = await api<{ user?: ApiUser; requires2fa?: boolean; emailUnverified?: boolean; devCode?: string }>("/auth/sign-in", { json: input });
  rememberDevCode(res.devCode);
  return res;
}

export const verifyEmail = (input: { email: string; code: string }) => api("/auth/verify-email", { json: input });

export async function resendCode(email: string) {
  const res = await api<{ devCode?: string }>("/auth/resend-code", { json: { email } });
  rememberDevCode(res.devCode);
  return res;
}

export const forgotPassword = (email: string) => api<{ ok: true; devLink?: string }>("/auth/forgot-password", { json: { email } });
export const resetPassword = (token: string, password: string) => api("/auth/reset-password", { json: { token, password } });
export const signOut = () => api("/auth/sign-out", { method: "POST" });
