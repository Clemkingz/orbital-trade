"use client";

import { useEffect } from "react";
import { ErrorView } from "@orbit/ui/components/site/StatusScreens";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorView error={error} reset={reset} />;
}
