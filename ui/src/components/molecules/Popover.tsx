import React, {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type ButtonHTMLAttributes,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";

// Global tracker to ensure opening one popover closes all other open popovers
const openPopovers = new Set<() => void>();

export interface PopoverTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-haspopup": "menu" | "dialog";
  "aria-expanded": boolean;
  onClick: () => void;
}

export interface PopoverProps {
  label: string;
  trigger: (p: {
    open: boolean;
    toggle: () => void;
    ref: RefObject<HTMLButtonElement | null>;
    props: PopoverTriggerProps;
  }) => ReactNode;
  children: (p: { close: () => void }) => ReactNode;
  align?: "start" | "end";
  role?: "menu" | "dialog";
  className?: string;
}

export function Popover({
  label,
  trigger,
  children,
  align = "end",
  role = "menu",
  className,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
  };

  const toggle = () => {
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;

    // Close other popovers when this opens
    for (const closeOther of openPopovers) {
      if (closeOther !== close) {
        closeOther();
      }
    }
    openPopovers.add(close);

    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const path = event.composedPath();
      if (containerRef.current && !path.includes(containerRef.current)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      openPopovers.delete(close);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const triggerProps: PopoverTriggerProps = {
    "aria-haspopup": role,
    "aria-expanded": open,
    onClick: toggle,
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      {trigger({ open, toggle, ref: triggerRef, props: triggerProps })}
      {open && (
        <div
          role={role}
          aria-label={label}
          className={cn(
            "absolute top-full mt-2 z-50 rounded-2xl border border-border bg-popover text-popover-foreground p-1 shadow-elevated",
            align === "end" ? "right-0" : "left-0",
            className
          )}
        >
          {children({ close })}
        </div>
      )}
    </div>
  );
}
