"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "../../lib/cn";

const KEY = "orbit-theme";

/**
 * Runs in <head> before the page paints, so a dark-mode visitor never sees a white flash.
 * Uses the saved choice, else the device setting.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

function apply(dark: boolean) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.classList.toggle("dark", dark);
  window.setTimeout(() => root.classList.remove("theme-transition"), 400);
  try {
    localStorage.setItem(KEY, dark ? "dark" : "light");
  } catch {
    /* ignore */
  }
}

/** Sun/moon button that switches light and dark mode and remembers the choice. */
export function ThemeToggle({ className, onDark }: { className?: string; onDark?: boolean }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !dark;
        setDark(next);
        apply(next);
      }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cn(
        "relative flex size-10 items-center justify-center overflow-hidden rounded-[var(--radius-control)] transition",
        onDark ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-text-muted hover:bg-muted hover:text-text",
        className,
      )}
    >
      <Sun className={cn("absolute size-5 transition-all duration-300", dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
      <Moon className={cn("absolute size-5 transition-all duration-300", dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
    </button>
  );
}
