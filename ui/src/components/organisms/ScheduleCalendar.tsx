import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  getISOWeek,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clock3,
  MapPin,
  UserRound,
  Video,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { EmptyState } from "@/components/molecules/EmptyState";
import type { ClassSession, Attendance } from "@/data/types";

const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const shortDay = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const courseNames: Record<string, string> = {
  WDP301: "Dự án phát triển Web",
  MLN122: "Kinh tế chính trị Mác-Lênin",
  PRM393: "Lập trình di động",
  ITE302c: "Đạo đức trong CNTT",
};

const attendanceMeta: Record<
  Attendance,
  { label: string; icon: typeof CheckCircle2; card: string; badge: string }
> = {
  attended: {
    label: "Có mặt",
    icon: CheckCircle2,
    card: "border-success/25 bg-success-soft/50",
    badge: "bg-success-soft text-success-strong",
  },
  absent: {
    label: "Vắng mặt",
    icon: XCircle,
    card: "border-danger/25 bg-danger-soft/50",
    badge: "bg-danger-soft text-danger-strong",
  },
  "not-yet": {
    label: "Chưa diễn ra",
    icon: CircleDashed,
    card: "border-primary/25 bg-primary-soft/45",
    badge: "bg-surface text-primary-strong",
  },
};

export interface ScheduleCalendarProps {
  sessions: ClassSession[];
  initialWeekStart?: string;
  className?: string;
}

export function ScheduleCalendar({
  sessions,
  initialWeekStart = "2026-11-02",
  className,
}: ScheduleCalendarProps) {
  const [today, setToday] = useState<Date | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => parseISO(initialWeekStart));
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    const start = parseISO(initialWeekStart);
    const idx = Math.floor((now.getTime() - start.getTime()) / (7 * 864e5));
    setSelectedDay(idx === 0 ? (now.getDay() + 6) % 7 : 0);
  }, [initialWeekStart]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const parsed = useMemo(
    () => sessions.map((s) => ({ ...s, day: parseISO(s.date) })),
    [sessions]
  );
  const weekSessions = parsed.filter((s) => days.some((d) => isSameDay(d, s.day)));
  const slots = [...new Set(weekSessions.map((s) => s.slot))].sort((a, b) => a - b);
  const at = (day: Date, slot: number) =>
    weekSessions.find((s) => isSameDay(s.day, day) && s.slot === slot);
  const dayHas = (day: Date) => weekSessions.some((s) => isSameDay(s.day, day));
  const slotTime = (slot: number) => weekSessions.find((s) => s.slot === slot)?.time;

  const goToday = () => {
    const now = today ?? new Date();
    setWeekStart(startOfWeek(now, { weekStartsOn: 1 }));
    setSelectedDay((now.getDay() + 6) % 7);
  };

  const columns = days
    .map((d) => (dayHas(d) ? "minmax(168px,1.6fr)" : "minmax(76px,0.7fr)"))
    .join(" ");

  const selected = days[selectedDay]!;
  const daySessions = weekSessions
    .filter((s) => isSameDay(s.day, selected))
    .sort((a, b) => a.slot - b.slot);

  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-strong">
            <CalendarDays className="size-[18px]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight">
              Tuần {getISOWeek(weekStart)}, {format(weekStart, "yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(weekStart, "dd/MM")} – {format(addDays(weekStart, 6), "dd/MM/yyyy")}
              {weekSessions.length > 0 && ` · ${weekSessions.length} buổi học`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Tuần trước"
            onClick={() => setWeekStart(addWeeks(weekStart, -1))}
          >
            <ChevronLeft className="size-4" />{" "}
            <span className="hidden sm:inline">Tuần trước</span>
          </Button>
          <Button variant="soft" size="sm" onClick={goToday}>
            Tuần hiện tại
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Tuần sau"
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
          >
            <span className="hidden sm:inline">Tuần sau</span>{" "}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Mobile day picker */}
      <div className="scrollbar-thin flex gap-1.5 overflow-x-auto border-b border-border px-4 py-3 md:hidden">
        {days.map((d, i) => {
          const isToday = today && isSameDay(d, today);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDay(i)}
              className={cn(
                "relative flex min-w-[48px] flex-1 flex-col items-center rounded-2xl px-2 py-2 text-xs transition-colors duration-200 cursor-pointer",
                selectedDay === i
                  ? "bg-ink text-ink-foreground"
                  : isToday
                  ? "bg-primary-soft text-primary-strong"
                  : "text-muted-foreground hover:bg-surface-2"
              )}
            >
              <span>{shortDay[i]}</span>
              <span className="mt-0.5 text-[15px] font-semibold">{format(d, "d")}</span>
              <span
                className={cn(
                  "mt-1 h-1 w-1 rounded-full",
                  dayHas(d)
                    ? selectedDay === i
                      ? "bg-ink-foreground"
                      : "bg-primary"
                    : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>

      {weekSessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Chưa có lịch học"
          description="Lịch học sẽ hiển thị tại đây khi được đồng bộ từ hệ thống FAP."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekStart(parseISO(initialWeekStart))}
            >
              Về tuần có lịch học
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop week grid */}
          <div className="scrollbar-thin hidden overflow-x-auto md:block">
            <div
              className="grid min-w-[960px]"
              style={{ gridTemplateColumns: `76px ${columns}` }}
            >
              <div className="border-b border-border bg-surface-2/50" />
              {days.map((d, i) => {
                const isToday = today && isSameDay(d, today);
                return (
                  <div
                    key={i}
                    className={cn(
                      "border-b border-l border-border px-3 py-3 text-center",
                      isToday ? "bg-primary-soft/60" : "bg-surface-2/50"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs",
                        isToday ? "font-medium text-primary-strong" : "text-muted-foreground"
                      )}
                    >
                      {dayNames[i]}
                    </p>
                    <p
                      className={cn(
                        "mx-auto mt-1 grid h-8 min-w-8 place-items-center rounded-full px-1 text-sm font-semibold",
                        isToday && "bg-primary text-primary-foreground shadow-soft"
                      )}
                    >
                      {format(d, "dd/MM")}
                    </p>
                  </div>
                );
              })}
              {slots.map((slot) => (
                <div key={slot} className="contents">
                  <div className="flex flex-col items-center justify-center gap-0.5 border-b border-border px-2 py-3 text-center">
                    <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                      Slot
                    </span>
                    <span className="text-lg font-semibold">{slot}</span>
                    {slotTime(slot) && (
                      <span className="text-[10.5px] leading-tight text-muted-foreground">
                        {slotTime(slot)!.replace("-", "–")}
                      </span>
                    )}
                  </div>
                  {days.map((d, i) => {
                    const s = at(d, slot);
                    const isToday = today && isSameDay(d, today);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "min-h-[132px] border-b border-l border-border p-2",
                          isToday && "bg-primary-soft/25"
                        )}
                      >
                        {s ? (
                          <SessionCard s={s} />
                        ) : (
                          <div className="grid h-full place-items-center text-muted-foreground/40">
                            –
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile day list */}
          <div className="space-y-3 p-4 md:hidden">
            <p className="text-[13px] font-medium">
              {dayNames[selectedDay]}, {format(selected, "dd/MM/yyyy")}
            </p>
            {daySessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
                Không có lịch học trong ngày này
              </div>
            ) : (
              daySessions.map((s) => (
                <div key={s.id} className="grid grid-cols-[52px_minmax(0,1fr)] gap-3">
                  <div className="flex flex-col items-center pt-3">
                    <span className="text-[10.5px] tracking-wide text-muted-foreground uppercase">
                      Slot
                    </span>
                    <span className="text-lg font-semibold">{s.slot}</span>
                  </div>
                  <SessionCard s={s} />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SessionCard({ s }: { s: ClassSession }) {
  const meta = attendanceMeta[s.attendance];
  const StatusIcon = meta.icon;
  const name = courseNames[s.courseCode];
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-2 rounded-2xl border p-3 text-xs transition-shadow duration-200 ease-natural hover:shadow-float",
        meta.card
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold tracking-tight" title={name}>
            {s.courseCode}
          </p>
          <p className="truncate text-[11.5px] text-muted-foreground">{s.classCode}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
            meta.badge
          )}
        >
          <StatusIcon className="size-3" /> {meta.label}
        </span>
      </div>
      <div className="space-y-1 text-foreground/80">
        <p className="flex items-center gap-1.5 font-medium text-warning-strong">
          <Clock3 className="size-3.5" /> {s.time}
        </p>
        <p className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-muted-foreground" /> {s.room}
          <span className="text-muted-foreground">·</span>
          {s.mode === "online" ? (
            <span className="inline-flex items-center gap-1 text-success-strong">
              <Wifi className="size-3" /> Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <WifiOff className="size-3" /> Offline
            </span>
          )}
        </p>
        <p className="flex items-center gap-1.5">
          <UserRound className="size-3.5 text-muted-foreground" /> {s.lecturer}
        </p>
      </div>
      {s.hasMeetLink && (
        <Button
          variant="outline"
          size="sm"
          className="mt-auto h-7 w-full rounded-xl text-[11.5px]"
        >
          <Video className="size-3" /> Link Meet
        </Button>
      )}
    </div>
  );
}
