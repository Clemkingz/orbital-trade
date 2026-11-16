import { twMerge } from "tailwind-merge";

/** Joins class names and resolves Tailwind conflicts (later classes win, e.g. bg-surface → bg-night). */
export function cn(...classes: unknown[]) {
  return twMerge(classes.filter((c): c is string => typeof c === "string" && c.length > 0).join(" "));
}
