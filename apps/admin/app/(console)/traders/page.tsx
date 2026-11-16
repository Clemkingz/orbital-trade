import type { Metadata } from "next";
import { TradersAdmin } from "@/components/TradersAdmin";

export const metadata: Metadata = { title: "Traders" };

export default function Page() {
  return <TradersAdmin />;
}
