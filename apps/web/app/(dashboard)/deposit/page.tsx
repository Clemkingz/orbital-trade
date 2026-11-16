import type { Metadata } from "next";
import { DepositView } from "@/components/dashboard/MoneyViews";

export const metadata: Metadata = { title: "Deposit" };

export default function Page() {
  return <DepositView />;
}
