import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TimetablePage } from "./Timetable";
import type { ClassSession } from "@/data/types";
import type { WeekLoader } from "@/data/weekLoader";

const base = {
  slot: 3,
  time: "12:50-15:10",
  mode: "offline" as const,
  attendance: "not-yet" as const,
};
const thisWeek: ClassSession[] = [{ ...base, id: "a", date: "2026-11-03", courseCode: "PRM393" }];
const nextWeek: ClassSession[] = [{ ...base, id: "b", date: "2026-11-10", courseCode: "WDP301" }];

describe("TimetablePage week navigation", () => {
  it("loads the next week from FAP when the student presses 'Tuần sau'", async () => {
    const loadWeek = vi.fn<WeekLoader>(async () => ({ sessions: nextWeek }));
    render(<TimetablePage sessions={thisWeek} weekStart="2026-11-02" loadWeek={loadWeek} />);

    expect(screen.getByText("PRM393")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tuần sau" }));

    expect(loadWeek).toHaveBeenCalledWith("2026-11-09");
    expect(await screen.findByText("WDP301")).not.toBeNull();
    expect(screen.queryByText("PRM393")).toBeNull();
  });

  it("goes back to a week that is already loaded without asking FAP again", async () => {
    const loadWeek = vi.fn<WeekLoader>(async () => ({ sessions: nextWeek }));
    render(<TimetablePage sessions={thisWeek} weekStart="2026-11-02" loadWeek={loadWeek} />);

    fireEvent.click(screen.getByRole("button", { name: "Tuần sau" }));
    await screen.findByText("WDP301");
    fireEvent.click(screen.getByRole("button", { name: "Tuần trước" }));

    expect(await screen.findByText("PRM393")).not.toBeNull();
    expect(loadWeek).toHaveBeenCalledTimes(1);
  });

  it("shows an error with a retry that loads the week", async () => {
    const loadWeek = vi
      .fn<WeekLoader>()
      .mockResolvedValueOnce({ error: "failed" })
      .mockResolvedValueOnce({ sessions: nextWeek });
    render(<TimetablePage sessions={thisWeek} weekStart="2026-11-02" loadWeek={loadWeek} />);

    fireEvent.click(screen.getByRole("button", { name: "Tuần sau" }));
    fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));

    await waitFor(() => expect(screen.getByText("WDP301")).not.toBeNull());
    expect(loadWeek).toHaveBeenCalledTimes(2);
  });

  it("keeps working on the loaded week when FAP's helpers are not available", () => {
    render(<TimetablePage sessions={thisWeek} weekStart="2026-11-02" />);
    fireEvent.click(screen.getByRole("button", { name: "Tuần sau" }));
    // No loader: it just shows the (empty) next week without an error or a spinner.
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
