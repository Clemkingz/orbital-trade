import type { Metadata } from "next";
import { WithdrawView } from "@/components/dashboard/MoneyViews";

export const metadata: Metadata = { title: "Withdraw" };

export default function Page() {
  return <WithdrawView />;
}
