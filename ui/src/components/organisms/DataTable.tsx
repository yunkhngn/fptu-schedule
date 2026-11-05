import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataTableProps {
  columns: string[];
  rows: ReactNode[][];
  empty?: ReactNode;
  className?: string;
}

export function DataTable({
  columns,
  rows,
  empty,
  className,
}: DataTableProps) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-border bg-surface-2/60">
              {columns.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="px-5 py-3.5 text-xs font-medium whitespace-nowrap text-muted-foreground"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => (
              <tr key={i} className="transition-colors duration-150 hover:bg-surface-2/60">
                {r.map((cell, j) => (
                  <td key={j} className="px-5 py-4 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && empty}
    </div>
  );
}
