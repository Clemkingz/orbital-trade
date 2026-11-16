import type { Metadata } from "next";
import { TraderDirectory } from "@/components/traders/TraderViews";

export const metadata: Metadata = { title: "Traders" };

export default function Page() {
  return <TraderDirectory />;
}
