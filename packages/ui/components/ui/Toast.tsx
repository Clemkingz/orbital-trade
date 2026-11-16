"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { cn } from "../../lib/cn";

type Tone = "success" | "error" | "info" | "warning" | "loading";

interface ToastItem {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
  duration: number;
  leaving?: boolean;
}

type Listener = (items: ToastItem[]) => void;
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l(items));

function push(tone: Tone, title: string, opts: { description?: string; duration?: number } = {}) {
  const id = nextId++;
  items = [...items.slice(-3), { id, tone, title, description: opts.description, duration: opts.duration ?? (tone === "loading" ? 0 : 4500) }];
  emit();
  return id;
}

function dismiss(id: number) {
  items = items.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 250);
}

function update(id: number, tone: Tone, title: string, description?: string) {
  items = items.map((t) => (t.id === id ? { ...t, tone, title, description, duration: 4500 } : t));
  emit();
}

/** Imperative toast API — call from anywhere on the client. */
export const toast = {
  success: (title: string, o?: { description?: string; duration?: number }) => push("success", title, o),
  error: (title: string, o?: { description?: string; duration?: number }) => push("error", title, o),
  info: (title: string, o?: { description?: string; duration?: number }) => push("info", title, o),
  warning: (title: string, o?: { description?: string; duration?: number }) => push("warning", title, o),
  loading: (title: string, o?: { description?: string }) => push("loading", title, o),
  /** Shows a loading toast, then resolves it to success/error. */
  async promise<T>(p: Promise<T>, msg: { loading: string; success: string | ((v: T) => string); error: string | ((e: unknown) => string) }) {
    const id = push("loading", msg.loading);
    try {
      const v = await p;
      update(id, "success", typeof msg.success === "function" ? msg.success(v) : msg.success);
      return v;
    } catch (e) {
      update(id, "error", typeof msg.error === "function" ? msg.error(e) : msg.error);
      throw e;
    }
  },
  dismiss,
};

const ICONS: Record<Tone, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 text-success" />,
  error: <XCircle className="size-5 text-danger" />,
  info: <Info className="size-5 text-primary" />,
  warning: <AlertTriangle className="size-5 text-warning" />,
  loading: <Loader2 className="size-5 animate-spin text-primary" />,
};

const BAR: Record<Tone, string> = {
  success: "bg-success",
  error: "bg-danger",
  info: "bg-primary",
  warning: "bg-warning",
  loading: "bg-primary",
};

function ToastCard({ t }: { t: ToastItem }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(t.duration);
  const started = useRef(Date.now());

  useEffect(() => {
    if (!t.duration || paused || t.leaving) return;
    started.current = Date.now();
    const timer = setTimeout(() => dismiss(t.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started.current;
    };
  }, [t.duration, t.id, paused, t.leaving, t.tone]);

  return (
    <div
      role={t.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "pointer-events-auto relative w-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-4 pr-10 shadow-[0_18px_50px_-12px_rgba(13,0,32,0.35)]",
        t.leaving ? "animate-toast-out" : "animate-toast-in",
      )}
    >
      <div className="flex gap-3">
        <span className="mt-px shrink-0">{ICONS[t.tone]}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">{t.title}</p>
          {t.description && <p className="mt-0.5 text-[13px] leading-relaxed text-text-muted">{t.description}</p>}
        </div>
      </div>
      <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="absolute right-2.5 top-2.5 rounded-md p-1 text-text-muted transition hover:bg-muted hover:text-text">
        <X className="size-4" />
      </button>
      {t.duration > 0 && (
        <span
          key={t.tone}
          className={cn("absolute bottom-0 left-0 h-[3px] origin-left", BAR[t.tone])}
          style={{ width: "100%", animation: `toast-bar ${t.duration}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
        />
      )}
    </div>
  );
}

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);
  if (!mounted) return null;
  return createPortal(
    <>
      <style>{`@keyframes toast-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}`}</style>
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-0 sm:w-[400px] sm:items-end sm:p-6">
        {list.map((t) => (
          <ToastCard key={t.id} t={t} />
        ))}
      </div>
    </>,
    document.body,
  );
}
