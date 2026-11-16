"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Clock, Fingerprint, Info, Lock, Megaphone, PartyPopper, Send } from "lucide-react";
import { ButtonLink } from "@orbit/ui/components/ui/Button";
import { Skeleton } from "@orbit/ui/components/ui/misc";
import { cn } from "@orbit/ui/lib/cn";
import type { Announcement, ApiUser } from "@orbit/ui/lib/types";
import { useDashboard, useMe } from "@/lib/data";

/** FR-3.1 banner shown while KYC is not approved. */
export function KycBanner({ user }: { user: ApiUser }) {
  const status = user.kycStatus;
  if (status === "APPROVED") return null;
  const pending = status === "PENDING_REVIEW";
  const rejected = status === "REJECTED" || status === "RESUBMISSION_REQUESTED";
  return (
    <div
      className={cn(
        "relative mb-6 flex animate-rise flex-col gap-4 overflow-hidden rounded-2xl p-5 sm:flex-row sm:items-center sm:p-6",
        pending ? "border border-warning/30 bg-warning/[0.07]" : rejected ? "border border-danger/25 bg-danger/[0.05]" : "bg-night text-white",
      )}
    >
      {!pending && !rejected && <div className="pointer-events-none absolute -right-16 -top-16 size-56 animate-glow rounded-full bg-primary/40 blur-3xl" />}
      <span className={cn("relative flex size-12 shrink-0 items-center justify-center rounded-2xl", pending ? "bg-warning/15 text-warning" : rejected ? "bg-danger/10 text-danger" : "bg-primary text-white")}>
        {pending ? <Clock className="size-6" /> : rejected ? <AlertTriangle className="size-6" /> : <Fingerprint className="size-6" />}
      </span>
      <div className="relative flex-1">
        <p className="font-semibold">
          {pending ? "Your ID is being reviewed" : rejected ? (status === "REJECTED" ? "Your ID was not approved" : "Please resubmit your ID") : "Verify your ID to unlock deposits and copy trading."}
        </p>
        <p className={cn("mt-0.5 text-sm", pending || rejected ? "text-text-muted" : "text-white/70")}>
          {pending
            ? "Most reviews finish within 4 hours. We'll email you and notify you here when it's done."
            : rejected
              ? user.kycReason ?? "Check your verification page and upload clearer documents."
              : "It takes about 3 minutes: an ID photo and a quick selfie check."}
        </p>
      </div>
      {!pending && (
        <ButtonLink href="/verify-id" size="md" className="relative shrink-0">
          {rejected ? "Resubmit ID" : "Verify now"}
        </ButtonLink>
      )}
    </div>
  );
}

/** Blur + lock overlay for tiles that need an approved ID (FR-3.1). */
export function Locked({ locked, children, compact }: { locked: boolean; children: ReactNode; compact?: boolean }) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative h-full">
      <div className="pointer-events-none h-full select-none blur-[6px] saturate-50" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[var(--radius-card)] bg-surface/40 p-4 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-night text-white shadow-lg">
          <Lock className="size-4" />
        </span>
        {!compact && <p className="mt-2 text-sm font-semibold">Unlocks after ID approval</p>}
      </div>
    </div>
  );
}

/** Full-page lock for money pages. The API enforces the same rule (403). */
export function RequireVerified({ children, feature }: { children: ReactNode; feature: string }) {
  const { data } = useMe();
  if (!data)
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (data.user.kycStatus === "APPROVED") return <>{children}</>;
  return (
    <div className="mx-auto max-w-lg animate-pop rounded-2xl border border-border bg-surface p-8 text-center sm:p-10">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-night text-white shadow-[0_12px_30px_-10px_rgba(85,1,255,0.6)]">
        <Lock className="size-7" />
      </span>
      <h2 className="mt-6 text-xl font-semibold">{feature} is locked</h2>
      <p className="mt-2 text-text-muted">Verify your ID to unlock deposits and copy trading. Our servers enforce this rule, not just this screen, to protect every account.</p>
      <ButtonLink href="/verify-id" className="mt-6">
        {data.user.kycStatus === "PENDING_REVIEW" ? "Check verification status" : "Verify my ID"}
      </ButtonLink>
    </div>
  );
}

/** Nudge for 48 h after a buy-platform redirect (PRD wallets trade-off). */
export function ClaimNudge() {
  const { data } = useDashboard();
  const at = data?.lastBuyRedirectAt;
  if (!at) return null;
  const hoursLeft = Math.ceil(48 - (Date.now() - new Date(at).getTime()) / 3_600_000);
  if (hoursLeft <= 0) return null;
  return (
    <div className="mb-6 flex animate-rise flex-col gap-3 rounded-2xl border border-primary/25 bg-primary-soft/60 p-4 sm:flex-row sm:items-center sm:p-5">
      <span className="flex size-10 shrink-0 animate-float items-center justify-center rounded-xl bg-primary text-white">
        <Send className="size-4.5" />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-primary-deep">Bought BTC? Submit your deposit claim</p>
        <p className="text-sm text-text-muted">We can&apos;t tell who sent a deposit until you give us the transaction hash. This reminder disappears in {hoursLeft}h.</p>
      </div>
      <ButtonLink href="/deposit#claim" size="md">
        Submit claim
      </ButtonLink>
    </div>
  );
}

const TONE = {
  info: { cls: "border-primary/20 bg-primary-soft/60 text-primary-deep", icon: Info },
  warning: { cls: "border-warning/30 bg-warning/[0.08] text-[#92400e]", icon: AlertTriangle },
  success: { cls: "border-success/25 bg-success/[0.07] text-success", icon: PartyPopper },
};

export function Banners({ items }: { items: Announcement[] }) {
  return (
    <>
      {items.map((b) => {
        const t = TONE[b.tone] ?? TONE.info;
        return (
          <div key={b.id} className={cn("mb-4 flex animate-rise items-start gap-3 rounded-2xl border px-4 py-3", t.cls)}>
            <t.icon className="mt-0.5 size-4.5 shrink-0" />
            <p className="flex-1 text-sm">
              <span className="font-semibold">{b.title}</span> <span className="opacity-80">{b.body}</span>
            </p>
          </div>
        );
      })}
    </>
  );
}

export function AnnouncementList({ items }: { items: Announcement[] }) {
  if (!items.length) return <p className="px-5 pb-5 text-sm text-text-muted">No announcements right now.</p>;
  return (
    <ul className="space-y-3 px-5 pb-5">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3 rounded-xl bg-surface-alt p-3">
          <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">{a.title}</p>
            <p className="text-[13px] text-text-muted">{a.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
