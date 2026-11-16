"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownToLine, ArrowLeftRight, Bell, Fingerprint, LayoutDashboard, Lock, LogOut, Menu, PiggyBank, Settings, Users, X } from "lucide-react";
import { Logo } from "@orbit/ui/components/brand/Logo";
import { OrbitLoader } from "@orbit/ui/components/brand/OrbitLoader";
import { toast } from "@orbit/ui/components/ui/Toast";
import { KycBadge } from "@orbit/ui/components/ui/misc";
import { api } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";
import { timeAgo } from "@orbit/ui/lib/format";
import type { ApiUser, AppNotification } from "@orbit/ui/lib/types";
import { refreshAccount, useDashboard, useMe } from "@/lib/data";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, locked: false },
  { href: "/verify-id", label: "Verify ID", icon: Fingerprint, locked: false },
  { href: "/traders", label: "Traders", icon: Users, locked: false },
  { href: "/deposit", label: "Deposit", icon: PiggyBank, locked: true },
  { href: "/withdraw", label: "Withdraw", icon: ArrowDownToLine, locked: true },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight, locked: false },
  { href: "/settings", label: "Settings", icon: Settings, locked: false },
];

function SidebarContent({ user, onNavigate }: { user: ApiUser; onNavigate?: () => void }) {
  const path = usePathname();
  const verified = user.kycStatus === "APPROVED";
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/" onClick={onNavigate}>
          <Logo variant="light" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Account">
        {NAV.filter((n) => !(verified && n.href === "/verify-id")).map(({ href, label, icon: Icon, locked }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-all",
                active ? "bg-sidebar-accent text-white" : "text-sidebar-fg hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              {active && <span className="absolute inset-y-2 left-0 w-1 animate-fade rounded-r-full bg-primary" />}
              <Icon className={cn("size-[18px] transition-colors", active ? "text-cyan" : "text-sidebar-fg group-hover:text-white")} />
              {label}
              {locked && !verified && <Lock className="ml-auto size-3.5 text-sidebar-fg/60" aria-label="Locked until ID is verified" />}
              {href === "/verify-id" && !verified && <span className="ml-auto size-2 animate-ping-slow rounded-full bg-warning" />}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3 text-[11px] leading-relaxed text-sidebar-fg">
        Your balance is the sum of your ledger. Every change appears in Transactions with a reason.
      </div>
    </div>
  );
}

function Notifications({ items }: { items: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread) setTimeout(() => api("/me/notifications/read", { method: "POST" }).then(refreshAccount), 1500);
        }}
        className="relative rounded-[var(--radius-control)] p-2.5 text-text-muted transition hover:bg-muted hover:text-text"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 flex size-4 animate-pop items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-[min(360px,calc(100vw-2rem))] animate-pop overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</p>
          <ul className="scroll-thin max-h-80 divide-y divide-border overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-text-muted">You&apos;re all caught up.</li>}
            {items.map((n) => (
              <li key={n.id} className={cn("px-4 py-3", !n.read && "bg-primary-soft/40")}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-0.5 text-[13px] text-text-muted">{n.body}</p>
                <p className="mt-1 text-[11px] text-text-muted" suppressHydrationWarning>
                  {timeAgo(n.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Signed-in shell. Redirects to /sign-in when there is no session. */
export function AppShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const { data, error, isLoading } = useMe();
  const { data: dash } = useDashboard();
  useEffect(() => setDrawer(false), [path]);

  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) router.replace(`/sign-in?next=${encodeURIComponent(path)}`);
  }, [error, path, router]);

  if (isLoading || !data) {
    if (error && error.status !== 401 && error.status !== 403) {
      return <OrbitLoader label="Can't reach the server" sub={error.message} />;
    }
    return <OrbitLoader label="Loading your account" sub="Fetching your balance and dashboard…" />;
  }
  const user = data.user;

  async function signOut() {
    await api("/auth/sign-out", { method: "POST" }).catch(() => undefined);
    toast.info("Signed out");
    router.replace("/sign-in");
  }

  return (
    <div className="min-h-dvh bg-surface-alt">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent user={user} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-overlay bg-night/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-drawer bg-sidebar shadow-2xl">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-sidebar-fg hover:text-white" aria-label="Close menu">
              <X className="size-5" />
            </button>
            <SidebarContent user={user} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setDrawer(true)} className="-ml-1 rounded-lg p-2 text-text lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex">
              <KycBadge status={user.kycStatus} />
            </span>
            <Notifications items={dash?.notifications ?? []} />
            <div className="flex items-center gap-2.5 border-l border-border pl-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-deep text-sm font-semibold uppercase text-white">
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
              <div className="hidden leading-tight md:block">
                <p className="text-sm font-semibold">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-text-muted">{user.email}</p>
              </div>
              <button onClick={signOut} className="rounded-lg p-2 text-text-muted transition hover:bg-muted hover:text-danger" aria-label="Sign out">
                <LogOut className="size-4.5" />
              </button>
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export { PageHeader } from "@orbit/ui/components/ui/PageHeader";
