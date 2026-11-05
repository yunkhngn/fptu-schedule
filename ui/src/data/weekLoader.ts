import { addDays, format, getISOWeek, getISOWeekYear, parseISO } from "date-fns";
import type { ClassSession } from "./types";

export type WeekLoadResult = { sessions: ClassSession[] } | { error: "login-required" | "failed" };
export type WeekLoader = (weekStartIso: string) => Promise<WeekLoadResult>;

type FapWindow = Window & {
  fetchAndExtractWeekSchedule?: (
    meta: Record<string, string | number>,
    doc: Document
  ) => Promise<{ success: boolean; schedule?: unknown[]; skipped?: number; loginRequired?: boolean }>;
  FapPageData?: { toTimetable?: (schedule: unknown[], now?: Date) => { sessions: ClassSession[] } };
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Week metadata in the shape the extension's `fetchAndExtractWeekSchedule` expects. */
function weekMeta(weekStartIso: string) {
  const monday = parseISO(weekStartIso);
  const sunday = addDays(monday, 6);
  const week = getISOWeek(monday);
  return {
    weekNumber: week,
    value: `${getISOWeekYear(monday)}-W${pad(week)}`,
    refDate: weekStartIso,
    startDate: weekStartIso,
    endDate: format(sunday, "yyyy-MM-dd"),
    label: `Tuần ${week} (${format(monday, "dd/MM")} - ${format(sunday, "dd/MM")})`,
  };
}

/**
 * Loads one week of the timetable from FAP using the extension's own (tested) fetcher.
 * Returns undefined when those helpers are not on the page, so the calendar simply stays on the loaded week.
 */
export function createFapWeekLoader(win?: Window): WeekLoader | undefined {
  const w = (win || (typeof window !== "undefined" ? window : undefined)) as FapWindow | undefined;
  if (!w || typeof w.fetchAndExtractWeekSchedule !== "function" || typeof w.FapPageData?.toTimetable !== "function") {
    return undefined;
  }

  return async (weekStartIso: string): Promise<WeekLoadResult> => {
    try {
      const res = await w.fetchAndExtractWeekSchedule!(weekMeta(weekStartIso), w.document);
      if (res.loginRequired) return { error: "login-required" };
      if (!res.success) return { error: "failed" };

      const parsed = w.FapPageData!.toTimetable!(res.schedule || [], new Date()).sessions;
      const weekEnd = format(addDays(parseISO(weekStartIso), 6), "yyyy-MM-dd");
      const inWeek = parsed.filter((s) => s.date >= weekStartIso && s.date <= weekEnd);
      // The server may answer with the current week when it does not understand the request. Showing those
      // classes under another week would be wrong, so treat "had classes, none in this week" as a failure.
      if (parsed.length > 0 && inWeek.length === 0) return { error: "failed" };
      return { sessions: inWeek };
    } catch (_) {
      return { error: "failed" };
    }
  };
}
