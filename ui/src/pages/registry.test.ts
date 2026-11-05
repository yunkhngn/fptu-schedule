import { describe, it, expect } from "vitest";
import { registry } from "./registry";

describe("page registry", () => {
  it("contains the registered page definitions", () => {
    const keys = Object.keys(registry).sort();
    expect(keys).toEqual([
      "exams",
      "news",
      "overview",
      "report-attendance",
      "report-grade",
      "report-ojt-conditions",
      "report-thesis-conditions",
      "report-transcript",
      "timetable",
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
