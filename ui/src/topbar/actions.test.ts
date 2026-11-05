import { describe, it, expect, vi } from "vitest";
import {
  submitLanguage,
  openNotifications,
  readNotificationItems,
  watchNotificationList,
  markAllNotificationsRead,
} from "./actions";

describe("topbar actions: submitLanguage", () => {
  it("clicks the culture button in the form and prevents duplicate submission", () => {
    document.body.innerHTML = `
      <form action="/Language/SetLanguage" method="post">
        <button name="culture" value="vi">Tiếng Việt</button>
        <button name="culture" value="en">English</button>
      </form>
    `;

    const enBtn = document.querySelector('button[value="en"]') as HTMLButtonElement;
    let clicked = false;
    enBtn.addEventListener("click", (e) => {
      e.preventDefault(); // prevent navigation in test
      clicked = true;
    });

    // First call: returns true and clicks button
    const result1 = submitLanguage(document, "en");
    expect(result1).toBe(true);
    expect(clicked).toBe(true);

    // Second call: blocked by double submission flag, returns false
    const result2 = submitLanguage(document, "en");
    expect(result2).toBe(false);
  });

  it("returns false when form or culture is missing", () => {
    document.body.innerHTML = `
      <form action="/Language/SetLanguage" method="post">
        <button name="culture" value="vi">Tiếng Việt</button>
      </form>
    `;

    // Unknown culture
    expect(submitLanguage(document, "fr")).toBe(false);

    // Empty doc
    const emptyDoc = document.implementation.createHTMLDocument();
    expect(submitLanguage(emptyDoc, "vi")).toBe(false);

    // Null doc
    expect(submitLanguage(null as any, "vi")).toBe(false);
  });
});

describe("topbar actions: notifications", () => {
  it("openNotifications clicks toggle element and returns true, or false if missing", () => {
    document.body.innerHTML = `
      <button class="jidox-notification-bell__toggle">Bell</button>
    `;
    const btn = document.querySelector(".jidox-notification-bell__toggle") as HTMLButtonElement;
    let clicked = false;
    btn.addEventListener("click", () => {
      clicked = true;
    });

    expect(openNotifications(document)).toBe(true);
    expect(clicked).toBe(true);

    const emptyDoc = document.implementation.createHTMLDocument();
    expect(openNotifications(emptyDoc)).toBe(false);
    expect(openNotifications(null as any)).toBe(false);
  });

  it("markAllNotificationsRead clicks the mark-all button", () => {
    document.body.innerHTML = `
      <button data-notification-mark-all>Đã đọc tất cả</button>
    `;
    const btn = document.querySelector("[data-notification-mark-all]") as HTMLButtonElement;
    let clickedCount = 0;
    btn.addEventListener("click", () => {
      clickedCount++;
    });

    expect(markAllNotificationsRead(document)).toBe(true);
    expect(clickedCount).toBe(1);

    const emptyDoc = document.implementation.createHTMLDocument();
    expect(markAllNotificationsRead(emptyDoc)).toBe(false);
    expect(markAllNotificationsRead(null as any)).toBe(false);
  });

  it("readNotificationItems handles loading, items, unread status, and failed state", () => {
    // 1. Loading state
    document.body.innerHTML = `
      <div data-notification-list>
        <div class="dropdown-item text-muted">Đang tải thông báo...</div>
      </div>
    `;
    const loadingState = readNotificationItems(document);
    expect(loadingState.loading).toBe(true);
    expect(loadingState.items).toEqual([]);
    expect(loadingState.failed).toBe(false);

    // 2. Populated list with 3 items (first is unread)
    document.body.innerHTML = `
      <div data-notification-list>
        <a class="dropdown-item unread" href="/News/Detail/1">
          <span>Tiêu đề 1</span>
          <small>5 phút trước</small>
        </a>
        <a class="dropdown-item" href="/News/Detail/2">
          <span>Tiêu đề 2</span>
          <small>1 giờ trước</small>
        </a>
        <div class="dropdown-item">
          <a href="/News/Detail/3"><span>Tiêu đề 3 &lt;img onerror=alert(1)&gt;</span></a>
          <small>Hôm qua</small>
        </div>
      </div>
    `;
    const populated = readNotificationItems(document);
    expect(populated.loading).toBe(false);
    expect(populated.failed).toBe(false);
    expect(populated.items.length).toBe(3);

    expect(populated.items[0]).toEqual({
      title: "Tiêu đề 1",
      time: "5 phút trước",
      href: "/News/Detail/1",
      unread: true,
    });
    expect(populated.items[1].unread).toBe(false);
    expect(populated.items[1].href).toBe("/News/Detail/2");
    expect(populated.items[2].title).toContain("<img onerror=alert(1)>");

    // 3. Failed state
    document.body.innerHTML = `
      <div data-notification-list>
        <div class="dropdown-item text-danger">Không tải được danh sách thông báo.</div>
      </div>
    `;
    const failedState = readNotificationItems(document);
    expect(failedState.failed).toBe(true);
    expect(failedState.loading).toBe(false);
    expect(failedState.items).toEqual([]);
  });

  it("watchNotificationList triggers onChange when DOM mutates and stops on stop()", async () => {
    document.body.innerHTML = `<div data-notification-list><span>Old</span></div>`;
    let triggered = false;
    const watcher = watchNotificationList(document, () => {
      triggered = true;
    });

    const list = document.querySelector("[data-notification-list]")!;
    list.innerHTML = `<span>New</span>`;

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(triggered).toBe(true);

    watcher.stop();
    triggered = false;
    list.innerHTML = `<span>Another</span>`;
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(triggered).toBe(false);
  });
});
