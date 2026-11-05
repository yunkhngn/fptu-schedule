import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  normalizeLang,
  dictionaries,
  I18nProvider,
  useT,
  useLang,
  dateLocale,
} from "./index";
import { AppShell } from "@/components/templates/AppShell";
import { TimetablePage } from "@/pages/Timetable";
import { mockPageData } from "@/data/mock";

describe("i18n dictionary integrity", () => {
  it("has matching keys between Vietnamese and English dictionaries with non-empty values", () => {
    const viKeys = Object.keys(dictionaries.vi).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    expect(viKeys).toEqual(enKeys);

    for (const key of viKeys) {
      expect(dictionaries.vi[key].trim().length).toBeGreaterThan(0);
      expect(dictionaries.en[key].trim().length).toBeGreaterThan(0);
    }
  });

  it("does not contain accented Vietnamese characters in English dictionary", () => {
    const vietnameseDiacritics = /[À-ỹ]/;
    for (const [key, value] of Object.entries(dictionaries.en)) {
      expect(
        vietnameseDiacritics.test(value),
        `English translation for key "${key}" contains Vietnamese characters: "${value}"`
      ).toBe(false);
    }
  });

  it("matches all interpolation parameters between vi and en", () => {
    const paramRegex = /\{(\w+)\}/g;
    for (const key of Object.keys(dictionaries.vi)) {
      const viParams = Array.from(dictionaries.vi[key].matchAll(paramRegex), (m) => m[1]).sort();
      const enParams = Array.from(dictionaries.en[key].matchAll(paramRegex), (m) => m[1]).sort();
      expect(enParams, `Parameter mismatch for key: ${key}`).toEqual(viParams);
    }
  });

  it("normalizeLang resolves valid language or falls back to 'vi'", () => {
    expect(normalizeLang("en")).toBe("en");
    expect(normalizeLang("vi")).toBe("vi");
    expect(normalizeLang("fr")).toBe("vi");
    expect(normalizeLang(undefined)).toBe("vi");
    expect(normalizeLang(null)).toBe("vi");
    expect(normalizeLang(42)).toBe("vi");
  });

  it("useT replaces parameters and returns key if missing", () => {
    function Consumer() {
      const t = useT();
      const lang = useLang();
      return (
        <div>
          <span data-testid="lang">{lang}</span>
          <span data-testid="missing">{t("missing.key")}</span>
        </div>
      );
    }

    render(
      <I18nProvider lang="en">
        <Consumer />
      </I18nProvider>
    );

    expect(screen.getByTestId("lang").textContent).toBe("en");
    expect(screen.getByTestId("missing").textContent).toBe("missing.key");
  });
});

describe("i18n rendering in components", () => {
  const timetableData = mockPageData("timetable");

  it("renders English navigation and page content when lang='en'", () => {
    render(
      <I18nProvider lang="en">
        <AppShell shell={timetableData.shell} activePath="/WeeklyTimetable">
          <TimetablePage
            sessions={timetableData.sessions}
            weekStart={timetableData.weekStart}
          />
        </AppShell>
      </I18nProvider>
    );

    // Sidebar should have "Overview" and not "Tổng quan"
    expect(screen.getByText("Overview")).toBeDefined();
    expect(screen.queryByText("Tổng quan")).toBeNull();

    // Timetable header should have English title
    expect(screen.getByRole("heading", { name: "Weekly Timetable" })).toBeDefined();
  });

  it("renders Vietnamese content when lang='vi'", () => {
    render(
      <I18nProvider lang="vi">
        <AppShell shell={timetableData.shell} activePath="/WeeklyTimetable">
          <TimetablePage
            sessions={timetableData.sessions}
            weekStart={timetableData.weekStart}
          />
        </AppShell>
      </I18nProvider>
    );

    expect(screen.getByText("Tổng quan")).toBeDefined();
    expect(screen.getByText("Thời khóa biểu tuần")).toBeDefined();
  });
});
