import { cn } from "../../lib/cn";

export function RiskMeter({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Risk level ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("h-2.5 w-1.5 rounded-sm", i <= level ? (level >= 4 ? "bg-danger" : level === 3 ? "bg-warning" : "bg-success") : "bg-border")} />
      ))}
    </span>
  );
}
