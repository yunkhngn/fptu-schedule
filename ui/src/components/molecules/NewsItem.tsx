import React, { useState } from "react";
import { FileText, FolderOpen, CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import type { NewsItemData } from "@/data/types";

const categoryToneMap: Record<string, "lavender" | "success" | "warning" | "neutral"> = {
  "Thông tin Khảo Thí": "lavender",
  "Thông báo tài chính": "warning",
  "Thông tin Đào tạo": "success",
  "Thông tin chung": "neutral",
};

export interface NewsItemProps {
  item: NewsItemData;
  read: boolean;
  onToggle?: () => void;
  className?: string;
}

export function NewsItem({
  item,
  read,
  onToggle,
  className,
}: NewsItemProps) {
  const [expanded, setExpanded] = useState(false);
  const tone = categoryToneMap[item.category] || "neutral";

  const handleClick = () => {
    setExpanded((prev) => !prev);
    if (onToggle) onToggle();
  };

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={handleClick}
        className={cn(
          "group flex w-full gap-4 rounded-2xl p-3.5 text-left transition-colors duration-200 ease-natural hover:bg-surface-2/80 sm:p-4 cursor-pointer",
          expanded && "bg-surface-2/80",
          className
        )}
      >
        <span className="relative mt-0.5 shrink-0">
          <span
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl transition-colors duration-200",
              read ? "bg-surface-2 text-muted-foreground" : "bg-primary-soft text-primary-strong"
            )}
          >
            <FileText className="size-[18px]" strokeWidth={1.75} />
          </span>
          {!read && (
            <span
              className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface"
              aria-label="Chưa đọc"
            />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-[14px] leading-snug",
              read ? "text-foreground/75" : "font-medium text-foreground",
              !expanded && "line-clamp-2"
            )}
          >
            {item.title}
          </span>

          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <StatusBadge tone={tone} className="py-0.5">
              <FolderOpen className="size-3" strokeWidth={2} />
              {item.category}
            </StatusBadge>

            {item.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" strokeWidth={1.75} />
                {item.publishedAt}
              </span>
            )}
          </span>

          <span
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-200 ease-natural",
              expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <span className="overflow-hidden">
              <span className="block rounded-xl border border-border bg-surface p-3 text-[13px] leading-relaxed text-muted-foreground">
                Nội dung chi tiết của thông báo sẽ được hiển thị từ hệ thống FAP. Vui lòng theo dõi
                email sinh viên để nhận đầy đủ thông tin.
              </span>
            </span>
          </span>
        </span>

        <ChevronDown
          className={cn(
            "mt-2.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-natural",
            expanded && "rotate-180"
          )}
        />
      </button>
    </li>
  );
}

