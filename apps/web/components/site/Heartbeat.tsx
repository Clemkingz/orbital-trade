"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { sendHeartbeat } from "@/lib/adapters/presence";

/** FR-9.3 — every page pings presence every 15 s. The server drops a visitor after 45 s of silence. */
export function Heartbeat() {
  const path = usePathname();
  useEffect(() => {
    sendHeartbeat(path);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") sendHeartbeat(path);
    }, 15_000);
    return () => clearInterval(id);
  }, [path]);
  return null;
}
