import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Accessible name; the switch has no visible text of its own. */
  label: string;
  className?: string;
}

/** On/off switch. A plain button with role="switch", so it needs no extra dependency. */
export function Switch({ checked, onCheckedChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none transition-colors duration-200 ease-natural focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary-strong" : "bg-muted-foreground/40",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none block size-[18px] rounded-full bg-surface shadow-soft transition-transform duration-200 ease-natural",
          checked ? "translate-x-[23px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}
