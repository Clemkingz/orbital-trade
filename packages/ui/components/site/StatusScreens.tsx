"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Home, LifeBuoy, RefreshCw } from "lucide-react";
import { Logo } from "../brand/Logo";
import { Button, ButtonLink } from "../ui/Button";
import { BRAND } from "../../lib/config";

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute -right-32 -top-40 size-[480px] animate-glow rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute -bottom-40 -left-32 size-[480px] animate-glow rounded-full bg-magenta/15 blur-3xl" style={{ animationDelay: "-3s" }} />
      <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)]" />
      {/* stars */}
      {[...Array(18)].map((_, i) => (
        <span
          key={i}
          className="absolute size-0.5 animate-ping-slow rounded-full bg-white"
          style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.4}s`, opacity: 0.6 }}
        />
      ))}
    </div>
  );
}

/** A planet with a satellite that has drifted off its orbit. */
function LostSatellite({ code }: { code: string }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]" aria-hidden="true">
      <svg viewBox="0 0 300 300" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id="ls-p" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#4a1fd0" />
            <stop offset="55%" stopColor="#22086e" />
            <stop offset="100%" stopColor="#0d0020" />
          </radialGradient>
        </defs>
        <circle cx="150" cy="150" r="82" fill="url(#ls-p)" />
        <circle cx="150" cy="150" r="82" fill="none" stroke="#7c3aff" strokeOpacity="0.6" />
        <ellipse cx="150" cy="150" rx="138" ry="48" fill="none" stroke="#fff" strokeOpacity="0.15" strokeDasharray="4 8" transform="rotate(-20 150 150)" />
        <text x="150" y="166" textAnchor="middle" fontSize="46" fontWeight="800" fill="#fff" fontFamily="inherit" letterSpacing="-2">
          {code}
        </text>
      </svg>
      <div className="absolute right-[2%] top-[8%] animate-float">
        <svg width="64" height="64" viewBox="0 0 64 64" className="animate-orbit" style={{ animationDuration: "18s" }}>
          <rect x="24" y="24" width="16" height="16" rx="3" fill="#e9e3ff" />
          <rect x="4" y="27" width="18" height="10" rx="2" fill="#5501ff" />
          <rect x="42" y="27" width="18" height="10" rx="2" fill="#5501ff" />
          <circle cx="32" cy="32" r="3" fill="#00ffbb" />
        </svg>
      </div>
    </div>
  );
}

export function StatusScreen({ code, title, body, actions }: { code: string; title: string; body: ReactNode; actions: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-night text-white">
      <Backdrop />
      <header className="relative px-4 py-6 sm:px-8">
        <Link href="/" aria-label={`${BRAND.name} home`}>
          <Logo variant="light" />
        </Link>
      </header>
      <main id="main" className="relative flex flex-1 items-center justify-center px-4 pb-16">
        <div className="grid w-full max-w-4xl items-center gap-10 md:grid-cols-2">
          <div className="animate-fade">
            <LostSatellite code={code} />
          </div>
          <div className="animate-rise text-center md:text-left">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <div className="mt-3 text-white/70">{body}</div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">{actions}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function NotFoundView() {
  return (
    <StatusScreen
      code="404"
      title="Lost in orbit"
      body="The page you're looking for drifted out of range. It may have moved, or the link may be mistyped."
      actions={
        <>
          <ButtonLink href="/" icon={<Home className="size-4" />}>
            Back to home
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="outline-light" icon={<ArrowLeft className="size-4" />}>
            Go to dashboard
          </ButtonLink>
        </>
      }
    />
  );
}

export function ErrorView({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [retrying, setRetrying] = useState(false);
  return (
    <StatusScreen
      code="500"
      title="Something went off course"
      body={
        <>
          <p>An unexpected error interrupted this page. Your balance and funds are not affected. Every balance is computed from the ledger, which this error does not touch.</p>
          {error.digest && <p className="mt-3 font-mono text-xs text-white/40">Reference: {error.digest}</p>}
        </>
      }
      actions={
        <>
          <Button
            loading={retrying}
            loadingText="Retrying…"
            icon={<RefreshCw className="size-4" />}
            onClick={() => {
              setRetrying(true);
              setTimeout(() => {
                reset();
                setRetrying(false);
              }, 600);
            }}
          >
            Try again
          </Button>
          <ButtonLink href={`mailto:${BRAND.supportEmail}`} variant="outline-light" icon={<LifeBuoy className="size-4" />}>
            Contact support
          </ButtonLink>
        </>
      }
    />
  );
}

/** Inline error card for errors inside the dashboard/admin shells (keeps navigation visible). */
export function InlineError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [retrying, setRetrying] = useState(false);
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md animate-pop rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-2xl">🛰️</span>
        <h2 className="mt-5 text-xl font-semibold">This section failed to load</h2>
        <p className="mt-2 text-sm text-text-muted">Your funds are safe. Try again, or contact support if it keeps happening.</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-text-muted">Ref: {error.digest}</p>}
        <Button
          className="mt-6"
          loading={retrying}
          loadingText="Retrying…"
          icon={<RefreshCw className="size-4" />}
          onClick={() => {
            setRetrying(true);
            setTimeout(() => {
              reset();
              setRetrying(false);
            }, 600);
          }}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
