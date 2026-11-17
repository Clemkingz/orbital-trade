import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Logo } from "@orbit/ui/components/brand/Logo";
import { BRAND, RISK_WARNING } from "@orbit/ui/lib/config";

const COLS = [
  { title: "Product", links: [["How it works", "/#how-it-works"], ["Traders", "/#traders"], ["Market news", "/#news"], ["Security", "/#security"]] },
  { title: "Account", links: [["Create account", "/sign-up"], ["Sign in", "/sign-in"], ["Verify ID", "/verify-id"], ["Dashboard", "/dashboard"]] },
  { title: "Legal", links: [["Terms of Service", "/legal/terms"], ["Privacy Policy", "/legal/privacy"], ["Risk Disclosure", "/legal/risk-disclosure"]] },
];

export function Footer() {
  return (
    <footer className="bg-night text-white">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-4 max-w-sm text-sm text-white/60">{BRAND.tagline} ID-verified accounts, licensed custody and a ledger you can audit.</p>
            <a href={`mailto:${BRAND.supportEmail}`} className="mt-4 inline-block text-sm font-medium text-cyan hover:underline">
              {BRAND.supportEmail}
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map((c) => (
              <div key={c.title}>
                <p className="text-sm font-semibold">{c.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-white/55 transition hover:text-white">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-12 flex items-start gap-1.5 text-[11px] leading-relaxed text-white/40">
          <AlertTriangle className="mt-px size-3 shrink-0 text-warning/70" aria-hidden="true" />
          <span>
            <span className="font-medium text-white/55">Risk warning:</span> {RISK_WARNING}{" "}
            <Link href="/legal/risk-disclosure" className="underline underline-offset-2 hover:text-white/70">
              Read more
            </Link>
          </span>
        </p>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. {BRAND.registration}
          </p>
          <p>Made for Nigeria and the world.</p>
        </div>
      </div>
    </footer>
  );
}
