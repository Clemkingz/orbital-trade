import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { AuthHeader } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeader icon={<KeyRound className="size-6" />} title="Reset your password" subtitle="Enter the email you signed up with and we'll send you a reset link." />
      <ForgotPasswordForm />
    </>
  );
}
