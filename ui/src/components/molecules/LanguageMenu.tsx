import React from "react";
import { Languages, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover } from "./Popover";
import type { TopbarLanguage } from "@/data/types";

export interface LanguageMenuProps {
  language: TopbarLanguage | null;
  onSelect?: (culture: string) => void;
  className?: string;
}

const pill =
  "inline-flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-foreground transition-colors duration-200 hover:bg-surface-2 outline-none focus-visible:ring-3 focus-visible:ring-primary/30";

export function LanguageMenu({ language, onSelect, className }: LanguageMenuProps) {
  if (!language || !language.options || language.options.length === 0) return null;

  const currentOption =
    language.options.find((opt) => opt.culture === language.current) || language.options[0];

  return (
    <Popover
      label={`Ngôn ngữ: ${currentOption.label}`}
      className="w-48 p-1.5"
      trigger={({ props, ref }) => (
        <button
          ref={ref}
          type="button"
          {...props}
          className={cn(pill, className)}
        >
          <Languages className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <span>{currentOption.label}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      )}
    >
      {({ close }) => (
        <div role="radiogroup" aria-label="Chọn ngôn ngữ" className="space-y-0.5">
          {language.options.map((option) => {
            const isSelected = option.culture === language.current;
            return (
              <button
                key={option.culture}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  onSelect?.(option.culture);
                  close();
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 text-left outline-none",
                  isSelected
                    ? "bg-primary-soft text-primary-strong font-semibold"
                    : "text-foreground hover:bg-surface-2"
                )}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="size-4 text-primary-strong" />}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

