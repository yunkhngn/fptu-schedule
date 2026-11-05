// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { createFapWeekLoader } from "./weekLoader";

const req = createRequire(import.meta.url);
const { JSDOM } = req("jsdom");
const scraper = req("../../../content.js");
const FapPageData = req("../../../lib/fap-page-data.js");

// week.html is a saved FAP page for the week 21/09 - 27/09/2026 (10 classes).
const weekHtml = fs.readFileSync(path.resolve(__dirname, "../../../tests/fixtures/week.html"), "utf8");

describe("week loader with the extension's real fetcher", () => {
  const originalFetch = globalThis.fetch;
  const originalParser = (globalThis as any).DOMParser;

  beforeEach(() => {
    (globalThis as any).DOMParser = new JSDOM("").window.DOMParser;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    (globalThis as any).DOMParser = originalParser;
  });

  function loaderFor(fetchImpl: typeof fetch) {
    globalThis.fetch = fetchImpl;
    // The page the student is on: FAP's container exists but shows another week.
    const doc = new JSDOM('<div id="weekly-timetable-container" data-fetch-url="/WeeklyTimetable/WeekPartial" data-reference-date="2026-11-04"></div>').window.document;
    const win = {
      document: doc,
      fetchAndExtractWeekSchedule: scraper.fetchAndExtractWeekSchedule,
      FapPageData,
    } as unknown as Window;
    return createFapWeekLoader(win)!;
  }

  it("reads the requested week through a request FAP understands", async () => {
    const fetchMock = vi.fn(async () => new Response(weekHtml, { status: 200 })) as unknown as typeof fetch;
    const result = await loaderFor(fetchMock)("2026-09-21");

    const firstUrl = String((fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(firstUrl).toContain("/WeeklyTimetable/WeekPartial");
    expect(firstUrl).toContain("referenceDate=2026-09-21");
    expect("sessions" in result && result.sessions).toHaveLength(10);
    expect(result).toEqual({
      sessions: expect.arrayContaining([
        expect.objectContaining({ date: "2026-09-27", slot: 1, courseCode: "EXE201", mode: "online" }),
      ]),
    });
  });

  it("does not show another week's classes when the server answers with a different week", async () => {
    // Asked for 09/11 - 15/11 but the server returns the 21/09 - 27/09 page: the date check must reject it.
    const result = await loaderFor((async () => new Response(weekHtml, { status: 200 })) as unknown as typeof fetch)(
      "2026-11-09"
    );
    expect(result).toEqual({ error: "failed" });
  });

  it("reports an expired session when FAP redirects to the login page", async () => {
    const result = await loaderFor((async () => new Response("", { status: 401 })) as unknown as typeof fetch)(
      "2026-09-21"
    );
    expect(result).toEqual({ error: "login-required" });
  });
});
