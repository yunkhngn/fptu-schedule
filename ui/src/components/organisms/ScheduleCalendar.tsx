import { useMemo, useState } from "react";
import { addDays, addWeeks, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { EmptyState } from "@/components/molecules/EmptyState";
import type { ClassSession } from "@/data/types";

const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const shortDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const attendanceToneMap: Record<ClassSession["attendance"], "success" | "danger" | "lavender"> = {
  attended: "success",
  absent: "danger",
  "not-yet": "lavender",
};

const attendanceLabelMap: Record<ClassSession["attendance"], string> = {
  attended: "Có mặt",
  absent: "Vắng",
  "not-yet": "Chưa học",
};

export interface ScheduleCalendarProps {
  sessions: ClassSession[];
  initialWeekStart?: string;
  className?: string;
}

export function ScheduleCalendar({
  sessions,
  initialWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
  className,
}: ScheduleCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => parseISO(initialWeekStart));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const parsedSessions = useMemo(() => {
    return sessions.map((s) => ({
      ...s,
      parsedDate: parseISO(s.date),
    }));
  }, [sessions]);

  const weekSessions = useMemo(() => {
    return parsedSessions.filter((s) =>
      days.some((d) => isSameDay(d, s.parsedDate))
    );
  }, [parsedSessions, days]);

  const goPrevWeek = () => setWeekStart((ws) => addWeeks(ws, -1));
  const goNextWeek = () => setWeekStart((ws) => addWeeks(ws, 1));
  const goCurrentWeek = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className={cn("space-y-4", className)}>
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goCurrentWeek}>
            Tuần này
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon-sm" onClick={goPrevWeek} aria-label="Tuần trước">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={goNextWeek} aria-label="Tuần sau">
              <ChevronRight />
            </Button>
          </div>
          <span className="text-sm font-semibold tracking-tight">
            {`${format(days[0]!, "dd/MM")} - ${format(days[6]!, "dd/MM/yyyy")}`}
          </span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Chưa có lịch học"
          description="Hiện tại chưa có dữ liệu thời khóa biểu cho tuần này."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((day, idx) => {
            const daySessions = weekSessions
              .filter((s) => isSameDay(s.parsedDate, day))
              .sort((a, b) => a.slot - b.slot);

            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "surface-card flex flex-col min-h-[220px] p-3 transition-colors",
                  isToday && "ring-2 ring-primary/40 bg-primary-soft/10"
                )}
              >
                <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground uppercase">
                      {dayNames[idx]}
                    </span>
                    <span
                      className={cn(
                        "text-base font-bold",
                        isToday ? "text-primary-strong" : "text-foreground"
                      )}
                    >
                      {format(day, "dd/MM")}
                    </span>
                  </div>
                  {daySessions.length > 0 && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {daySessions.length} buổi
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2.5">
                  {daySessions.length === 0 ? (
                    <div className="grid h-full place-items-center py-6 text-center text-xs text-muted-foreground/60">
                      Nghỉ
                    </div>
                  ) : (
                    daySessions.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-xl border border-border/70 bg-surface p-2.5 shadow-soft transition-all hover:border-primary/40 hover:shadow-float"
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-1">
                          <span className="text-sm font-bold text-foreground">
                            {session.courseCode}
                          </span>
                          <StatusBadge
                            tone={attendanceToneMap[session.attendance]}
                            dot
                            className="text-[10px] px-1.5 py-0"
                          >
                            {attendanceLabelMap[session.attendance]}
                          </StatusBadge>
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock3 className="size-3 shrink-0" />
                            <span>Slot {session.slot} ({session.time})</span>
                          </div>

                          {session.mode === "online" ? (
                            <div className="flex items-center gap-1 text-primary-strong font-medium">
                              <Video className="size-3 shrink-0" />
                              {session.meetUrl ? (
                                <a
                                  href={session.meetUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline underline-offset-2 hover:text-primary"
                                >
                                  Học online (Meet)
                                </a>
                              ) : (
                                <span>Học online</span>
                              )}
                            </div>
                          ) : (
                            session.room && (
                              <div className="flex items-center gap-1">
                                <MapPin className="size-3 shrink-0" />
                                <span>Phòng {session.room}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
