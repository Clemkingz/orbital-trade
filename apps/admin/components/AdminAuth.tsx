"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Clock, KeyRound, Mail, ShieldCheck, Smartphone, User } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { EMAIL_RE, PASSWORD_MIN_LENGTH } from "@orbit/shared";
import { LogoMark } from "@orbit/ui/components/brand/Logo";
import { Button, ButtonLink } from "@orbit/ui/components/ui/Button";
import { Field } from "@orbit/ui/components/ui/Field";
import { PasswordField } from "@orbit/ui/components/ui/PasswordField";
import { toast } from "@orbit/ui/components/ui/Toast";
import { CopyButton } from "@orbit/ui/components/ui/misc";
import { api, errorMessage } from "@orbit/ui/lib/api";
import { BRAND } from "@orbit/ui/lib/config";

function Shell({ step, title, icon, children, footer }: { step?: string; title: string; icon: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-night px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-24 -top-32 size-[460px] animate-glow rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 size-[420px] animate-glow rounded-full bg-magenta/10 blur-3xl" style={{ animationDelay: "-3s" }} />
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)]" />
      </div>
      <main id="main" className="relative w-full max-w-[440px] animate-rise">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={44} light />
          <p className="mt-3 text-lg font-semibold">{BRAND.name} console</p>
          <p className="text-sm text-white/55">Authorised staff only</p>
        </div>
        <div className="rounded-2xl bg-surface p-6 text-text shadow-2xl shadow-black/40 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">{icon}</span>
            <div>
              <h1 className="font-semibold">{title}</h1>
              {step && <p className="text-xs text-text-muted">{step}</p>}
            </div>
          </div>
          {children}
        </div>
        {footer && <div className="mt-5 text-center text-sm text-white/60">{footer}</div>}
        <p className="mt-4 text-center text-xs text-white/40">Access is restricted by IP allow-list in production. Every sign-in and action is recorded in the audit log.</p>
      </main>
    </div>
  );
}

function Alert({ children }: { children: ReactNode }) {
  return <div role="alert" className="mb-5 animate-pop rounded-[var(--radius-control)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{children}</div>;
}

/* ── Sign in: password → authenticator code (mandatory for admins) ── */
export function AdminSignIn() {
  const router = useRouter();
  const [ticket, setTicket] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [enroll, setEnroll] = useState<{ ticket: string; otpauthUrl: string; secret: string } | null>(null);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    setLoading(true);
    try {
      if (enroll) {
        await api("/admin/auth/enroll", { json: { ticket: enroll.ticket, code } });
        toast.success("Authenticator set up", { description: "You're signed in. Next time, just enter the code from your app." });
        router.replace("/");
      } else if (!ticket) {
        if (!EMAIL_RE.test(email.trim()) || !password) return;
        const r = await api<{ ticket?: string; enroll?: { ticket: string; otpauthUrl: string; secret: string } }>("/admin/auth/sign-in", { json: { email: email.trim(), password } });
        if (r.enroll) setEnroll(r.enroll);
        else setTicket(r.ticket!);
        setTouched(false);
      } else {
        await api("/admin/auth/verify", { json: { ticket, code } });
        toast.success("Signed in to the console", { description: "This session is recorded in the audit log." });
        router.replace("/");
      }
    } catch (err) {
      setError(errorMessage(err));
      if ((ticket || enroll) && /expired/i.test(errorMessage(err))) {
        setTicket(null);
        setEnroll(null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell
      title={enroll ? "Set up your authenticator" : ticket ? "Two-factor authentication" : "Sign in"}
      step={enroll ? "One-time setup · 2FA is required for all admins" : ticket ? "Step 2 of 2 · required for all admins" : "Step 1 of 2"}
      icon={enroll ? <Smartphone className="size-5" /> : ticket ? <ShieldCheck className="size-5" /> : <Mail className="size-5" />}
      footer={<>New staff member? <Link href="/sign-up" className="font-semibold text-white hover:underline">Request console access</Link></>}
    >
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} noValidate className="space-y-5">
        {enroll ? (
          <div key="enroll" className="animate-rise space-y-5">
            <p className="text-sm text-text-muted">Scan this QR code with Google Authenticator, Authy or 1Password, then enter the 6-digit code it shows. You only do this once.</p>
            <div className="flex justify-center">
              <div className="rounded-2xl border border-border p-3"><QRCodeSVG value={enroll.otpauthUrl} size={176} fgColor="#0d0020" /></div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-alt px-3 py-2">
              <code className="truncate text-xs">{enroll.secret}</code>
              <CopyButton value={enroll.secret} label="Copy key" />
            </div>
            <Field label="6-digit code" icon={<KeyRound />} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
          </div>
        ) : !ticket ? (
          <div key="cred" className="animate-fade space-y-5">
            <Field label="Work email" icon={<Mail />} type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} error={touched && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : undefined} />
            <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={touched && !password ? "Enter your password." : undefined} />
          </div>
        ) : (
          <div key="totp" className="animate-rise">
            <Field label="Authenticator code" icon={<KeyRound />} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus hint={`Signed in as ${email}`} />
            <button type="button" onClick={() => { setTicket(null); setCode(""); setError(null); }} className="mt-3 text-sm font-medium text-primary hover:underline">
              Use a different account
            </button>
          </div>
        )}
        <Button type="submit" fullWidth loading={loading} loadingText={ticket || enroll ? "Verifying…" : "Checking…"} disabled={(!!ticket || !!enroll) && code.length !== 6}>
          {enroll ? "Confirm and enter console" : ticket ? "Verify and enter console" : "Continue"}
        </Button>
      </form>
    </Shell>
  );
}

/* ── Sign up: details → scan authenticator QR → confirm code → status ── */
export function AdminSignUp() {
  const [v, setV] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState(false);
  const [setup, setSetup] = useState<{ ticket: string; otpauthUrl: string; secret: string; firstAdmin: boolean } | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PENDING_APPROVAL" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errors = {
    firstName: !v.firstName.trim() ? "Enter your first name." : undefined,
    lastName: !v.lastName.trim() ? "Enter your last name." : undefined,
    email: !EMAIL_RE.test(v.email.trim()) ? "Enter a valid work email." : undefined,
    password: v.password.length < PASSWORD_MIN_LENGTH ? `Use at least ${PASSWORD_MIN_LENGTH} characters.` : undefined,
    confirm: v.confirm !== v.password ? "Passwords don't match." : undefined,
  };
  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined);

  async function createAccount(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.values(errors).some(Boolean)) return;
    setLoading(true);
    try {
      setSetup(await api("/admin/auth/sign-up", { json: { firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim(), password: v.password } }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await api<{ status: "ACTIVE" | "PENDING_APPROVAL" }>("/admin/auth/sign-up/confirm", { json: { ticket: setup!.ticket, code } });
      setStatus(r.status);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (status) {
    const active = status === "ACTIVE";
    return (
      <Shell title={active ? "You're set up" : "Waiting for approval"} icon={active ? <CheckCircle2 className="size-5" /> : <Clock className="size-5" />}>
        <div className="animate-rise text-center">
          <p className="text-sm text-text-muted">
            {active
              ? "You're the first admin, so your account is a super admin. Sign in with your password and authenticator code."
              : "A super admin has been notified. You can sign in once they approve your access."}
          </p>
          <ButtonLink href="/sign-in" fullWidth className="mt-6">Go to sign in</ButtonLink>
        </div>
      </Shell>
    );
  }

  if (setup) {
    return (
      <Shell title="Set up your authenticator" step="Step 2 of 2 · 2FA is mandatory for admins" icon={<Smartphone className="size-5" />}>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={confirm} className="animate-rise space-y-5">
          <p className="text-sm text-text-muted">Scan this QR code with Google Authenticator, Authy or 1Password, then enter the 6-digit code it shows.</p>
          <div className="flex justify-center">
            <div className="rounded-2xl border border-border p-3"><QRCodeSVG value={setup.otpauthUrl} size={176} fgColor="#0d0020" /></div>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-alt px-3 py-2">
            <code className="truncate text-xs">{setup.secret}</code>
            <CopyButton value={setup.secret} label="Copy key" />
          </div>
          <Field label="6-digit code" icon={<KeyRound />} inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
          <Button type="submit" fullWidth loading={loading} loadingText="Confirming…" disabled={code.length !== 6}>Confirm and finish</Button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell title="Request console access" step="Step 1 of 2" icon={<User className="size-5" />} footer={<>Already have access? <Link href="/sign-in" className="font-semibold text-white hover:underline">Sign in</Link></>}>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={createAccount} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" icon={<User />} value={v.firstName} onChange={(e) => setV({ ...v, firstName: e.target.value })} error={show("firstName")} />
          <Field label="Last name" icon={<User />} value={v.lastName} onChange={(e) => setV({ ...v, lastName: e.target.value })} error={show("lastName")} />
        </div>
        <Field label="Work email" icon={<Mail />} type="email" autoComplete="username" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} error={show("email")} />
        <PasswordField label="Password" autoComplete="new-password" showStrength value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} error={show("password")} />
        <PasswordField label="Confirm password" autoComplete="new-password" value={v.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} error={show("confirm")} />
        <p className="rounded-xl bg-surface-alt px-3 py-2 text-xs text-text-muted">The first admin becomes the super admin. Everyone after that needs a super admin to approve them.</p>
        <Button type="submit" fullWidth loading={loading} loadingText="Creating account…">Continue</Button>
      </form>
    </Shell>
  );
}
