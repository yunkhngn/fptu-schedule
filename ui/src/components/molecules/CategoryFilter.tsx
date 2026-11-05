import React from "react";
import { cn } from "@/lib/utils";

export interface CategoryFilterProps {
  value: string;
  onChange: (category: string) => void;
  categories?: readonly string[];
  className?: string;
}

const DEFAULT_CATEGORIES = [
  "Tất cả",
  "Thông tin Khảo Thí",
  "Thông tin Đào tạo",
  "Thông báo tài chính",
  "Thông tin chung",
];

export function CategoryFilter({
  value,
  onChange,
  categories = DEFAULT_CATEGORIES,
  className,
}: CategoryFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Loại tin"
      className={cn("scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1", className)}
    >
      {categories.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(c)}
            className={cn(
              "h-8 shrink-0 rounded-full px-3.5 text-[12.5px] font-medium cursor-pointer transition-all duration-200 ease-natural focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              active
                ? "bg-ink text-ink-foreground shadow-soft"
                : "bg-surface-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
