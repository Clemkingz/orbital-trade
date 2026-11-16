"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
};

const widths = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };

/** Accessible modal: a bottom sheet on phones, a centred card from `sm` up. */
export function Modal({ open, onOpenChange, title, description, children, footer, size = "md" }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-overlay bg-night/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-surface shadow-2xl outline-none animate-pop",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
            widths[size],
          )}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="text-lg font-semibold text-text">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="-mr-1 rounded-lg p-1.5 text-text-muted transition hover:bg-muted hover:text-text" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
