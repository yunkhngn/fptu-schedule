import type { JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value?: string | number | null;
  tone?: "success" | "warning" | "danger" | "neutral" | "default";
  hint?: ReactNode;
  className?: string;
}

export function StatTile({ label, value, tone = "default", hint, className }: StatTileProps): JSX.Element {
  const displayVal =
    value !== undefined && value !== null && String(value).trim() !== "" ? String(value) : "—";

  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
      ? "text-warning"
      : tone === "danger"
      ? "text-danger"
      : "text-foreground";

  return (
    <div className={cn("surface-card flex flex-col justify-between p-4 sm:p-5", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", toneClass)}>{displayVal}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
