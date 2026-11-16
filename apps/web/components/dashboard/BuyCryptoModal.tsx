"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUpRight, ExternalLink, ShieldAlert } from "lucide-react";
import { Button } from "@orbit/ui/components/ui/Button";
import { Modal } from "@orbit/ui/components/ui/Modal";
import { toast } from "@orbit/ui/components/ui/Toast";
import { Badge, Skeleton } from "@orbit/ui/components/ui/misc";
import { api, useApi } from "@orbit/ui/lib/api";
import type { BuyPlatform } from "@orbit/ui/lib/types";
import { refreshAccount } from "@/lib/data";
import { DepositAddress } from "./DepositAddress";

const STEPS = ["Buy BTC on the platform", "Paste your deposit address as the receiving address", "Come back and submit a deposit claim"];

/** FR-4 — redirect-only list of buy platforms, managed in the admin console. Verified users only. */
export function BuyCryptoModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: platforms } = useApi<BuyPlatform[]>(open ? "/buy-platforms" : null);
  const [leaving, setLeaving] = useState<BuyPlatform | null>(null);

  function go(p: BuyPlatform) {
    window.open(p.linkUrl, "_blank", "noopener,noreferrer");
    api("/me/buy-redirect", { method: "POST" }).then(refreshAccount).catch(() => undefined);
    toast.info(`Opened ${p.name} in a new tab`, { description: "When you've sent BTC, come back and submit a deposit claim." });
    setLeaving(null);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setLeaving(null);
      }}
      size="xl"
      title={leaving ? `Continue to ${leaving.name}?` : "Buy crypto"}
      description={leaving ? "You're about to leave for a third-party site." : "Buy BTC on a trusted platform, then send it to your deposit address."}
    >
      {leaving ? (
        <div className="mx-auto max-w-md animate-pop py-4 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl text-2xl font-bold text-white" style={{ background: leaving.color }}>
            {leaving.logoText}
          </span>
          <div className="mt-6 rounded-xl border border-warning/30 bg-warning/[0.07] p-4 text-left text-sm">
            <p className="flex items-center gap-2 font-semibold text-[#92400e]">
              <ShieldAlert className="size-4" /> Third-party purchase
            </p>
            <p className="mt-1.5 text-text-muted">
              Your purchase happens on {leaving.name}&apos;s website, under their terms and their own identity checks. We don&apos;t pass any of your data to them and we can&apos;t see or reverse transactions there.
            </p>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button variant="secondary" size="md" onClick={() => setLeaving(null)} icon={<ArrowLeft className="size-4" />}>
              Back
            </Button>
            <Button size="md" onClick={() => go(leaving)}>
              Continue to {leaving.name} <ExternalLink className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {!platforms && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
              {platforms?.map((p, i) => (
                <li key={p.id} className="animate-rise" style={{ animationDelay: `${i * 35}ms` }}>
                  <button
                    onClick={() => setLeaving(p)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_24px_-12px_rgba(85,1,255,0.35)]"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: p.color }}>
                      {p.logoText}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 font-semibold">
                        {p.name} <ArrowUpRight className="size-3.5 text-text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {p.paymentMethods.map((m) => (
                          <Badge key={m} className="px-2 text-[10px]">
                            {m}
                          </Badge>
                        ))}
                      </span>
                      <span className="mt-1 block text-[11px] text-text-muted">Opens in a new tab</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-text-muted">Availability varies by country. Each platform runs its own identity checks.</p>
          </div>
          <div className="rounded-2xl bg-surface-alt p-5">
            <ol className="space-y-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 border-t border-border pt-5">
              <DepositAddress size={120} layout="stack" />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
