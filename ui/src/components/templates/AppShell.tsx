import { useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { TopNavigation } from "@/components/organisms/TopNavigation";
import type { ShellData, TopbarData } from "@/data/types";
import type { ThemePreference } from "@/theme/theme";

export interface AppShellProps {
  shell: ShellData;
  topbar?: TopbarData | null;
  activePath: string;
  children: ReactNode;
  onShowOriginal?: () => void;
  onLogout?: () => void;
  onSelectLanguage?: (culture: string) => void;
  themePreference?: ThemePreference;
  onThemeChange?: (next: ThemePreference) => void;
}

export function AppShell({
  shell,
  topbar,
  activePath,
  children,
  onShowOriginal,
  onLogout,
  onSelectLanguage,
  themePreference,
  onThemeChange,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <AppSidebar
        shell={shell}
        topbar={topbar}
        activePath={activePath}
        collapsed={collapsed}
        onShowOriginal={onShowOriginal}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavigation
          shell={shell}
          topbar={topbar}
          onSelectLanguage={onSelectLanguage}
          onLogout={onLogout}
          onToggleSidebar={toggleSidebar}
          themePreference={themePreference}
          onThemeChange={onThemeChange}
        />
        <main className="page-enter flex-1 px-4 pt-2 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

