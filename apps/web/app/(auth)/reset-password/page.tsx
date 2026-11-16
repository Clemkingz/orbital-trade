import type { Metadata } from "next";
import { Suspense } from "react";
import { KeyRound } from "lucide-react";
import { AuthHeader } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeader icon={<KeyRound className="size-6" />} title="Choose a new password" subtitle="Your reset link is valid for 30 minutes. Use at least 10 characters." />
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
