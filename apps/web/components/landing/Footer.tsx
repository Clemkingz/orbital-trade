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

        <div className="mt-12 rounded-2xl border border-warning/25 bg-warning/[0.06] p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="size-4" /> Risk warning
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/60">{RISK_WARNING} Purchases on third-party platforms happen under their own terms and their own identity checks.</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. {BRAND.registration}
          </p>
          <p>Made for Nigeria and the world.</p>
        </div>
      </div>
    </footer>
  );
}
