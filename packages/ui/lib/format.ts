export const fmtBtc = (n: number, digits = 6) =>
  `${n < 0 ? "−" : ""}₿${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const fmtUsd = (n: number, digits = 2) =>
  `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const fmtNgn = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;

export const fmtPct = (n: number, digits = 2) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(digits)}%`;

export const fmtTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const fmtDateTime = (d: Date | string) => `${fmtDate(d)}, ${fmtTime(d)}`;

export function timeAgo(d: Date | string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export const shortHash = (h: string, n = 6) => (h.length > n * 2 + 1 ? `${h.slice(0, n)}…${h.slice(-n)}` : h);

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadFile(name: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Formats an amount in the user's own currency, e.g. ₦1,560,000.00 or GH₵15.40. */
export function fmtFiat(n: number, currency: string, digits = 2) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
  } catch {
    return `${currency} ${n.toFixed(digits)}`;
  }
}

export const CURRENCY_NAME: Record<string, string> = { NGN: "Naira", GHS: "Cedi", KES: "Shilling", ZAR: "Rand", GBP: "Pound", USD: "Dollar", CAD: "Canadian dollar", AED: "Dirham" };
