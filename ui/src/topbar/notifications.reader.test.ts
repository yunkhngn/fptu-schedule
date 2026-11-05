import { describe, it, expect, beforeEach } from "vitest";
import { readNotificationItems, loadMoreNotifications } from "./actions";

function list(html: string, bellAttrs = 'data-default-title="Thông báo mới"') {
  document.body.innerHTML = `<li class="jidox-notification-bell" ${bellAttrs}><div data-notification-list>${html}</div></li>`;
}

describe("readNotificationItems with different shapes of FAP notification rows", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("finds the title when the first span is an empty icon and the text sits in another element", () => {
    list(`
      <a class="dropdown-item" href="/News/Detail/1">
        <span class="avatar"></span>
        <div><div class="notification-title">Thông báo lịch thi</div><small>06/11/2026 01:36</small></div>
      </a>`);
    const { items } = readNotificationItems(document);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Thông báo lịch thi");
    expect(items[0].time).toBe("06/11/2026 01:36");
    expect(items[0].href).toBe("/News/Detail/1");
  });

  it("reads a heading element, and ignores the 'Đã đọc' button inside the row", () => {
    list(`
      <div class="dropdown-item">
        <h6>Điểm môn PRM393 đã có</h6><small>05/11/2026 23:48</small>
        <button type="button" class="btn btn-sm">Đã đọc</button>
      </div>`);
    const { items } = readNotificationItems(document);
    expect(items[0].title).toBe("Điểm môn PRM393 đã có");
    expect(items[0].title).not.toContain("Đã đọc");
    expect(items[0].time).toBe("05/11/2026 23:48");
  });

  it("reads a title that is a bare text node next to the time", () => {
    list(`<a class="dropdown-item" href="/x">Hạn nộp học phí <span class="time">05/11/2026 18:17</span></a>`);
    const { items } = readNotificationItems(document);
    expect(items[0].title).toBe("Hạn nộp học phí");
    expect(items[0].time).toBe("05/11/2026 18:17");
  });

  it("takes the time from the text when no element is marked as the time", () => {
    list(`<a class="dropdown-item" href="/x"><b>Đổi phòng thi</b> 05/11/2026 13:25</a>`);
    const { items } = readNotificationItems(document);
    expect(items[0].title).toBe("Đổi phòng thi");
    expect(items[0].time).toBe("05/11/2026 13:25");
  });

  it("falls back to the row's title attribute, then to FAP's own default title, instead of showing an empty row", () => {
    list(`
      <a class="dropdown-item" href="/a" title="Tiêu đề trong thuộc tính"><small>05/11/2026 13:07</small></a>
      <a class="dropdown-item" href="/b"><small>05/11/2026 13:06</small></a>`);
    const { items } = readNotificationItems(document);
    expect(items[0].title).toBe("Tiêu đề trong thuộc tính");
    expect(items[1].title).toBe("Thông báo mới");
    expect(items.every((i) => i.title.trim() !== "")).toBe(true);
  });

  it("shows HTML in a title as text", () => {
    list(`<a class="dropdown-item" href="/x"><div>&lt;img src=x onerror=alert(1)&gt;</div><small>05/11/2026 13:07</small></a>`);
    const { items } = readNotificationItems(document);
    expect(items[0].title).toBe("<img src=x onerror=alert(1)>");
  });

  it("keeps the 'Tải thêm' row out of the notifications and reports that there are more", () => {
    list(`
      <a class="dropdown-item" href="/x"><div>Một thông báo</div><small>05/11/2026 13:07</small></a>
      <button type="button" class="dropdown-item" data-notification-load-more>Tải thêm</button>`);
    const result = readNotificationItems(document);
    expect(result.items.map((i) => i.title)).toEqual(["Một thông báo"]);
    expect(result.hasMore).toBe(true);

    list(`<a class="dropdown-item" href="/x"><div>Chỉ một</div><small>05/11/2026 13:07</small></a>`);
    expect(readNotificationItems(document).hasMore).toBe(false);
  });

  it("recognises the load-more row by its text when it has no marker", () => {
    list(`
      <a class="dropdown-item" href="/x"><div>Một</div><small>05/11/2026 13:07</small></a>
      <a class="dropdown-item text-center" href="#">Tải thêm</a>`);
    const result = readNotificationItems(document);
    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(true);
  });

  it("loadMoreNotifications presses FAP's own load-more control once, and reports when there is none", () => {
    list(`<button type="button" class="dropdown-item" data-notification-load-more>Tải thêm</button>`);
    let clicks = 0;
    document.querySelector("[data-notification-load-more]")!.addEventListener("click", () => clicks++);

    expect(loadMoreNotifications(document)).toBe(true);
    expect(clicks).toBe(1);

    list(`<a class="dropdown-item" href="/x"><div>Một</div></a>`);
    expect(loadMoreNotifications(document)).toBe(false);
  });
});
