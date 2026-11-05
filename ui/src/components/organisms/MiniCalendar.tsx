import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";

const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export interface MiniCalendarProps {
  today?: Date;
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  className?: string;
}

export function MiniCalendar({
  today: propToday,
  selectedDate: propSelected,
  onSelectDate,
  className,
}: MiniCalendarProps) {
  const [currentDate] = useState(() => propToday || new Date());
  const [month, setMonth] = useState<Date>(() => startOfMonth(propToday || new Date()));

  useEffect(() => {
    if (propToday) {
      setMonth(startOfMonth(propToday));
    }
  }, [propToday]);

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
    });
  }, [month]);

  return (
    <div className={cn("surface-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold tracking-tight">
          {`Tháng ${format(month, "M, yyyy")}`}
        </p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Tháng trước"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Tháng sau"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekdays.map((w) => (
          <span key={w} className="py-1 font-medium text-muted-foreground">
            {w}
          </span>
        ))}
        {days.map((d) => {
          const isToday = isSameDay(d, propToday || currentDate);
          const inMonth = isSameMonth(d, month);
          const isSelected = propSelected ? isSameDay(d, propSelected) : false;

          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelectDate?.(d)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full text-xs font-medium cursor-pointer transition-colors mx-auto",
                !inMonth && "text-muted-foreground/40",
                inMonth && "text-foreground hover:bg-surface-2",
                isToday && "bg-primary-soft text-primary-strong font-semibold",
                isSelected && "bg-ink text-ink-foreground shadow-soft"
              )}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
