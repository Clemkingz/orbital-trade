"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing, Check, MonitorSmartphone } from "lucide-react";
import { toast } from "@orbit/ui/components/ui/Toast";
import { useApi } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";
import type { Visitor } from "@orbit/ui/lib/types";

const PREF_KEY = "orbit-admin-visitor-alerts";
type Prefs = { inApp: boolean; desktop: boolean };

function readPrefs(): Prefs {
  try {
    return { inApp: true, desktop: false, ...JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}") };
  } catch {
    return { inApp: true, desktop: false };
  }
}

function describe(v: Visitor) {
  const who = v.userName ?? "Anonymous visitor";
  return { title: `${who} is on the site`, body: `${v.page} · ${v.city}, ${v.country} · ${v.device}, ${v.browser}` };
}

/**
 * FR-9 — pops up a notification in the console whenever someone starts visiting the user site.
 * In-app toasts are on by default; desktop notifications are opt-in (browser permission).
 * Checks the live-visitor list every 5 s.
 */
export function VisitorAlerts() {
  const router = useRouter();
  const { data } = useApi<Visitor[]>("/admin/visitors", { refreshInterval: 5000 });
  const seen = useRef<Set<string> | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({ inApp: true, desktop: false });
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => setPrefs(readPrefs()), []);

  function save(next: Prefs) {
    setPrefs(next);
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  // Detect new sessions. The first load only records who is already here.
  useEffect(() => {
    if (!data) return;
    if (!seen.current) {
      seen.current = new Set(data.map((v) => v.sessionId));
      return;
    }
    for (const v of data) {
      if (seen.current.has(v.sessionId)) continue;
      seen.current.add(v.sessionId);
      const { title, body } = describe(v);
      if (prefs.inApp) toast.info(title, { description: body, duration: 7000 });
      if (prefs.desktop && typeof Notification !== "undefined" && Notification.permission === "granted") {
        const n = new Notification(title, { body, tag: v.sessionId, icon: "/admin/icon.svg" });
        n.onclick = () => {
          window.focus();
          router.push("/live-visitors");
          n.close();
        };
      }
    }
  }, [data, prefs, router]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !menu.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function toggleDesktop() {
    if (prefs.desktop) return save({ ...prefs, desktop: false });
    if (typeof Notification === "undefined") return toast.error("This browser doesn't support desktop notifications");
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") return toast.warning("Notifications are blocked", { description: "Allow notifications for this site in your browser settings, then try again." });
    save({ ...prefs, desktop: true });
    new Notification("Visitor alerts are on", { body: "You'll get a notification when someone visits the site.", icon: "/admin/icon.svg" });
  }

  const live = data?.length ?? 0;
  const anyOn = prefs.inApp || prefs.desktop;

  return (
    <div className="relative" ref={menu}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-[var(--radius-control)] p-2.5 text-text-muted transition hover:bg-muted hover:text-text"
        aria-label={`Visitor alerts (${anyOn ? "on" : "off"}), ${live} live now`}
        aria-expanded={open}
      >
        {anyOn ? <BellRing className="size-5" /> : <BellOff className="size-5" />}
        {live > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 animate-pop items-center justify-center rounded-full bg-success px-1 text-[10px] font-bold text-white">{live}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-[min(320px,calc(100vw-2rem))] animate-pop overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-2xl">
          <p className="px-3 pb-1 pt-2 text-sm font-semibold">Visitor alerts</p>
          <p className="px-3 pb-2 text-xs text-text-muted">{live} {live === 1 ? "person is" : "people are"} on the site now.</p>
          {[
            { key: "inApp" as const, icon: Bell, label: "Pop-up in the console", sub: "Shows while this tab is open", onClick: () => save({ ...prefs, inApp: !prefs.inApp }) },
            { key: "desktop" as const, icon: MonitorSmartphone, label: "Desktop notifications", sub: "Even when this tab is in the background", onClick: toggleDesktop },
          ].map((o) => (
            <button key={o.key} onClick={o.onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-alt">
              <o.icon className="size-4 text-text-muted" />
              <span className="flex-1">
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-xs text-text-muted">{o.sub}</span>
              </span>
              <span className={cn("flex size-5 items-center justify-center rounded-md border transition", prefs[o.key] ? "border-primary bg-primary text-white" : "border-border")}>
                {prefs[o.key] && <Check className="size-3.5" />}
              </span>
            </button>
          ))}
          <button onClick={() => { setOpen(false); router.push("/live-visitors"); }} className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-primary-soft">
            Open live visitors →
          </button>
        </div>
      )}
    </div>
  );
}
