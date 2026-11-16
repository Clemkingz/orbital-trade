import type { Metadata } from "next";
import { WalletsAdmin } from "@/components/MoneyAdmin";

export const metadata: Metadata = { title: "Deposits and wallet" };

export default function Page() {
  return <WalletsAdmin />;
}
