"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowDownToLine, Fingerprint, Globe2, LayoutDashboard, LayoutTemplate, LogOut, Menu, ScrollText, ShieldCheck, ShoppingCart, UserCog, Users, UsersRound, Wallet, X } from "lucide-react";
import { Logo } from "@orbit/ui/components/brand/Logo";
import { OrbitLoader } from "@orbit/ui/components/brand/OrbitLoader";
import { toast } from "@orbit/ui/components/ui/Toast";
import { Badge } from "@orbit/ui/components/ui/misc";
import { ThemeToggle } from "@orbit/ui/components/ui/ThemeToggle";
import { api } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";
import { useAdminMe, useOverview, type Overview } from "@/lib/data";
import { VisitorAlerts } from "./VisitorAlerts";

type CountKey = keyof Pick<Overview, "kyc" | "claims" | "adjustments" | "withdrawals" | "pendingAdmins">;

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; count?: CountKey }[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/kyc", label: "KYC queue", icon: Fingerprint, count: "kyc" },
  { href: "/users", label: "Users", icon: Users, count: "adjustments" },
  { href: "/wallets", label: "Deposits & wallet", icon: Wallet, count: "claims" },
  { href: "/withdrawals", label: "Withdrawals", icon: ArrowDownToLine, count: "withdrawals" },
  { href: "/traders", label: "Traders", icon: UserCog },
  { href: "/buy-platforms", label: "Buy platforms", icon: ShoppingCart },
  { href: "/dashboard-builder", label: "Dashboard builder", icon: LayoutTemplate },
  { href: "/live-visitors", label: "Live visitors", icon: Globe2 },
  { href: "/audit-log", label: "Audit log", icon: ScrollText },
  { href: "/admins", label: "Admins", icon: UsersRound, count: "pendingAdmins" },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { data: counts } = useOverview();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Link href="/" onClick={onNavigate}>
          <Logo variant="light" />
        </Link>
        <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin</span>
      </div>
      <nav className="scroll-thin flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {NAV.map(({ href, label, icon: Icon, count }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          const n = count && counts ? counts[count] : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn("group relative flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-all", active ? "bg-sidebar-accent text-white" : "text-sidebar-fg hover:bg-sidebar-accent/60 hover:text-white")}
            >
              {active && <span className="absolute inset-y-2 left-0 w-1 animate-fade rounded-r-full bg-primary" />}
              <Icon className={cn("size-[18px]", active ? "text-cyan" : "")} />
              {label}
              {n > 0 && <span className="ml-auto flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">{n}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 flex items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs text-sidebar-fg">
        <ShieldCheck className="size-4 shrink-0 text-cyan" />
        2FA-verified session · every action is audit-logged
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const { data, error } = useAdminMe();
  useEffect(() => setDrawer(false), [path]);
  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) router.replace("/sign-in");
  }, [error, router]);

  if (!data) {
    if (error && error.status !== 401 && error.status !== 403) return <OrbitLoader dark label="Can't reach the API" sub={error.message} />;
    return <OrbitLoader dark label="Loading console" sub="Checking your session…" />;
  }
  const me = data.user;

  async function signOut() {
    await api("/admin/auth/sign-out", { method: "POST" }).catch(() => undefined);
    toast.info("Signed out of the console");
    router.replace("/sign-in");
  }

  return (
    <div className="min-h-dvh bg-surface-alt">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <Sidebar />
      </aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-overlay bg-night/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-drawer bg-sidebar shadow-2xl">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-sidebar-fg hover:text-white" aria-label="Close menu">
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setDrawer(true)} className="-ml-1 rounded-lg p-2 lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Badge tone="primary" className="hidden sm:inline-flex">Operations console</Badge>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <VisitorAlerts />
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold">{me.firstName} {me.lastName}</p>
              <p className="text-xs text-text-muted">{me.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-night text-sm font-semibold uppercase text-white">
              {me.firstName[0]}
              {me.lastName[0]}
            </span>
            <button onClick={signOut} className="rounded-lg p-2 text-text-muted hover:bg-muted hover:text-danger" aria-label="Sign out">
              <LogOut className="size-4.5" />
            </button>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
