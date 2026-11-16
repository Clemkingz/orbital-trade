"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Download, Eye, EyeOff, Megaphone, Pencil, Plus, Rocket, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { Button } from "@orbit/ui/components/ui/Button";
import { Field, TextArea } from "@orbit/ui/components/ui/Field";
import { Modal } from "@orbit/ui/components/ui/Modal";
import { PageHeader } from "@orbit/ui/components/ui/PageHeader";
import { SelectField } from "@orbit/ui/components/ui/SelectField";
import { toast } from "@orbit/ui/components/ui/Toast";
import { Badge, Card, CardHeader, EmptyState, Segmented, Skeleton } from "@orbit/ui/components/ui/misc";
import { api, errorMessage, refresh, useApi } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";
import { downloadFile, fmtDateTime, toCsv } from "@orbit/ui/lib/format";
import type { Announcement, ApiUser, AuditEntry, BuyPlatform, TileConfig } from "@orbit/ui/lib/types";
import { useAdminMe } from "@/lib/data";

function move<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/* ── Buy platforms (FR-4.5) ──────────────────────────────────── */
export function BuyPlatformsAdmin() {
  const { data: saved, mutate } = useApi<BuyPlatform[]>("/admin/buy-platforms");
  const [draft, setDraft] = useState<BuyPlatform[] | null>(null);
  const list = draft ?? saved ?? [];
  const [edit, setEdit] = useState<BuyPlatform | null>(null);
  const [saving, setSaving] = useState(false);

  async function publish() {
    setSaving(true);
    try {
      await api("/admin/buy-platforms", { method: "PUT", json: { platforms: list } });
      await mutate();
      setDraft(null);
      toast.success("Buy platforms updated", { description: "Users see the new list right away." });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function saveEdit() {
    if (!edit) return;
    if (!edit.name.trim() || !/^https:\/\//.test(edit.linkUrl)) return toast.error("Name and an https:// link are required");
    const exists = edit.id && list.some((p) => p.id === edit.id);
    setDraft(exists ? list.map((p) => (p.id === edit.id ? edit : p)) : [...list, { ...edit, id: `new-${Date.now()}` }]);
    setEdit(null);
  }

  return (
    <>
      <PageHeader
        title="Buy platforms"
        subtitle="Redirect links shown in the Buy crypto modal. No data is passed to the platform."
        action={
          <div className="flex gap-2">
            <Button size="md" variant="secondary" icon={<Plus className="size-4" />} onClick={() => setEdit({ name: "", logoText: "", color: "#5501ff", linkUrl: "https://", paymentMethods: ["Card"], active: true })}>Add</Button>
            <Button size="md" disabled={!draft} loading={saving} loadingText="Saving…" onClick={publish}>Save changes</Button>
          </div>
        }
      />
      {!saved ? (
        <Skeleton className="h-96" />
      ) : (
        <Card className="animate-rise">
          <ul className="divide-y divide-border">
            {list.map((p, i) => (
              <li key={p.id} className={cn("flex flex-wrap items-center gap-3 px-4 py-3 transition-opacity sm:px-5", !p.active && "opacity-55")}>
                <div className="flex flex-col">
                  <button className="rounded p-0.5 text-text-muted hover:text-primary disabled:opacity-30" disabled={i === 0} onClick={() => setDraft(move(list, i, -1))} aria-label={`Move ${p.name} up`}><ArrowUp className="size-4" /></button>
                  <button className="rounded p-0.5 text-text-muted hover:text-primary disabled:opacity-30" disabled={i === list.length - 1} onClick={() => setDraft(move(list, i, 1))} aria-label={`Move ${p.name} down`}><ArrowDown className="size-4" /></button>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl font-bold text-white" style={{ background: p.color }}>{p.logoText}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="truncate text-xs text-text-muted">{p.linkUrl}</p>
                </div>
                <div className="hidden gap-1 md:flex">{p.paymentMethods.map((m) => <Badge key={m}>{m}</Badge>)}</div>
                <label className="relative inline-flex cursor-pointer items-center" title={p.active ? "Shown to users" : "Hidden"}>
                  <input type="checkbox" className="peer sr-only" checked={p.active} onChange={() => setDraft(list.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)))} aria-label={`Show ${p.name}`} />
                  <span className="h-6 w-11 rounded-full bg-border transition peer-checked:bg-primary" />
                  <span className="absolute left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                </label>
                <Button size="sm" variant="ghost" icon={<Pencil className="size-3.5" />} onClick={() => setEdit(p)}>Edit</Button>
                <button onClick={() => setDraft(list.filter((x) => x.id !== p.id))} className="rounded-lg p-2 text-text-muted hover:bg-danger/10 hover:text-danger" aria-label={`Remove ${p.name}`}><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          {draft && <p className="animate-fade border-t border-border px-5 py-3 text-sm text-warning">You have unsaved changes.</p>}
        </Card>
      )}
      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.name || "New platform"} footer={<Button size="md" onClick={saveEdit}>Done</Button>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value, logoText: edit.logoText || e.target.value.slice(0, 1).toUpperCase() })} />
            <Field label="Logo letter" maxLength={2} value={edit.logoText} onChange={(e) => setEdit({ ...edit, logoText: e.target.value })} />
            <Field className="sm:col-span-2" label="Link URL (affiliate tags allowed)" value={edit.linkUrl} onChange={(e) => setEdit({ ...edit, linkUrl: e.target.value })} />
            <Field label="Brand colour" type="color" value={edit.color} onChange={(e) => setEdit({ ...edit, color: e.target.value })} className="[&_input]:p-1" />
            <div>
              <p className="mb-1.5 text-sm font-medium">Payment methods</p>
              <div className="flex flex-wrap gap-2">
                {(["Card", "Bank transfer", "P2P"] as const).map((m) => {
                  const on = edit.paymentMethods.includes(m);
                  return (
                    <button key={m} type="button" onClick={() => setEdit({ ...edit, paymentMethods: on ? edit.paymentMethods.filter((x) => x !== m) : [...edit.paymentMethods, m] })} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", on ? "border-primary bg-primary-soft text-primary-deep" : "border-border text-text-muted")}>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ── Dashboard builder (FR-8.5) ──────────────────────────────── */
const SEGMENTS = [
  { value: "all", label: "All users" },
  { value: "unverified", label: "Unverified" },
  { value: "verified", label: "Verified" },
  { value: "copiers", label: "Copiers" },
];

interface Config {
  version: number;
  tiles: TileConfig[];
  announcements: Announcement[];
  publishedBy: string;
  publishedAt: string;
}

export function DashboardBuilder() {
  const { data: config, mutate } = useApi<Config>("/admin/dashboard-config");
  const [tiles, setTiles] = useState<TileConfig[] | null>(null);
  const [anns, setAnns] = useState<Announcement[] | null>(null);
  const [draftAnn, setDraftAnn] = useState<Announcement | null>(null);
  const [preview, setPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const t = useMemo(() => tiles ?? [...(config?.tiles ?? [])].sort((a, b) => a.order - b.order), [tiles, config]);
  const a = anns ?? config?.announcements ?? [];
  const dirty = tiles !== null || anns !== null;

  if (!config) return <Skeleton className="h-96" />;

  async function publish() {
    setPublishing(true);
    try {
      await api("/admin/dashboard-config", { json: { tiles: t.map((x, i) => ({ ...x, order: i })), announcements: a } });
      await mutate();
      setTiles(null);
      setAnns(null);
      setPreview(false);
      toast.success(`Dashboard v${config!.version + 1} published`, { description: "Users see it right away." });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Dashboard builder"
        subtitle={`Live: v${config.version}, published by ${config.publishedBy} on ${fmtDateTime(config.publishedAt)}. Tile values always come from the ledger.`}
        action={
          <div className="flex gap-2">
            <Button size="md" variant="secondary" icon={<Eye className="size-4" />} onClick={() => setPreview(true)}>Preview</Button>
            <Button size="md" icon={<Rocket className="size-4" />} disabled={!dirty} loading={publishing} loadingText="Publishing…" onClick={publish}>Publish</Button>
          </div>
        }
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="animate-rise">
          <CardHeader title="Tiles" subtitle="Show, hide, reorder and rename." />
          <ul className="space-y-2 p-5">
            {t.map((tile, i) => (
              <li key={tile.id} className={cn("flex items-center gap-2 rounded-xl border p-2.5 transition-all", tile.visible ? "border-border bg-surface" : "border-dashed border-border bg-surface-alt opacity-60")}>
                <div className="flex flex-col">
                  <button className="text-text-muted hover:text-primary disabled:opacity-30" disabled={i === 0} onClick={() => setTiles(move(t, i, -1))} aria-label="Move up"><ArrowUp className="size-4" /></button>
                  <button className="text-text-muted hover:text-primary disabled:opacity-30" disabled={i === t.length - 1} onClick={() => setTiles(move(t, i, 1))} aria-label="Move down"><ArrowDown className="size-4" /></button>
                </div>
                <input value={tile.label} onChange={(e) => setTiles(t.map((x) => (x.id === tile.id ? { ...x, label: e.target.value } : x)))} className="h-9 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-sm font-medium outline-none hover:border-border focus:border-primary focus:bg-surface" aria-label={`Label for ${tile.id}`} />
                <code className="hidden text-[11px] text-text-muted sm:block">{tile.id}</code>
                <button onClick={() => setTiles(t.map((x) => (x.id === tile.id ? { ...x, visible: !x.visible } : x)))} className="rounded-lg p-2 text-text-muted hover:bg-muted hover:text-primary" aria-label={tile.visible ? "Hide tile" : "Show tile"}>
                  {tile.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="animate-rise" style={{ animationDelay: "80ms" }}>
          <CardHeader title="Announcements and banners" subtitle="Target them by user segment." action={<Button size="sm" variant="secondary" icon={<Plus className="size-3.5" />} onClick={() => setDraftAnn({ id: `an-${Date.now().toString(36)}`, title: "", body: "", segment: "all", kind: "announcement", tone: "info", createdAt: new Date().toISOString() })}>New</Button>} />
          {a.length === 0 ? (
            <EmptyState icon={<Megaphone className="size-5" />} title="Nothing posted" />
          ) : (
            <ul className="space-y-2 p-5">
              {a.map((x) => (
                <li key={x.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                  <Megaphone className="mt-0.5 size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{x.title}</p>
                    <p className="line-clamp-2 text-xs text-text-muted">{x.body}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Badge tone="primary">{x.kind}</Badge>
                      <Badge>{SEGMENTS.find((s) => s.value === x.segment)?.label}</Badge>
                    </div>
                  </div>
                  <button onClick={() => setAnns(a.filter((y) => y.id !== x.id))} className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger" aria-label="Remove"><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={!!draftAnn}
        onOpenChange={(o) => !o && setDraftAnn(null)}
        title="New announcement"
        footer={
          <Button size="md" onClick={() => {
            if (!draftAnn?.title.trim() || !draftAnn.body.trim()) return toast.error("Title and message are required");
            setAnns([draftAnn, ...a]);
            setDraftAnn(null);
          }}>Add to draft</Button>
        }
      >
        {draftAnn && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Title" value={draftAnn.title} onChange={(e) => setDraftAnn({ ...draftAnn, title: e.target.value })} />
            <TextArea className="sm:col-span-2" label="Message" value={draftAnn.body} onChange={(e) => setDraftAnn({ ...draftAnn, body: e.target.value })} />
            <SelectField label="Type" value={draftAnn.kind} onChange={(e) => setDraftAnn({ ...draftAnn, kind: e.target.value as Announcement["kind"] })} options={[{ value: "announcement", label: "Announcement (tile)" }, { value: "banner", label: "Banner (top of page)" }]} />
            <SelectField label="Audience" value={draftAnn.segment} onChange={(e) => setDraftAnn({ ...draftAnn, segment: e.target.value as Announcement["segment"] })} options={SEGMENTS} />
            <SelectField label="Tone" value={draftAnn.tone} onChange={(e) => setDraftAnn({ ...draftAnn, tone: e.target.value as Announcement["tone"] })} options={[{ value: "info", label: "Info" }, { value: "success", label: "Success" }, { value: "warning", label: "Warning" }]} />
          </div>
        )}
      </Modal>

      <Modal open={preview} onOpenChange={setPreview} size="xl" title="Preview" description="Tile layout users will see. Numbers come from each user's ledger.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.filter((x) => x.visible).map((x, i) => (
            <div key={x.id} className={cn("animate-rise rounded-xl border border-border bg-surface-alt p-4", ["balance", "copied", "deposit", "transactions"].includes(x.id) && "sm:col-span-2")} style={{ animationDelay: `${i * 50}ms` }}>
              <p className="text-sm font-semibold">{x.label}</p>
              <div className="mt-3 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

/* ── Audit log (FR-8.7) ──────────────────────────────────────── */
export function AuditLogAdmin() {
  const [q, setQ] = useState("");
  const { data, error } = useApi<AuditEntry[]>(`/admin/audit?q=${encodeURIComponent(q)}`, { keepPreviousData: true, refreshInterval: 20_000 });
  const [scope, setScope] = useState<"All" | "KYC" | "Balance" | "Wallet" | "Content" | "Access">("All");
  const rows = (data ?? []).filter((x) => {
    const m = { All: "", KYC: "kyc", Balance: "balance|withdrawal", Wallet: "wallet|claim", Content: "dashboard|buy_platforms|trader|trade", Access: "admin\\.|user\\." }[scope];
    return !m || new RegExp(m).test(x.action);
  });

  function exportCsv() {
    downloadFile(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows.map((r) => ({ when: r.createdAt, actor: r.actorName, action: r.action, target: r.target, ip: r.ip }))));
    toast.success("Audit log exported", { description: `${rows.length} entries.` });
  }

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every admin action, with who, what and when. Read-only, and entries can't be deleted." action={<Button size="md" variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>} />
      <Card className="animate-rise overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actor, action or target" className="h-10 w-full rounded-[var(--radius-control)] border border-border bg-surface-alt pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-surface" />
          </div>
          <div className="scroll-thin -mx-1 overflow-x-auto px-1">
            <Segmented value={scope} onChange={setScope} options={["All", "KYC", "Balance", "Wallet", "Content", "Access"] as const} />
          </div>
        </div>
        {error ? (
          <EmptyState icon={<Search className="size-5" />} title="Couldn't load the audit log" body={error.message} />
        ) : !data ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<Search className="size-5" />} title="No entries" />
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-3 py-3 font-medium">Actor</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={r.id} className="animate-fade hover:bg-surface-alt" style={{ animationDelay: `${Math.min(i, 20) * 20}ms` }}>
                    <td className="whitespace-nowrap px-5 py-3 text-text-muted">{fmtDateTime(r.createdAt)}</td>
                    <td className="px-3 py-3 font-medium">{r.actorName}</td>
                    <td className="px-3 py-3"><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.action}</code></td>
                    <td className="px-5 py-3 text-text-muted">{r.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

/* ── Admin accounts (super admin approves sign-ups) ─────────── */
export function AdminsAdmin() {
  const { data, mutate } = useApi<ApiUser[]>("/admin/admins");
  const { data: me } = useAdminMe();
  const [busy, setBusy] = useState<string | null>(null);
  const isSuper = me?.user.role === "SUPER_ADMIN";

  async function call(path: string, json: unknown, key: string, msg: string) {
    setBusy(key);
    try {
      await api(path, { json });
      await Promise.all([mutate(), refresh("/admin/overview")]);
      toast.success(msg);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Admins" subtitle="People with console access. New admins sign up at /admin/sign-up and wait here for a super admin to approve them." />
      {!isSuper && <p className="mb-4 rounded-xl border border-warning/30 bg-warning/[0.07] px-4 py-3 text-sm text-[#92400e]">Only super admins can approve admins or change roles.</p>}
      <Card className="animate-rise overflow-hidden">
        {!data ? (
          <div className="space-y-3 p-5">{[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Admin</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((a) => {
                  const self = a.id === me?.user.id;
                  return (
                    <tr key={a.id} className="hover:bg-surface-alt">
                      <td className="px-5 py-3">
                        <p className="font-medium">{a.firstName} {a.lastName} {self && <Badge>You</Badge>}</p>
                        <p className="text-xs text-text-muted">{a.email}</p>
                      </td>
                      <td className="px-3 py-3"><Badge tone={a.role === "SUPER_ADMIN" ? "primary" : "neutral"}><ShieldCheck className="size-3" /> {a.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}</Badge></td>
                      <td className="px-3 py-3"><Badge tone={a.status === "ACTIVE" ? "success" : a.status === "PENDING_APPROVAL" ? "warning" : "danger"} dot>{a.status.replace("_", " ").toLowerCase()}</Badge></td>
                      <td className="px-3 py-3 text-text-muted">{fmtDateTime(a.createdAt)}</td>
                      <td className="px-5 py-3">
                        {isSuper && !self && (
                          <div className="flex justify-end gap-2">
                            {a.status === "PENDING_APPROVAL" ? (
                              <>
                                <Button size="sm" variant="secondary" loading={busy === a.id + "no"} icon={<X className="size-3.5" />} onClick={() => call(`/admin/admins/${a.id}/approve`, { approve: false }, a.id + "no", "Request rejected")}>Reject</Button>
                                <Button size="sm" variant="success" loading={busy === a.id + "yes"} icon={<Check className="size-3.5" />} onClick={() => call(`/admin/admins/${a.id}/approve`, { approve: true }, a.id + "yes", `${a.firstName} can now sign in`)}>Approve</Button>
                              </>
                            ) : a.status === "ACTIVE" ? (
                              <>
                                <Button size="sm" variant="secondary" loading={busy === a.id + "role"} onClick={() => call(`/admin/admins/${a.id}/role`, { role: a.role === "SUPER_ADMIN" ? "ADMIN" : "SUPER_ADMIN" }, a.id + "role", "Role updated")}>
                                  Make {a.role === "SUPER_ADMIN" ? "admin" : "super admin"}
                                </Button>
                                <Button size="sm" variant="secondary" className="text-danger" loading={busy === a.id + "rev"} onClick={() => call(`/admin/admins/${a.id}/approve`, { approve: false }, a.id + "rev", "Access revoked")}>Revoke</Button>
                              </>
                            ) : (
                              <Button size="sm" variant="secondary" loading={busy === a.id + "yes"} onClick={() => call(`/admin/admins/${a.id}/approve`, { approve: true }, a.id + "yes", "Access restored")}>Restore</Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
