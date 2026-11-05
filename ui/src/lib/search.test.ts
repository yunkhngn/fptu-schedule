import { describe, it, expect } from "vitest";
import { searchTargets, filterTargets } from "./search";
import { navHref } from "@/data/nav";

describe("search targets and filtering", () => {
  it("collects all navigable targets from nav groups", () => {
    const targets = searchTargets();
    expect(targets.length).toBeGreaterThan(10);
    const timetable = targets.find((t) => t.title === "Thời khóa biểu");
    expect(timetable).toBeDefined();
    expect(timetable?.href).toBe(navHref("/thoi-khoa-bieu"));
    expect(timetable?.group).toBe("Học tập");
  });

  it("filters with diacritic-insensitive and case-insensitive query", () => {
    const targets = searchTargets();

    // 'thoi khoa bieu' matches 'Thời khóa biểu' at top
    const timetableResults = filterTargets("thoi khoa bieu", targets);
    expect(timetableResults.length).toBeGreaterThan(0);
    expect(timetableResults[0].title).toBe("Thời khóa biểu");

    // 'diem danh' matches 'Báo cáo điểm danh'
    const attendanceResults = filterTargets("diem danh", targets);
    expect(attendanceResults.some((t) => t.title === "Báo cáo điểm danh")).toBe(true);

    // Empty query returns all targets
    const all = filterTargets("", targets);
    expect(all.length).toBe(targets.length);

    // Unmatched query returns empty array
    const none = filterTargets("zzzz", targets);
    expect(none).toEqual([]);
  });
});
