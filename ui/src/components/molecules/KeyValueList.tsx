import type { JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KeyValueItem {
  label: string;
  value: ReactNode;
}

export interface KeyValueListProps {
  items: KeyValueItem[];
  className?: string;
}

export function KeyValueList({ items, className }: KeyValueListProps): JSX.Element {
  return (
    <dl className={cn("divide-y divide-border text-sm", className)}>
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium text-muted-foreground">{item.label}</dt>
          <dd className="text-foreground sm:col-span-2">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
