import { useState } from "react";
import { ChevronDown, GraduationCap, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, navHref, isParent, type NavItem as NavItemType } from "@/data/nav";
import { NavItem } from "@/components/molecules/NavItem";
import { Avatar, AvatarFallback } from "@/components/atoms/Avatar";
import type { ShellData } from "@/data/types";

export interface AppSidebarProps {
  shell: ShellData;
  activePath: string;
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
}

function SidebarGroup({
  item,
  activePath,
  collapsed,
  onNavigate,
}: {
  item: NavItemType;
  activePath: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  if (!isParent(item)) {
    const href = navHref(item.to);
    const active = activePath === href || activePath === item.to;
    return (
      <NavItem
        href={href}
        icon={item.icon}
        active={active}
        collapsed={collapsed}
        onClick={onNavigate}
      >
        {item.title}
      </NavItem>
    );
  }

  const containsActive = item.children.some(
    (c) => activePath === navHref(c.to) || activePath === c.to
  );
  const [open, setOpen] = useState(containsActive || true);
  const Icon = item.icon;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 transition-colors hover:text-foreground cursor-pointer",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="size-4 shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </div>
        {!collapsed && (
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              open ? "rotate-180" : "rotate-0"
            )}
          />
        )}
      </button>

      {open && (
        <div className={cn("space-y-1", !collapsed && "pl-4")}>
          {item.children.map((child) => {
            const href = navHref(child.to);
            const active = activePath === href || activePath === child.to;
            return (
              <NavItem
                key={child.to}
                href={href}
                icon={child.icon}
                active={active}
                collapsed={collapsed}
                onClick={onNavigate}
              >
                {child.title}
              </NavItem>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppSidebar({
  shell,
  activePath,
  collapsed = false,
  className,
  onNavigate,
}: AppSidebarProps) {
  const isDashboardActive = activePath === "/" || activePath === "";

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Student Profile summary */}
      <div className="flex items-center gap-3 border-b border-border/80 p-4">
        <Avatar className="size-10 shrink-0 shadow-soft">
          <AvatarFallback className="bg-primary-soft text-primary-strong text-sm font-bold">
            {shell.student.initials || "SV"}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {shell.student.name}
            </h3>
            <p className="truncate text-xs font-medium text-muted-foreground">
              {shell.student.studentId}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Dashboard Link */}
        <div className="space-y-1">
          <NavItem
            href="/"
            icon={LayoutGrid}
            active={isDashboardActive}
            collapsed={collapsed}
            onClick={onNavigate}
          >
            Tổng quan
          </NavItem>
        </div>

        {/* Groups */}
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-2">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarGroup
                  key={item.title}
                  item={item}
                  activePath={activePath}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
