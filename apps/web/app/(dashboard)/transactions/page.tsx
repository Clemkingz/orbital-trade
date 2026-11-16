import type { Metadata } from "next";
import { TransactionsView } from "@/components/dashboard/MoneyViews";

export const metadata: Metadata = { title: "Transactions" };

export default function Page() {
  return <TransactionsView />;
}
