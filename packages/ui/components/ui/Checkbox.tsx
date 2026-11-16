import type { InputHTMLAttributes, ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { children: ReactNode; error?: string };

export function Checkbox({ children, error, ...rest }: Props) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-text-muted">
        <input type="checkbox" {...rest} className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded accent-[#5501ff]" />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1.5 pl-[30px] text-[13px] text-danger">{error}</p>}
    </div>
  );
}
