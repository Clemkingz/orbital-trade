import type { Metadata } from "next";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { StatusScreen } from "@orbit/ui/components/site/StatusScreens";
import { ButtonLink } from "@orbit/ui/components/ui/Button";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="Lost in orbit"
      body="This console page doesn't exist. Check the link, or head back to the overview."
      actions={
        <>
          <ButtonLink href="/" icon={<LayoutDashboard className="size-4" />}>
            Back to overview
          </ButtonLink>
          <ButtonLink href="/sign-in" variant="outline-light" icon={<ArrowLeft className="size-4" />}>
            Sign in again
          </ButtonLink>
        </>
      }
    />
  );
}
