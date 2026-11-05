(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FapPageData = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toIsoDate(dmy) {
    if (!dmy || typeof dmy !== "string") return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dmy)) return dmy;
    const parts = dmy.split(/[\/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${pad(parts[1])}-${pad(parts[2])}`;
      }
      return `${parts[2]}-${pad(parts[1])}-${pad(parts[0])}`;
    }
    return dmy;
  }

  function getMondayIso(dateInput) {
    let d;
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      d = new Date(dateInput.getTime());
    } else if (typeof dateInput === "string" && dateInput) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [y, m, day] = dateInput.split("-").map(Number);
        d = new Date(y, m - 1, day);
      } else if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(dateInput)) {
        const [day, m, y] = dateInput.split(/[\/-]/).map(Number);
        d = new Date(y, m - 1, day);
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = new Date();
    }
    if (isNaN(d.getTime())) {
      d = new Date();
    }
    const dayOfWeek = d.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    d.setDate(d.getDate() + diff);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function readShell(doc) {
    if (!doc) return null;

    const topbar = doc.querySelector(".fap-topbar, .navbar-custom");
    const userWrap = doc.querySelector(".fap-topbar-user");
    const nameEl = doc.querySelector(".fap-topbar-user h5, .fap-home-student-card__name");
    const idEl = doc.querySelector(".fap-topbar-user h6, .fap-home-student-card__roll");

    if (!topbar && !userWrap && !nameEl && !idEl) {
      return null;
    }

    const name = nameEl ? nameEl.textContent.trim() : "";
    const studentId = idEl ? idEl.textContent.trim() : "";

    if (!name && !studentId) {
      return null;
    }

    const avatarEl = doc.querySelector(".fap-topbar-avatar");
    let initials = avatarEl ? avatarEl.textContent.trim() : "";
    if (!initials && name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.length === 1) {
        initials = parts[0].slice(0, 2).toUpperCase();
      }
    }

    const campusEl = doc.querySelector(".jidox-campus-topbar__static");
    let campus = "";
    if (campusEl) {
      campus = campusEl.getAttribute("title") || campusEl.textContent.trim();
    }

    const notifBadgeEl = doc.querySelector(".jidox-notification-bell__badge");
    let unreadNotifications = 0;
    if (notifBadgeEl) {
      const countText = notifBadgeEl.textContent.trim();
      const parsed = parseInt(countText, 10);
      if (!isNaN(parsed) && parsed > 0) {
        unreadNotifications = parsed;
      }
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

    const studentCard = doc.querySelector(".fap-home-student-card");
    const newsCard = doc.querySelector(".fap-home-news-card, .fap-home-news-list");
    const newsItemEls = doc.querySelectorAll(".fap-home-news-item");

    const homeSlots = doc.querySelectorAll("[data-home-slot]");
    if (homeSlots.length > 0 && !studentCard && newsItemEls.length === 0) {
      return null;
    }

    if (!studentCard && newsItemEls.length === 0) {
      return null;
    }

    const metrics = {
      status: "",
      program: "",
      email: "",
      cohort: "",
      balance: ""
    };

    if (studentCard) {
      const metricEls = studentCard.querySelectorAll(".fap-home-student-card__metric");
      metricEls.forEach((el, idx) => {
        const valEl = el.querySelector(".fap-home-student-card__value, .fap-home-student-card__wallet-amount");
        const val = valEl ? valEl.textContent.trim() : "";
        if (idx === 0) metrics.status = val;
        else if (idx === 1) metrics.program = val;
        else if (idx === 2) metrics.email = val;
        else if (idx === 3) metrics.cohort = val;
        else if (idx === 4) metrics.balance = val;
      });
    }

    const news = [];
    newsItemEls.forEach((el, idx) => {
      const href = el.getAttribute("href") || "";
      const titleEl = el.querySelector(".fap-home-news-item__title");
      const title = titleEl ? titleEl.textContent.trim() : "";

      const metaSpans = el.querySelectorAll(".fap-home-news-item__meta span");
      const category = metaSpans[0] ? metaSpans[0].textContent.trim() : "";
      const publishedAt = metaSpans[1] ? metaSpans[1].textContent.trim() : "";

      const idMatch = href.match(/[?&]id=([^&#]+)/) || href.match(/\/Detail\/([^?&#]+)/);
      const id = idMatch ? idMatch[1] : `home-news-${idx + 1}`;

      news.push({
        id,
        title,
        category,
        publishedAt,
        href
      });
    });

    const filterBtns = doc.querySelectorAll(".fap-home-news-card__filter-btn");
    const categories = [];
    if (filterBtns.length > 0) {
      filterBtns.forEach((btn) => {
        const cat = btn.textContent.trim();
        if (cat && !categories.includes(cat)) {
          categories.push(cat);
        }
      });
    } else {
      categories.push("Tất cả");
      news.forEach((item) => {
        if (item.category && !categories.includes(item.category)) {
          categories.push(item.category);
        }
      });
    }

    return {
      metrics,
      news,
      categories
    };
  }

  function readNews(doc) {
    if (!doc) return null;

    const rows = doc.querySelectorAll("table.fap-sheet tbody tr, table.fap-table--stack tbody tr, table tbody tr");
    if (!rows.length) return null;

    const news = [];
    rows.forEach((tr, idx) => {
      const titleEl = tr.querySelector('td[data-label="Tiêu đề"] a, td[data-label="Title"] a') ||
        tr.querySelector('td[data-label="Tiêu đề"], td[data-label="Title"]') ||
        (tr.cells && tr.cells[1] ? (tr.cells[1].querySelector("a") || tr.cells[1]) : null);

      if (!titleEl) return;
      const title = titleEl.textContent.trim();
      if (!title) return;

      const detailEl = tr.querySelector('td[data-label="Chi tiết"] a, td[data-label="Detail"] a');
      const href = (titleEl.tagName === "A" && titleEl.getAttribute("href")) ||
        (detailEl && detailEl.getAttribute("href")) ||
        "";

      const catEl = tr.querySelector('td[data-label="Loại tin"], td[data-label="Type"]') ||
        (tr.cells && tr.cells[2] ? tr.cells[2] : null);
      const category = catEl ? catEl.textContent.trim() : "";

      const dateEl = tr.querySelector('td[data-label="Ngày tạo"], td[data-label="Created Date"], td[data-label="Date"]') ||
        (tr.cells && tr.cells[5] ? tr.cells[5] : null);
      const publishedAt = dateEl ? dateEl.textContent.trim() : "";

      const idMatch = href.match(/[?&]id=([^&#]+)/) || href.match(/\/Detail\/([^?&#]+)/);
      const id = idMatch ? idMatch[1] : `news-page-${idx + 1}`;

      news.push({
        id,
        title,
        category,
        publishedAt,
        href
      });
    });

    const categories = ["Tất cả"];
    const selectEl = doc.querySelector("#FAPNewsTypeId");
    if (selectEl) {
      Array.from(selectEl.options).forEach((opt) => {
        const text = opt.textContent.trim();
        if (text && !text.startsWith("--") && !categories.includes(text)) {
          categories.push(text);
        }
      });
    }
    news.forEach((item) => {
      if (item.category && !categories.includes(item.category)) {
        categories.push(item.category);
      }
    });

    return {
      news,
      categories
    };
  }

  function toTimetable(schedule, now) {
    const list = Array.isArray(schedule) ? schedule : [];
    const sessions = list.map((ev, idx) => {
      const dateIso = toIsoDate(ev.date);
      let slot = 1;
      if (typeof ev.slot === "number") {
        slot = ev.slot;
      } else if (ev.slot) {
        const m = String(ev.slot).match(/\d+/);
        if (m) slot = parseInt(m[0], 10);
      }

      const time = (ev.rawDate && ev.rawDate.timeRange) ? ev.rawDate.timeRange : (ev.time || "");
      const courseCode = ev.title || "";

      let classCode = undefined;
      let lecturer = undefined;
      if (ev.description) {
        const classMatch = ev.description.match(/\(([^)]+)\)/);
        if (classMatch) classCode = classMatch[1].trim();

        const gvMatch = ev.description.match(/GV:\s*([^-\s]+)/i);
        if (gvMatch) lecturer = gvMatch[1].trim();
      }

      const mode = ev.isOnline ? "online" : "offline";
      const room = (ev.location && ev.location !== "-") ? ev.location : undefined;
      const meetUrl = (ev.meetUrl && ev.meetUrl !== "-") ? ev.meetUrl : undefined;

      let attendance = "not-yet";
      const att = String(ev.attendanceStatus || "").toLowerCase();
      if (att === "attended") attendance = "attended";
      else if (att === "absent") attendance = "absent";

      return {
        id: `s-${idx + 1}`,
        date: dateIso,
        slot,
        time,
        courseCode,
        classCode,
        mode,
        room,
        lecturer,
        attendance,
        meetUrl
      };
    });

    let weekStart = "";
    if (sessions.length > 0 && sessions[0].date) {
      weekStart = getMondayIso(sessions[0].date);
    } else {
      weekStart = getMondayIso(now || new Date());
    }

    return {
      sessions,
      weekStart
    };
  }

  function toExams(events) {
    const list = Array.isArray(events) ? events : [];
    return list.map((ev) => {
      const courseCode = ev.title || "";

      let courseName = undefined;
      let form = undefined;
      if (ev.description) {
        const parts = ev.description.split(/\s*-\s*/);
        if (parts.length > 0 && parts[0] !== courseCode) {
          courseName = parts[0].trim();
        }
        if (parts.length > 1) {
          form = parts.slice(1).join(" - ").trim();
        }
      }

      let date = "";
      let time = "";
      if (ev.start instanceof Date && !isNaN(ev.start.getTime())) {
        date = `${ev.start.getFullYear()}-${pad(ev.start.getMonth() + 1)}-${pad(ev.start.getDate())}`;
        const startH = pad(ev.start.getHours());
        const startM = pad(ev.start.getMinutes());
        if (ev.end instanceof Date && !isNaN(ev.end.getTime())) {
          const endH = pad(ev.end.getHours());
          const endM = pad(ev.end.getMinutes());
          time = `${startH}:${startM}-${endH}:${endM}`;
        } else {
          time = `${startH}:${startM}`;
        }
      }

      const room = (ev.location && ev.location !== "-") ? ev.location : undefined;
      const kind = ev.tag || undefined;

      return {
        courseCode,
        courseName,
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

    if (page === "timetable") {
      const titles = doc.querySelectorAll(".weekly-timetable-cell-title, a[href*='ActivityDetail']");
      if (titles.length > 0) return true;

      const cells = doc.querySelectorAll("#weekly-timetable-container table tbody td, .weekly-timetable-grid table tbody td");
      for (const cell of cells) {
        const text = cell.textContent.trim();
        if (text && text !== "-" && text !== "—") return true;
      }
      return false;
    }

    if (page === "exams") {
      const rows = doc.querySelectorAll("table.fap-sheet tbody tr, table.fap-table--stack tbody tr, #ctl00_mainContent_divContent table tr");
      for (const row of rows) {
        if (row.querySelector("td")) {
          const text = row.textContent.trim();
          if (text && text !== "-" && text !== "—") return true;
        }
      }
      return false;
    }

    if (page === "news") {
      const items = doc.querySelectorAll(".fap-home-news-item");
      if (items.length > 0) return true;
      const rows = doc.querySelectorAll("table.fap-sheet tbody tr, table.fap-table--stack tbody tr, table tbody tr");
      for (const row of rows) {
        if (row.querySelector('td[data-label="Tiêu đề"], td[data-label="Title"], a')) return true;
      }
      return false;
    }

    if (page === "overview") {
      const student = doc.querySelector(".fap-home-student-card");
      const news = doc.querySelectorAll(".fap-home-news-item");
      return Boolean(student || news.length > 0);
    }

    return false;
  }

  return {
    readShell,
    readHome,
    readNews,
    toTimetable,
    toExams,
    hasOriginalRows
  };
});
