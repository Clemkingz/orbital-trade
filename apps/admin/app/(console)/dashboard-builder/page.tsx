import type { Metadata } from "next";
import { DashboardBuilder } from "@/components/ContentAdmin";

export const metadata: Metadata = { title: "Dashboard builder" };

export default function Page() {
  return <DashboardBuilder />;
}
