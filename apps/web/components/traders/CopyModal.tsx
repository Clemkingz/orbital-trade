"use client";

import { useState } from "react";
import { AlertTriangle, Bitcoin, ShieldMinus } from "lucide-react";
import { Button } from "@orbit/ui/components/ui/Button";
import { Checkbox } from "@orbit/ui/components/ui/Checkbox";
import { Field } from "@orbit/ui/components/ui/Field";
import { Modal } from "@orbit/ui/components/ui/Modal";
import { toast } from "@orbit/ui/components/ui/Toast";
import { Avatar } from "@orbit/ui/components/ui/misc";
import { api, errorMessage } from "@orbit/ui/lib/api";
import { RISK_WARNING } from "@orbit/ui/lib/config";
import { fmtBtc, fmtFiat } from "@orbit/ui/lib/format";
import type { Trader } from "@orbit/ui/lib/types";
import { refreshAccount, useDashboard } from "@/lib/data";
import { initialsOf } from "./TraderCard";

/** FR-7.3 — amount, optional stop-loss, risk acknowledgement. The API checks the balance again. */
export function CopyModal({ trader, open, onOpenChange }: { trader: Trader; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: d } = useDashboard();
  const available = d?.available.btc ?? 0;
  const [amount, setAmount] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [ack, setAck] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const n = Number(amount);
  const sl = stopLoss ? Number(stopLoss) : null;
  const amountError = !touched
    ? undefined
    : !amount || isNaN(n) || n <= 0
      ? "Enter an amount in BTC."
      : n < trader.minAllocation
        ? `Minimum allocation is ${fmtBtc(trader.minAllocation, 3)}.`
        : n > available
          ? `You only have ${fmtBtc(available)} available.`
          : undefined;
  const slError = touched && sl !== null && (isNaN(sl) || sl < 1 || sl > 99) ? "Use a percentage between 1 and 99." : undefined;

  async function confirm() {
    setTouched(true);
    if (!amount || isNaN(n) || n < trader.minAllocation || n > available || slError) return;
    if (!ack) return toast.warning("Please acknowledge the risks to continue");
    setLoading(true);
    try {
      await api("/me/copies", { json: { traderId: trader.id, allocationBtc: n, stopLossPct: sl ?? undefined, acknowledgeRisk: true } });
      await refreshAccount();
      onOpenChange(false);
      setAmount("");
      setStopLoss("");
      setAck(false);
      setTouched(false);
      toast.success(`You're now copying ${trader.name}`, { description: `${fmtBtc(n, 4)} allocated. New trades are mirrored in proportion.` });
    } catch (e) {
      toast.error("Couldn't start copying", { description: errorMessage(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Copy ${trader.name}`}
      description="New trades are mirrored in proportion to your allocation."
      footer={
        <>
          <Button variant="secondary" size="md" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="md" loading={loading} loadingText="Starting copy…" onClick={confirm}>Confirm and start copying</Button>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-xl bg-surface-alt p-3">
        <Avatar name={trader.name} initials={initialsOf(trader.name)} hue={trader.hue} src={trader.photoUrl} size={44} />
        <div className="text-sm">
          <p className="font-semibold">{trader.name}</p>
          <p className="text-text-muted">Fee {trader.feePct}% of profits · Min {fmtBtc(trader.minAllocation, 3)}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <Field
          label="Allocation (BTC)"
          icon={<Bitcoin />}
          inputMode="decimal"
          placeholder="0.010"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          onBlur={() => setTouched(true)}
          error={amountError}
          hint={
            <span className="flex justify-between gap-2">
              <span>
                Available: {fmtBtc(available)}
                {d && n > 0 && ` · ≈ ${fmtFiat(n * d.btcPrice, d.currency)}`}
              </span>
              <button type="button" className="font-semibold text-primary" onClick={() => setAmount(available.toFixed(8))}>Use max</button>
            </span>
          }
        />
        <Field label="Stop-loss (% of allocation, optional)" icon={<ShieldMinus />} inputMode="decimal" placeholder="e.g. 15" value={stopLoss} onChange={(e) => setStopLoss(e.target.value.replace(/[^\d.]/g, ""))} error={slError} hint="We stop copying automatically if this allocation falls by this much." />
        <div className="rounded-xl border border-warning/30 bg-warning/[0.07] p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-[#92400e]">
            <AlertTriangle className="size-4" /> Risk warning
          </p>
          <p className="mt-1 text-text-muted">{RISK_WARNING}</p>
        </div>
        <Checkbox checked={ack} onChange={(e) => setAck(e.target.checked)} error={touched && !ack ? "Required to continue." : undefined}>
          I understand that copy trading can lose money, that past results don&apos;t predict future returns, and that I can pause or stop at any time.
        </Checkbox>
      </div>
    </Modal>
  );
}
