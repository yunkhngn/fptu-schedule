import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconTile } from "@/components/atoms/IconTile";

export interface DashboardCardProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: DashboardCardProps) {
  return (
    <section className={cn("surface-card flex min-w-0 flex-col overflow-hidden", className)}>
      {(title || action) && (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && <IconTile icon={Icon} />}
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold tracking-tight">{title}</h2>
              {description && (
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={cn("flex-1 p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

