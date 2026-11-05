import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useWeekSessions } from "./useWeekSessions";
import type { ClassSession } from "@/data/types";
import type { WeekLoader } from "@/data/weekLoader";

const session = (id: string, date: string): ClassSession => ({
  id,
  date,
  slot: 1,
  time: "07:30-09:50",
  courseCode: "PRM393",
  mode: "offline",
  attendance: "not-yet",
});

const INITIAL = [session("a", "2026-11-03")];

describe("useWeekSessions", () => {
  it("starts with the sessions that were already read from the page and does not refetch that week", () => {
    const loader = vi.fn<WeekLoader>();
    const { result } = renderHook(() => useWeekSessions(INITIAL, "2026-11-02", loader));

    expect(result.current.sessions).toEqual(INITIAL);
    expect(result.current.status).toBe("idle");
    act(() => result.current.requestWeek("2026-11-02"));
    expect(loader).not.toHaveBeenCalled();
  });

  it("loads another week, shows a loading state meanwhile and merges the result", async () => {
    let finish!: (v: { sessions: ClassSession[] }) => void;
    const loader = vi.fn<WeekLoader>(() => new Promise((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useWeekSessions(INITIAL, "2026-11-02", loader));

    act(() => result.current.requestWeek("2026-11-09"));
    expect(result.current.status).toBe("loading");
    expect(loader).toHaveBeenCalledWith("2026-11-09");

    await act(async () => finish({ sessions: [session("b", "2026-11-10")] }));
    expect(result.current.status).toBe("idle");
    expect(result.current.sessions.map((s) => s.id).sort()).toEqual(["a", "b"]);
  });

  it("does not fetch a week twice", async () => {
    const loader = vi.fn<WeekLoader>(async () => ({ sessions: [session("b", "2026-11-10")] }));
    const { result } = renderHook(() => useWeekSessions(INITIAL, "2026-11-02", loader));

    await act(async () => result.current.requestWeek("2026-11-09"));
    await act(async () => result.current.requestWeek("2026-11-09"));
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("reports an error and retries the same week", async () => {
    const loader = vi
      .fn<WeekLoader>()
      .mockResolvedValueOnce({ error: "failed" })
      .mockResolvedValueOnce({ sessions: [session("b", "2026-11-10")] });
    const { result } = renderHook(() => useWeekSessions(INITIAL, "2026-11-02", loader));

    await act(async () => result.current.requestWeek("2026-11-09"));
    expect(result.current.status).toBe("error");

    await act(async () => result.current.retry());
    expect(loader).toHaveBeenCalledTimes(2);
    expect(loader).toHaveBeenLastCalledWith("2026-11-09");
    expect(result.current.status).toBe("idle");
    expect(result.current.sessions).toHaveLength(2);
  });

  it("reports an expired session separately", async () => {
    const loader = vi.fn<WeekLoader>(async () => ({ error: "login-required" }));
    const { result } = renderHook(() => useWeekSessions(INITIAL, "2026-11-02", loader));
    await act(async () => result.current.requestWeek("2026-11-09"));
    expect(result.current.status).toBe("login-required");
  });

  it("ignores a slow answer for a week the student already left", async () => {
    const resolvers: Record<string, (v: { sessions: ClassSession[] }) => void> = {};
    const loader = vi.fn<WeekLoader>((week) => new Promise((resolve) => (resolvers[week] = resolve)));
    const { result } = renderHook(() => useWeekSessions(INITIAL, "2026-11-02", loader));

    act(() => result.current.requestWeek("2026-11-09"));
    act(() => result.current.requestWeek("2026-11-16"));
    // The first week answers late; the second one is still the one on screen.
    await act(async () => resolvers["2026-11-09"]({ sessions: [session("b", "2026-11-10")] }));
    expect(result.current.status).toBe("loading");

    await act(async () => resolvers["2026-11-16"]({ sessions: [session("c", "2026-11-17")] }));
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.sessions.map((s) => s.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("does nothing, and stays idle, when there is no loader", () => {
    const { result } = renderHook(() => useWeekSessions(INITIAL, "2026-11-02", undefined));
    act(() => result.current.requestWeek("2026-11-09"));
    expect(result.current.status).toBe("idle");
    expect(result.current.sessions).toEqual(INITIAL);
  });
});
