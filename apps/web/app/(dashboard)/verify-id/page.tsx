import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/AppShell";
import { KycWizard } from "@/components/dashboard/KycWizard";

export const metadata: Metadata = { title: "Verify your ID" };

export default function Page() {
  return (
    <>
      <PageHeader title="Verify your ID" subtitle="Takes about 3 minutes. Your documents are encrypted and only seen by our KYC team." />
      <KycWizard />
    </>
  );
}
