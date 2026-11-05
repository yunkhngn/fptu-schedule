import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconTile } from "@/components/atoms/IconTile";

export interface StatCardProps {
  label: string;
  value?: ReactNode | null;
  icon: LucideIcon;
  tone?: "success" | "warning" | "primary" | "neutral";
  hint?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  className,
  children,
}: StatCardProps) {
  const displayValue =
    value === null || value === undefined || value === "" ? "—" : value;

  const iconTone = tone === "primary" ? "lavender" : tone;

  return (
    <div
      className={cn(
        "surface-card group flex min-w-0 flex-col justify-between gap-5 p-5 transition-shadow duration-200 ease-natural hover:shadow-float",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <IconTile icon={Icon} tone={iconTone} size="sm" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[17px] font-semibold tracking-tight">
          {displayValue}
        </div>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
        {children}
      </div>
    </div>
  );
}
