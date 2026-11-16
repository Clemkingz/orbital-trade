import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { RISK_WARNING } from "@orbit/ui/lib/config";

export const metadata: Metadata = { title: "Risk Disclosure" };

export default function Page() {
  return (
    <LegalPage title="Risk Disclosure" updated="12 Nov 2026">
      <p className="rounded-2xl border border-warning/30 bg-warning/[0.07] p-5 text-text">{RISK_WARNING}</p>
      <h2>Copy trading</h2>
      <p>Copied trades are mirrored in proportion to your allocation. A trader&apos;s past results, though counted from real trades, do not predict future returns.</p>
      <h2>Bitcoin volatility</h2>
      <p>The price of Bitcoin can move sharply in minutes. Only allocate what you can afford to lose.</p>
    </LegalPage>
  );
}
