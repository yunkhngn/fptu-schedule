import React from "react";
import { ChevronDown, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/atoms/Brand";
import { Popover } from "@/components/molecules/Popover";
import { useT } from "@/i18n";
import type { TopbarProfile } from "@/data/types";

export interface ProfileMenuProps {
  profile?: TopbarProfile | null;
  fallbackName?: string;
  fallbackStudentId?: string;
  onLogout?: () => void;
  className?: string;
}

export function ProfileMenu({
  profile,
  fallbackName,
  fallbackStudentId,
  onLogout,
  className,
}: ProfileMenuProps) {
  const t = useT();

  const name = profile?.name || fallbackName || "";
  const studentId = profile?.studentId || fallbackStudentId || "";
  const accountHref = profile?.accountHref || "/Account";
  const canLogout = profile ? profile.canLogout !== false : true;

  return (
    <Popover
      label={name || "Profile"}
      align="end"
      role="menu"
      className={className}
      trigger={({ open, toggle, ref, props }) => (
        <button
          ref={ref}
          type="button"
          aria-label={name}
          className={cn(
            "ml-1 flex items-center gap-3 rounded-full py-1 pr-1 pl-1 transition-colors duration-200 outline-none hover:bg-surface-2 focus-visible:ring-3 focus-visible:ring-primary/30 sm:pr-3 cursor-pointer",
            open && "bg-surface-2"
          )}
          {...props}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lavender">
            <Mascot className="size-7" />
          </span>
          <span className="hidden min-w-0 text-left leading-tight sm:block">
            <span className="block truncate text-[13px] font-semibold">{name}</span>
            <span className="block text-xs text-muted-foreground">{studentId}</span>
          </span>
          <ChevronDown
            className={cn(
              "hidden size-3.5 text-muted-foreground transition-transform duration-200 sm:block",
              open && "rotate-180"
            )}
          />
        </button>
      )}
    >
      {({ close }) => (
        <div className="w-64 p-1.5" role="menu">
          <div className="border-b border-border px-3.5 py-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{studentId}</p>
          </div>

          <div className="pt-1.5 space-y-0.5">
            <a
              role="menuitem"
              href={accountHref}
              onClick={() => close()}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-2 cursor-pointer"
            >
              <User className="size-4 text-muted-foreground" />
              <span className="flex-1">{t("topbar.my_account")}</span>
            </a>

            {canLogout && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  onLogout?.();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-danger hover:bg-danger-soft transition-colors cursor-pointer"
              >
                <LogOut className="size-4" />
                <span>{t("topbar.logout")}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </Popover>
  );
}
