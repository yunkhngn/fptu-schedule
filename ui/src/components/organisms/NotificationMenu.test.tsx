import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationMenu } from "./NotificationMenu";

describe("NotificationMenu component", () => {
  it("renders notification bell with badge showing '9+' when unread > 9", () => {
    const { rerender } = render(<NotificationMenu unread={5} />);
    expect(screen.getByText("5")).toBeDefined();

    rerender(<NotificationMenu unread={12} />);
    expect(screen.getByText("9+")).toBeDefined();

    rerender(<NotificationMenu unread={0} />);
    expect(screen.queryByText("0")).toBeNull();
  });

  it("calls openNotifications once on opening and displays loading then items when DOM updates", async () => {
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = `
      <button class="jidox-notification-bell__toggle">Toggle</button>
      <div data-notification-list>
        <div class="dropdown-item text-muted">Đang tải thông báo...</div>
      </div>
      <button data-notification-mark-all>Đã đọc tất cả</button>
    `;

    const toggleBtn = doc.querySelector(".jidox-notification-bell__toggle") as HTMLButtonElement;
    let toggleClicks = 0;
    toggleBtn.addEventListener("click", () => {
      toggleClicks++;
    });

    render(<NotificationMenu unread={2} doc={doc} />);

    const triggerBtn = screen.getByRole("button", { name: "Thông báo" });
    fireEvent.click(triggerBtn);

    // openNotifications called once
    expect(toggleClicks).toBe(1);

    // Initially loading
    expect(screen.getByText(/Đang tải thông báo/i)).toBeDefined();

    // DOM updates with notification items
    const listEl = doc.querySelector("[data-notification-list]")!;
    listEl.innerHTML = `
      <a class="dropdown-item unread" href="/News/Detail/101">
        <span>Lịch thi học kỳ mới</span>
        <small>10 phút trước</small>
      </a>
      <a class="dropdown-item" href="/News/Detail/102">
        <span>Thông báo học phí</span>
        <small>2 giờ trước</small>
      </a>
    `;

    // Wait for mutation observer to detect changes
    await waitFor(() => {
      expect(screen.getByText("Lịch thi học kỳ mới")).toBeDefined();
      expect(screen.getByText("Thông báo học phí")).toBeDefined();
    });
  });

  it("handles mark all as read button click", async () => {
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = `
      <button class="jidox-notification-bell__toggle">Toggle</button>
      <div data-notification-list>
        <a class="dropdown-item unread" href="/News/Detail/101">
          <span>Thông báo điểm</span>
        </a>
      </div>
      <button data-notification-mark-all>Đã đọc tất cả</button>
    `;

    const markAllBtn = doc.querySelector("[data-notification-mark-all]") as HTMLButtonElement;
    let markAllClicks = 0;
    markAllBtn.addEventListener("click", () => {
      markAllClicks++;
    });

    render(<NotificationMenu unread={1} doc={doc} />);

    fireEvent.click(screen.getByRole("button", { name: "Thông báo" }));

    await waitFor(() => {
      expect(screen.getByText("Thông báo điểm")).toBeDefined();
    });

    const markAllUiBtn = screen.getByRole("button", { name: /Đã đọc tất cả/i });
    fireEvent.click(markAllUiBtn);

    expect(markAllClicks).toBe(1);
    // Badge should disappear or be 0
    expect(screen.queryByText("1")).toBeNull();
  });

  it("displays failed state with link to open on FAP", async () => {
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = `
      <button class="jidox-notification-bell__toggle">Toggle</button>
      <div data-notification-list>
        <div class="dropdown-item text-danger">Không tải được danh sách thông báo.</div>
      </div>
    `;

    render(<NotificationMenu unread={0} doc={doc} />);
    fireEvent.click(screen.getByRole("button", { name: "Thông báo" }));

    await waitFor(() => {
      expect(screen.getByText(/Không tải được danh sách thông báo/i)).toBeDefined();
      expect(screen.getByText(/Mở thông báo trên FAP/i)).toBeDefined();
    });
  });

  it("displays empty state when no notifications exist", async () => {
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = `
      <button class="jidox-notification-bell__toggle">Toggle</button>
      <div data-notification-list></div>
    `;

    render(<NotificationMenu unread={0} doc={doc} />);
    fireEvent.click(screen.getByRole("button", { name: "Thông báo" }));

    await waitFor(() => {
      expect(screen.getByText(/Không có thông báo mới/i)).toBeDefined();
    });
  });
});
