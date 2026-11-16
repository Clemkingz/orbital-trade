import type { Metadata } from "next";
import { AdminsAdmin } from "@/components/ContentAdmin";

export const metadata: Metadata = { title: "Admins" };

export default function Page() {
  return <AdminsAdmin />;
}
