import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { mockPageData } from "@/data/mock";
import { OverviewPage } from "./Overview";
import { TimetablePage } from "./Timetable";
import { ExamsPage } from "./Exams";
import { NewsPage } from "./News";
import { renderPage } from "./index";
import type { PageData } from "@/data/types";

describe("OverviewPage", () => {
  it("renders greeting with student name, 5 metric cards, and filtered news items", () => {
    const data = mockPageData("overview") as Extract<PageData, { page: "overview" }>;
    render(<OverviewPage home={data.home} shell={data.shell} />);

    // Greeting has "Chào" and student name
    const greetingEl = screen.getByRole("heading", { level: 1 });
    expect(greetingEl.textContent).toContain("Chào");
    expect(greetingEl.textContent).toContain(data.shell.student.name);

    // 5 metric cards
    expect(screen.getByText("Trạng thái")).toBeTruthy();
    expect(screen.getByText("Mã chương trình")).toBeTruthy();
    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByText("Số dư")).toBeTruthy();
    expect(screen.getByText("Khóa")).toBeTruthy();

    // News list rendered
    expect(screen.getByText(data.home.news[0].title)).toBeTruthy();
    expect(screen.getByText(data.home.news[1].title)).toBeTruthy();

    // Filter by category
    const filterBtn = screen.getByRole("tab", { name: "Thông tin Đào tạo" });
    fireEvent.click(filterBtn);

    const daoTaoItem = data.home.news.find((n) => n.category === "Thông tin Đào tạo");
    expect(screen.getByText(daoTaoItem!.title)).toBeTruthy();
  });
});

describe("TimetablePage", () => {
  it("renders header, calendar with sessions, and reference cards", () => {
    const data = mockPageData("timetable") as Extract<PageData, { page: "timetable" }>;
    render(<TimetablePage sessions={data.sessions} weekStart={data.weekStart} />);

    expect(screen.getByText("Thời khóa biểu tuần")).toBeTruthy();
    expect(screen.getByText("Chú thích")).toBeTruthy();
    expect(screen.getByText("Ký hiệu phòng học")).toBeTruthy();

    // Check sessions rendered
    expect(screen.getAllByText("PRM393").length).toBeGreaterThan(0);
  });
});

describe("ExamsPage", () => {
  it("renders 7-column table with exam entries", () => {
    const data = mockPageData("exams") as Extract<PageData, { page: "exams" }>;
    render(<ExamsPage exams={data.exams} />);

    expect(screen.getByText("Lịch thi")).toBeTruthy();
    expect(screen.getByText("Mã môn")).toBeTruthy();
    expect(screen.getByText("Tên môn")).toBeTruthy();
    expect(screen.getByText("Ngày thi")).toBeTruthy();
    expect(screen.getByText("Phòng")).toBeTruthy();
    expect(screen.getByText("Giờ thi")).toBeTruthy();
    expect(screen.getByText("Hình thức")).toBeTruthy();
    expect(screen.getByText("Loại thi")).toBeTruthy();

    expect(screen.getByText("WDP301")).toBeTruthy();
  });

  it("renders EmptyState when exams list is empty", () => {
    render(<ExamsPage exams={[]} />);
    expect(screen.getByText("Chưa có lịch thi")).toBeTruthy();
  });
});

describe("NewsPage", () => {
  it("filters news by query and marks all read via storage", async () => {
    const data = mockPageData("news") as Extract<PageData, { page: "news" }>;
    const setStorageMock = vi.fn();
    const mockChrome = {
      storage: {
        local: {
          get: vi.fn(async () => ({ fapUiReadNews: [] })),
          set: setStorageMock,
        },
      },
    } as unknown as typeof chrome;

    render(<NewsPage news={data.news} categories={data.categories} chromeApi={mockChrome} />);

    expect(screen.getByText("Tin tức")).toBeTruthy();

    // Search query
    const searchInput = screen.getByPlaceholderText(/Tìm/i);
    fireEvent.change(searchInput, { target: { value: "học phí" } });

    // Should only match news items with "học phí"
    expect(screen.getByText(/học phí/i)).toBeTruthy();

    // Mark all read button
    const markAllBtn = screen.getByRole("button", { name: /Đánh dấu/i });
    fireEvent.click(markAllBtn);

    expect(setStorageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fapUiReadNews: expect.arrayContaining([expect.any(String)]),
      })
    );
  });
});

describe("renderPage dispatcher", () => {
  it("dispatches each page correctly", () => {
    const overview = renderPage(mockPageData("overview"));
    expect(overview).toBeTruthy();

    const timetable = renderPage(mockPageData("timetable"));
    expect(timetable).toBeTruthy();

    const exams = renderPage(mockPageData("exams"));
    expect(exams).toBeTruthy();

    const news = renderPage(mockPageData("news"));
    expect(news).toBeTruthy();
  });
});
