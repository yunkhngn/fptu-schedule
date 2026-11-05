import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface NavItemProps {
  href: string;
  icon: LucideIcon;
  active?: boolean;
  collapsed?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const itemBase =
  "group/item relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-colors duration-200 ease-natural outline-none focus-visible:ring-3 focus-visible:ring-primary/30";
const itemIdle = "text-muted-foreground hover:bg-surface-2 hover:text-foreground";
const itemActive = "bg-primary-soft text-foreground";

export function NavItem({
  href,
  icon: Icon,
  active = false,
  collapsed = false,
  children,
  className,
  onClick,
}: NavItemProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        itemBase,
        active ? itemActive : itemIdle,
        collapsed && "justify-center px-0",
        className
      )}
    >
      <Icon
        className={cn("size-[18px] shrink-0", active && "text-primary-strong")}
        strokeWidth={1.75}
      />
      {!collapsed && <span className="truncate">{children}</span>}
    </a>
  );
}

