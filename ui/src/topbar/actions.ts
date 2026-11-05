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

export function readNotificationItems(doc: Document): {
  items: NotificationItem[];
  loading: boolean;
  failed: boolean;
} {
  if (!doc) return { items: [], loading: false, failed: false };

  const list = doc.querySelector(
    "[data-notification-list], .jidox-notification-bell__list, .notification-list"
  );
  if (!list) return { items: [], loading: false, failed: false };

  const fullText = (list.textContent || "").trim();
  if (
    list.querySelector("[data-load-failed]") ||
    fullText.includes("Không tải được") ||
    fullText.includes("Failed to load")
  ) {
    return { items: [], loading: false, failed: true };
  }

  const dropdownItems = Array.from(list.querySelectorAll(".dropdown-item"));
  if (dropdownItems.length === 0) {
    if (fullText.includes("Đang tải") || fullText.includes("Loading")) {
      return { items: [], loading: true, failed: false };
    }
    return { items: [], loading: false, failed: false };
  }

  // Check if the only dropdown item is a loading placeholder
  if (
    dropdownItems.length === 1 &&
    (dropdownItems[0].textContent || "").includes("Đang tải")
  ) {
    return { items: [], loading: true, failed: false };
  }

  const items: NotificationItem[] = [];

  for (const el of dropdownItems) {
    const text = el.textContent || "";
    if (text.includes("Đang tải") || text.includes("Loading")) continue;
    if (text.includes("Không tải được") || text.includes("Failed to load")) continue;

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

    let time: string | undefined;
    const smallEl = el.querySelector("small, .time, [data-time]");
    if (smallEl) {
      time = smallEl.textContent?.trim() || undefined;
    }

    let title = "";
    const titleSpan = el.querySelector("span:not(.time), p, h4, h5");
    if (titleSpan) {
      title = titleSpan.textContent?.trim() || "";
    } else {
      title = text.trim();
      if (time && title.endsWith(time)) {
        title = title.slice(0, -time.length).trim();
      }
    }

    items.push({
      title,
      time,
      href,
      unread: isUnread,
    });
  }

  return { items, loading: false, failed: false };
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
