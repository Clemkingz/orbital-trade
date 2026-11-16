import { cn } from "../../lib/cn";

/** Orbit-style spinner: a ring with a travelling satellite. */
export function Spinner({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn("animate-orbit-fast", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="21" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}
