(function (root, factory) {
  const api = factory();
  if (typeof define === "function" && define.amd) {
    define([], function () {
      return api;
    });
  } else if (typeof module === "object" && module.exports) {
    api.default = api;
    module.exports = api;
  }
  if (root) {
    root.FapPageData = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : (typeof self !== "undefined" ? self : this), function () {
  "use strict";

  function padZero(num) {
    return String(num).padStart(2, "0");
  }

  function readShell(doc) {
    if (!doc) return null;

    const userEl = doc.querySelector(".fap-topbar-user, .nav-user");
    const nameEl = userEl ? userEl.querySelector("h5") : doc.querySelector(".fap-topbar-user h5, .nav-user h5");
    const idEl = userEl ? userEl.querySelector("h6") : doc.querySelector(".fap-topbar-user h6, .nav-user h6");

    const name = nameEl ? nameEl.textContent.trim() : "";
    const studentId = idEl ? idEl.textContent.trim() : "";

    if (!name && !studentId) {
      return null;
    }

    const avatarEl = doc.querySelector(".fap-topbar-avatar, .account-user-avatar");
    let initials = avatarEl ? avatarEl.textContent.trim() : "";
    if (!initials && name) {
      const words = name.split(/\s+/).filter(Boolean);
      if (words.length === 1) {
        initials = words[0].slice(0, 2).toUpperCase();
      } else if (words.length > 1) {
        initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
      }
    }

    const campusEl = doc.querySelector(".jidox-campus-topbar__static");
    let campus = "";
    if (campusEl) {
      campus = campusEl.getAttribute("title")?.trim() ||
        campusEl.querySelector("span")?.textContent?.trim() ||
        campusEl.textContent.trim() || "";
    }
    if (!campus) {
      const campusInfo = doc.querySelector(".jidox-campus-topbar__info .fw-semibold");
      campus = campusInfo ? campusInfo.textContent.trim() : "";
    }

    const badgeEl = doc.querySelector(".jidox-notification-bell__badge");
    let unreadNotifications = 0;
    if (badgeEl) {
      const rawCount = badgeEl.textContent.trim();
      const parsed = parseInt(rawCount, 10);
      unreadNotifications = Number.isNaN(parsed) ? 0 : parsed;
    }

    return {
      student: {
        name,
        initials,
        studentId
      },
      campus,
      unreadNotifications
    };
  }

  function readHome(doc) {
    if (!doc) return null;

    const metricEls = Array.from(doc.querySelectorAll(".fap-home-student-card__metric"));
    const metrics = {};
    const metricKeys = ["status", "program", "email", "cohort", "balance"];

    metricEls.forEach((el, idx) => {
      const valEl = el.querySelector(".fap-home-student-card__value, .fap-home-student-card__wallet-amount");
      const val = valEl ? valEl.textContent.trim() : "";

      let key = null;
      if (el.classList.contains("fap-home-student-card__metric--wallet") || el.querySelector(".ri-wallet-3-line")) {
        key = "balance";
      } else if (el.querySelector(".ri-shield-check-line") || el.querySelector(".fap-home-student-card__label--primary")) {
        key = "status";
      } else if (el.querySelector(".ri-book-open-line") || el.querySelector(".fap-home-student-card__label--info")) {
        key = "program";
      } else if (el.querySelector(".ri-mail-line") || el.querySelector(".fap-home-student-card__label--warning")) {
        key = "email";
      } else if (el.querySelector(".ri-calendar-line") || el.querySelector(".fap-home-student-card__label--secondary")) {
        key = "cohort";
      } else if (idx < metricKeys.length) {
        key = metricKeys[idx];
      }

      if (key && val) {
        metrics[key] = val;
      }
    });

    const newsItemEls = Array.from(doc.querySelectorAll(".fap-home-news-item"));
    const news = newsItemEls.map((item, idx) => {
      const titleEl = item.querySelector(".fap-home-news-item__title");
      const title = titleEl ? titleEl.textContent.trim() : "";

      const metaSpans = item.querySelectorAll(".fap-home-news-item__meta span");
      const category = metaSpans[0] ? metaSpans[0].textContent.trim() : "";
      const publishedAt = metaSpans[1] ? metaSpans[1].textContent.trim() : "";

      const href = item.getAttribute("href") || item.querySelector("a")?.getAttribute("href") || "";

      let id = item.getAttribute("data-id") || "";
      if (!id && href) {
        const match = href.match(/[?&]id=([^&]+)/) || href.match(/\/Detail\/([^/?#]+)/);
        if (match) id = match[1];
      }
      if (!id) id = "home-news-" + (idx + 1);

      return {
        id,
        title,
        category,
        publishedAt,
        href
      };
    }).filter((n) => n.title || n.href);

    const catSet = new Set();
    const filterBtns = doc.querySelectorAll(".fap-home-news-card__filter-btn");
    filterBtns.forEach((btn) => {
      const txt = btn.textContent ? btn.textContent.trim() : "";
      if (txt) catSet.add(txt);
    });
    news.forEach((n) => {
      if (n.category) catSet.add(n.category);
    });
    const categories = Array.from(catSet);

    const hasMetrics = Object.keys(metrics).length > 0;
    const hasNews = news.length > 0;
    if (!hasMetrics && !hasNews) {
      return null;
    }

    return {
      metrics,
      news,
      categories
    };
  }

  function readNews(doc) {
    if (!doc) return null;

    const rowEls = Array.from(
      doc.querySelectorAll(".fap-result-card table tbody tr, table.fap-sheet tbody tr, table tbody tr")
    );
    const news = [];

    rowEls.forEach((tr, idx) => {
      const titleCell = tr.querySelector('td[data-label="Tiêu đề"], td:nth-child(2)');
      if (!titleCell) return;
      const titleLink = titleCell.querySelector("a");
      const title = titleLink ? titleLink.textContent.trim() : titleCell.textContent.trim();
      if (!title) return;

      const href = (titleLink ? titleLink.getAttribute("href") : "") ||
        tr.querySelector('td[data-label="Chi tiết"] a')?.getAttribute("href") ||
        "";

      const catCell = tr.querySelector('td[data-label="Loại tin"], td:nth-child(3)');
      const category = catCell ? catCell.textContent.trim() : "";

      const dateCell = tr.querySelector('td[data-label="Ngày tạo"], td:nth-child(6)');
      const publishedAt = dateCell ? dateCell.textContent.trim() : "";

      let id = tr.getAttribute("data-id") || "";
      if (!id && href) {
        const match = href.match(/[?&]id=([^&]+)/) || href.match(/\/Detail\/([^/?#]+)/);
        if (match) id = match[1];
      }
      if (!id) id = "news-" + (idx + 1);

      news.push({
        id,
        title,
        category,
        publishedAt,
        href
      });
    });

    if (news.length === 0) {
      return null;
    }

    const categories = [];
    const select = doc.querySelector('.fap-filter-card select[name*="NewsType"], select#FAPNewsTypeId, .fap-filter-card select');
    if (select) {
      const options = Array.from(select.querySelectorAll("option"));
      options.forEach((opt) => {
        let txt = opt.textContent ? opt.textContent.trim() : "";
        txt = txt.replace(/^[-–—\s]+|[-–—\s]+$/g, "");
        if (txt && !categories.includes(txt)) {
          categories.push(txt);
        }
      });
    }

    if (!categories.includes("Tất cả")) {
      categories.unshift("Tất cả");
    }

    news.forEach((n) => {
      if (n.category && !categories.includes(n.category)) {
        categories.push(n.category);
      }
    });

    return {
      news,
      categories
    };
  }

  function toTimetable(schedule, now) {
    const list = Array.isArray(schedule) ? schedule : [];
    const sessions = list.map((item, idx) => {
      let dateIso = "";
      if (item.date) {
        const parts = item.date.split("/").map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          const [d, m, y] = parts;
          dateIso = `${y}-${padZero(m)}-${padZero(d)}`;
        } else {
          dateIso = item.date;
        }
      }

      let slot = 1;
      if (typeof item.slot === "number") {
        slot = item.slot;
      } else if (item.slot) {
        const match = String(item.slot).match(/\d+/);
        if (match) slot = parseInt(match[0], 10);
      }

      let time = item.rawDate?.timeRange || "";
      if (!time && item.rawDate?.startHour !== undefined) {
        time = `${padZero(item.rawDate.startHour)}:${padZero(item.rawDate.startMinute)}-${padZero(item.rawDate.endHour)}:${padZero(item.rawDate.endMinute)}`;
      }

      let attendance = "not-yet";
      const status = (item.attendanceStatus || "").toLowerCase().trim();
      if (status === "attended") {
        attendance = "attended";
      } else if (status === "absent") {
        attendance = "absent";
      }

      const meetUrl = item.meetUrl && item.meetUrl.trim() ? item.meetUrl.trim() : undefined;
      const isOnline = Boolean(item.isOnline || meetUrl);
      const mode = isOnline ? "online" : "offline";

      const room = item.location && item.location.trim() ? item.location.trim() : undefined;

      const desc = item.description || "";
      const classMatch = desc.match(/\(([^)]+)\)/);
      const classCode = classMatch ? classMatch[1].trim() : undefined;
      const gvMatch = desc.match(/GV:\s*([^-(]+)/);
      const lecturer = gvMatch ? gvMatch[1].trim() : undefined;

      const id = "s-" + (dateIso || idx) + "-" + slot + "-" + (item.title || idx);

      return {
        id,
        date: dateIso,
        slot,
        time,
        courseCode: item.title || "",
        classCode,
        mode,
        room,
        lecturer,
        attendance,
        meetUrl
      };
    });

    let refDate = null;
    const firstValid = sessions.find((s) => s.date && s.date.includes("-"));
    if (firstValid) {
      const parts = firstValid.date.split("-").map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        refDate = new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    if (!refDate) {
      refDate = now ? new Date(now) : new Date();
    }
    const day = refDate.getDay();
    const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(refDate.getFullYear(), refDate.getMonth(), diff);
    const weekStart = `${monday.getFullYear()}-${padZero(monday.getMonth() + 1)}-${padZero(monday.getDate())}`;

    return {
      sessions,
      weekStart
    };
  }

  function toExams(events) {
    const list = Array.isArray(events) ? events : [];
    return list.map((ev) => {
      const courseCode = ev.title || "";
      let courseName;
      if (ev.courseName) {
        courseName = ev.courseName.trim();
      } else if (ev.description) {
        const parts = ev.description.split(" - ");
        courseName = parts[0] ? parts[0].trim() : undefined;
      }

      let date = "";
      let time = "";
      if (ev.start instanceof Date && !isNaN(ev.start)) {
        date = `${ev.start.getFullYear()}-${padZero(ev.start.getMonth() + 1)}-${padZero(ev.start.getDate())}`;
        const startStr = `${padZero(ev.start.getHours())}:${padZero(ev.start.getMinutes())}`;
        const endStr = ev.end instanceof Date && !isNaN(ev.end)
          ? `${padZero(ev.end.getHours())}:${padZero(ev.end.getMinutes())}`
          : startStr;
        time = `${startStr}-${endStr}`;
      }

      const room = ev.location && ev.location.trim() ? ev.location.trim() : undefined;
      const form = ev.form && ev.form.trim() ? ev.form.trim() : undefined;
      const kind = ev.tag && ev.tag.trim() ? ev.tag.trim() : undefined;

      return {
        courseCode,
        courseName: courseName || undefined,
        date,
        time,
        room,
        form,
        kind
      };
    });
  }

  function hasOriginalRows(doc, page) {
    if (!doc) return false;

    switch (page) {
      case "timetable": {
        const rows = Array.from(doc.querySelectorAll("table tr, .weekly-timetable-grid tr"));
        return rows.some((tr) => tr.querySelectorAll("td").length > 0);
      }
      case "exams": {
        const rows = Array.from(doc.querySelectorAll("table tr, #ctl00_mainContent_divContent table tr"));
        return rows.some((tr) => tr.querySelectorAll("td").length > 0);
      }
      case "news": {
        const rows = Array.from(doc.querySelectorAll(".fap-result-card table tr, table.fap-sheet tr, table tr"));
        const hasTableRows = rows.some((tr) => tr.querySelectorAll("td").length > 0);
        const hasNewsItems = doc.querySelectorAll(".fap-home-news-item").length > 0;
        return hasTableRows || hasNewsItems;
      }
      case "overview": {
        const hasStudentCard = doc.querySelectorAll(".fap-home-student-card, .fap-home-student-card__metric").length > 0;
        const hasNews = doc.querySelectorAll(".fap-home-news-item").length > 0;
        return hasStudentCard || hasNews;
      }
      default:
        return false;
    }
  }

  function readTopbar(doc) {
    if (!doc) {
      return {
        campus: null,
        language: null,
        notifications: null,
        profile: null
      };
    }

    // 1. Campus
    let campus = null;
    const campusMenu = doc.querySelector(".jidox-campus-topbar__menu, .jidox-campus-topbar");
    if (campusMenu) {
      const nameEl = campusMenu.querySelector(".fw-semibold.text-body") ||
        doc.querySelector(".jidox-campus-topbar__static span") ||
        doc.querySelector(".jidox-campus-topbar__static");
      const name = nameEl ? nameEl.textContent.trim() : "";

      const codeEl = campusMenu.querySelector(".small.text-muted");
      let code = "";
      let isMain = false;
      if (codeEl) {
        const text = codeEl.textContent.trim();
        isMain = /Chính|Main/i.test(text);
        const match = text.match(/^([A-Za-z0-9_-]+)/);
        if (match) {
          code = match[1];
        }
      }
      if (!code && name) {
        const m = name.match(/\(([A-Za-z0-9_-]+)\)/);
        if (m) code = m[1];
      }

      if (name) {
        campus = {
          name,
          code: code || name,
          isMain
        };
      }
    }

    // 2. Language
    let language = null;
    const langForm = doc.querySelector('form[action*="/Language/SetLanguage"]');
    if (langForm) {
      const buttons = Array.from(langForm.querySelectorAll('button[name="culture"]'));
      if (buttons.length > 0) {
        let current = "";
        const options = [];
        for (const btn of buttons) {
          const culture = btn.getAttribute("value") || "";
          const label = btn.textContent.trim();
          if (btn.classList.contains("active")) {
            current = culture;
          }
          options.push({ culture, label });
        }
        if (!current && options.length > 0) {
          current = options[0].culture;
        }
        language = {
          current,
          options
        };
      }
    }

    // 3. Notifications
    let notifications = null;
    const bellEl = doc.querySelector(".jidox-notification-bell");
    if (bellEl) {
      const badgeEl = bellEl.querySelector("[data-notification-badge]");
      const badgeText = badgeEl ? badgeEl.textContent.trim() : "";
      const unread = parseInt(badgeText, 10) || 0;
      notifications = {
        unread,
        available: true
      };
    }

    // 4. Profile
    let profile = null;
    const userEl = doc.querySelector(".fap-topbar-user, .profile-dropdown");
    if (userEl) {
      const nameEl = doc.querySelector(".fap-topbar-user h5, .profile-dropdown h6");
      const idEl = doc.querySelector(".fap-topbar-user h6, .profile-dropdown small");
      const name = nameEl ? nameEl.textContent.trim() : "";
      const studentId = idEl ? idEl.textContent.trim() : "";

      const accountLink = doc.querySelector('.profile-dropdown a[href*="/Account"], a[href*="/Account"]');
      const accountHref = accountLink ? (accountLink.getAttribute("href") || "") : "";

      const logoutBtn = doc.querySelector('form[action*="/Auth/Logout"] button');
      const canLogout = Boolean(logoutBtn);

      if (name || studentId || accountHref || canLogout) {
        profile = {
          name,
          studentId,
          accountHref,
          canLogout
        };
      }
    }

    return {
      campus,
      language,
      notifications,
      profile
    };
  }

  return {
    readShell,
    readHome,
    readNews,
    readTopbar,
    toTimetable,
    toExams,
    hasOriginalRows
  };
});
