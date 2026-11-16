"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "dark" | "outline-light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-[0_8px_24px_-8px_rgba(85,1,255,0.55)] hover:bg-primary-hover hover:shadow-[0_10px_28px_-8px_rgba(85,1,255,0.7)]",
  secondary: "bg-surface text-text border border-border hover:border-primary/40 hover:bg-primary-soft/40",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "bg-danger text-white hover:bg-danger/90",
  success: "bg-success text-white hover:bg-success/90",
  dark: "bg-night text-white hover:bg-sidebar-accent",
  "outline-light": "border border-white/25 text-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

const base =
  "relative inline-flex select-none items-center justify-center overflow-hidden rounded-[var(--radius-control)] font-semibold whitespace-nowrap transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

type Common = { variant?: Variant; size?: Size; fullWidth?: boolean; icon?: ReactNode };

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  Common & {
    loading?: boolean;
    loadingText?: string;
    /** Briefly shows a check after a successful action. */
    done?: boolean;
  };

/**
 * Button with built-in loader states:
 *  - `loading` swaps the label for a spinner + optional `loadingText` and blocks clicks
 *  - `done` flashes a success check
 */
export function Button({ variant = "primary", size = "lg", loading, loadingText, done, fullWidth, icon, className, children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", loading && "cursor-wait", className)}
    >
      {loading ? (
        <>
          <Spinner className={variant === "secondary" || variant === "ghost" ? "text-primary" : "text-white"} />
          <span>{loadingText ?? children}</span>
        </>
      ) : done ? (
        <span className="flex animate-pop items-center gap-2">
          <Check className="size-4" strokeWidth={3} /> Done
        </span>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "lg",
  fullWidth,
  icon,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & Common & { href: string }) {
  return (
    <Link href={href} {...rest} className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}>
      {icon}
      {children}
    </Link>
  );
}
