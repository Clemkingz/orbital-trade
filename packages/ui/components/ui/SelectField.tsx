"use client";

import { useId, type SelectHTMLAttributes } from "react";
import { controlClass } from "./Field";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export function SelectField({ label, error, options, placeholder, className, ...rest }: Props) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text">{label}</label>
      <select
        id={id}
        aria-invalid={!!error}
        {...rest}
        className={`${controlClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1.5 6 6.5l5-5' stroke='%236B6780' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E")] bg-[position:right_14px_center] bg-no-repeat pr-10 ${error ? "border-danger" : "border-border"}`}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-[13px] text-danger">{error}</p>}
    </div>
  );
}
