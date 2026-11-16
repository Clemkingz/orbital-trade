"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { KeyRound, Mail } from "lucide-react";
import { EMAIL_RE } from "@orbit/shared";
import { Button } from "@orbit/ui/components/ui/Button";
import { Field } from "@orbit/ui/components/ui/Field";
import { PasswordField } from "@orbit/ui/components/ui/PasswordField";
import { toast } from "@orbit/ui/components/ui/Toast";
import { AuthError, signIn } from "@/lib/adapters/auth";
import { FormAlert } from "./AuthShell";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailError = touched.email && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : undefined;
  const passwordError = touched.password && !password ? "Enter your password." : undefined;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!EMAIL_RE.test(email.trim()) || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await signIn({ email, password, ...(step === "2fa" ? { totp: code } : {}) });
      if (res.emailUnverified) {
        toast.info("Verify your email first", { description: "We sent you a new 6-digit code." });
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      if (res.requires2fa) {
        setStep("2fa");
        toast.info("Two-factor authentication", { description: "Enter the code from your authenticator app." });
        return;
      }
      toast.success("Welcome back", { description: "Taking you to your account…" });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <FormAlert>{error}</FormAlert>}

      {step === "credentials" ? (
        <div key="cred" className="animate-fade space-y-5">
          <Field label="Email address" icon={<Mail />} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} error={emailError} />
          <div>
            <PasswordField label="Password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))} error={passwordError} />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div key="2fa" className="animate-rise">
          <Field
            label="Authenticator code"
            icon={<KeyRound />}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            hint="Open your authenticator app and enter the code for this account."
            autoFocus
          />
          <button type="button" onClick={() => setStep("credentials")} className="mt-3 text-sm font-medium text-primary hover:underline">
            Use a different account
          </button>
        </div>
      )}

      <Button type="submit" fullWidth loading={submitting} loadingText={step === "2fa" ? "Verifying…" : "Signing in…"}>
        {step === "2fa" ? "Verify and sign in" : "Sign in"}
      </Button>
    </form>
  );
}
