import type { Metadata } from "next";
import { WithdrawalsAdmin } from "@/components/MoneyAdmin";

export const metadata: Metadata = { title: "Withdrawals" };

export default function Page() {
  return <WithdrawalsAdmin />;
}
