import { useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { TopNavigation } from "@/components/organisms/TopNavigation";
import type { ShellData } from "@/data/types";

export interface AppShellProps {
  shell: ShellData;
  activePath: string;
  children: ReactNode;
  onShowOriginal?: () => void;
}

export function AppShell({
  shell,
  activePath,
  children,
  onShowOriginal,
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
        activePath={activePath}
        collapsed={collapsed}
        onShowOriginal={onShowOriginal}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavigation
          shell={shell}
          onToggleSidebar={toggleSidebar}
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

