"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@orbit/ui/components/ui/Button";
import { toast } from "@orbit/ui/components/ui/Toast";
import { AuthError, readDevCode, resendCode, verifyEmail } from "@/lib/adapters/auth";
import { FormAlert } from "./AuthShell";

const LENGTH = 6;
const RESEND_SECONDS = 60;

/** FR-2.2: 6-digit email code before first login. */
export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [devCode, setDevCode] = useState<string | null>(null);
  useEffect(() => setDevCode(readDevCode()), []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setAt = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setDigits((s) => s.map((x, j) => (j === i ? d : x)));
    if (d && i < LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length: LENGTH }, (_, i) => text[i] ?? ""));
    refs.current[Math.min(text.length, LENGTH - 1)]?.focus();
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== LENGTH) return setError("Enter the 6-digit code from your email.");
    setSubmitting(true);
    setError(null);
    try {
      await verifyEmail({ email, code });
      toast.success("Email verified", { description: "Sign in to continue." });
      router.push("/sign-in?verified=1");
    } catch (err) {
      setDigits(Array(LENGTH).fill(""));
      refs.current[0]?.focus();
      setError(err instanceof AuthError ? err.message : "We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setCooldown(RESEND_SECONDS);
    await resendCode(email).catch(() => undefined);
    setDevCode(readDevCode());
    toast.info("New code sent", { description: email ? `Check ${email}.` : "Check your inbox." });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {error && <FormAlert>{error}</FormAlert>}
      {devCode && (
        <p className="rounded-xl border border-dashed border-primary/40 bg-primary-soft/50 px-3 py-2 text-center text-xs text-primary-deep">
          Dev mode (no email provider yet): your code is <b className="tabular tracking-widest">{devCode}</b>
        </p>
      )}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-text">Verification code</legend>
        <div className="flex justify-between gap-2 sm:gap-3" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={onKeyDown(i)}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1}`}
              maxLength={1}
              data-filled={!!d}
              className="tabular h-14 w-full min-w-0 transition-all duration-200 data-[filled=true]:border-primary data-[filled=true]:bg-primary-soft/50 rounded-[var(--radius-control)] border border-border bg-surface-alt text-center text-xl font-semibold outline-none focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
            />
          ))}
        </div>
      </fieldset>

      <Button type="submit" fullWidth loading={submitting} loadingText="Verifying…">Verify email</Button>

      <p className="text-center text-sm text-text-muted">
        Didn't get it?{" "}
        {cooldown > 0 ? (
          <span>Resend in {cooldown}s</span>
        ) : (
          <button type="button" onClick={resend} className="font-medium text-primary hover:underline">Resend code</button>
        )}
      </p>
    </form>
  );
}
