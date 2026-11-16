"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { EMAIL_RE } from "@orbit/shared";
import { Button } from "@orbit/ui/components/ui/Button";
import { Field } from "@orbit/ui/components/ui/Field";
import { toast } from "@orbit/ui/components/ui/Toast";
import { forgotPassword } from "@/lib/adapters/auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const error = touched && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : undefined;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!EMAIL_RE.test(email.trim())) return;
    setSubmitting(true);
    // Same confirmation whether or not the account exists, so the form can't be used to discover accounts.
    const res = await forgotPassword(email.trim()).catch(() => null);
    setDevLink(res?.devLink ?? null);
    setSubmitting(false);
    setSent(true);
    toast.success("Check your inbox", { description: "The reset link is valid for 30 minutes." });
  }

  if (sent) {
    return (
      <div className="animate-rise space-y-6 text-center">
        <span className="mx-auto flex size-14 animate-pop items-center justify-center rounded-2xl bg-success/10 text-success">
          <MailCheck className="size-7" />
        </span>
        <p className="text-[15px] text-text">
          If an account exists for <span className="font-semibold">{email}</span>, we&apos;ve sent a link to reset your password. It expires in 30 minutes.
        </p>
        {devLink && (
          <a href={devLink} className="block rounded-xl border border-dashed border-primary/40 bg-primary-soft/50 px-3 py-2 text-xs font-medium text-primary-deep hover:underline">
            Dev mode (no email provider yet): open the reset link
          </a>
        )}
        <Link href="/sign-in" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Email address" icon={<Mail />} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} error={error} />
      <Button type="submit" fullWidth loading={submitting} loadingText="Sending link…">
        Send reset link
      </Button>
      <Link href="/sign-in" className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </form>
  );
}
