import type { JSX } from "react";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange(value: string): void;
  className?: string;
}

export function FilterBar({ label, value, options, onChange, className }: FilterBarProps): JSX.Element {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground shadow-xs transition-colors focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
