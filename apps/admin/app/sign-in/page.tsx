import type { Metadata } from "next";
import { AdminSignIn } from "@/components/AdminAuth";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return <AdminSignIn />;
}
