"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Lock } from "lucide-react";
import { passwordStrength } from "@orbit/shared";
import { Field } from "./Field";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
  showStrength?: boolean;
};

const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["bg-danger", "bg-danger", "bg-warning", "bg-success", "bg-success"];

export function PasswordField({ showStrength, value, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  const pw = typeof value === "string" ? value : "";
  const score = passwordStrength(pw);

  return (
    <Field
      {...rest}
      value={value}
      type={visible ? "text" : "password"}
      icon={<Lock />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="rounded-md px-2 py-1 text-[13px] font-medium text-text-muted hover:text-primary"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      }
      hint={
        showStrength && pw ? (
          <div className="flex items-center gap-3" aria-live="polite">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? COLORS[score] : "bg-border"}`} />
              ))}
            </div>
            <span className="w-16 text-right">{LABELS[score]}</span>
          </div>
        ) : showStrength ? (
          "At least 10 characters."
        ) : undefined
      }
    />
  );
}
