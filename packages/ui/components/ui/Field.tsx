"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export const controlClass =
  "h-11 w-full min-w-0 rounded-[var(--radius-control)] border bg-surface-alt px-3.5 text-[15px] text-text placeholder:text-text-muted/70 outline-none transition-all duration-200 hover:border-primary/30 focus:bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Icon rendered inside the input on the left. */
  icon?: ReactNode;
  /** Element rendered inside the input on the right (e.g. show/hide). */
  trailing?: ReactNode;
  /** Element attached to the left edge (e.g. a country-code select). */
  leading?: ReactNode;
  dark?: boolean;
};

export function Field({ label, error, hint, icon, trailing, leading, className, id, ...rest }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text">
        {label}
      </label>
      <div className={cn("relative flex", error && "animate-shake")} key={error ? "err" : "ok"}>
        {leading}
        <div className="relative w-full">
          {icon && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted [&_svg]:size-4">{icon}</span>}
          <input
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...rest}
            className={cn(controlClass, error ? "border-danger focus:border-danger focus:ring-danger/10" : "border-border", icon && "pl-9", trailing && "pr-14", leading && "rounded-l-none")}
          />
          {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">{trailing}</div>}
        </div>
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="mt-1.5 animate-fade text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <div id={`${inputId}-hint`} className="mt-1.5 text-[13px] text-text-muted">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function TextArea({ label, error, className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={!!error}
        {...rest}
        className={cn(controlClass, "h-auto min-h-24 py-2.5", error ? "border-danger" : "border-border")}
      />
      {error && <p className="mt-1.5 text-[13px] text-danger">{error}</p>}
    </div>
  );
}
