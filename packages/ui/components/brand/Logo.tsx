import { BRAND } from "../../lib/config";
import { cn } from "../../lib/cn";

type Props = { variant?: "dark" | "light"; className?: string; compact?: boolean };

/** Original mark: a tilted orbit ring around a core, with a satellite. */
export function LogoMark({ size = 30, light }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="ot-core" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c3aff" />
          <stop offset="1" stopColor="#3e02b7" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="7" fill="url(#ot-core)" />
      <ellipse cx="16" cy="16" rx="14" ry="6" fill="none" stroke={light ? "#ffffff" : "#5501ff"} strokeWidth="2" transform="rotate(-28 16 16)" />
      <circle cx="27.6" cy="9.8" r="2.6" fill="#00ffbb" />
    </svg>
  );
}

export function Logo({ variant = "dark", className, compact }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark light={variant === "light"} />
      {!compact && (
        <span className={cn("text-lg font-bold tracking-tight", variant === "light" ? "text-white" : "text-text")}>{BRAND.name}</span>
      )}
    </span>
  );
}
