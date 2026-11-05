import React from "react";
import { MapPin, ChevronDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover } from "./Popover";
import type { TopbarCampus } from "@/data/types";

export interface CampusMenuProps {
  campus: TopbarCampus | null;
  className?: string;
}

const pill =
  "inline-flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-foreground transition-colors duration-200 hover:bg-surface-2 outline-none focus-visible:ring-3 focus-visible:ring-primary/30";

export function CampusMenu({ campus, className }: CampusMenuProps) {
  if (!campus) return null;

  return (
    <Popover
      label={`Cơ sở: ${campus.name}`}
      className="w-64 p-3"
      trigger={({ props, ref }) => (
        <button
          ref={ref}
          type="button"
          {...props}
          className={cn(pill, className)}
        >
          <MapPin className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <span>{campus.name}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      )}
    >
      {() => (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Cơ sở
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-surface-2 p-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-primary-strong shadow-soft">
              <Building2 className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm text-foreground leading-tight">
                {campus.name}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{campus.code}</span>
                {campus.isMain && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-primary-strong">Chính</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Popover>
  );
}
