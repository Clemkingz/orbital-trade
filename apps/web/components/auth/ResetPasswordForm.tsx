"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PASSWORD_MIN_LENGTH } from "@orbit/shared";
import { Button } from "@orbit/ui/components/ui/Button";
import { PasswordField } from "@orbit/ui/components/ui/PasswordField";
import { toast } from "@orbit/ui/components/ui/Toast";
import { AuthError, resetPassword } from "@/lib/adapters/auth";
import { FormAlert } from "./AuthShell";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ pw: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);

  const pwError = touched.pw && pw.length < PASSWORD_MIN_LENGTH ? `Use at least ${PASSWORD_MIN_LENGTH} characters.` : undefined;
  const confirmError = touched.confirm && confirm !== pw ? "Passwords don't match." : undefined;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ pw: true, confirm: true });
    if (pw.length < PASSWORD_MIN_LENGTH || confirm !== pw) return;
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token, pw);
    } catch (err) {
      setSubmitting(false);
      return setError(err instanceof AuthError ? err.message : "Something went wrong. Try again.");
    }
    setSubmitting(false);
    toast.success("Password updated", { description: "Sign in with your new password." });
    router.push("/sign-in");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {!token && <FormAlert>This page needs the link from your reset email. Request a new one from “Forgot password”.</FormAlert>}
      {error && <FormAlert>{error}</FormAlert>}
      <PasswordField label="New password" autoComplete="new-password" showStrength value={pw} onChange={(e) => setPw(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, pw: true }))} error={pwError} />
      <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, confirm: true }))} error={confirmError} />
      <Button type="submit" fullWidth loading={submitting} loadingText="Updating password…">
        Update password
      </Button>
    </form>
  );
}
