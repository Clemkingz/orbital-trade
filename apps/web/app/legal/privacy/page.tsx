import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { BRAND } from "@orbit/ui/lib/config";

export const metadata: Metadata = { title: "Privacy Policy", description: `How ${BRAND.name} handles ID documents, location and session data.` };

export default function Page() {
  return (
    <LegalPage title="Privacy Policy" updated="12 Nov 2026">
      <p>This policy explains how {BRAND.name} handles your data under the Nigeria Data Protection Act 2023. Final legal copy will replace this draft before launch.</p>
      <h2>ID documents</h2>
      <p>ID images and selfies are encrypted at rest, visible only to KYC reviewers, and every view is logged. We delete them on request after the legal retention period.</p>
      <h2>Location and live sessions</h2>
      <p>We estimate your country, region and city from your IP address. We never ask for GPS location. IP addresses are hashed, and raw IPs are deleted after 90 days.</p>
      <h2>Your rights</h2>
      <p>You can request a copy or deletion of your data, subject to anti-money-laundering record-keeping rules.</p>
    </LegalPage>
  );
}
