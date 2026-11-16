import type { Metadata } from "next";
import { UsersAdmin } from "@/components/MoneyAdmin";

export const metadata: Metadata = { title: "Users" };

export default function Page() {
  return <UsersAdmin />;
}
