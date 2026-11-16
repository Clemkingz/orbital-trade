/**
 * Presence adapter (FR-9). Sends a heartbeat every 15 s; a visitor stays "live" for 45 s after
 * the last one. In mock mode this is recorded in browser storage and shown in the admin console.
 */
import { api } from "@orbit/ui/lib/api";

function sessionId() {
  try {
    let id = sessionStorage.getItem("orbit-sid");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("orbit-sid", id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

export function sendHeartbeat(page: string) {
  if (process.env.NEXT_PUBLIC_ENABLE_PRESENCE === "false") return;
  api("/visitors/heartbeat", { json: { sessionId: sessionId(), page } }).catch(() => undefined);
}
