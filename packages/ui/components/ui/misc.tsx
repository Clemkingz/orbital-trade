"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import type { KycStatus } from "@orbit/shared";
import { cn } from "../../lib/cn";
import { toast } from "./Toast";

/* ── Card ────────────────────────────────────────────────────── */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn("rounded-[var(--radius-card)] border border-border bg-surface", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, subtitle }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Badge ───────────────────────────────────────────────────── */
type Tone = "neutral" | "primary" | "success" | "danger" | "warning" | "dark";
const tones: Record<Tone, string> = {
  neutral: "bg-muted text-text-muted",
  primary: "bg-primary-soft text-primary-deep",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/15 text-[#b45309]",
  dark: "bg-white/10 text-white",
};

export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const KYC: Record<KycStatus, { label: string; tone: Tone }> = {
  NOT_SUBMITTED: { label: "Not submitted", tone: "neutral" },
  PENDING_REVIEW: { label: "Pending review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  RESUBMISSION_REQUESTED: { label: "Resubmission requested", tone: "warning" },
};

export function KycBadge({ status }: { status: KycStatus }) {
  return (
    <Badge tone={KYC[status].tone} dot>
      {KYC[status].label}
    </Badge>
  );
}

/* ── Live dot ────────────────────────────────────────────────── */
export function LiveDot({ className, color = "bg-cyan" }: { className?: string; color?: string }) {
  return (
    <span className={cn("relative inline-flex size-2", className)} aria-hidden="true">
      <span className={cn("absolute inline-flex size-full animate-ping-slow rounded-full opacity-70", color)} />
      <span className={cn("relative inline-flex size-2 rounded-full", color)} />
    </span>
  );
}

/* ── Skeleton ────────────────────────────────────────────────── */
export function Skeleton({ className, dark, style }: { className?: string; dark?: boolean; style?: CSSProperties }) {
  return <div className={cn(dark ? "skeleton-dark" : "skeleton", className)} style={style} aria-hidden="true" />;
}

/* ── Reveal on scroll ────────────────────────────────────────── */
export function Reveal({ children, delay = 0, className, as: Tag = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} data-reveal={shown ? "shown" : "hidden"} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties} className={className}>
      {children}
    </Tag>
  );
}

/* ── Copy button ─────────────────────────────────────────────── */
export function CopyButton({ value, label = "Copy", className, dark }: { value: string; label?: string; className?: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy", { description: "Select the text and copy it manually." });
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] px-3 text-sm font-semibold transition",
        dark ? "bg-white/10 text-white hover:bg-white/20" : "bg-primary-soft text-primary-deep hover:bg-primary hover:text-white",
        className,
      )}
    >
      {copied ? <Check className="size-4 animate-pop" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}

/* ── Avatar (trader photo or generated initials) ─────────────── */
export function Avatar({ name, initials, hue = 262, src, size = 48, className }: { name: string; initials: string; hue?: number; src?: string | null; size?: number; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span
      role="img"
      aria-label={name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${hue} 90% 58%), hsl(${(hue + 40) % 360} 85% 38%))` }}
    >
      {initials}
    </span>
  );
}

/* ── Empty state ─────────────────────────────────────────────── */
export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">{icon}</span>
      <p className="font-semibold text-text">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Segmented control ───────────────────────────────────────── */
export function Segmented<T extends string>({ value, onChange, options, className, dark }: { value: T; onChange: (v: T) => void; options: readonly T[]; className?: string; dark?: boolean }) {
  return (
    <div role="tablist" className={cn("inline-flex rounded-[var(--radius-control)] p-1", dark ? "bg-white/5" : "bg-muted", className)}>
      {options.map((o) => (
        <button
          key={o}
          role="tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all",
            value === o ? (dark ? "bg-primary text-white shadow" : "bg-surface text-text shadow-sm") : dark ? "text-white/60 hover:text-white" : "text-text-muted hover:text-text",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ── Animated number (tick on change) ────────────────────────── */
export function FlashNumber({ value, children, className }: { value: number; children: ReactNode; className?: string }) {
  const prev = useRef(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (value !== prev.current) {
      setDir(value > prev.current ? "up" : "down");
      setN((x) => x + 1);
      prev.current = value;
    }
  }, [value]);
  return (
    <span key={n} className={cn("tabular rounded px-0.5 transition-colors", dir === "up" && "animate-flash-up", dir === "down" && "animate-flash-down", className)}>
      {children}
    </span>
  );
}
