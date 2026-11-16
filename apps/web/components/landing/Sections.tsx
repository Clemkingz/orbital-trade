"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, ChevronDown, Fingerprint, KeyRound, Landmark, ScrollText, ShieldCheck, ShoppingCart, UserPlus, Wallet, Users } from "lucide-react";
import { OrbitGlobe } from "@orbit/ui/components/brand/OrbitGlobe";
import { TraderCard } from "@/components/traders/TraderCard";
import { ButtonLink } from "@orbit/ui/components/ui/Button";
import { Reveal, Skeleton } from "@orbit/ui/components/ui/misc";
import { cn } from "@orbit/ui/lib/cn";
import { useApi } from "@orbit/ui/lib/api";
import type { Trader } from "@orbit/ui/lib/types";

function SectionHead({ eyebrow, title, body, center }: { eyebrow: string; title: string; body?: string; center?: boolean }) {
  return (
    <Reveal className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {body && <p className="mt-3 text-lg text-text-muted">{body}</p>}
    </Reveal>
  );
}

/* ── How it works ────────────────────────────────────────────── */
const STEPS = [
  { icon: UserPlus, title: "Create your account", body: "Sign up in a minute and confirm your email with a 6-digit code." },
  { icon: Fingerprint, title: "Verify your ID", body: "Upload a passport, NIN, driver's licence or voter's card, plus a quick selfie check. Our team reviews it, usually within 4 hours." },
  { icon: ShoppingCart, title: "Buy and deposit BTC", body: "Buy on MoonPay, Coinmama, Quidax and others. Send it to your deposit address and submit a claim so we can match it to you." },
  { icon: Users, title: "Copy vetted traders", body: "Pick one or several traders, set an allocation and stop-loss, and pause or stop any time." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface-alt py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead center eyebrow="How it works" title="From sign-up to copy trading in four steps" body="ID verification is the only gate, and it protects every account on the platform." />
        <ol className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" aria-hidden="true" />
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <Reveal as="li" key={title} delay={i * 90} className="relative rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_-20px_rgba(85,1,255,0.35)]">
              <div className="flex items-center justify-between">
                <span className="relative flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_8px_20px_-6px_rgba(85,1,255,0.6)]">
                  <Icon className="size-5" />
                </span>
                <span className="text-4xl font-bold text-primary/10">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Featured traders ────────────────────────────────────────── */
export function FeaturedTraders() {
  const { data } = useApi<Trader[]>("/traders");
  const list = useMemo(() => (data ?? []).slice(0, 3), [data]);
  // Hide the section entirely until an admin has added at least one trader.
  if (data && list.length === 0) return null;
  return (
    <section id="traders" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead eyebrow="Featured traders" title="Stats counted from real trade records" body="Wins, losses and returns are calculated from every closed trade. No one types them in." />
          <Reveal>
            <ButtonLink href="/sign-up" variant="secondary" size="md">
              Browse all traders <ArrowRight className="size-4" />
            </ButtonLink>
          </Reveal>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {!data && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[400px]" />)}
          {list.map((trader, i) => (
            <Reveal key={trader.id} delay={i * 100}>
              <TraderCard trader={trader} href="/sign-up" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Security ────────────────────────────────────────────────── */
const SECURITY = [
  { icon: BadgeCheck, title: "Every account is ID-verified", body: "Deposits, copy trading and withdrawals stay locked until our team approves your ID. The server enforces this, not only the screen." },
  { icon: Landmark, title: "Licensed custodian", body: "Funds are held with a licensed custody provider. Private keys never touch our servers." },
  { icon: ScrollText, title: "A ledger you can audit", body: "Your balance is the sum of recorded transactions. Every adjustment carries a reason and appears in your history." },
  { icon: KeyRound, title: "2FA and address allow-lists", body: "Withdrawals need 2FA and email confirmation. New withdrawal addresses have a 24-hour hold." },
  { icon: Wallet, title: "Withdraw any time", body: "Your available balance is yours, subject only to the published fee and threshold. There are no unlock fees." },
  { icon: ShieldCheck, title: "Encrypted ID documents", body: "Documents are encrypted at rest, visible only to KYC reviewers, and every view is logged." },
];

export function Security() {
  return (
    <section id="security" className="relative overflow-hidden bg-night py-20 text-white sm:py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-40 top-0 size-[500px] rounded-full bg-primary/25 blur-3xl" />
        <div className="bg-dot-grid absolute inset-0 opacity-50" />
      </div>
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan">Security and verification</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Built so you can check our work</h2>
          <p className="mt-3 text-lg text-white/65">We designed the platform around rules that protect you. Regulators and payment partners look for the same rules.</p>
          <OrbitGlobe className="mx-auto mt-8 hidden w-72 animate-float lg:block" />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {SECURITY.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 2) * 80 + Math.floor(i / 2) * 60} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:border-primary/50 hover:bg-white/[0.07]">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/25 ring-1 ring-primary/40">
                <Icon className="size-5 text-cyan" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────── */
const FAQS = [
  { q: "Why do I need to verify my ID?", a: "We're required to know who our customers are. Verification also stops anyone else from depositing to or withdrawing from your account. Until it's approved, you can log in and read announcements, but money features stay locked." },
  { q: "How do I fund my account?", a: "Buy BTC on one of the listed platforms, such as MoonPay, Coinmama or Quidax. Send it to the deposit address on your dashboard, then submit a deposit claim with the transaction hash. We credit it after 2 network confirmations." },
  { q: "Why do I have to submit a deposit claim?", a: "Everyone deposits to the same address, and Bitcoin transfers carry no memo. Your claim tells us the transaction is yours, so we can match it by hash and amount. Each hash can only be credited once." },
  { q: "How are trader statistics calculated?", a: "From the trader's recorded trades. A closed trade with a profit counts as a win, and one with a loss counts as a loss. Returns and drawdown come from the same records. Nobody types these numbers in." },
  { q: "Can I copy more than one trader?", a: "Yes. Each copy has its own allocation and optional stop-loss. Your total allocation can't exceed your available balance, and you can pause or stop any copy at any time." },
  { q: "Can I withdraw at any time?", a: "Yes. Verified users can withdraw their available balance at any time, subject only to the published network fee. Large withdrawals get an extra admin check. We never charge a fee to unlock a withdrawal." },
  { q: "Is the trading bot on the homepage trading my money?", a: "No. The bot trades the firm's own prop account, and the widget says so on its label. Client funds are never used by the bot." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-surface-alt py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHead center eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 40} className={cn("overflow-hidden rounded-2xl border bg-surface transition-colors", isOpen ? "border-primary/30 shadow-[0_12px_32px_-18px_rgba(85,1,255,0.4)]" : "border-border")}>
                <h3>
                  <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold sm:px-6">
                    {f.q}
                    <ChevronDown className={cn("size-5 shrink-0 text-text-muted transition-transform duration-300", isOpen && "rotate-180 text-primary")} />
                  </button>
                </h3>
                <div className={cn("grid transition-all duration-300 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-[15px] leading-relaxed text-text-muted sm:px-6">{f.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ───────────────────────────────────────────────── */
export function FinalCta() {
  return (
    <section className="bg-surface px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-gradient-to-br from-primary-deep via-primary to-[#7c3aff] px-6 py-14 text-center text-white sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="bg-dot-grid absolute inset-0 opacity-60" />
          <div className="absolute -right-20 -top-20 size-80 animate-glow rounded-full bg-cyan/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 size-72 animate-glow rounded-full bg-magenta/25 blur-3xl" />
        </div>
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Start with verification. Trade with confidence.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">Create your account, verify your ID and fund your wallet. Most people finish in under 15 minutes.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/sign-up" variant="secondary" className="border-transparent text-primary-deep">
              Create free account <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/sign-in" variant="outline-light">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
