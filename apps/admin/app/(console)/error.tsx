"use client";

import { InlineError } from "@orbit/ui/components/site/StatusScreens";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <InlineError error={error} reset={reset} />;
}
