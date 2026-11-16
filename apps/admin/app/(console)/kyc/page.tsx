import type { Metadata } from "next";
import { KycQueue } from "@/components/KycAdmin";

export const metadata: Metadata = { title: "KYC queue" };

export default function Page() {
  return <KycQueue />;
}
