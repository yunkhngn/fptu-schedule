import { useCallback, useRef, useState } from "react";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import type { ClassSession } from "@/data/types";
import type { WeekLoader } from "@/data/weekLoader";

export type WeekStatus = "idle" | "loading" | "error" | "login-required";

const mondayOf = (iso: string) => format(startOfWeek(parseISO(iso), { weekStartsOn: 1 }), "yyyy-MM-dd");

/**
 * Keeps the sessions of every week the student has looked at. The page only starts with the week FAP
 * loaded; other weeks are fetched on demand, once, and merged.
 */
export function useWeekSessions(initial: ClassSession[], initialWeekStart: string, loader?: WeekLoader) {
  const [sessions, setSessions] = useState<ClassSession[]>(initial);
  const [status, setStatus] = useState<WeekStatus>("idle");
  const loaded = useRef<Set<string>>(new Set([mondayOf(initialWeekStart)]));
  const current = useRef<string>(mondayOf(initialWeekStart));
  const attempt = useRef(0);

  const load = useCallback(
    async (week: string) => {
      if (!loader) return;
      const mine = ++attempt.current;
      setStatus("loading");
      const result = await loader(week);
      // If the student moved on, a newer request owns the status; this answer is still worth keeping.
      const stale = mine !== attempt.current;

      if ("error" in result) {
        if (!stale) setStatus(result.error === "login-required" ? "login-required" : "error");
        return;
      }
      loaded.current.add(week);
      setSessions((prev) => {
        const end = format(addDays(parseISO(week), 6), "yyyy-MM-dd");
        const others = prev.filter((s) => s.date < week || s.date > end);
        return [...others, ...result.sessions];
      });
      if (!stale) setStatus("idle");
    },
    [loader]
  );

  const requestWeek = useCallback(
    (weekStartIso: string) => {
      const week = mondayOf(weekStartIso);
      current.current = week;
      if (!loader) return;
      if (loaded.current.has(week)) {
        attempt.current++; // cancels a slower request for another week
        setStatus("idle");
        return;
      }
      void load(week);
    },
    [loader, load]
  );

  const retry = useCallback(() => {
    void load(current.current);
  }, [load]);

  return { sessions, status, requestWeek, retry };
}
