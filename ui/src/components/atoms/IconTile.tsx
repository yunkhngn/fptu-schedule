import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconTileVariants = cva("grid shrink-0 place-items-center rounded-xl", {
  variants: {
    tone: {
      lavender: "bg-primary-soft text-primary-strong",
      neutral: "bg-surface-2 text-muted-foreground",
      success: "bg-success-soft text-success-strong",
      warning: "bg-warning-soft text-warning-strong",
      danger: "bg-danger-soft text-danger-strong",
      ink: "bg-ink text-ink-foreground",
    },
    size: {
      sm: "h-8 w-8 [&_svg]:size-4",
      md: "h-10 w-10 [&_svg]:size-[18px]",
      lg: "h-12 w-12 [&_svg]:size-5",
    },
  },
  defaultVariants: { tone: "lavender", size: "md" },
});

export interface IconTileProps extends VariantProps<typeof iconTileVariants> {
  icon: LucideIcon;
  className?: string;
}

export function IconTile({
  icon: Icon,
  tone,
  size,
  className,
}: IconTileProps) {
  return (
    <span className={cn(iconTileVariants({ tone, size }), className)}>
      <Icon strokeWidth={1.75} />
    </span>
  );
}
