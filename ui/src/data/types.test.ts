import { describe, it, expect } from "vitest";
import { mockPageData } from "./mock";

describe("data contract and mock data", () => {
  it("generates overview page data meeting the contract", () => {
    const data = mockPageData("overview");
    expect(data.page).toBe("overview");
    expect(data.shell).toBeDefined();
    expect(data.shell.student.name).toBeTruthy();
    expect(data.shell.student.studentId).toBeTruthy();
    expect(data.shell.student.initials).toBeTruthy();
    expect(data.shell.campus).toBeTruthy();

    if (data.page === "overview") {
      expect(data.home).toBeDefined();
      expect(data.home.metrics).toBeDefined();
      expect(Array.isArray(data.home.news)).toBe(true);
      expect(data.home.news.length).toBeGreaterThan(0);
      expect(Array.isArray(data.home.categories)).toBe(true);
    }
  });

  it("generates timetable page data with exactly 10 sessions and valid weekStart", () => {
    const data = mockPageData("timetable");
    expect(data.page).toBe("timetable");

    if (data.page === "timetable") {
      expect(data.sessions).toHaveLength(10);
      expect(data.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      for (const session of data.sessions) {
        expect(session.id).toBeTruthy();
        expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof session.slot).toBe("number");
        expect(session.time).toBeTruthy();
        expect(session.courseCode).toBeTruthy();
        expect(["online", "offline"]).toContain(session.mode);
        expect(["attended", "absent", "not-yet"]).toContain(session.attendance);
      }
    }
  });

  it("generates exams page data meeting the contract", () => {
    const data = mockPageData("exams");
    expect(data.page).toBe("exams");

    if (data.page === "exams") {
      expect(data.exams.length).toBeGreaterThan(0);
      for (const exam of data.exams) {
        expect(exam.courseCode).toBeTruthy();
        expect(exam.date).toBeTruthy();
        expect(exam.time).toBeTruthy();
      }
    }
  });

  it("generates news page data meeting the contract", () => {
    const data = mockPageData("news");
    expect(data.page).toBe("news");

    if (data.page === "news") {
      expect(data.news.length).toBeGreaterThan(0);
      expect(data.categories.length).toBeGreaterThan(0);
      for (const item of data.news) {
        expect(item.id).toBeTruthy();
        expect(item.title).toBeTruthy();
        expect(item.category).toBeTruthy();
        expect(item.publishedAt).toBeTruthy();
        expect(item.href).toBeTruthy();
      }
    }
  });
});
