import type { Metadata } from "next";
import { BuyPlatformsAdmin } from "@/components/ContentAdmin";

export const metadata: Metadata = { title: "Buy platforms" };

export default function Page() {
  return <BuyPlatformsAdmin />;
}
