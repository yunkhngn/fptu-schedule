import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { ScheduleCalendar } from "./ScheduleCalendar";
import type { ClassSession } from "@/data/types";

const sessions: ClassSession[] = [
  {
    id: "s1",
    date: "2026-11-03",
    slot: 3,
    time: "12:50-15:10",
    courseCode: "PRM393",
    mode: "offline",
    room: "DE-338",
    attendance: "attended",
  },
];

describe("ScheduleCalendar week navigation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("tells the page which week the student moved to, as the Monday of that week", () => {
    const onWeekChange = vi.fn();
    render(<ScheduleCalendar sessions={sessions} initialWeekStart="2026-11-02" onWeekChange={onWeekChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Tuần sau" }));
    expect(onWeekChange).toHaveBeenLastCalledWith("2026-11-09");

    fireEvent.click(screen.getByRole("button", { name: "Tuần sau" }));
    expect(onWeekChange).toHaveBeenLastCalledWith("2026-11-16");

    fireEvent.click(screen.getByRole("button", { name: "Tuần trước" }));
    expect(onWeekChange).toHaveBeenLastCalledWith("2026-11-09");
  });

  it("'Tuần hiện tại' goes back to the Monday of the current week", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-05T14:00:00"));
    const onWeekChange = vi.fn();
    render(<ScheduleCalendar sessions={sessions} initialWeekStart="2026-11-02" onWeekChange={onWeekChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Tuần sau" }));
    fireEvent.click(screen.getByRole("button", { name: "Tuần hiện tại" }));
    expect(onWeekChange).toHaveBeenLastCalledWith("2026-11-02");
  });

  it("works without onWeekChange (the design preview and the harness)", () => {
    render(<ScheduleCalendar sessions={sessions} initialWeekStart="2026-11-02" />);
    fireEvent.click(screen.getByRole("button", { name: "Tuần sau" }));
    expect(screen.getByText(/09\/11/)).not.toBeNull();
  });

  it("shows a loading message instead of 'no classes' while a week is being fetched", () => {
    render(<ScheduleCalendar sessions={[]} initialWeekStart="2026-11-09" status="loading" onWeekChange={() => {}} />);
    expect(screen.getByRole("status").textContent).toMatch(/Đang tải/);
    expect(screen.queryByText("Chưa có lịch học")).toBeNull();
  });

  it("offers a retry when the week could not be loaded", () => {
    const onRetry = vi.fn();
    render(
      <ScheduleCalendar
        sessions={[]}
        initialWeekStart="2026-11-09"
        status="error"
        onRetry={onRetry}
        onWeekChange={() => {}}
      />
    );
    expect(screen.getByRole("alert").textContent).toMatch(/Không tải được/);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalled();
    expect(screen.queryByText("Chưa có lịch học")).toBeNull();
  });

  it("asks the student to sign in again when the FAP session has expired", () => {
    render(
      <ScheduleCalendar sessions={[]} initialWeekStart="2026-11-09" status="login-required" onWeekChange={() => {}} />
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/đăng nhập/i);
  });
});
