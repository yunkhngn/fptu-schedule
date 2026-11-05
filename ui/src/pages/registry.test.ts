import { describe, it, expect } from "vitest";
import { registry } from "./registry";

describe("page registry", () => {
  it("contains the registered page definitions", () => {
    const keys = Object.keys(registry).sort();
    expect(keys).toEqual([
      "application",
      "application-catalog",
      "cross-class-change",
      "curriculum",
      "document",
      "exams",
      "fye-check-in-log",
      "fye-mentor-feedback",
      "my-certificates",
      "news",
      "overview",
      "report-attendance",
      "report-grade",
      "report-ojt-conditions",
      "report-thesis-conditions",
      "report-transcript",
      "startup-group",
      "subject",
      "timetable",
      "transaction",
      "wishlist",
    ]);
  });

  it("each page definition conforms to the PageDefinition interface", () => {
    for (const [key, def] of Object.entries(registry)) {
      expect(def.id).toBe(key);
      expect(typeof def.read).toBe("function");
      expect(typeof def.Component).toBe("function");
      if (def.ready) {
        expect(typeof def.ready).toBe("function");
      }
    }
  });
});
