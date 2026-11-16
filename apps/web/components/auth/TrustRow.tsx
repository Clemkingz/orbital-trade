const ITEMS = ["ID-verified", "Licensed custody", "2FA protected"];

export function TrustRow() {
  return (
    <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-text-muted">
      {ITEMS.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1.5 2.5 3.8v3.7c0 3.2 2.3 6 5.5 7 3.2-1 5.5-3.8 5.5-7V3.8L8 1.5Z" stroke="var(--color-primary)" strokeWidth="1.4" />
          </svg>
          {t}
        </li>
      ))}
    </ul>
  );
}
