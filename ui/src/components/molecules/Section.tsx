import type { JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Section({ title, description, action, children, className }: SectionProps): JSX.Element {
  return (
    <section className={cn("surface-card p-5 sm:p-6", className)}>
      {(title || action) && (
        <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
