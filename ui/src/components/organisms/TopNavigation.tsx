import React from "react";
import { Bell, Languages, MapPin, PanelLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import type { ShellData } from "@/data/types";

export interface TopNavigationProps {
  shell: ShellData;
  onShowOriginal: () => void;
  onToggleSidebar?: () => void;
  className?: string;
}

export function TopNavigation({
  shell,
  onShowOriginal,
  onToggleSidebar,
  className,
}: TopNavigationProps) {
  return (
    <header
      className={cn(
        "glass sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/80 px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            aria-label="Thu gọn thanh điều hướng"
            className="lg:hidden"
          >
            <PanelLeft className="size-5" />
          </Button>
        )}

        {/* Campus selector - static display per spec */}
        <div
          title={shell.campus}
          className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-soft"
        >
          <MapPin className="size-3.5 text-primary-strong" />
          <span className="max-w-[180px] truncate sm:max-w-[280px]">
            {shell.campus}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language selector - static display per spec */}
        <div
          title="Ngôn ngữ"
          className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft"
        >
          <Languages className="size-3.5" />
          <span>Tiếng Việt</span>
        </div>

        {/* Notification bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Thông báo"
            className="relative"
          >
            <Bell className="size-4" />
            {shell.unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-soft">
                {shell.unreadNotifications}
              </span>
            )}
          </Button>
        </div>

        {/* Switch back to original FAP */}
        <Button
          variant="outline"
          size="sm"
          onClick={onShowOriginal}
          className="text-xs font-semibold gap-1.5"
        >
          <ExternalLink className="size-3.5" />
          <span>Xem bản FAP gốc</span>
        </Button>
      </div>
    </header>
  );
}
