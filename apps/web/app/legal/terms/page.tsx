import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { BRAND } from "@orbit/ui/lib/config";

export const metadata: Metadata = { title: "Terms of Service", description: `The terms that govern your use of ${BRAND.name}.` };

export default function Page() {
  return (
    <LegalPage title="Terms of Service" updated="12 Nov 2026">
      <p>These terms govern your use of {BRAND.name}. Final legal copy will replace this draft before launch.</p>
      <h2>Eligibility and verification</h2>
      <p>You must be of legal age and pass ID verification before you can deposit, copy traders or withdraw.</p>
      <h2>Balances</h2>
      <p>Your balance is the sum of the entries in your ledger. Every change, including any admin adjustment, appears in your transaction history with a reason.</p>
      <h2>Withdrawals</h2>
      <p>Verified users can withdraw their available balance at any time, subject only to the published network fee and approval threshold.</p>
      <h2>Third-party platforms</h2>
      <p>Purchases on buy platforms happen on their websites, under their terms and their own identity checks.</p>
    </LegalPage>
  );
}
