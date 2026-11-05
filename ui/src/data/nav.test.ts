import { describe, it, expect } from "vitest";
import { NAV_GROUPS, FAP_URLS, navHref, isParent } from "./nav";

describe("navigation mapping and FAP URLs", () => {
  it("maps /thoi-khoa-bieu to /WeeklyTimetable", () => {
    expect(navHref("/thoi-khoa-bieu")).toBe("/WeeklyTimetable");
    expect(navHref("/lich-thi")).toBe("/ExamSchedule");
    expect(navHref("/tin-tuc")).toBe("/News");
    expect(navHref("/")).toBe("/");
  });

  it("ensures every leaf item across all NAV_GROUPS resolves to a non-empty FAP URL", () => {
    expect(NAV_GROUPS.length).toBeGreaterThan(0);

    for (const group of NAV_GROUPS) {
      expect(group.items.length).toBeGreaterThan(0);
      for (const item of group.items) {
        if (isParent(item)) {
          for (const child of item.children) {
            const href = navHref(child.to);
            expect(href.length).toBeGreaterThan(0);
            expect(href.startsWith("/")).toBe(true);
          }
        } else {
          const href = navHref(item.to);
          expect(href.length).toBeGreaterThan(0);
          expect(href.startsWith("/")).toBe(true);
        }
      }
    }
  });
});
