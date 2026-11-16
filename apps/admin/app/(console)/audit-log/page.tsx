import type { Metadata } from "next";
import { AuditLogAdmin } from "@/components/ContentAdmin";

export const metadata: Metadata = { title: "Audit log" };

export default function Page() {
  return <AuditLogAdmin />;
}
