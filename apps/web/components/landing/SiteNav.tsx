"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@orbit/ui/components/brand/Logo";
import { ButtonLink } from "@orbit/ui/components/ui/Button";
import { ThemeToggle } from "@orbit/ui/components/ui/ThemeToggle";
import { cn } from "@orbit/ui/lib/cn";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#traders", label: "Traders" },
  { href: "#news", label: "News" },
  { href: "#faq", label: "FAQ" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled || open ? "border-b border-white/10 bg-night/85 backdrop-blur-xl" : "bg-transparent")}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8" aria-label="Main">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo variant="light" />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle onDark />
          <Link href="/sign-in" className="rounded-lg px-3 py-2 text-sm font-semibold text-white/85 transition hover:text-white">
            Sign in
          </Link>
          <ButtonLink href="/sign-up" size="sm" className="h-10 px-4">
            Get started
          </ButtonLink>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle onDark />
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-white md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
        </div>
      </nav>

      {open && (
        <div className="h-[calc(100dvh-64px)] animate-fade border-t border-white/10 bg-night px-4 pb-8 pt-4 md:hidden">
          <ul className="space-y-1">
            {LINKS.map((l, i) => (
              <li key={l.href} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
                <a href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3.5 text-lg font-medium text-white/85 hover:bg-white/5">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-3">
            <ButtonLink href="/sign-up" fullWidth>
              Get started
            </ButtonLink>
            <ButtonLink href="/sign-in" variant="outline-light" fullWidth>
              Sign in
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
