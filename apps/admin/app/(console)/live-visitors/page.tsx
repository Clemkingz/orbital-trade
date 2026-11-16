import type { Metadata } from "next";
import { LiveVisitors } from "@/components/VisitorsAdmin";

export const metadata: Metadata = { title: "Live visitors" };

export default function Page() {
  return <LiveVisitors />;
}
