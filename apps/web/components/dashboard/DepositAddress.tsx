"use client";

import { QRCodeSVG } from "qrcode.react";
import { ShieldAlert } from "lucide-react";
import { CopyButton, Skeleton } from "@orbit/ui/components/ui/misc";
import { useApi } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";

/** FR-5.1/5.2 — every verified user sees the same single admin-set address (served by the API, KYC-gated). */
export function DepositAddress({ size = 132, layout = "row" }: { size?: number; layout?: "row" | "stack" }) {
  const { data, error } = useApi<{ address: string | null }>("/me/wallet");
  if (error) return <p className="text-sm text-text-muted">{error.message}</p>;
  if (!data) return <Skeleton className="h-36 w-full" />;
  if (!data.address) return <p className="text-sm text-text-muted">The deposit address isn&apos;t set yet. Contact support.</p>;
  return (
    <div className={cn("flex gap-5", layout === "stack" ? "flex-col items-center text-center" : "flex-col items-center sm:flex-row sm:items-start")}>
      <div className="relative shrink-0 rounded-2xl border border-border bg-surface p-3 shadow-sm">
        <QRCodeSVG value={`bitcoin:${data.address}`} size={size} fgColor="#0d0020" level="M" />
        <span className="absolute left-1/2 top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white ring-4 ring-surface">₿</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">BTC deposit address · Bitcoin network</p>
        <p className="tabular mt-1.5 break-all rounded-[var(--radius-control)] bg-surface-alt px-3 py-2.5 font-mono text-[13px] font-medium text-text">{data.address}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CopyButton value={data.address} label="Copy address" />
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-text-muted">
          <ShieldAlert className="mt-px size-3.5 shrink-0 text-warning" />
          Send BTC only on the Bitcoin network. Always copy the address from this page, and submit a deposit claim after sending.
        </p>
      </div>
    </div>
  );
}
