import type { Metadata } from "next";
import { AdminSignUp } from "@/components/AdminAuth";

export const metadata: Metadata = { title: "Request access" };

export default function Page() {
  return <AdminSignUp />;
}
