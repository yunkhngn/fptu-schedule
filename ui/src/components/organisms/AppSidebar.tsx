import { useState } from "react";
import { ChevronDown, LayoutGrid, LayoutTemplate, Settings2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, navHref, isParent, getNavTitle, type NavItem as NavItemType } from "@/data/nav";
import { NavItem } from "@/components/molecules/NavItem";
import { Switch } from "@/components/atoms/Switch";
import { BrandLogo, Mascot } from "@/components/atoms/Brand";
import { useT } from "@/i18n";
import type { ShellData, TopbarData } from "@/data/types";

export interface AppSidebarProps {
  shell: ShellData;
  topbar?: TopbarData | null;
  activePath: string;
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
  /** Turns the new interface off for every page. When omitted the card shows no switch. */
  onShowOriginal?: () => void;
  onLogout?: () => void;
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
  const t = useT();
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
        {getNavTitle(item.title, t)}
      </NavItem>
    );
  }

  const isAnyChildActive = item.children.some(
    (c) => activePath === navHref(c.to) || activePath === c.to
  );
  const [isOpen, setIsOpen] = useState(isAnyChildActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={cn(
          "group/item relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-colors duration-200 ease-natural outline-none hover:bg-surface-2 hover:text-foreground",
          isAnyChildActive && !isOpen ? "bg-primary-soft text-foreground" : "text-muted-foreground",
          collapsed && "justify-center px-0"
        )}
      >
        <item.icon
          className={cn("size-[18px] shrink-0", isAnyChildActive && "text-primary-strong")}
          strokeWidth={1.75}
        />
        {!collapsed && (
          <>
            <span className={cn("truncate", isAnyChildActive && "text-foreground")}>
              {getNavTitle(item.title, t)}
            </span>
            <ChevronDown
              className={cn(
                "ml-auto size-4 shrink-0 transition-transform duration-200 ease-natural",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {!collapsed && (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-natural",
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <ul className="relative my-1 ml-[21px] space-y-0.5 border-l border-border pl-3">
              {item.children.map((child) => {
                const href = navHref(child.to);
                const active = activePath === href || activePath === child.to;
                return (
                  <li key={child.to}>
                    <a
                      href={href}
                      onClick={onNavigate}
                      tabIndex={isOpen ? 0 : -1}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-9 items-center rounded-lg px-3 text-[13px] transition-colors duration-200",
                        active
                          ? "bg-primary-soft font-medium text-foreground"
                          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute top-1/2 -left-[13px] h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary" />
                      )}
                      <span className="truncate">{getNavTitle(child.title, t)}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppSidebar({
  shell,
  topbar,
  activePath,
  collapsed = false,
  className,
  onNavigate,
  onShowOriginal,
  onLogout,
}: AppSidebarProps) {
  const t = useT();
  const [logoFailed, setLogoFailed] = useState(false);
  const isDashboardActive = activePath === "/" || activePath === "";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 p-3 pr-0 transition-[width] duration-250 ease-natural lg:block",
        collapsed ? "w-[88px]" : "w-[280px]",
        className
      )}
    >
      <div className="h-full overflow-hidden rounded-3xl border border-border bg-surface shadow-soft flex flex-col">
        {/* Brand: the logo, centred. Collapsed, only the mascot fits. If the logo cannot be shown, the name stands in. */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-center px-5 py-5",
            collapsed && "h-[72px] px-0 py-0"
          )}
        >
          <a
            href="/"
            onClick={onNavigate}
            title={t("nav.overview")}
            aria-label={t("nav.overview")}
            className="flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
          >
            {collapsed ? (
              <Mascot className="size-10" />
            ) : logoFailed ? (
              <div className="min-w-0 text-center leading-tight">
                <p className="truncate text-[15px] font-semibold tracking-tight">Trường Đại học FPT</p>
                <p className="truncate text-xs text-muted-foreground">FPT Education · FAP</p>
              </div>
            ) : (
              <BrandLogo className="h-14" onFail={() => setLogoFailed(true)} />
            )}
          </a>
        </div>

        {/* Navigation Links */}
        <nav
          className={cn(
            "scrollbar-thin flex-1 overflow-y-auto px-3 pb-4",
            collapsed && "px-2.5"
          )}
          aria-label="Điều hướng chính"
        >
          {/* Dashboard Link */}
          <div className="pt-2 pb-1">
            <NavItem
              href="/"
              icon={LayoutGrid}
              active={isDashboardActive}
              collapsed={collapsed}
              onClick={onNavigate}
            >
              {t("nav.overview")}
            </NavItem>
          </div>

          {/* Groups */}
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="pt-4">
              {collapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-border" />
              ) : (
                <p className="mb-1.5 px-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80 uppercase">
                  {getNavTitle(group.label, t)}
                </p>
              )}
              <div className="space-y-0.5">
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
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "shrink-0 space-y-1 border-t border-border p-3",
            collapsed && "px-2.5"
          )}
        >
          {!collapsed ? (
            <div className="flex w-full items-center gap-3 rounded-2xl bg-lavender p-3 text-left">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface/80 text-primary-strong">
                <LayoutTemplate className="size-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">
                  Giao diện FAP mới
                </span>
                <span className="block truncate text-xs text-foreground/60">
                  Đang được sử dụng
                </span>
              </div>
              {onShowOriginal && (
                <Switch checked label="Tắt giao diện FAP mới" onCheckedChange={() => onShowOriginal()} />
              )}
            </div>
          ) : onShowOriginal ? (
            <div className="flex justify-center">
              <Switch checked label="Tắt giao diện FAP mới" onCheckedChange={() => onShowOriginal()} />
            </div>
          ) : (
            <div className="flex justify-center p-2">
              <LayoutTemplate className="size-4 text-primary-strong" />
            </div>
          )}
          <NavItem
            href={topbar?.profile?.accountHref || "/tai-khoan"}
            icon={Settings2}
            active={activePath === "/tai-khoan" || activePath === topbar?.profile?.accountHref}
            collapsed={collapsed}
          >
            {t("sidebar.account_settings")}
          </NavItem>
          {topbar?.profile?.canLogout !== false && (
            <button
              type="button"
              onClick={onLogout}
              className={cn(
                "group/item relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-colors duration-200 ease-natural outline-none text-muted-foreground hover:bg-surface-2 hover:text-foreground cursor-pointer",
                collapsed && "justify-center px-0"
              )}
            >
              <LogOut className="size-[18px] shrink-0 text-muted-foreground group-hover/item:text-foreground" strokeWidth={1.75} />
              {!collapsed && <span>{t("sidebar.logout")}</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
