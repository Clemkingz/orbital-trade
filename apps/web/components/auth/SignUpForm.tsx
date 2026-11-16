"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EMAIL_RE, PASSWORD_MIN_LENGTH } from "@orbit/shared";
import { Button } from "@orbit/ui/components/ui/Button";
import { Checkbox } from "@orbit/ui/components/ui/Checkbox";
import { Field } from "@orbit/ui/components/ui/Field";
import { PasswordField } from "@orbit/ui/components/ui/PasswordField";
import { SelectField } from "@orbit/ui/components/ui/SelectField";
import { AuthError, signUp } from "@/lib/adapters/auth";
import { toast } from "@orbit/ui/components/ui/Toast";
import { Gift, Mail, Phone, User } from "lucide-react";
import { COUNTRIES, DEFAULT_DIAL } from "@/lib/countries";
import { FormAlert } from "./AuthShell";
import { TrustRow } from "./TrustRow";

type Values = {
  firstName: string;
  lastName: string;
  email: string;
  dial: string;
  phone: string;
  country: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
  acceptTerms: boolean;
};
type Errors = Partial<Record<keyof Values, string>>;

const initial: Values = {
  firstName: "",
  lastName: "",
  email: "",
  dial: DEFAULT_DIAL,
  phone: "",
  country: "NG",
  password: "",
  confirmPassword: "",
  referralCode: "",
  acceptTerms: false,
};

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.firstName.trim()) e.firstName = "Enter your first name.";
  if (!v.lastName.trim()) e.lastName = "Enter your last name.";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address.";
  if (!/^\d{7,14}$/.test(v.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a valid phone number.";
  if (!v.country) e.country = "Select your country.";
  if (v.password.length < PASSWORD_MIN_LENGTH) e.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (v.confirmPassword !== v.password) e.confirmPassword = "Passwords don't match.";
  if (!v.acceptTerms) e.acceptTerms = "You need to accept the terms and risk disclosure.";
  return e;
}

export function SignUpForm() {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errors = validate(values);
  const show = (k: keyof Values) => (touched[k] ? errors[k] : undefined);
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setValues((s) => ({ ...s, [k]: val }));
  const blur = (k: keyof Values) => () => setTouched((t) => ({ ...t, [k]: true }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    if (Object.keys(errors).length) {
      toast.error("Check the highlighted fields", { description: "A few details need fixing before we can create your account." });
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { dial, phone, confirmPassword: _c, ...rest } = values;
      await signUp({ ...rest, email: rest.email.trim(), phone: `${dial}${phone.replace(/\D/g, "")}` });
      toast.success("Account created", { description: `We sent a 6-digit code to ${values.email}.` });
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      setServerError(err instanceof AuthError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {serverError && <FormAlert>{serverError}</FormAlert>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="First name" icon={<User />} placeholder="Tobi" autoComplete="given-name" value={values.firstName} onChange={(e) => set("firstName", e.target.value)} onBlur={blur("firstName")} error={show("firstName")} />
        <Field label="Last name" icon={<User />} placeholder="Adeyemi" autoComplete="family-name" value={values.lastName} onChange={(e) => set("lastName", e.target.value)} onBlur={blur("lastName")} error={show("lastName")} />
      </div>

      <Field label="Email address" icon={<Mail />} type="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={(e) => set("email", e.target.value)} onBlur={blur("email")} error={show("email")} />

      <Field
        label="Phone number"
        icon={<Phone />}
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        placeholder="803 000 0000"
        value={values.phone}
        onChange={(e) => set("phone", e.target.value)}
        onBlur={blur("phone")}
        error={show("phone")}
        leading={
          <select
            aria-label="Country code"
            value={values.dial}
            onChange={(e) => set("dial", e.target.value)}
            className="h-11 shrink-0 rounded-l-[var(--radius-control)] border border-r-0 border-border bg-surface-alt pl-3 pr-2 text-[15px] text-text outline-none focus:border-primary"
          >
            {[...new Set(COUNTRIES.map((c) => c.dial))].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        }
      />

      <SelectField
        label="Country of residence"
        value={values.country}
        onChange={(e) => set("country", e.target.value)}
        onBlur={blur("country")}
        error={show("country")}
        placeholder="Select country…"
        options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
      />

      <PasswordField label="Password" autoComplete="new-password" showStrength value={values.password} onChange={(e) => set("password", e.target.value)} onBlur={blur("password")} error={show("password")} />
      <PasswordField label="Confirm password" autoComplete="new-password" value={values.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} onBlur={blur("confirmPassword")} error={show("confirmPassword")} />

      <Field label="Referral code (optional)" icon={<Gift />} placeholder="e.g. TOBI25" value={values.referralCode} onChange={(e) => set("referralCode", e.target.value)} />

      <Checkbox checked={values.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} onBlur={blur("acceptTerms")} error={show("acceptTerms")}>
        I agree to the{" "}
        <Link href="/legal/terms" className="font-medium text-primary hover:underline">Terms of Service</Link> and have read the{" "}
        <Link href="/legal/risk-disclosure" className="font-medium text-primary hover:underline">Risk Disclosure</Link>.
      </Checkbox>

      <Button type="submit" fullWidth loading={submitting} loadingText="Creating your account…">Create account</Button>

      <TrustRow />

      <p className="text-center text-[13px] text-text-muted">
        <Link href="/legal/terms" className="hover:text-primary">Terms</Link>
        <span className="mx-2">·</span>
        <Link href="/legal/privacy" className="hover:text-primary">Privacy</Link>
      </p>
    </form>
  );
}
