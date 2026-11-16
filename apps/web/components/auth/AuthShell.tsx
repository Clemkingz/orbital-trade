import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, ArrowDownToLine, ShieldCheck } from "lucide-react";
import { Logo } from "@orbit/ui/components/brand/Logo";
import { OrbitGlobe } from "@orbit/ui/components/brand/OrbitGlobe";
import { BRAND, RISK_WARNING } from "@orbit/ui/lib/config";

const PROOF_POINTS = [
  { icon: ShieldCheck, label: "ID-verified accounts" },
  { icon: Activity, label: "Live market data" },
  { icon: ArrowDownToLine, label: "Withdraw anytime" },
];

/**
 * Shared shell for sign-up, sign-in, forgot/reset password and verify email.
 * Desktop: brand column (left) + white form card (right). Mobile: logo, then the form first.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-night text-white">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-48 right-[-10%] size-[520px] animate-glow rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] size-[560px] animate-glow rounded-full bg-primary/30 blur-3xl" style={{ animationDelay: "-2s" }} />
        <div className="absolute right-1/3 top-1/3 size-72 animate-glow rounded-full bg-magenta/10 blur-3xl" style={{ animationDelay: "-4s" }} />
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-12">
        {/* Brand column */}
        <section className="flex flex-col gap-6 lg:h-full lg:justify-between lg:py-4">
          <Link href="/" className="w-fit animate-fade" aria-label={`${BRAND.name} home`}>
            <Logo variant="light" />
          </Link>

          <div className="hidden animate-rise space-y-4 lg:block" style={{ animationDelay: "80ms" }}>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Trade Bitcoin with traders <span className="text-cyan">you can verify.</span>
            </h2>
            <p className="max-w-md text-lg text-white/70">Every win, loss and balance comes from recorded trades and a ledger you can audit.</p>
          </div>

          <OrbitGlobe className="mx-auto hidden w-[min(80%,400px)] animate-float lg:-ml-10 lg:block" />

          <ul className="hidden flex-wrap gap-x-6 gap-y-3 text-sm text-white/65 lg:flex">
            {PROOF_POINTS.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex animate-rise items-center gap-2" style={{ animationDelay: `${200 + i * 80}ms` }}>
                <span className="flex size-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                  <Icon className="size-3.5 text-cyan" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </section>

        {/* Form card */}
        <main className="w-full min-w-0 max-w-[480px] animate-rise justify-self-center lg:justify-self-end">
          <p className="mb-4 text-sm text-white/70 lg:hidden">Trade Bitcoin with traders you can verify.</p>
          <div className="rounded-2xl bg-surface p-6 text-text shadow-2xl shadow-black/40 sm:p-9">{children}</div>
          <p className="mt-5 text-center text-xs leading-relaxed text-white/45">{RISK_WARNING}</p>
        </main>
      </div>
    </div>
  );
}

export function AuthHeader({ title, subtitle, icon }: { title: string; subtitle?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-7">
      {icon && <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">{icon}</span>}
      <h1 className="text-2xl font-semibold tracking-tight text-text">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>}
    </div>
  );
}

export function FormAlert({ children, tone = "danger" }: { children: ReactNode; tone?: "danger" | "success" }) {
  return (
    <div
      role="alert"
      className={
        tone === "danger"
          ? "mb-5 animate-pop rounded-[var(--radius-control)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
          : "mb-5 animate-pop rounded-[var(--radius-control)] border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
      }
    >
      {children}
    </div>
  );
}
