import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, waitFor, within } from "@testing-library/react";
import { NotificationMenu } from "./NotificationMenu";
import { I18nProvider } from "@/i18n";

function fapBell(rows: string) {
  document.body.innerHTML = `
    <li class="jidox-notification-bell" data-default-title="Thông báo mới">
      <a class="jidox-notification-bell__toggle" href="#"></a>
      <div data-notification-list>${rows}</div>
    </li>`;
}

describe("NotificationMenu content and 'Tải thêm'", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("shows each notification's title and time, not just the time", async () => {
    fapBell(`
      <a class="dropdown-item" href="/News/Detail/1"><span class="avatar"></span><div><div>Thông báo lịch thi</div><small>06/11/2026 01:36</small></div></a>
      <a class="dropdown-item" href="/News/Detail/2"><span class="avatar"></span><div><div>Điểm giữa kỳ</div><small>05/11/2026 23:48</small></div></a>`);
    const host = document.createElement("div");
    document.body.appendChild(host);
    render(
      <I18nProvider lang="vi">
        <NotificationMenu unread={2} doc={document} />
      </I18nProvider>,
      { container: host }
    );
    const menu = within(host);

    fireEvent.click(menu.getByRole("button", { name: "Thông báo" }));

    expect(await menu.findByText("Thông báo lịch thi")).not.toBeNull();
    expect(menu.getByText("Điểm giữa kỳ")).not.toBeNull();
    expect(menu.getByText("06/11/2026 01:36")).not.toBeNull();
  });

  it("offers 'Tải thêm' only when FAP has more, and pressing it presses FAP's own control", async () => {
    fapBell(`
      <a class="dropdown-item" href="/x"><div>Một thông báo</div><small>05/11/2026 13:07</small></a>
      <button type="button" class="dropdown-item" data-notification-load-more>Tải thêm</button>`);
    let pressed = 0;
    document.querySelector("[data-notification-load-more]")!.addEventListener("click", () => pressed++);
    const host = document.createElement("div");
    document.body.appendChild(host);
    render(
      <I18nProvider lang="vi">
        <NotificationMenu unread={1} doc={document} />
      </I18nProvider>,
      { container: host }
    );

    const menu = within(host);
    fireEvent.click(menu.getByRole("button", { name: "Thông báo" }));
    // The row is FAP's control, not a notification: it is one button in our menu, not a list entry.
    const more = await menu.findByRole("button", { name: "Tải thêm" });
    expect(menu.queryAllByText("Tải thêm")).toHaveLength(1);

    fireEvent.click(more);
    await waitFor(() => expect(pressed).toBe(1));
  });

  it("has no 'Tải thêm' when FAP has no more to load", async () => {
    fapBell(`<a class="dropdown-item" href="/x"><div>Chỉ một</div><small>05/11/2026 13:07</small></a>`);
    const host = document.createElement("div");
    document.body.appendChild(host);
    render(
      <I18nProvider lang="vi">
        <NotificationMenu unread={0} doc={document} />
      </I18nProvider>,
      { container: host }
    );
    const menu = within(host);
    fireEvent.click(menu.getByRole("button", { name: "Thông báo" }));
    await menu.findByText("Chỉ một");
    expect(menu.queryByRole("button", { name: "Tải thêm" })).toBeNull();
  });
});
