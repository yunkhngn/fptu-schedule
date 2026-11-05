import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/atoms/Input";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

export function SearchField({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className,
  "aria-label": ariaLabel = "Tìm kiếm",
}: SearchFieldProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-10 rounded-full border-border bg-surface-2 pl-10 pr-9 shadow-none focus-visible:ring-3 focus-visible:ring-primary/30"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Xóa tìm kiếm"
          className="absolute right-3 grid size-5 place-items-center rounded-full text-muted-foreground cursor-pointer hover:bg-surface hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
