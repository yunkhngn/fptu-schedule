import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchTargets, filterTargets, type SearchTarget } from "@/lib/search";

export interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (href: string) => void;
}

export function SearchDialog({ open, onClose, onSelect }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const targets = useMemo(() => searchTargets(), []);
  const filtered = useMemo(() => filterTargets(query, targets), [query, targets]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (href: string) => {
    if (onSelect) {
      onSelect(href);
    } else {
      window.location.href = href;
    }
    onClose();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0 && filtered[activeIndex]) {
        handleSelect(filtered[activeIndex].href);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm chức năng, trang"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface text-foreground shadow-elevated">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Tìm chức năng, trang…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-sans text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div ref={listRef} role="listbox" className="max-h-[360px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Không tìm thấy kết quả nào
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={`${item.href}-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors duration-150",
                    isSelected
                      ? "bg-primary-soft text-primary-strong"
                      : "hover:bg-surface-2 text-foreground"
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-medium leading-snug">{item.title}</div>
                    {item.description && (
                      <div className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex items-center gap-2 shrink-0">
                    <span className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {item.group}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
