import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      tone: {
        lavender: "bg-primary-soft text-primary-strong",
        neutral: "bg-surface-2 text-muted-foreground",
        success: "bg-success-soft text-success-strong",
        warning: "bg-warning-soft text-warning-strong",
        danger: "bg-danger-soft text-danger-strong",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

const dotTone = {
  lavender: "bg-primary",
  neutral: "bg-muted-foreground/60",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
} as const;

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  tone?: "lavender" | "neutral" | "success" | "warning" | "danger";
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({
  tone = "neutral",
  dot,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotTone[tone ?? "neutral"])} />}
      {children}
    </span>
  );
}
