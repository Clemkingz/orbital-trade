"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, FileText, Fingerprint, Globe2, Inbox, RotateCcw, ScrollText, ShieldCheck, UserPlus, Wallet, XCircle } from "lucide-react";
import { Button } from "@orbit/ui/components/ui/Button";
import { TextArea } from "@orbit/ui/components/ui/Field";
import { Modal } from "@orbit/ui/components/ui/Modal";
import { PageHeader } from "@orbit/ui/components/ui/PageHeader";
import { toast } from "@orbit/ui/components/ui/Toast";
import { Badge, Card, CardHeader, EmptyState, LiveDot, Skeleton } from "@orbit/ui/components/ui/misc";
import { api, errorMessage, refresh, useApi } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";
import { fmtDateTime, timeAgo } from "@orbit/ui/lib/format";
import type { KycQueueItem } from "@orbit/ui/lib/types";
import { useOverview } from "@/lib/data";

const ID_LABEL = { PASSPORT: "Passport", NATIONAL_ID: "National ID (NIN)", DRIVERS_LICENCE: "Driver's licence", VOTERS_CARD: "Voter's card" } as const;

/* ── Overview ────────────────────────────────────────────────── */
export function AdminOverview() {
  const { data } = useOverview();
  if (!data) return <Skeleton className="h-96" />;
  const oldestH = data.oldestKycAt ? (Date.now() - new Date(data.oldestKycAt).getTime()) / 3_600_000 : 0;

  const CARDS = [
    { label: "KYC pending review", value: data.kyc, sub: data.kyc ? `Oldest waiting ${oldestH.toFixed(1)}h (target < 4h)` : "Queue clear", icon: Fingerprint, href: "/kyc", warn: oldestH > 4 },
    { label: "New users this week", value: data.newUsers, sub: "Sign-ups in the last 7 days", icon: UserPlus, href: "/users", warn: false },
    { label: "Deposit claims to match", value: data.claims, sub: "Match by tx hash + amount", icon: Wallet, href: "/wallets", warn: false },
    { label: "Awaiting second approval", value: data.adjustments + data.withdrawals, sub: `${data.adjustments} adjustments · ${data.withdrawals} withdrawals`, icon: ShieldCheck, href: "/users", warn: data.adjustments + data.withdrawals > 0 },
    { label: "Admins awaiting approval", value: data.pendingAdmins, sub: "Super admin approves", icon: ShieldCheck, href: "/admins", warn: data.pendingAdmins > 0 },
    { label: "Live visitors", value: data.liveVisitors, sub: "Heartbeat every 15 s", icon: Globe2, href: "/live-visitors", warn: false, live: true },
  ];

  return (
    <>
      <PageHeader title="Overview" subtitle="What needs attention right now." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((c, i) => (
          <Link key={c.label} href={c.href} className="group animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
            <Card className="h-full p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-[0_14px_30px_-16px_rgba(85,1,255,0.35)]">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><c.icon className="size-5" /></span>
                {c.live ? <LiveDot color="bg-success" /> : <ArrowRight className="size-4 text-text-muted transition group-hover:translate-x-1 group-hover:text-primary" />}
              </div>
              <p className="tabular mt-4 text-3xl font-bold">{c.value}</p>
              <p className="text-sm font-medium">{c.label}</p>
              <p className={cn("mt-1 text-xs", c.warn ? "text-warning" : "text-text-muted")}>{c.sub}</p>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="mt-5 animate-rise" style={{ animationDelay: "300ms" }}>
        <CardHeader title="Recent admin activity" action={<Link href="/audit-log" className="text-xs font-semibold text-primary hover:underline">Full audit log</Link>} />
        {data.audit.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-text-muted">No admin activity yet.</p>
        ) : (
          <ul className="divide-y divide-border px-5 pb-2 pt-3">
            {data.audit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                <ScrollText className="size-4 text-text-muted" />
                <span className="font-medium">{a.actorName}</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{a.action}</code>
                <span className="min-w-0 flex-1 truncate text-text-muted">{a.target}</span>
                <span className="text-xs text-text-muted" suppressHydrationWarning>{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/* ── Document viewer: the files the user uploaded (every view is audit-logged) ── */
function Doc({ label, file, onView }: { label: string; file: { name?: string; mime: string; url?: string | null } | null; onView: () => void }) {
  if (!file) return null;
  return (
    <figure>
      <div className="relative flex aspect-[1.4] items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-alt">
        {file.url ? (
          <a href={file.url} target="_blank" rel="noreferrer" onClick={onView} className="block size-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.url} alt={label} onLoad={onView} className="size-full object-contain transition-transform duration-300 hover:scale-105" />
          </a>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-xs text-text-muted">
            <FileText className="size-8" />
            {file.name ?? "Document"} ({file.mime.split("/")[1]?.toUpperCase()})
          </div>
        )}
        <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-night/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">View logged</span>
      </div>
      <figcaption className="mt-1.5 text-xs text-text-muted">{label}</figcaption>
    </figure>
  );
}

/* ── KYC queue (FR-8.1) ──────────────────────────────────────── */
export function KycQueue() {
  const { data: queue, error } = useApi<KycQueueItem[]>("/admin/kyc", { refreshInterval: 15_000 });
  const [selected, setSelected] = useState<KycQueueItem | null>(null);
  const [mode, setMode] = useState<"view" | "REJECTED" | "RESUBMISSION_REQUESTED">("view");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [logged, setLogged] = useState<Set<string>>(new Set());

  function logView(kind: string) {
    if (!selected || logged.has(selected.id + kind)) return;
    setLogged((s) => new Set(s).add(selected.id + kind));
    api(`/admin/kyc/${selected.id}/view`, { json: { kind } }).catch(() => undefined);
  }

  async function decide(decision: "APPROVED" | "REJECTED" | "RESUBMISSION_REQUESTED") {
    if (!selected) return;
    if (decision !== "APPROVED" && reason.trim().length < 5) return toast.error("A reason is required", { description: "The user sees this reason, so make it specific." });
    setBusy(decision);
    try {
      await api(`/admin/kyc/${selected.id}/decision`, { json: { decision, reason: decision === "APPROVED" ? undefined : reason.trim() } });
      await refresh("/admin");
      toast.success(decision === "APPROVED" ? `${selected.user.firstName} ${selected.user.lastName} approved` : decision === "REJECTED" ? "Submission rejected" : "Resubmission requested", {
        description: decision === "APPROVED" ? "Their dashboard is unlocked now." : "The user has been notified.",
      });
      setSelected(null);
      setMode("view");
      setReason("");
    } catch (e) {
      toast.error("Couldn't save the decision", { description: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="KYC queue" subtitle="New users appear here after they upload their ID. Approving them unlocks deposits, copy trading and withdrawals." />
      <Card className="animate-rise overflow-hidden">
        {error ? (
          <EmptyState icon={<Inbox className="size-5" />} title="Couldn't load the queue" body={error.message} />
        ) : !queue ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : queue.length === 0 ? (
          <EmptyState icon={<Inbox className="size-5" />} title="Queue is clear" body="New submissions appear here as soon as users upload their ID." />
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Document</th>
                  <th className="px-3 py-3 font-medium">Country</th>
                  <th className="px-3 py-3 font-medium">Waiting</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {queue.map((k, i) => {
                  const hrs = (Date.now() - new Date(k.createdAt).getTime()) / 3_600_000;
                  return (
                    <tr key={k.id} className="animate-fade transition-colors hover:bg-surface-alt" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{k.user.firstName} {k.user.lastName}</p>
                        <p className="text-xs text-text-muted">{k.user.email}</p>
                      </td>
                      <td className="px-3 py-3">{ID_LABEL[k.idType]}</td>
                      <td className="px-3 py-3">{k.user.country ?? "—"}</td>
                      <td className={cn("tabular px-3 py-3", hrs > 4 ? "font-semibold text-warning" : "text-text-muted")} suppressHydrationWarning>{timeAgo(k.createdAt).replace(" ago", "")}</td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="secondary" icon={<Eye className="size-4" />} onClick={() => setSelected(k)}>Review</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setMode("view");
            setReason("");
          }
        }}
        size="xl"
        title={selected ? `Review: ${selected.user.firstName} ${selected.user.lastName}` : ""}
        description={selected ? `${ID_LABEL[selected.idType]} · submitted ${fmtDateTime(selected.createdAt)}` : undefined}
        footer={
          mode === "view" ? (
            <>
              <Button size="md" variant="secondary" icon={<RotateCcw className="size-4" />} onClick={() => setMode("RESUBMISSION_REQUESTED")}>Request resubmission</Button>
              <Button size="md" variant="danger" icon={<XCircle className="size-4" />} onClick={() => setMode("REJECTED")}>Reject</Button>
              <Button size="md" variant="success" loading={busy === "APPROVED"} loadingText="Approving…" icon={<CheckCircle2 className="size-4" />} onClick={() => decide("APPROVED")}>Approve user</Button>
            </>
          ) : (
            <>
              <Button size="md" variant="secondary" onClick={() => setMode("view")}>Back</Button>
              <Button size="md" variant={mode === "REJECTED" ? "danger" : "primary"} loading={busy === mode} loadingText="Saving…" onClick={() => decide(mode)}>
                {mode === "REJECTED" ? "Confirm rejection" : "Send request"}
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div key={mode} className="animate-fade">
            {mode === "view" ? (
              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Doc label="ID front" file={selected.files.front} onView={() => logView("front")} />
                  <Doc label="ID back" file={selected.files.back} onView={() => logView("back")} />
                  <Doc label="Selfie (liveness)" file={selected.files.selfie} onView={() => logView("selfie")} />
                </div>
                <div className="space-y-4">
                  <dl className="divide-y divide-border rounded-xl border border-border text-sm">
                    {[
                      ["Name", `${selected.user.firstName} ${selected.user.lastName}`],
                      ["Email", selected.user.email],
                      ["Phone", selected.user.phone ?? "—"],
                      ["Country", selected.user.country ?? "—"],
                      ["Signed up", fmtDateTime(selected.user.createdAt)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 px-3 py-2.5">
                        <dt className="text-text-muted">{k}</dt>
                        <dd className="text-right font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="rounded-xl bg-surface-alt p-4 text-sm">
                    <p className="font-semibold">Vendor pre-check</p>
                    <p className="mt-1 text-text-muted">Not connected yet (Smile ID or Dojah). Compare the selfie with the ID photo yourself.</p>
                    <Badge className="mt-2">Mock data</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <TextArea
                label={mode === "REJECTED" ? "Reason for rejection (shown to the user)" : "What should the user fix? (shown to the user)"}
                placeholder={mode === "REJECTED" ? "e.g. The document has expired." : "e.g. The photo is blurry. Please upload a clearer image of the front."}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
