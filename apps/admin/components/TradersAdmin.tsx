"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, ListPlus, Pencil, Plus } from "lucide-react";
import { Button } from "@orbit/ui/components/ui/Button";
import { Field, TextArea } from "@orbit/ui/components/ui/Field";
import { Modal } from "@orbit/ui/components/ui/Modal";
import { PageHeader } from "@orbit/ui/components/ui/PageHeader";
import { RiskMeter } from "@orbit/ui/components/ui/RiskMeter";
import { SelectField } from "@orbit/ui/components/ui/SelectField";
import { toast } from "@orbit/ui/components/ui/Toast";
import { Avatar, Badge, Card, Skeleton } from "@orbit/ui/components/ui/misc";
import { api, errorMessage, useApi } from "@orbit/ui/lib/api";
import { fmtBtc, fmtPct } from "@orbit/ui/lib/format";
import type { Trader } from "@orbit/ui/lib/types";

type Draft = Omit<Trader, "id" | "copiers" | "stats" | "demo"> & { id?: string };

const blank = (): Draft => ({ name: "", photoUrl: null, hue: Math.floor(Math.random() * 360), yearsExperience: 1, typicalTradeSizeBtc: 0.1, bio: "", strategy: "", riskLevel: 3, minAllocation: 0.005, feePct: 15, active: true });
const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
/** datetime-local value with seconds, so a trade logged "just now" doesn't round back past recent copiers. */
const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);

/** Square-crops an uploaded photo to 256×256 (FR-8.3: JPG/PNG, max 5 MB). */
async function cropSquare(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const s = Math.min(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  canvas.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Decimal input that keeps the text as typed ("0.", "0.0", "0.35") instead of re-formatting
 * on every keystroke. Accepts digits and one ".", caps decimal places, reports the number.
 */
function DecimalField({ label, value, onValue, decimals, suffix, hint, error }: { label: string; value: number; onValue: (n: number) => void; decimals: number; suffix?: string; hint?: string; error?: string }) {
  const [text, setText] = useState(() => (value ? String(value) : ""));
  // Pick up a new value from outside (e.g. opening a different trader) without fighting the user's typing.
  useEffect(() => {
    if (Number(text) !== value) setText(value ? String(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <Field
      label={label}
      inputMode="decimal"
      placeholder={decimals >= 8 ? "0.00000000" : "0.00"}
      value={text}
      error={error}
      hint={hint}
      trailing={suffix ? <span className="pr-2 text-xs font-semibold text-text-muted">{suffix}</span> : undefined}
      onChange={(e) => {
        let v = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
        const dot = v.indexOf(".");
        if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, "").slice(0, decimals);
        if (v.startsWith(".")) v = "0" + v;
        setText(v);
        onValue(v === "" || v === "0." ? 0 : Number(v));
      }}
      onBlur={() => text.endsWith(".") && setText(text.slice(0, -1))}
    />
  );
}

export function TradersAdmin() {
  const { data: list, mutate } = useApi<Trader[]>("/admin/traders");
  const [edit, setEdit] = useState<Draft | null>(null);
  const [logFor, setLogFor] = useState<Trader | null>(null);
  const [trade, setTrade] = useState({ side: "BUY", entry: "", exit: "", size: "", opened: "", closed: "" });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPhoto(f?: File) {
    if (!f || !edit) return;
    if (!["image/jpeg", "image/png"].includes(f.type)) return toast.error("Use a JPG or PNG photo");
    if (f.size > 5 * 1024 * 1024) return toast.error("Photo must be 5 MB or smaller");
    setEdit({ ...edit, photoUrl: await cropSquare(f) });
    toast.success("Photo cropped to square");
  }

  async function save() {
    if (!edit) return;
    if (!edit.name.trim() || !edit.bio.trim() || !edit.strategy.trim()) return toast.error("Name, bio and strategy are required");
    if (!(edit.typicalTradeSizeBtc > 0)) return toast.error("Typical trade size must be more than 0 BTC", { description: "Use a decimal, e.g. 0.35" });
    if (!(edit.minAllocation > 0)) return toast.error("Minimum allocation must be more than 0 BTC", { description: "Use a decimal, e.g. 0.005" });
    if (edit.feePct < 0 || edit.feePct > 50) return toast.error("Fee must be between 0 and 50%");
    setSaving(true);
    try {
      const { id, ...body } = edit;
      await api(id ? `/admin/traders/${id}` : "/admin/traders", { method: id ? "PUT" : "POST", json: body });
      await mutate();
      setEdit(null);
      toast.success("Trader saved");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function openLog(t: Trader) {
    const now = new Date();
    setTrade({ side: "BUY", entry: "", exit: "", size: String(t.typicalTradeSizeBtc), opened: localInput(new Date(now.getTime() - 30_000)), closed: localInput(now) });
    setLogFor(t);
  }

  async function logTrade() {
    if (!logFor) return;
    const entry = Number(trade.entry), exit = Number(trade.exit), size = Number(trade.size);
    if (!entry || !exit || !size || !trade.opened || !trade.closed) return toast.error("Fill in every field");
    setSaving(true);
    try {
      const r = await api<{ mirroredTo: number }>(`/admin/traders/${logFor.id}/trades`, { json: { side: trade.side, entry, exit, size, openedAt: new Date(trade.opened).toISOString(), closedAt: new Date(trade.closed).toISOString() } });
      await mutate();
      setLogFor(null);
      toast.success("Trade logged", {
        description: r.mirroredTo ? `Profit or loss posted to ${r.mirroredTo} copier${r.mirroredTo === 1 ? "" : "s"}, converted to BTC at the exit price.` : "No one was copying this trader when the trade opened, so no balances changed.",
      });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const pct = Number(trade.entry) > 0 && Number(trade.exit) > 0 ? ((Number(trade.exit) - Number(trade.entry)) / Number(trade.entry)) * 100 * (trade.side === "BUY" ? 1 : -1) : null;

  return (
    <>
      <PageHeader title="Traders" subtitle="Edit profiles and log closed trades. Stats and copier profits are calculated from trades. There are no fields for typing in results." action={<Button size="md" icon={<Plus className="size-4" />} onClick={() => setEdit(blank())}>New trader</Button>} />
      {!list ? (
        <Skeleton className="h-80" />
      ) : (
        <Card className="animate-rise overflow-hidden">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Trader</th>
                  <th className="px-3 py-3 font-medium">Risk</th>
                  <th className="px-3 py-3 font-medium">W / L</th>
                  <th className="px-3 py-3 font-medium">Win rate</th>
                  <th className="px-3 py-3 font-medium">30d</th>
                  <th className="px-3 py-3 font-medium">Copiers</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="tabular divide-y divide-border">
                {list.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-surface-alt">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} initials={initials(t.name)} hue={t.hue} src={t.photoUrl} size={36} />
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-text-muted">{t.yearsExperience} yrs · fee {t.feePct}% {t.demo && "· demo"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><RiskMeter level={t.riskLevel} /></td>
                    <td className="px-3 py-3"><span className="text-success">{t.stats.wins}</span> / <span className="text-danger">{t.stats.losses}</span></td>
                    <td className="px-3 py-3">{t.stats.winRate.toFixed(0)}%</td>
                    <td className={t.stats.return30 >= 0 ? "px-3 py-3 text-success" : "px-3 py-3 text-danger"}>{fmtPct(t.stats.return30, 1)}</td>
                    <td className="px-3 py-3">{t.copiers}</td>
                    <td className="px-3 py-3"><Badge tone={t.active ? "success" : "neutral"} dot>{t.active ? "Active" : "Inactive"}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" icon={<ListPlus className="size-3.5" />} onClick={() => openLog(t)}>Log trade</Button>
                        <Button size="sm" variant="secondary" icon={<Pencil className="size-3.5" />} onClick={() => setEdit({ ...t })}>Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        size="lg"
        title={edit?.id ? `Edit ${edit.name}` : "New trader"}
        description="There are no fields for wins, losses or returns. Those come from logged trades."
        footer={
          <>
            {edit && <Button size="md" variant="secondary" onClick={() => setEdit({ ...edit, active: !edit.active })}>{edit.active ? "Deactivate" : "Activate"}</Button>}
            <Button size="md" loading={saving} loadingText="Saving…" onClick={save}>Save trader</Button>
          </>
        }
      >
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 sm:col-span-2">
              <Avatar name={edit.name || "New"} initials={initials(edit.name)} hue={edit.hue} src={edit.photoUrl} size={72} />
              <div>
                <Button size="sm" variant="secondary" icon={<ImagePlus className="size-4" />} onClick={() => fileRef.current?.click()}>Upload photo</Button>
                <p className="mt-1 text-xs text-text-muted">JPG/PNG, max 5 MB, cropped square</p>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
              </div>
            </div>
            <Field label="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <Field label="Years of experience" type="number" min={0} value={edit.yearsExperience} onChange={(e) => setEdit({ ...edit, yearsExperience: Number(e.target.value) })} />
            <DecimalField key={`size-${edit.id ?? "new"}`} label="Typical trade size (BTC)" decimals={8} suffix="BTC" value={edit.typicalTradeSizeBtc} onValue={(n) => setEdit((d) => d && { ...d, typicalTradeSizeBtc: n })} hint="e.g. 0.35" />
            <DecimalField key={`min-${edit.id ?? "new"}`} label="Minimum allocation (BTC)" decimals={8} suffix="BTC" value={edit.minAllocation} onValue={(n) => setEdit((d) => d && { ...d, minAllocation: n })} hint="e.g. 0.005" />
            <SelectField label="Risk level" value={String(edit.riskLevel)} onChange={(e) => setEdit({ ...edit, riskLevel: Number(e.target.value) })} options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} – ${["Very low", "Low", "Medium", "High", "Very high"][n - 1]}` }))} />
            <DecimalField key={`fee-${edit.id ?? "new"}`} label="Fee (% of profits)" decimals={2} suffix="%" value={edit.feePct} onValue={(n) => setEdit((d) => d && { ...d, feePct: n })} hint="e.g. 12.5" />
            <TextArea className="sm:col-span-2" label="Strategy" value={edit.strategy} onChange={(e) => setEdit({ ...edit, strategy: e.target.value })} />
            <TextArea className="sm:col-span-2" label="Bio" value={edit.bio} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!logFor}
        onOpenChange={(o) => !o && setLogFor(null)}
        title={`Log a closed trade · ${logFor?.name ?? ""}`}
        description="Copiers who were active when the trade opened get their share of the profit or loss, converted to BTC and posted to their ledger."
        footer={<Button size="md" loading={saving} loadingText="Logging…" onClick={logTrade}>Log trade</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Side" value={trade.side} onChange={(e) => setTrade({ ...trade, side: e.target.value })} options={[{ value: "BUY", label: "Buy (long)" }, { value: "SELL", label: "Sell (short)" }]} />
          <Field label="Size (BTC)" inputMode="decimal" value={trade.size} onChange={(e) => setTrade({ ...trade, size: e.target.value.replace(",", ".").replace(/[^\d.]/g, "") })} hint={logFor ? `Typical: ${fmtBtc(logFor.typicalTradeSizeBtc, 2)}` : undefined} />
          <Field label="Entry price (USD)" inputMode="decimal" placeholder="96000" value={trade.entry} onChange={(e) => setTrade({ ...trade, entry: e.target.value })} />
          <Field label="Exit price (USD)" inputMode="decimal" placeholder="97200" value={trade.exit} onChange={(e) => setTrade({ ...trade, exit: e.target.value })} hint={pct != null ? <span className={pct >= 0 ? "text-success" : "text-danger"}>{fmtPct(pct)} {pct >= 0 ? "win" : "loss"}</span> : undefined} />
          <Field label="Opened" type="datetime-local" step={1} value={trade.opened} onChange={(e) => setTrade({ ...trade, opened: e.target.value })} />
          <Field label="Closed" type="datetime-local" step={1} value={trade.closed} onChange={(e) => setTrade({ ...trade, closed: e.target.value })} />
        </div>
      </Modal>
    </>
  );
}
