import { useState, useEffect } from "react";
import {
  Check,
  ChevronDown,
  Languages,
  MapPin,
  Maximize2,
  Minimize2,
  PanelLeft,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { Mascot } from "@/components/atoms/Brand";
import { ThemeToggle } from "@/components/molecules/ThemeToggle";
import { CampusMenu } from "@/components/molecules/CampusMenu";
import { LanguageMenu } from "@/components/molecules/LanguageMenu";
import { NotificationMenu } from "./NotificationMenu";
import { SearchDialog } from "./SearchDialog";
import type { ThemePreference } from "@/theme/theme";
import type { ShellData, TopbarData } from "@/data/types";

export interface TopNavigationProps {
  shell: ShellData;
  topbar?: TopbarData | null;
  onSelectLanguage?: (culture: string) => void;
  onToggleSidebar?: () => void;
  className?: string;
  themePreference?: ThemePreference;
  onThemeChange?: (next: ThemePreference) => void;
}

const pill =
  "inline-flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-foreground transition-colors duration-200 hover:bg-surface-2 outline-none focus-visible:ring-3 focus-visible:ring-primary/30";

export function TopNavigation({
  shell,
  topbar,
  onSelectLanguage,
  onToggleSidebar,
  className,
  themePreference,
  onThemeChange,
}: TopNavigationProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const campusData =
    topbar !== undefined
      ? topbar?.campus ?? null
      : shell.campus
      ? { name: shell.campus, code: "", isMain: false }
      : null;

  const languageData =
    topbar !== undefined
      ? topbar?.language ?? null
      : {
          current: "vi",
          options: [
            { culture: "vi", label: "Tiếng Việt" },
            { culture: "en", label: "English" },
          ],
        };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header
      className={cn("sticky top-0 z-30", className)}
    >
      {/*
        Blur and tint for whatever scrolls underneath. It is its own layer so the mask can fade it out
        below the bar without fading the controls, and it reaches 24px past the bar so the fade has room.
      */}
      <div
        data-topbar-backdrop
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+24px)] bg-background/70 backdrop-blur-xl backdrop-saturate-150 [-webkit-mask-image:linear-gradient(to_bottom,black_55%,transparent)] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      />
      <div className="relative grid h-[72px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Toggle Sidebar Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Thu gọn / mở rộng thanh điều hướng"
        >
          <PanelLeft className="size-4" strokeWidth={1.75} />
        </Button>

        {/* Global Search Bar */}
        <div className="flex min-w-0 items-center">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden h-10 w-full max-w-[360px] items-center gap-2.5 rounded-full border border-border bg-surface px-4 text-[13px] text-muted-foreground shadow-soft transition-colors duration-200 hover:border-primary-muted md:flex"
          >
            <Search className="size-4" strokeWidth={1.75} />
            <span className="flex-1 text-left">Tìm chức năng, trang…</span>
            <kbd className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-sans text-[11px]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Campus Selector */}
          <CampusMenu campus={campusData} className="hidden xl:inline-flex" />

          {/* Language Selector */}
          <LanguageMenu
            language={languageData}
            onSelect={onSelectLanguage}
            className="hidden lg:inline-flex"
          />

          {/* Theme Toggle */}
          {onThemeChange && (
            <ThemeToggle
              preference={themePreference ?? "auto"}
              onChange={onThemeChange}
            />
          )}

          {/* Notifications */}
          <NotificationMenu unread={shell.unreadNotifications} />

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            aria-label="Toàn màn hình"
            className="hidden sm:inline-flex"
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" strokeWidth={1.75} />
            ) : (
              <Maximize2 className="size-4" strokeWidth={1.75} />
            )}
          </Button>

          {/* User Profile Pill */}
          <div className="ml-1 flex items-center gap-3 rounded-full py-1 pr-1 pl-1 transition-colors duration-200 outline-none hover:bg-surface-2 focus-visible:ring-3 focus-visible:ring-primary/30 sm:pr-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lavender">
              <Mascot className="size-7" />
            </span>
            <span className="hidden min-w-0 text-left leading-tight sm:block">
              <span className="block truncate text-[13px] font-semibold">
                {shell.student.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {shell.student.studentId}
              </span>
            </span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
          </div>
        </div>
      </div>
      <SearchDialog open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
