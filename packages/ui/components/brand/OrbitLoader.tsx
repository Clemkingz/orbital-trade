import { BRAND } from "../../lib/config";
import { cn } from "../../lib/cn";
import { LogoMark } from "./Logo";

/** Animated mark: the logo core with satellites circling it. */
export function OrbitMark({ size = 88, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }} aria-hidden="true">
      <div className="absolute inset-0 animate-glow rounded-full bg-primary/30 blur-xl" />
      <div className="absolute inset-0 animate-orbit-fast">
        <svg viewBox="0 0 100 100" className="size-full">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#5501ff" strokeOpacity="0.18" strokeWidth="2" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#5501ff" strokeWidth="3" strokeLinecap="round" strokeDasharray="280" className="animate-dash" />
          <circle cx="94" cy="50" r="5" fill="#00ffbb" />
        </svg>
      </div>
      <div className="absolute inset-[18%] animate-orbit-reverse" style={{ animationDuration: "3.2s" }}>
        <svg viewBox="0 0 100 100" className="size-full">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#ff00a6" strokeOpacity="0.3" strokeDasharray="2 6" />
          <circle cx="4" cy="50" r="5" fill="#ff00a6" />
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <LogoMark size={size * 0.38} />
      </div>
    </div>
  );
}

/** Full-screen branded loading state, used by route-level loading.tsx files. */
export function OrbitLoader({ label = "Loading", sub = "Syncing markets and your account…", dark }: { label?: string; sub?: string; dark?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10", dark ? "bg-night text-white" : "bg-surface-alt")}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-24 -top-24 size-80 animate-glow rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-80 animate-glow rounded-full bg-magenta/10 blur-3xl" style={{ animationDelay: "-3s" }} />
      </div>
      <div className={cn("relative z-10 flex w-full max-w-sm animate-rise flex-col items-center rounded-[28px] border p-10 text-center shadow-xl backdrop-blur-sm", dark ? "border-white/10 bg-white/5" : "border-border bg-surface/90 shadow-black/5")}>
        <OrbitMark />
        <h1 className="mt-7 text-xl font-bold">{label}</h1>
        <p className={cn("mt-1.5 text-sm", dark ? "text-white/60" : "text-text-muted")}>{sub}</p>
        <div className={cn("mt-6 h-1 w-40 overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-muted")}>
          <div className="h-full w-1/3 animate-progress rounded-full bg-gradient-to-r from-primary via-sidebar-ring to-cyan" />
        </div>
        <span className="sr-only">{BRAND.name} is loading</span>
      </div>
    </div>
  );
}

/** Thin top progress bar for in-page transitions. */
export function TopProgress() {
  return (
    <div className="fixed inset-x-0 top-0 z-[90] h-0.5 overflow-hidden bg-primary/10" aria-hidden="true">
      <div className="h-full w-1/3 animate-progress bg-gradient-to-r from-primary via-sidebar-ring to-cyan" />
    </div>
  );
}
