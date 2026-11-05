import type { JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface RichTableColumn {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  tone?: (value: string) => "success" | "warning" | "danger" | "neutral" | undefined;
  render?: (value: string, row: Record<string, string>) => ReactNode;
}

export interface RichTableProps {
  columns: RichTableColumn[];
  rows: Array<Record<string, string>>;
  empty?: ReactNode;
  caption?: string;
  className?: string;
}

export function RichTable({ columns, rows, empty, caption, className }: RichTableProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <div className={cn("surface-card p-8 text-center text-sm text-muted-foreground", className)}>
        {empty ?? "Không có dữ liệu"}
      </div>
    );
  }

  const getToneClass = (tone?: "success" | "warning" | "danger" | "neutral") => {
    switch (tone) {
      case "success":
        return "text-success font-medium";
      case "warning":
        return "text-warning font-medium";
      case "danger":
        return "text-danger font-medium";
      case "neutral":
        return "text-muted-foreground";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          {caption && (
            <caption className="border-b border-border bg-surface-muted/50 px-5 py-3 text-left font-medium text-foreground">
              {caption}
            </caption>
          )}
          <thead>
            <tr className="border-b border-border bg-surface-muted/60 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-5 py-3 font-medium",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="transition-colors hover:bg-surface-muted/40">
                {columns.map((col) => {
                  const val = row[col.key] ?? "";
                  const tone = col.tone ? col.tone(val) : undefined;
                  const content = col.render ? col.render(val, row) : val;
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        "px-5 py-3.5",
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                        getToneClass(tone)
                      )}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
