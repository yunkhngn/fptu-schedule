import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React from "react";
import {
  AppSidebar,
  TopNavigation,
  ScheduleCalendar,
  MiniCalendar,
  DataTable,
  AnnouncementList,
} from "./index";
import { AppShell } from "../templates/AppShell";
import { PageHeader } from "../templates/PageHeader";
import type { ClassSession, ShellData, NewsItemData } from "@/data/types";

const mockShell: ShellData = {
  student: {
    name: "Nguyen Van A",
    initials: "NA",
    studentId: "SE123456",
  },
  campus: "Cơ sở Hà Nội (HN)",
  unreadNotifications: 2,
};

describe("organisms and templates suite", () => {
  it("renders AppShell and highlights active navigation item for /WeeklyTimetable", () => {
    const onShowOriginal = vi.fn();
    const { container, getByRole } = render(
      <AppShell
        shell={mockShell}
        activePath="/WeeklyTimetable"
        onShowOriginal={onShowOriginal}
      >
        <div>Content</div>
      </AppShell>
    );

    const activeLink = container.querySelector('a[aria-current="page"]');
    expect(activeLink).not.toBeNull();
    expect(activeLink?.getAttribute("href")).toBe("/WeeklyTimetable");

    // The on/off switch lives in the "Giao diện FAP mới" card of the sidebar.
    const modernUiSwitch = getByRole("switch", { name: /giao diện FAP mới/i });
    expect(modernUiSwitch.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(modernUiSwitch);
    expect(onShowOriginal).toHaveBeenCalledTimes(1);
  });

  it("shows a layout icon on the 'Giao diện FAP mới' card, not the sparkle", () => {
    const { container } = render(
      <AppShell shell={mockShell} activePath="/" onShowOriginal={() => {}}>
        <div>Content</div>
      </AppShell>
    );
    expect(container.querySelector("svg.lucide-layout-template")).not.toBeNull();
    expect(container.querySelector("svg.lucide-sparkles")).toBeNull();
  });

  it("does not repeat the switch as a button in the top bar, and shows no switch without a handler", () => {
    const { queryByRole, rerender } = render(
      <AppShell shell={mockShell} activePath="/" onShowOriginal={() => {}}>
        <div>Content</div>
      </AppShell>
    );
    expect(queryByRole("button", { name: /Xem bản FAP gốc/i })).toBeNull();

    rerender(
      <AppShell shell={mockShell} activePath="/">
        <div>Content</div>
      </AppShell>
    );
    expect(queryByRole("switch")).toBeNull();
  });

  it("does not render ThemeToggle when onThemeChange is undefined in AppShell", () => {
    const { queryByRole } = render(
      <AppShell shell={mockShell} activePath="/">
        <div>Content</div>
      </AppShell>
    );
    expect(queryByRole("button", { name: /^Giao diện:/ })).toBeNull();
  });

  it("renders ThemeToggle in top bar when onThemeChange is provided to AppShell and forwards preference", () => {
    const onThemeChange = vi.fn();
    const { getByRole } = render(
      <AppShell
        shell={mockShell}
        activePath="/"
        themePreference="light"
        onThemeChange={onThemeChange}
      >
        <div>Content</div>
      </AppShell>
    );

    const toggleButton = getByRole("button", { name: "Giao diện: Sáng" });
    expect(toggleButton).not.toBeNull();
    fireEvent.click(toggleButton);
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  it("renders TopNavigation with campus info and unread badge, with static campus/language selector", () => {
    const { getByText } = render(
      <TopNavigation shell={mockShell} />
    );

    expect(getByText("Cơ sở Hà Nội (HN)")).not.toBeNull();
    expect(getByText("2")).not.toBeNull();
  });

  it("renders ScheduleCalendar with 3 sessions displayed in their respective day columns", () => {
    const sessions: ClassSession[] = [
      {
        id: "1",
        date: "2026-11-02",
        slot: 1,
        time: "07:30 - 09:50",
        courseCode: "PRN231",
        mode: "offline",
        room: "BE-301",
        attendance: "attended",
      },
      {
        id: "2",
        date: "2026-11-03",
        slot: 2,
        time: "10:00 - 12:20",
        courseCode: "SWP391",
        mode: "online",
        meetUrl: "https://meet.google.com/xyz",
        attendance: "not-yet",
      },
      {
        id: "3",
        date: "2026-11-04",
        slot: 3,
        time: "12:50 - 15:10",
        courseCode: "MLN111",
        mode: "offline",
        room: "AL-205",
        attendance: "absent",
      },
    ];

    const { getByText } = render(
      <ScheduleCalendar sessions={sessions} initialWeekStart="2026-11-02" />
    );

    expect(getByText("PRN231")).not.toBeNull();
    expect(getByText("SWP391")).not.toBeNull();
    expect(getByText("MLN111")).not.toBeNull();
  });

  it("renders ScheduleCalendar gracefully when sessions array is empty", () => {
    const { getByText } = render(
      <ScheduleCalendar sessions={[]} initialWeekStart="2026-11-02" />
    );
    expect(getByText("Chưa có lịch học")).not.toBeNull();
  });

  it("renders MiniCalendar with deterministic today prop", () => {
    const today = new Date(2026, 10, 5); // 2026-11-05
    const { getByText } = render(<MiniCalendar today={today} />);
    expect(getByText("Tháng 11, 2026")).not.toBeNull();
  });

  it("renders DataTable with headers and row data", () => {
    const columns = ["Mã môn", "Tên môn", "Phòng", "Thời gian"];
    const rows = [
      ["PRN231", "Building Cross-Platform Apps", "BE-301", "07:30"],
      ["SWP391", "Software Development Project", "AL-202", "10:00"],
    ];

    const { getByText } = render(<DataTable columns={columns} rows={rows} />);
    expect(getByText("Building Cross-Platform Apps")).not.toBeNull();
    expect(getByText("Software Development Project")).not.toBeNull();
  });

  it("renders AnnouncementList with news items", () => {
    const items: NewsItemData[] = [
      {
        id: "1",
        title: "Thông báo nộp học phí học kỳ Fall 2026",
        category: "Thông báo tài chính",
        publishedAt: "2026-11-01",
        href: "/News/Detail/1",
      },
    ];

    const { getByText } = render(<AnnouncementList items={items} />);
    expect(getByText("Thông báo nộp học phí học kỳ Fall 2026")).not.toBeNull();
  });

  it("renders PageHeader with eyebrow, title, description, and actions", () => {
    const { getByText } = render(
      <PageHeader
        eyebrow="Lịch học"
        title="Thời khóa biểu"
        description="Lịch học các môn trong tuần"
        actions={<button>Export</button>}
      />
    );

    expect(getByText("Lịch học")).not.toBeNull();
    expect(getByText("Thời khóa biểu")).not.toBeNull();
    expect(getByText("Lịch học các môn trong tuần")).not.toBeNull();
    expect(getByText("Export")).not.toBeNull();
  });
});

