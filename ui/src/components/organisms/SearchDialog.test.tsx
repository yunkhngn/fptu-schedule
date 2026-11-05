import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { SearchDialog } from "./SearchDialog";
import { TopNavigation } from "./TopNavigation";
import { navHref } from "@/data/nav";

const mockShell = {
  student: { name: "Nguyễn Văn A", initials: "NA", studentId: "SE000000" },
  campus: "Cơ sở Hà Nội (HN)",
  unreadNotifications: 0,
};

describe("SearchDialog component", () => {
  it("focuses input when open, filters targets, and supports arrow key + Enter selection", () => {
    const handleClose = vi.fn();
    const handleSelect = vi.fn();

    render(
      <SearchDialog
        open={true}
        onClose={handleClose}
        onSelect={handleSelect}
      />
    );

    const input = screen.getByPlaceholderText(/Tìm chức năng, trang…/i);
    expect(document.activeElement).toBe(input);

    // Filter for 'lich thi'
    fireEvent.change(input, { target: { value: "lich thi" } });
    const results = screen.getAllByRole("option");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].textContent).toContain("Lịch thi");

    // Arrow down and Enter
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(handleSelect).toHaveBeenCalledWith(navHref("/lich-thi"));

    // Escape closes dialog
    fireEvent.keyDown(input, { key: "Escape" });
    expect(handleClose).toHaveBeenCalled();
  });

  it("calls onSelect when clicking a result item", () => {
    const handleSelect = vi.fn();

    render(
      <SearchDialog
        open={true}
        onClose={vi.fn()}
        onSelect={handleSelect}
      />
    );

    const input = screen.getByPlaceholderText(/Tìm chức năng, trang…/i);
    fireEvent.change(input, { target: { value: "lich thi" } });
    const item = screen.getByText("Lịch thi");
    fireEvent.click(item);

    expect(handleSelect).toHaveBeenCalledWith(navHref("/lich-thi"));
  });

  it("shows empty state when no results match", () => {
    render(
      <SearchDialog
        open={true}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Tìm chức năng, trang…/i);
    fireEvent.change(input, { target: { value: "zzzznonexistent" } });
    expect(screen.getByText(/Không tìm thấy/i)).toBeDefined();
  });
});

describe("TopNavigation search triggering", () => {
  it("opens search dialog when clicking search bar button and responds to Cmd/Ctrl+K", () => {
    render(<TopNavigation shell={mockShell} />);

    // Initially search dialog is not visible
    expect(screen.queryByPlaceholderText(/Tìm chức năng, trang…/i)).toBeNull();

    // Click search button
    const searchBtn = screen.getByText(/Tìm chức năng, trang…/i);
    fireEvent.click(searchBtn);
    expect(screen.getByPlaceholderText(/Tìm chức năng, trang…/i)).toBeDefined();

    // Press Escape to close
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByPlaceholderText(/Tìm chức năng, trang…/i)).toBeNull();

    // Press Cmd+K
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByPlaceholderText(/Tìm chức năng, trang…/i)).toBeDefined();
  });
});

