import { describe, it, expect, vi } from "vitest";
import { createFapWeekLoader } from "./weekLoader";

const raw = (date: string, slot = "Slot 3") => ({
  title: "PRM393",
  date,
  slot,
  location: "DE-338",
  attendanceStatus: "attended",
  isOnline: false,
  description: "SE1938 - NJ - duongtb",
  rawDate: { timeRange: "12:50-15:10" },
});

function makeWin(fetchWeek: unknown) {
  return {
    document: window.document,
    FapPageData: (window as any).FapPageData,
    fetchAndExtractWeekSchedule: fetchWeek,
  } as unknown as Window;
}

describe("createFapWeekLoader", () => {
  it("asks FAP for the requested week with the metadata its fetcher expects", async () => {
    const fetchWeek = vi.fn(async () => ({ success: true, schedule: [raw("10/11/2026")], skipped: 0 }));
    const load = createFapWeekLoader(makeWin(fetchWeek))!;

    const result = await load("2026-11-09");

    expect(fetchWeek).toHaveBeenCalledTimes(1);
    const [meta] = fetchWeek.mock.calls[0] as unknown as [Record<string, string>];
    expect(meta).toMatchObject({
      value: "2026-W46",
      refDate: "2026-11-09",
      startDate: "2026-11-09",
      endDate: "2026-11-15",
      label: "Tuần 46 (09/11 - 15/11)",
    });
    expect(result).toEqual({
      sessions: [expect.objectContaining({ date: "2026-11-10", slot: 3, courseCode: "PRM393" })],
    });
  });

  it("uses the ISO week-year for a week that starts in the previous calendar year", async () => {
    const fetchWeek = vi.fn(async () => ({ success: true, schedule: [], skipped: 0 }));
    await createFapWeekLoader(makeWin(fetchWeek))!("2025-12-29");
    const [meta] = fetchWeek.mock.calls[0] as unknown as [Record<string, string>];
    expect(meta.value).toBe("2026-W01");
    expect(meta.startDate).toBe("2025-12-29");
  });

  it("returns an empty list for a week without classes", async () => {
    const load = createFapWeekLoader(makeWin(async () => ({ success: true, schedule: [], skipped: 0 })))!;
    expect(await load("2026-11-16")).toEqual({ sessions: [] });
  });

  it("reports an expired session instead of an empty week", async () => {
    const load = createFapWeekLoader(makeWin(async () => ({ success: false, loginRequired: true })))!;
    expect(await load("2026-11-09")).toEqual({ error: "login-required" });
  });

  it("reports a failure when FAP could not be read, and when the fetcher throws", async () => {
    expect(await createFapWeekLoader(makeWin(async () => ({ success: false })))!("2026-11-09")).toEqual({
      error: "failed",
    });
    expect(
      await createFapWeekLoader(
        makeWin(async () => {
          throw new Error("network");
        })
      )!("2026-11-09")
    ).toEqual({ error: "failed" });
  });

  it("refuses sessions that belong to another week, which happens when the server falls back to the current week", async () => {
    // Asked for 09/11 - 15/11, but the response only holds the week of 02/11.
    const load = createFapWeekLoader(
      makeWin(async () => ({ success: true, schedule: [raw("03/11/2026"), raw("04/11/2026")], skipped: 0 }))
    )!;
    expect(await load("2026-11-09")).toEqual({ error: "failed" });
  });

  it("keeps only the sessions of the requested week when the response mixes weeks", async () => {
    const load = createFapWeekLoader(
      makeWin(async () => ({ success: true, schedule: [raw("10/11/2026"), raw("03/11/2026")], skipped: 0 }))
    )!;
    const result = await load("2026-11-09");
    expect(result).toEqual({ sessions: [expect.objectContaining({ date: "2026-11-10" })] });
  });

  it("is unavailable when the extension's FAP helpers are missing", () => {
    expect(createFapWeekLoader({ document: window.document } as unknown as Window)).toBeUndefined();
  });
});
