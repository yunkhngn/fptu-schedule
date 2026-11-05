export type PageId = "overview" | "timetable" | "exams" | "news";

export function matchPage(pathname: string): PageId | null {
  if (typeof pathname !== "string") return null;

  const normalized = pathname.trim().replace(/\/+$/, "");

  if (normalized === "" || normalized === "/") {
    return "overview";
  }

  if (normalized.startsWith("/Auth") || normalized.startsWith("/Default")) {
    return null;
  }

  if (normalized === "/WeeklyTimetable" || normalized.startsWith("/WeeklyTimetable/")) {
    return "timetable";
  }

  if (normalized === "/ExamSchedule" || normalized.startsWith("/ExamSchedule/")) {
    return "exams";
  }

  if (normalized === "/News" || normalized === "/News/Index") {
    return "news";
  }

  if (normalized.startsWith("/News/Detail")) {
    return null;
  }

  return null;
}
