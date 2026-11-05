export interface NotificationItem {
  title: string;
  time?: string;
  href?: string;
  unread: boolean;
}

export function submitLanguage(doc: Document, culture: string): boolean {
  if (!doc) return false;

  const flagKey = "__fptuSubmittingLanguage";
  if ((doc as any)[flagKey]) return false;

  const form = doc.querySelector('form[action*="/Language/SetLanguage"]');
  if (!form) return false;

  const btn = form.querySelector(`button[name="culture"][value="${culture}"]`) as HTMLButtonElement | null;
  if (!btn) return false;

  (doc as any)[flagKey] = true;
  btn.click();
  return true;
}

export function openNotifications(doc: Document): boolean {
  if (!doc) return false;
  const toggle = doc.querySelector(
    ".jidox-notification-bell__toggle, [data-notification-toggle], .notification-bell button, .notification-bell a"
  ) as HTMLElement | null;
  if (!toggle) return false;
  toggle.click();
  return true;
}

export interface NotificationRead {
  items: NotificationItem[];
  loading: boolean;
  failed: boolean;
  /** FAP offers a "Tải thêm" row: more notifications can be loaded. */
  hasMore: boolean;
}

const MORE_TEXT = /^(tải thêm|xem thêm|load more|show more|see more)$/i;
const TIME_TEXT =
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?|\bvừa xong\b|\b\d+\s*(?:giây|phút|giờ|ngày|tuần|tháng|năm)\s+trước\b|\bjust now\b|\b\d+\s*(?:seconds?|minutes?|hours?|days?|weeks?|months?)\s+ago\b/i;

const squash = (text: string | null | undefined) => (text || "").replace(/\s+/g, " ").trim();

function isLoadMoreRow(el: Element): boolean {
  if (el.hasAttribute("data-notification-load-more") || el.querySelector("[data-notification-load-more]")) return true;
  const cls = typeof el.className === "string" ? el.className : "";
  if (/load-?more/i.test(cls)) return true;
  return MORE_TEXT.test(squash(el.textContent));
}

/** The row's text without its controls and decorations: the title, with the time and the "Đã đọc" button taken out. */
function titleOf(el: Element, time: string | undefined, defaultTitle: string): string {
  const clone = el.cloneNode(true) as Element;
  clone
    .querySelectorAll("button, .btn, svg, i, img, script, style, small, time, .time, [data-time], .visually-hidden, [aria-hidden='true']")
    .forEach((n) => n.remove());
  let text = squash(clone.textContent);
  if (time && text.includes(time)) text = squash(text.replace(time, ""));
  const embedded = text.match(TIME_TEXT);
  if (embedded && text.trim() === embedded[0].trim()) text = "";

  if (!text) {
    const labelled = el.querySelector("[title], [aria-label], [data-title]") as Element | null;
    text = squash(
      el.getAttribute("title") ||
        el.getAttribute("aria-label") ||
        el.getAttribute("data-title") ||
        labelled?.getAttribute("title") ||
        labelled?.getAttribute("aria-label") ||
        labelled?.getAttribute("data-title") ||
        ""
    );
  }
  return text || defaultTitle;
}

export function readNotificationItems(doc: Document): NotificationRead {
  const none: NotificationRead = { items: [], loading: false, failed: false, hasMore: false };
  if (!doc) return none;

  const list = doc.querySelector(
    "[data-notification-list], .jidox-notification-bell__list, .notification-list"
  );
  if (!list) return none;

  const fullText = (list.textContent || "").trim();
  if (
    list.querySelector("[data-load-failed]") ||
    fullText.includes("Không tải được") ||
    fullText.includes("Failed to load")
  ) {
    return { ...none, failed: true };
  }

  const dropdownItems = Array.from(list.querySelectorAll(".dropdown-item"));
  if (dropdownItems.length === 0) {
    if (fullText.includes("Đang tải") || fullText.includes("Loading")) {
      return { ...none, loading: true };
    }
    return none;
  }

  // Only a loading placeholder: FAP has not filled the list yet.
  if (dropdownItems.length === 1 && (dropdownItems[0].textContent || "").includes("Đang tải")) {
    return { ...none, loading: true };
  }

  // FAP gives the title it shows when a notification has none (data-default-title on the bell).
  const defaultTitle = squash(doc.querySelector("[data-default-title]")?.getAttribute("data-default-title")) || "Thông báo mới";

  const items: NotificationItem[] = [];
  let hasMore = false;

  for (const el of dropdownItems) {
    const text = el.textContent || "";
    if (text.includes("Đang tải") || text.includes("Loading")) continue;
    if (text.includes("Không tải được") || text.includes("Failed to load")) continue;
    if (isLoadMoreRow(el)) {
      hasMore = true;
      continue;
    }

    const isUnread =
      el.classList.contains("unread") ||
      el.classList.contains("new") ||
      el.hasAttribute("data-unread") ||
      Boolean(el.querySelector(".unread, [data-unread]"));

    let href: string | undefined;
    if (el instanceof HTMLAnchorElement && el.getAttribute("href")) {
      href = el.getAttribute("href") || undefined;
    } else {
      const anchor = el.querySelector("a");
      if (anchor?.getAttribute("href")) {
        href = anchor.getAttribute("href") || undefined;
      }
    }

    // The time: an element marked as one, otherwise whatever in the text looks like a date or "x phút trước".
    let time: string | undefined;
    const marked = el.querySelector("small, time, .time, [data-time]");
    const markedText = squash(marked?.textContent);
    if (markedText) {
      time = markedText;
    } else {
      time = squash(squash(text).match(TIME_TEXT)?.[0]) || undefined;
    }

    items.push({ title: titleOf(el, time, defaultTitle), time, href, unread: isUnread });
  }

  return { items, loading: false, failed: false, hasMore };
}

/** Presses FAP's own "Tải thêm" so that it loads the next notifications into its list. */
export function loadMoreNotifications(doc: Document): boolean {
  if (!doc) return false;
  const list = doc.querySelector(
    "[data-notification-list], .jidox-notification-bell__list, .notification-list"
  );
  if (!list) return false;
  const target = Array.from(list.querySelectorAll(".dropdown-item, button, a")).find((el) =>
    isLoadMoreRow(el)
  ) as HTMLElement | undefined;
  if (!target) return false;
  target.click();
  return true;
}

export function watchNotificationList(
  doc: Document,
  onChange: () => void
): { stop(): void } {
  if (!doc) return { stop: () => {} };

  const Observer =
    doc.defaultView?.MutationObserver ||
    (typeof MutationObserver !== "undefined" ? MutationObserver : null);

  if (!Observer) return { stop: () => {} };

  const target =
    doc.querySelector("[data-notification-list], .jidox-notification-bell__list, .notification-list") ||
    doc.body;

  const observer = new Observer(() => {
    onChange();
  });

  observer.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });

  return {
    stop: () => observer.disconnect(),
  };
}

export function markAllNotificationsRead(doc: Document): boolean {
  if (!doc) return false;
  const btn = doc.querySelector(
    "[data-notification-mark-all], .jidox-notification-mark-all, .mark-all-read"
  ) as HTMLButtonElement | null;
  if (!btn) return false;
  btn.click();
  return true;
}

export function logout(doc: Document): boolean {
  if (!doc) return false;

  const flagKey = "__fptuLoggingOut";
  if ((doc as any)[flagKey]) return false;

  const form = doc.querySelector(
    'form[action*="/Auth/Logout"], form[action*="/Logout"], form[action$="/Logout"], form[action*="/Account/Logout"]'
  ) as HTMLFormElement | null;
  if (!form) return false;

  (doc as any)[flagKey] = true;

  const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement | null;
  if (submitBtn) {
    submitBtn.click();
  } else {
    form.submit();
  }

  return true;
}
