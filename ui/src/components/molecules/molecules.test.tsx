import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React from "react";
import { Wallet, BookOpen } from "lucide-react";
import {
  DashboardCard,
  StatCard,
  NewsItem,
  CategoryFilter,
  NavItem,
  SearchField,
  EmptyState,
  SkeletonRows,
  ThemeToggle,
} from "./index";
import type { NewsItemData } from "@/data/types";

describe("molecules component suite", () => {
  it("renders StatCard displaying an em-dash when value is null or undefined", () => {
    const { getByText, queryByText } = render(
      <StatCard label="Số dư tài khoản" value={undefined} icon={Wallet} />
    );
    expect(getByText("Số dư tài khoản")).not.toBeNull();
    expect(getByText("—")).not.toBeNull();
    expect(queryByText("undefined")).toBeNull();
    expect(queryByText("null")).toBeNull();
  });

  it("renders StatCard displaying provided value and hint", () => {
    const { getByText } = render(
      <StatCard label="Số dư" value="100.000 VNĐ" icon={Wallet} hint="Khả dụng" />
    );
    expect(getByText("100.000 VNĐ")).not.toBeNull();
    expect(getByText("Khả dụng")).not.toBeNull();
  });

  it("renders CategoryFilter and triggers onChange when category tab is clicked", () => {
    const onChange = vi.fn();
    const categories = ["Tất cả", "Khảo thí", "Đào tạo"];
    const { getByRole } = render(
      <CategoryFilter value="Tất cả" categories={categories} onChange={onChange} />
    );

    const tab = getByRole("tab", { name: "Đào tạo" });
    fireEvent.click(tab);
    expect(onChange).toHaveBeenCalledWith("Đào tạo");
  });

  it("renders NewsItem strictly as text preventing HTML injection", () => {
    const maliciousItem: NewsItemData = {
      id: "1",
      title: '<img src="x" onerror="alert(1)" /> Thông báo mới',
      category: "Thông tin chung",
      publishedAt: "2026-11-05",
      href: "/News/Detail?id=1",
    };

    const { container, getByText } = render(
      <NewsItem item={maliciousItem} read={false} />
    );

    // Ensure raw img tag is not created
    expect(container.querySelector("img")).toBeNull();
    // Title is rendered as plain text
    expect(getByText('<img src="x" onerror="alert(1)" /> Thông báo mới')).not.toBeNull();
  });

  it("renders NavItem as an anchor element with the provided href", () => {
    const { getByRole } = render(
      <NavItem href="/WeeklyTimetable" icon={BookOpen} active={false}>
        Thời khóa biểu
      </NavItem>
    );

    const link = getByRole("link", { name: "Thời khóa biểu" });
    expect(link.getAttribute("href")).toBe("/WeeklyTimetable");
  });

  it("renders SearchField with input and clear capability", () => {
    const onChange = vi.fn();
    const { getByPlaceholderText } = render(
      <SearchField value="test" onChange={onChange} placeholder="Tìm kiếm..." />
    );

    const input = getByPlaceholderText("Tìm kiếm...");
    expect((input as HTMLInputElement).value).toBe("test");
  });

  it("renders EmptyState and SkeletonRows without crashing", () => {
    const { getByText } = render(
      <EmptyState icon={BookOpen} title="Không có lịch" description="Tuần này chưa có lịch học." />
    );
    expect(getByText("Không có lịch")).not.toBeNull();

    const { container } = render(<SkeletonRows rows={3} />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  describe("ThemeToggle", () => {
    it("renders with 'auto' preference, shows Monitor icon, has descriptive label, and clicking cycles to 'light'", () => {
      const onChange = vi.fn();
      const { getByRole, container } = render(
        <ThemeToggle preference="auto" onChange={onChange} />
      );

      const button = getByRole("button", {
        name: "Giao diện: Tự động (theo hệ thống)",
      });
      expect(button).not.toBeNull();
      expect(container.querySelector("svg.lucide-monitor")).not.toBeNull();

      fireEvent.click(button);
      expect(onChange).toHaveBeenCalledWith("light");
    });

    it("renders with 'light' preference, shows Sun icon, has descriptive label, and clicking cycles to 'dark'", () => {
      const onChange = vi.fn();
      const { getByRole, container } = render(
        <ThemeToggle preference="light" onChange={onChange} />
      );

      const button = getByRole("button", { name: "Giao diện: Sáng" });
      expect(button).not.toBeNull();
      expect(container.querySelector("svg.lucide-sun")).not.toBeNull();

      fireEvent.click(button);
      expect(onChange).toHaveBeenCalledWith("dark");
    });

    it("renders with 'dark' preference, shows Moon icon, has descriptive label, and clicking cycles to 'auto'", () => {
      const onChange = vi.fn();
      const { getByRole, container } = render(
        <ThemeToggle preference="dark" onChange={onChange} />
      );

      const button = getByRole("button", { name: "Giao diện: Tối" });
      expect(button).not.toBeNull();
      expect(container.querySelector("svg.lucide-moon")).not.toBeNull();

      fireEvent.click(button);
      expect(onChange).toHaveBeenCalledWith("auto");
    });
  });
});

