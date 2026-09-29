function findScheduleOfWeekYearSelect(doc) {
  const d = doc || (typeof document !== "undefined" ? document : null);
  if (!d) return null;
  return (
    d.getElementById("ctl00_mainContent_drpYear") ||
    d.querySelector('select[name*="Year"]')
  );
}

function findScheduleOfWeekWeekSelect(doc) {
  const d = doc || (typeof document !== "undefined" ? document : null);
  if (!d) return null;
  return (
    d.getElementById("ctl00_mainContent_drpWeek") ||
    d.getElementById("ctl00_mainContent_ddlWeek") ||
    d.querySelector('select[id*="mainContent"][id*="drp"][id*="Week"]') ||
    d.querySelector('select[id*="mainContent"][id*="Week"]') ||
    d.querySelector('select[name*="drpWeek"]') ||
    d.querySelector('select[name*="Week"]')
  );
}

function getIsoWeeksForYear(year) {
  const y = Number(year) || new Date().getFullYear();
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // 1 = Mon, ..., 7 = Sun
  const w1Mon = new Date(jan4);
  w1Mon.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1));
  w1Mon.setUTCHours(0, 0, 0, 0);

  // Thursday of week 53 determines if year has 53 ISO weeks
  const w53Thu = new Date(w1Mon);
  w53Thu.setUTCDate(w1Mon.getUTCDate() + 52 * 7 + 3);
  const totalWeeks = w53Thu.getUTCFullYear() === y ? 53 : 52;

  const pad = (n) => String(n).padStart(2, "0");
  const weeks = [];
  for (let i = 0; i < totalWeeks; i++) {
    const mon = new Date(w1Mon);
    mon.setUTCDate(w1Mon.getUTCDate() + i * 7);
    const sun = new Date(mon);
    sun.setUTCDate(mon.getUTCDate() + 6);

    const weekNum = i + 1;
    const weekVal = `${y}-W${pad(weekNum)}`;
    const monStr = `${pad(mon.getUTCDate())}/${pad(mon.getUTCMonth() + 1)}`;
    const sunStr = `${pad(sun.getUTCDate())}/${pad(sun.getUTCMonth() + 1)}`;
    const monIso = `${mon.getUTCFullYear()}-${pad(mon.getUTCMonth() + 1)}-${pad(mon.getUTCDate())}`;
    const sunIso = `${sun.getUTCFullYear()}-${pad(sun.getUTCMonth() + 1)}-${pad(sun.getUTCDate())}`;

    weeks.push({
      index: i,
      weekNumber: weekNum,
      value: weekVal,
      refDate: monIso,
      startDate: monIso,
      endDate: sunIso,
      label: `Tuần ${weekNum} (${monStr} - ${sunStr})`
    });
  }
  return weeks;
}

function getScheduleOfWeekControls(doc) {
  const d = doc || (typeof document !== "undefined" ? document : null);
  const weekSelect = findScheduleOfWeekWeekSelect(d);
  const yearSelect = findScheduleOfWeekYearSelect(d);
  const pathname = (typeof window !== "undefined" && window.location && window.location.pathname) || "";
  const onWeekPage = /WeeklyTimetable/i.test(pathname) || /ScheduleOfWeek\.aspx/i.test(pathname);
  const isNewUi = !weekSelect && !!d && (
    !!d.getElementById("weekly-timetable-container") ||
    !!d.getElementById("weekly-timetable-week") ||
    !!d.getElementById("weekly-timetable-week-actions") ||
    !!d.querySelector(".weekly-timetable-grid")
  );

  if (!weekSelect) {
    if (isNewUi) {
      const container = d.getElementById("weekly-timetable-container");
      const weekInput = d.getElementById("weekly-timetable-week") || d.querySelector('input[type="week"][name="week"]') || d.querySelector('input[type="week"]');
      const refDate = (container && (container.getAttribute("data-reference-date") || container.getAttribute("data-date"))) || "";
      const headerText = (container?.querySelector(".fw-semibold")?.textContent || "").trim().replace(/\s+/g, " ");

      let yr = new Date().getFullYear();
      let detectedWeekNum = null;

      if (weekInput && weekInput.value) {
        const m = weekInput.value.match(/^(\d{4})-W(\d{1,2})$/i);
        if (m) {
          yr = parseInt(m[1], 10);
          detectedWeekNum = parseInt(m[2], 10);
        }
      }

      if (!detectedWeekNum && refDate && /^\d{4}/.test(refDate)) {
        yr = parseInt(refDate.split("-")[0], 10);
      }

      const weeks = getIsoWeeksForYear(yr);

      let currentWeekIndex = -1;
      if (detectedWeekNum && detectedWeekNum >= 1 && detectedWeekNum <= weeks.length) {
        currentWeekIndex = detectedWeekNum - 1;
      } else if (headerText) {
        const dateMatch = headerText.match(/(\d{1,2}\/\d{1,2})\s*-\s*(\d{1,2}\/\d{1,2})/);
        if (dateMatch) {
          currentWeekIndex = weeks.findIndex((w) => w.label.includes(dateMatch[1]) && w.label.includes(dateMatch[2]));
        }
      }

      if (currentWeekIndex === -1 && refDate) {
        currentWeekIndex = weeks.findIndex((w) => w.refDate === refDate || w.startDate === refDate);
      }

      if (currentWeekIndex === -1) {
        const todayIso = new Date().toISOString().slice(0, 10);
        currentWeekIndex = weeks.findIndex((w) => w.startDate <= todayIso && todayIso <= w.endDate);
        if (currentWeekIndex === -1) currentWeekIndex = 0;
      }

      const years = [
        { index: 0, value: String(yr - 1), label: String(yr - 1) },
        { index: 1, value: String(yr), label: String(yr) },
        { index: 2, value: String(yr + 1), label: String(yr + 1) }
      ];

      return {
        ok: true,
        onWeekPage: true,
        isNewUi: true,
        yearIndex: 1,
        yearValue: String(yr),
        weekIndex: currentWeekIndex,
        weeks,
        years
      };
    }

    const loginLike =
      d?.querySelector('input[type="password"]') ||
      d?.getElementById("ctl00_mainContent_txtPassword");
    const loginRequired = !!loginLike;
    return {
      ok: false,
      loginRequired,
      onWeekPage,
      error: loginRequired ? "login-required" : "week-select-not-found"
    };
  }

  const weeks = Array.from(weekSelect.options).map((opt, idx) => ({
    index: idx,
    value: opt.value,
    label: (opt.textContent || "").trim()
  }));

  const years = yearSelect
    ? Array.from(yearSelect.options).map((opt, idx) => ({
        index: idx,
        value: opt.value,
        label: (opt.textContent || "").trim()
      }))
    : [];

  return {
    ok: true,
    onWeekPage,
    isNewUi: false,
    yearIndex: yearSelect ? yearSelect.selectedIndex : -1,
    yearValue: yearSelect ? yearSelect.value : "",
    weekIndex: weekSelect.selectedIndex,
    weeks,
    years
  };
}

function extractExamScheduleFromPage(doc) {
  const d = doc || (typeof document !== "undefined" ? document : null);
  if (!d) return [];

  const fmtTime = t => {
    if (!t || typeof t !== "string") return { hour: 0, minute: 0 };
    const cleaned = t.trim().replace(/\s+/g, "");
    if (cleaned.match(/\d+h\d*/i)) {
      const [h, m = "0"] = cleaned.replace(/h/i, ":").split(":").map(Number);
      return { hour: h, minute: m };
    }
    if (cleaned.includes(":")) {
      const [h, m = "0"] = cleaned.split(":").map(Number);
      return { hour: h, minute: m };
    }
    if (/^\d{1,2}$/.test(cleaned)) {
      return { hour: Number(cleaned), minute: 0 };
    }
    if (cleaned.includes(".")) {
      const [h, m = "0"] = cleaned.split(".").map(Number);
      return { hour: h, minute: m };
    }
    return { hour: 0, minute: 0 };
  };

  // 1. Check for New FAP UI table
  const newTables = Array.from(d.querySelectorAll("table.fap-sheet, table.fap-table--stack, .table-responsive table, table"));
  for (const tbl of newTables) {
    const trList = Array.from(tbl.querySelectorAll("tbody tr"));
    if (!trList.length) continue;
    const hasNewExamShape = trList.some(tr => tr.querySelector('[data-label="Ngày"], [data-label="Date"], [data-label="Môn thi"], [data-label="Course"]'))
      || (tbl.querySelector("thead") && (/Ngày|Date/i.test(tbl.querySelector("thead").textContent) && /Môn thi|Course|Subject/i.test(tbl.querySelector("thead").textContent)));

    if (hasNewExamShape) {
      const events = [];
      trList.forEach(tr => {
        const getCellText = (labels, colIdx) => {
          for (const label of labels) {
            const byLabel = tr.querySelector(`td[data-label="${label}"]`);
            if (byLabel) return byLabel.textContent.trim();
          }
          const tds = tr.querySelectorAll("td");
          if (tds[colIdx]) return tds[colIdx].textContent.trim();
          return "";
        };

        const dateStr = getCellText(["Ngày", "Date"], 0);
        const timeStr = getCellText(["Thời gian", "Time"], 1);
        const roomStr = getCellText(["Phòng", "Room"], 2);
        const subjectStr = getCellText(["Môn thi", "Course", "Subject"], 3);
        const scheduleTypeStr = getCellText(["Loại lịch", "Type"], 4);
        const examTypeStr = getCellText(["Kỳ thi", "Exam"], 5);
        const formStr = getCellText(["Hình thức thi", "Form", "Format"], 6);
        const attendanceStr = getCellText(["Trạng thái điểm danh", "Attendance"], 7);

        if (!dateStr || !subjectStr) return;

        const dateParts = dateStr.split("/").map(Number);
        if (dateParts.length < 3 || dateParts.some(n => isNaN(n))) return;
        const [day, month, year] = dateParts;

        const timeParts = timeStr.split("-");
        const startT = fmtTime(timeParts[0]);
        const endT = fmtTime(timeParts[1] || timeParts[0]);

        const start = new Date(year, month - 1, day, startT.hour, startT.minute);
        const end = new Date(year, month - 1, day, endT.hour, endT.minute);

        const match = subjectStr.match(/^([A-Za-z0-9_]+)\s*[-–:]\s*(.*)$/);
        const code = match ? match[1].trim() : subjectStr.split(/\s+/)[0];
        const name = match ? match[2].trim() : subjectStr;

        let tag = null;
        const rawTag = (examTypeStr || "").trim().toUpperCase();
        if (rawTag.includes("2NDFE")) tag = "2NDFE";
        else if (rawTag.includes("2NDPE")) tag = "2NDPE";
        else if (rawTag.includes("PE")) tag = "PE";
        else if (rawTag.includes("FE")) tag = "FE";
        else {
          const formLower = (formStr || "").toLowerCase();
          if (formLower.includes("2nd") && formLower.includes("fe")) tag = "2NDFE";
          else if (formLower.includes("2nd") && formLower.includes("pe")) tag = "2NDPE";
          else if (formLower.includes("practical_exam") || formLower.includes("project presentation")) tag = "PE";
          else if (formLower.includes("multiple_choices") || formLower.includes("speaking")) tag = "FE";
        }

        const room = (roomStr === "-" || !roomStr) ? "" : roomStr;
        let desc = formStr;
        if (name && name !== code) {
          desc = formStr ? `${name} - ${formStr}` : name;
        }

        events.push({
          title: code || "Unknown",
          location: room,
          description: desc || "",
          start,
          end,
          tag
        });
      });

      if (events.length > 0) return events;
    }
  }

  // 2. Old FAP UI fallback: #ctl00_mainContent_divContent table tr
  const rows = Array.from(d.querySelectorAll("#ctl00_mainContent_divContent table tr"))
    .slice(1)
    .map(tr => Array.from(tr.cells).map(td => td.textContent.trim()));

  return rows
    .filter(row => row.length >= 8 && row[3] && row[5] !== undefined)
    .map(row => {
      const [no, code, name, date, room, time, form, exam, ...rest] = row;
      const [day, month, year] = date.split("/").map(Number);
      const [startStr, endStr] = time.split("-");
      const start = new Date(year, month - 1, day, fmtTime(startStr).hour, fmtTime(startStr).minute);
      const end = new Date(year, month - 1, day, fmtTime(endStr).hour, fmtTime(endStr).minute);

      let rawTag = "";
      if (exam && exam.trim()) {
        rawTag = exam.trim().toUpperCase();
      } else if (rest.length > 0 && rest[0] && rest[0].trim()) {
        rawTag = rest[0].trim().toUpperCase();
      }

      const formLower = (form || "").toLowerCase();
      let tag = null;
      if (rawTag === "2NDFE") tag = "2NDFE";
      else if (rawTag === "2NDPE") tag = "2NDPE";
      else if (rawTag === "PE") tag = "PE";
      else if (rawTag === "FE") tag = "FE";
      else if (!rawTag || rawTag === "") {
        if (formLower.includes("2nd") && formLower.includes("fe")) tag = "2NDFE";
        else if (formLower.includes("2nd") && formLower.includes("pe")) tag = "2NDPE";
        else if (formLower.includes("practical_exam") || formLower.includes("project presentation")) tag = "PE";
        else if (formLower.includes("multiple_choices") || formLower.includes("speaking")) tag = "FE";
      }

      return {
        title: code || "Unknown",
        location: room || "",
        description: form || "",
        start,
        end,
        tag
      };
    });
}

async function fetchAndExtractWeekSchedule(weekMeta, doc, weekIndex) {
  const d = doc || (typeof document !== "undefined" ? document : null);
  if (!d) return { success: false, error: "no-document" };

  const container = d.getElementById("weekly-timetable-container");
  const weekInput = d.getElementById("weekly-timetable-week") || d.querySelector('input[type="week"][name="week"]') || d.querySelector('input[type="week"]');
  let meta = weekMeta || {};

  // If meta is missing or incomplete, reconstruct from weekIndex
  let currentYear = new Date().getFullYear();
  const curRefDate = container ? (container.getAttribute("data-reference-date") || container.getAttribute("data-date") || "") : "";
  if (curRefDate && /^\d{4}/.test(curRefDate)) {
    currentYear = parseInt(curRefDate.split("-")[0], 10);
  }
  const isoWeeks = getIsoWeeksForYear(currentYear);
  const targetIdx = typeof weekIndex === "number" ? weekIndex : (typeof meta.index === "number" ? meta.index : -1);
  if (targetIdx >= 0 && targetIdx < isoWeeks.length) {
    meta = { ...isoWeeks[targetIdx], ...meta };
  }

  const curWeekVal = weekInput ? weekInput.value : "";
  const curHeader = (container?.querySelector(".fw-semibold")?.textContent || "").replace(/\s+/g, " ");

  // Date tokens for validating that returned HTML actually matches this target week
  const dateTokens = [];
  const addToken = (dayStr, monStr) => {
    const dNum = parseInt(dayStr, 10);
    const mNum = parseInt(monStr, 10);
    if (!isNaN(dNum) && !isNaN(mNum)) {
      const dd = String(dNum).padStart(2, "0");
      const mm = String(mNum).padStart(2, "0");
      dateTokens.push(`${dd}/${mm}`);
      dateTokens.push(`${dNum}/${mNum}`);
      dateTokens.push(`${dd}/${mNum}`);
      dateTokens.push(`${dNum}/${mm}`);
    }
  };

  if (meta.startDate) {
    const parts = meta.startDate.split("-");
    if (parts.length === 3) addToken(parts[2], parts[1]);
  }
  if (meta.endDate) {
    const parts = meta.endDate.split("-");
    if (parts.length === 3) addToken(parts[2], parts[1]);
  }
  if (meta.label) {
    const m = meta.label.match(/\((\d{1,2}\/\d{1,2})\s*-\s*(\d{1,2}\/\d{1,2})\)/);
    if (m) {
      const [d1, m1] = m[1].split("/");
      const [d2, m2] = m[2].split("/");
      addToken(d1, m1);
      addToken(d2, m2);
    }
  }

  function matchesTargetWeek(html) {
    if (!html || typeof html !== "string") return false;
    if (!dateTokens.length) return true;
    return dateTokens.some((tok) => html.includes(tok));
  }

  // Check if requested week is ALREADY displayed in current DOM
  const isCurrentInDom = (
    (curWeekVal && meta.value && curWeekVal === meta.value) ||
    (curRefDate && meta.refDate && curRefDate === meta.refDate) ||
    (curHeader && dateTokens.some((tok) => curHeader.includes(tok)))
  );

  if (isCurrentInDom && (!dateTokens.length || matchesTargetWeek(d.body ? d.body.innerHTML : d.documentElement.innerHTML))) {
    const { schedule, skipped } = extractWeeklyScheduleFromTable(d, currentYear);
    return { success: true, schedule, skipped };
  }

  const fetchBaseUrl = (container && container.getAttribute("data-fetch-url")) || "/WeeklyTimetable/WeekPartial";
  const weekVal = meta.value || "";
  const refDate = meta.refDate || meta.startDate || "";

  let dmyDate = "";
  if (refDate && /^\d{4}-\d{2}-\d{2}$/.test(refDate)) {
    const [y, m, day] = refDate.split("-");
    dmyDate = `${day}/${m}/${y}`;
  }

  // 1. Candidate GET request URLs to try in priority order
  const candidateUrls = [];
  if (refDate) candidateUrls.push(`${fetchBaseUrl}?referenceDate=${encodeURIComponent(refDate)}`);
  if (weekVal) candidateUrls.push(`${fetchBaseUrl}?week=${encodeURIComponent(weekVal)}`);
  if (refDate) candidateUrls.push(`${fetchBaseUrl}?date=${encodeURIComponent(refDate)}`);
  if (dmyDate) candidateUrls.push(`${fetchBaseUrl}?referenceDate=${encodeURIComponent(dmyDate)}`);
  if (dmyDate) candidateUrls.push(`${fetchBaseUrl}?date=${encodeURIComponent(dmyDate)}`);
  if (weekVal && refDate) candidateUrls.push(`${fetchBaseUrl}?week=${encodeURIComponent(weekVal)}&referenceDate=${encodeURIComponent(refDate)}`);
  if (weekVal) candidateUrls.push(`/WeeklyTimetable?week=${encodeURIComponent(weekVal)}`);
  if (refDate) candidateUrls.push(`/WeeklyTimetable?referenceDate=${encodeURIComponent(refDate)}`);
  if (dmyDate) candidateUrls.push(`/WeeklyTimetable?referenceDate=${encodeURIComponent(dmyDate)}`);

  for (const url of candidateUrls) {
    try {
      const res = await (typeof fetch === "function"
        ? fetch(url, {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
              "Accept": "text/html, */*"
            },
            credentials: "include"
          })
        : null);

      if (!res) continue;

      if (res.status === 401 || (res.redirected && (/Default\.aspx/i.test(res.url) || /Login/i.test(res.url)))) {
        return { success: false, loginRequired: true };
      }

      if (!res.ok) continue;

      const html = await res.text();
      const hasTimetable = html.includes("weekly-timetable-grid") || html.includes("table") || html.includes("Slot");
      if (!hasTimetable) continue;

      if (!matchesTargetWeek(html)) {
        // Returned HTML does not belong to target week (e.g. server defaulted to current week)
        continue;
      }

      let partialDoc = null;
      if (typeof DOMParser !== "undefined") {
        partialDoc = new DOMParser().parseFromString(html, "text/html");
      } else if (d.implementation && d.implementation.createHTMLDocument) {
        partialDoc = d.implementation.createHTMLDocument("");
        partialDoc.body.innerHTML = html;
      }

      if (partialDoc) {
        const targetYear = (meta.startDate && parseInt(meta.startDate.split("-")[0], 10)) || currentYear;
        const { schedule, skipped } = extractWeeklyScheduleFromTable(partialDoc, targetYear);
        return { success: true, schedule, skipped };
      }
    } catch (_) {}
  }

  // 2. Candidate POST requests if GET is not accepted
  const candidatePosts = [];
  if (refDate) candidatePosts.push(`referenceDate=${encodeURIComponent(refDate)}`);
  if (weekVal) candidatePosts.push(`week=${encodeURIComponent(weekVal)}`);
  if (dmyDate) candidatePosts.push(`referenceDate=${encodeURIComponent(dmyDate)}`);

  for (const bodyStr of candidatePosts) {
    try {
      const res = await (typeof fetch === "function"
        ? fetch(fetchBaseUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Accept": "text/html, */*"
            },
            credentials: "include",
            body: bodyStr
          })
        : null);

      if (!res) continue;

      if (res.status === 401 || (res.redirected && (/Default\.aspx/i.test(res.url) || /Login/i.test(res.url)))) {
        return { success: false, loginRequired: true };
      }

      if (!res.ok) continue;

      const html = await res.text();
      const hasTimetable = html.includes("weekly-timetable-grid") || html.includes("table") || html.includes("Slot");
      if (!hasTimetable || !matchesTargetWeek(html)) continue;

      let partialDoc = null;
      if (typeof DOMParser !== "undefined") {
        partialDoc = new DOMParser().parseFromString(html, "text/html");
      } else if (d.implementation && d.implementation.createHTMLDocument) {
        partialDoc = d.implementation.createHTMLDocument("");
        partialDoc.body.innerHTML = html;
      }

      if (partialDoc) {
        const targetYear = (meta.startDate && parseInt(meta.startDate.split("-")[0], 10)) || currentYear;
        const { schedule, skipped } = extractWeeklyScheduleFromTable(partialDoc, targetYear);
        return { success: true, schedule, skipped };
      }
    } catch (_) {}
  }

  // 3. Fallback: Trigger native week picker in active DOM and wait for table update
  if (weekInput && weekVal) {
    try {
      weekInput.value = weekVal;
      weekInput.dispatchEvent(new Event("input", { bubbles: true }));
      weekInput.dispatchEvent(new Event("change", { bubbles: true }));

      const startWait = Date.now();
      while (Date.now() - startWait < 1200) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        const liveHtml = (d.body ? d.body.innerHTML : d.documentElement?.innerHTML) || "";
        if (matchesTargetWeek(liveHtml)) {
          const targetYear = (meta.startDate && parseInt(meta.startDate.split("-")[0], 10)) || currentYear;
          const { schedule, skipped } = extractWeeklyScheduleFromTable(d, targetYear);
          return { success: true, schedule, skipped };
        }
      }
    } catch (_) {}
  }

  return { success: false, error: "no-matching-timetable-found" };
}

/* Guarded so the scraper can be required from tests/, where there is no chrome runtime. */
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extractSchedule") {
    try {
      const events = extractExamScheduleFromPage(document);
      sendResponse({ events });
    } catch (e) {
      console.error("Error extracting exam schedule:", e);
      sendResponse({ events: [] });
    }
    return true;
  } else if (msg.action === "getWeekScheduleControls") {
    try {
      sendResponse(getScheduleOfWeekControls());
    } catch (e) {
      sendResponse({ ok: false, error: String(e.message || e) });
    }
    return true;
  } else if (msg.action === "fetchAndExtractWeekSchedule") {
    fetchAndExtractWeekSchedule(msg.weekMeta, document, msg.weekIndex)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: String(err && err.message ? err.message : err) }));
    return true;
  } else if (msg.action === "extractWeeklySchedule") {
    try {
      const container = document.getElementById("weekly-timetable-container") || document.querySelector(".weekly-timetable-grid");
      const hasNewTable = !!container;
      const hasOldSelect = !!findScheduleOfWeekWeekSelect();
      if (!hasNewTable && !hasOldSelect) {
        const loginLike = document.querySelector('input[type="password"]');
        sendResponse({
          schedule: [],
          success: false,
          loginRequired: !!loginLike
        });
        return true;
      }
      const { schedule, skipped } = extractWeeklyScheduleFromTable();
      sendResponse({ schedule, skipped, success: true });
    } catch (e) {
      console.error("Error extracting weekly schedule:", e);
      sendResponse({ schedule: [], success: false });
    }
    return true;
  } else if (msg.action === "extractStudentGrade" || msg.type === "EXTRACT_GRADE_REPORT" || msg.action === "EXTRACT_GRADE_REPORT") {
    try {
      const grade = extractStudentGradeFromPage();
      if (!grade) {
        sendResponse({ ok: false, error: "table-not-found" });
      } else {
        sendResponse({ ok: true, grade });
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e.message || e) });
    }
    return true;
  } else if (msg.action === "getGradePageControls" || msg.type === "GET_GRADE_PAGE_CONTROLS" || msg.action === "GET_GRADE_PAGE_CONTROLS") {
    try {
      sendResponse(getGradePageControls());
    } catch (e) {
      sendResponse({ ok: false, error: String(e.message || e) });
    }
    return true;
  } else if (msg.action === "fetchCourseGrade" || msg.type === "FETCH_COURSE_GRADE" || msg.action === "FETCH_COURSE_GRADE") {
    fetchCourseGradeFromPage(msg.url)
      .then((grade) => {
        sendResponse({ ok: !!grade, grade });
      })
      .catch((e) => {
        sendResponse({ ok: false, error: String(e.message || e) });
      });
    return true;
  }
});
}

function extractNewWeeklySchedule(container, table, doc, explicitYear) {
  let year = explicitYear || new Date().getFullYear();
  if (!explicitYear) {
    const refDateAttr = (container && typeof container.getAttribute === "function" && (container.getAttribute("data-reference-date") || container.getAttribute("data-date"))) ||
      (doc && doc.getElementById && doc.getElementById("weekly-timetable-container")?.getAttribute("data-reference-date"));
    if (refDateAttr && /^\d{4}/.test(refDateAttr)) {
      year = parseInt(refDateAttr.split("-")[0], 10);
    } else {
      const yearSelect = findScheduleOfWeekYearSelect(doc);
      if (yearSelect && yearSelect.value) {
        year = parseInt(yearSelect.value, 10);
      }
    }
  }

  const headerThs = Array.from(table.querySelectorAll("thead tr th"));
  const dayCols = [];
  const headerMonths = [];
  headerThs.slice(1).forEach((th) => {
    const m = th.textContent.match(/\((\d{1,2})\/(\d{1,2})\)/);
    if (m) headerMonths.push(parseInt(m[2], 10));
  });
  const crossesDecJan = headerMonths.includes(12) && headerMonths.includes(1);
  let currentYear = crossesDecJan && headerMonths[0] === 12 ? year - 1 : year;
  let prevMonth = null;
  headerThs.slice(1).forEach((th, i) => {
    const thText = th.textContent.trim();
    const m = thText.match(/\((\d{1,2})\/(\d{1,2})\)/);
    if (!m) return;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (prevMonth !== null && prevMonth === 12 && month === 1) {
      currentYear += 1;
    }
    prevMonth = month;
    const dayName = thText.replace(/\s*\(\d{1,2}\/\d{1,2}\)/, "").trim() || `Thứ ${i + 2}`;
    dayCols.push({ day, month, year: currentYear, dayName, colIndex: i });
  });

  const schedule = [];
  let skipped = 0;
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  rows.forEach(row => {
    const slotCell = row.querySelector("th, td");
    const rawSlot = slotCell ? slotCell.textContent.trim() : "";
    const slotName = rawSlot.toLowerCase().startsWith("slot") ? rawSlot : `Slot ${rawSlot}`;

    const cells = Array.from(row.querySelectorAll("td"));
    cells.forEach((cell, dayIdx) => {
      const dayCol = dayCols[dayIdx];
      if (!dayCol) return;

      const titleEl = cell.querySelector(".weekly-timetable-cell-title, [title='Lớp học'], [title='Class'], .text-primary.fw-semibold");
      if (!titleEl) {
        // If cell is empty dash or whitespace, ignore
        return;
      }

      const rawTitle = titleEl.textContent.trim();
      const parts = rawTitle.split(/\s*-\s*/);
      const subject = parts[0] ? parts[0].trim() : rawTitle;
      const classGroup = parts.length > 1 ? parts.slice(1).join(" - ").trim() : "";

      if (!subject) {
        skipped += 1;
        return;
      }

      let attendanceStatus = "not yet";
      let attendanceColor = "gray";
      const statusEl = cell.querySelector(".weekly-timetable-attendance-status, [title='Điểm danh'], [title*='attendance' i]");
      if (statusEl) {
        const text = statusEl.textContent.trim().toLowerCase();
        if (text.includes("có mặt") || text.includes("attended")) {
          attendanceStatus = "attended";
          attendanceColor = "green";
        } else if (text.includes("vắng") || text.includes("absent")) {
          attendanceStatus = "absent";
          attendanceColor = "red";
        }
      }

      const timeMatch = cell.textContent.match(/(\d{1,2})[h:](\d{2})\s*-\s*(\d{1,2})[h:](\d{2})/i);
      let startHour = 0, startMinute = 0, endHour = 0, endMinute = 0, timeRange = "";
      if (timeMatch) {
        startHour = parseInt(timeMatch[1], 10);
        startMinute = parseInt(timeMatch[2], 10);
        endHour = parseInt(timeMatch[3], 10);
        endMinute = parseInt(timeMatch[4], 10);
        timeRange = `${startHour}:${String(startMinute).padStart(2, "0")}-${endHour}:${String(endMinute).padStart(2, "0")}`;
      } else {
        timeRange = "07:30-09:50";
      }

      const meetLink = cell.querySelector('a[href*="meet.google.com"]');
      const onlineEl = cell.querySelector('[title*="online" i]') || cell.querySelector(".ri-wifi-line");
      const isOnline = !!meetLink || Boolean(onlineEl && /online/i.test(onlineEl.textContent || onlineEl.outerHTML));
      const meetUrl = meetLink ? meetLink.href : "";

      const roomEl = cell.querySelector('[title="Phòng"], [title="Room"]');
      let room = roomEl ? roomEl.textContent.replace(/[\s-]+$/, "").trim() : "";
      if (room === "-") room = "";
      room = room.replace(/^[^\w\d\s\u00C0-\u1EF9-]+/, "").trim();

      const lecturerEl = cell.querySelector('[title="Giảng viên"], [title="Lecturer"], [title="Instructor"]');
      let lecturer = lecturerEl ? lecturerEl.textContent.trim() : "";
      if (lecturer === "-") lecturer = "";
      lecturer = lecturer.replace(/^[^\w\d\s\u00C0-\u1EF9-]+/, "").trim();

      const descParts = [subject];
      if (classGroup) descParts.push(`(${classGroup})`);
      descParts.push(`- ${slotName} (${timeRange})`);
      if (lecturer) descParts.push(`- GV: ${lecturer}`);
      const description = descParts.join(" ");

      schedule.push({
        title: subject,
        detailUrl: meetUrl || "",
        meetUrl,
        attendanceStatus,
        attendanceColor,
        isOnline,
        location: room,
        description,
        rawDate: {
          year: dayCol.year,
          month: dayCol.month,
          day: dayCol.day,
          startHour,
          startMinute,
          endHour,
          endMinute,
          timeRange
        },
        slot: slotName,
        day: dayCol.dayName,
        date: `${dayCol.day}/${dayCol.month}/${dayCol.year}`
      });
    });
  });

  return { schedule, skipped };
}

function extractLegacyWeeklySchedule(doc) {
  const d = doc || (typeof document !== "undefined" ? document : null);
  if (!d) return { schedule: [], skipped: 0 };

  const rows = Array.from(d.querySelectorAll("tbody tr"))
    .filter((row) => row.querySelector("td")?.textContent?.startsWith("Slot"));

  const dayColumnCount = rows.length ? rows[0].querySelectorAll("td").length - 1 : 0;
  const headerTexts = (selector) => {
    const all = Array.from(d.querySelectorAll(selector)).map((th) => th.textContent.trim());
    return dayColumnCount > 0 ? all.slice(-dayColumnCount) : all.slice(1);
  };
  const dayHeaders = headerTexts("thead tr:nth-child(2) th");
  const dayNames = headerTexts("thead tr:nth-child(1) th");

  const schedule = [];
  let skipped = 0;
  
  const yearSelect = findScheduleOfWeekYearSelect(d);
  const year = yearSelect ? parseInt(yearSelect.value, 10) : new Date().getFullYear();
  
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    const slotName = cells[0].textContent.trim();

    for (let i = 1; i < cells.length; i++) {
      const cell = cells[i];
      const content = cell.innerHTML.trim();
      
      if (content.includes("href")) {
        const subjectMatch = content.match(/([A-Z]{2,4}\d{3})-/) || 
                           content.match(/>([A-Z]{2,4}\d{3})/) ||
                           content.match(/([A-Z]{2,4}\d{3})/);
                           
        const roomMatch = content.match(/at\s+(.*?)\s*</) || 
                         content.match(/at\s+([A-Z]{1,3}-\d{3})/);

        const successTimeMatch = content.match(/label-success">\s*\((\d{1,2}:\d{2}-\d{1,2}:\d{2})\)/);
        const allTimeMatches = [...content.matchAll(/\((\d{1,2}:\d{2}-\d{1,2}:\d{2})\)/g)];
        const timeRangeFound = successTimeMatch
          ? successTimeMatch[1]
          : (allTimeMatches.length ? allTimeMatches[allTimeMatches.length - 1][1] : null);

        const isOnline = /online-indicator/i.test(content);
        
        const hrefMatch = content.match(/href="([^"]+)"/i);
        let detailUrl = "";
        if (hrefMatch && hrefMatch[1]) {
          try {
            detailUrl = new URL(hrefMatch[1], (typeof window !== "undefined" ? window.location.href : "https://fap.fpt.edu.vn")).href;
          } catch (e) {
            detailUrl = hrefMatch[1];
          }
        }

        let attendanceStatus = null;
        let attendanceColor = null;
        const statusFontMatch = content.match(/<font\s+color="([^"]+)">([^<]+)<\/font>/i);
        if (statusFontMatch) {
          attendanceColor = (statusFontMatch[1] || '').toLowerCase();
          attendanceStatus = (statusFontMatch[2] || '').trim().toLowerCase();
        } else {
          if (/\bnot\s*yet\b/i.test(content)) {
            attendanceStatus = 'not yet';
            attendanceColor = 'gray';
          } else if (/\babsent\b/i.test(content)) {
            attendanceStatus = 'absent';
            attendanceColor = 'red';
          } else if (/\battended\b/i.test(content)) {
            attendanceStatus = 'attended';
            attendanceColor = 'green';
          }
        }
        
        if (!subjectMatch) {
          skipped += 1;
          continue;
        }
        {
          const subject = subjectMatch[1];
          const room = (roomMatch ? roomMatch[1] : "").replace(/[\s-]+$/, "");
          const timeRange = timeRangeFound || "7:30-9:00";
          
          const dateStr = dayHeaders[i - 1];
          if (!dateStr) {
            skipped += 1;
            continue;
          }

          const [day, month] = dateStr.split('/').map(Number);
          if (!Number.isFinite(day) || !Number.isFinite(month)) {
            skipped += 1;
            continue;
          }
          
          let startHour = 0, startMinute = 0, endHour = 0, endMinute = 0;
          
          if (timeRangeFound) {
            const [startTime, endTime] = timeRange.split('-');
            [startHour, startMinute] = startTime.split(':').map(Number);
            [endHour, endMinute] = endTime.split(':').map(Number);
          }

          schedule.push({
            title: subject,
            detailUrl,
            attendanceStatus,
            attendanceColor,
            isOnline,
            location: room,
            description: `${subject} - ${slotName} (${timeRange})`,
            rawDate: {
              year,
              month,
              day,
              startHour,
              startMinute,
              endHour,
              endMinute,
              timeRange
            },
            slot: slotName,
            day: dayNames[i - 1],
            date: `${day}/${month}/${year}`
          });
        }
      }
    }
  });

  if (skipped > 0) {
    console.warn(`FPTU Schedule: ${skipped} ô lịch không đọc được (FAP có thể đã đổi giao diện).`);
  }
  return { schedule, skipped };
}

function extractWeeklyScheduleFromTable(doc, explicitYear) {
  const d = doc || (typeof document !== "undefined" ? document : null);
  if (!d) return { schedule: [], skipped: 0 };

  const newGrid = d.querySelector("#weekly-timetable-container, .weekly-timetable-grid");
  if (newGrid) {
    const table = newGrid.tagName === "TABLE" ? newGrid : newGrid.querySelector("table");
    if (table) {
      return extractNewWeeklySchedule(newGrid, table, d, explicitYear);
    }
  }

  const anyGridTable = d.querySelector(".weekly-timetable-grid table, table.weekly-timetable-grid, table.table-bordered");
  if (anyGridTable && anyGridTable.querySelector("th")?.textContent?.includes("Slot")) {
    const container = d.querySelector("#weekly-timetable-container") || d;
    return extractNewWeeklySchedule(container, anyGridTable, d, explicitYear);
  }

  return extractLegacyWeeklySchedule(d);
}

function findFapGradeTable(doc) {
  if (!doc) doc = typeof document !== "undefined" ? document : null;
  if (!doc) return null;
  const bySummary = doc.querySelector('table[summary="Report"]');
  if (bySummary) return bySummary;

  // Check modern FAP table classes
  const byClass = doc.querySelector("table.student-mark-sheet, .fap-result-card table");
  if (byClass) return byClass;

  const tables = Array.from(doc.querySelectorAll("table"));
  for (const tbl of tables) {
    const text = tbl.textContent || "";
    const isWeight = /Weight/i.test(text) || /Trọng\s*số/i.test(text) || /Tỷ\s*lệ/i.test(text);
    const isValue = /Value/i.test(text) || /\bĐiểm\b/i.test(text) || /Giá\s*trị/i.test(text);
    const isGradeReport =
      /Grade/i.test(text) ||
      /Course total/i.test(text) ||
      /Average/i.test(text) ||
      /Passed|Not passed/i.test(text) ||
      /Trung\s*bình/i.test(text) ||
      /Tổng\s*kết/i.test(text) ||
      /Tổng\s*môn/i.test(text) ||
      /Đạt|Không\s*đạt/i.test(text) ||
      /Thành\s*phần/i.test(text) ||
      /Nhóm\s*điểm/i.test(text);
    if (isWeight && isValue && isGradeReport) {
      return tbl;
    }
  }
  for (const tbl of tables) {
    const text = tbl.textContent || "";
    const isWeight = /Weight/i.test(text) || /Trọng\s*số/i.test(text) || /Tỷ\s*lệ/i.test(text);
    const isValue = /Value/i.test(text) || /\bĐiểm\b/i.test(text) || /Giá\s*trị/i.test(text);
    if (isWeight && isValue && (/Total/i.test(text) || /Average/i.test(text) || /Tổng\s*kết/i.test(text) || /Tổng\s*môn/i.test(text) || /Trung\s*bình/i.test(text))) {
      return tbl;
    }
  }
  return null;
}

function extractCourseCodeAndName(rawText, courseId = "") {
  let text = (rawText || "").trim();
  // Strip date ranges: (from 13/05/2026 - 22/07/2026) or from 13/05/2026 to 22/07/2026
  text = text.replace(/\(?from\s+[\d/.-]+\s*(-|to|–)\s*[\d/.-]+\)?/gi, "").trim();

  let code = "";
  let name = text;

  // 1. Check parenthesized groups: e.g. "(IS1905-EIS, EXE101)", "(PMG202c)", "(IS1905-EIS, (EXE101))"
  const parenMatches = Array.from(text.matchAll(/\(([^)]+)\)?/g));
  for (const m of parenMatches) {
    const inside = m[1];
    // Find all potential codes inside: e.g. "IS1905-EIS", "EXE101"
    const tokens = inside.split(/[,;\s]+/).map((t) => t.replace(/[()]/g, "").trim()).filter(Boolean);
    // Prioritize standard 3-digit course code (e.g. EXE101, PRN211, PMG202c, ENT301m)
    let found = tokens.find((t) => /^[A-Za-z]{2,5}\d{3}[A-Za-z]?$/i.test(t));
    if (!found) {
      // Fallback: any code with 2-4 digits, avoiding class codes with hyphen like IS1905-EIS if possible
      found = tokens.find((t) => /^[A-Za-z]{2,5}\d{2,4}[A-Za-z0-9_]*$/i.test(t) && !t.includes("-"));
    }
    if (found) {
      code = found.toUpperCase();
      // Remove this entire parenthesized section from name
      name = name.replace(m[0], " ");
      break;
    }
  }

  // 2. Prefix code like "PRN211 - Multiplatform Mobile App"
  if (!code) {
    const prefixMatch = text.match(/^([A-Za-z]{2,5}\d{2,4}[A-Za-z0-9_]*)\s*[-–:]\s*(.*)$/i);
    if (prefixMatch) {
      code = prefixMatch[1].toUpperCase();
      name = prefixMatch[2];
    }
  }

  // 3. Any word with digits e.g. "ENT301"
  if (!code) {
    // Prefer 3-digit course code first
    const match3 = text.match(/\b([A-Za-z]{2,5}\d{3}[A-Za-z]?)\b/i);
    if (match3) {
      code = match3[1].toUpperCase();
    } else {
      const matchAny = text.match(/\b([A-Za-z]{2,5}\d{2,4}[A-Za-z0-9_]*)\b/i);
      if (matchAny) code = matchAny[1].toUpperCase();
    }
  }

  // 4. Fallback code from initials
  if (!code) {
    const words = text.split(/\s+/).filter(Boolean);
    let acronym = words.map((w) => w[0]).join("").toUpperCase();
    if (acronym.length < 2) acronym = "COURSE";
    code = courseId ? `${acronym}_${courseId}` : acronym;
  }

  // Clean name:
  // Remove any remaining parenthesized class info e.g. "(IS1905-EIS)" or "(IS1905-EIS," or unclosed "("
  name = name.replace(/\([^)]*\)?/g, " ");
  // Remove unclosed open parenthesis and anything after it
  name = name.replace(/\([^(]*$/, " ");
  // Remove any stray parentheses
  name = name.replace(/[()]/g, " ");
  // Clean trailing/leading punctuation: commas, colons, dashes, slashes
  name = name.replace(/^[-–:,/.\s]+|[-–:,/.\s]+$/g, "");
  // Collapse spaces
  name = name.replace(/\s{2,}/g, " ").trim();

  if (!name || name === code) {
    name = text.replace(/\s{2,}/g, " ").trim() || code;
  }

  return { courseCode: code, courseName: name };
}

function isGradeReportTable(tbl) {
  if (!tbl) return false;
  if (tbl.getAttribute && tbl.getAttribute("summary") === "Report") return true;
  const text = tbl.textContent || "";
  if (/Grade\s*item/i.test(text) && /Weight/i.test(text) && /Value/i.test(text)) return true;
  if (/Grade\s*category/i.test(text) && /Weight/i.test(text)) return true;
  if (/Course\s*total/i.test(text) && (/Average/i.test(text) || /Status/i.test(text))) return true;
  return false;
}

function findGradeCourseSelect(doc) {
  if (!doc) return null;
  // 1. Direct match by specific course select ID or class
  const direct = doc.querySelector('#grade-report-course, select.academic-report-course-select');
  if (direct) return direct;

  // 2. Name or ID containing course / subject / class, strictly excluding term / semester / year
  const candidates = Array.from(doc.querySelectorAll(
    'select[id*="course" i], select[name*="course" i], select[id*="subject" i], select[name*="subject" i], select[id*="class" i], select[name*="class" i]'
  ));
  for (const sel of candidates) {
    const id = (sel.id || "").toLowerCase();
    const name = (sel.getAttribute("name") || "").toLowerCase();
    const cls = (sel.className || "").toLowerCase();
    const combined = `${id} ${name} ${cls}`;
    if (combined.includes("term") || combined.includes("semester") || combined.includes("hocky") || combined.includes("year")) {
      continue;
    }
    return sel;
  }

  // 3. Fallback: all selects that are not term selects
  const allSelects = Array.from(doc.querySelectorAll('select'));
  for (const sel of allSelects) {
    const id = (sel.id || "").toLowerCase();
    const name = (sel.getAttribute("name") || "").toLowerCase();
    const cls = (sel.className || "").toLowerCase();
    const combined = `${id} ${name} ${cls}`;
    if (combined.includes("term") || combined.includes("semester") || combined.includes("hocky") || combined.includes("year")) {
      continue;
    }
    if (sel.options && sel.options.length > 0) {
      const firstText = (sel.options[0].textContent || "").trim();
      if (!/^(Spring|Summer|Fall|Winter)\d{4}$/i.test(firstText)) {
        return sel;
      }
    }
  }
  return null;
}

function getGradePageCourses(doc) {
  if (!doc) doc = typeof document !== "undefined" ? document : null;
  if (!doc) return [];
  const win = (doc && doc.defaultView) || (typeof window !== "undefined" ? window : null);
  const courses = [];
  const seen = new Set();

  let currentCourseId = "";
  try {
    const search = (win && win.location ? win.location.search : "") || "";
    const params = new URLSearchParams(search);
    currentCourseId = params.get("courseId") || params.get("course") || "";
  } catch (_) {}

  const activeHref = (win && win.location ? win.location.href : "") || "";

  // 0. Modern dropdown support: find course select (strictly excluding term selects)
  const courseSel = findGradeCourseSelect(doc);
  if (courseSel && courseSel.options && courseSel.options.length > 0) {
    Array.from(courseSel.options).forEach((opt, idx) => {
      const val = (opt.value || "").trim();
      const text = (opt.textContent || "").trim();
      const fallbackHref = opt.getAttribute("data-fallback-href") || "";
      if (val && val !== "0" && val !== "-1" && !seen.has(val)) {
        seen.add(val);
        const { courseCode, courseName } = extractCourseCodeAndName(text, val);
        let href = fallbackHref;
        if (!href) {
          href = `/Report/Grade?courseId=${encodeURIComponent(val)}`;
        }
        if (href && !/^https?:\/\//i.test(href) && activeHref) {
          try {
            href = new URL(href, activeHref).href;
          } catch (_) {}
        }
        const isSelected = opt.selected || idx === courseSel.selectedIndex || (currentCourseId && val === currentCourseId);
        courses.push({
          id: val,
          href,
          courseCode,
          courseName,
          fullText: text,
          isActive: isSelected
        });
      }
    });
    if (courses.length > 0) return courses;
  }

  // 1. Scan candidate course tables, strictly excluding grade report tables
  const allTables = Array.from(doc.querySelectorAll("table"));
  const nonGradeTables = allTables.filter((tbl) => !isGradeReportTable(tbl));

  let courseTable = null;
  for (const tbl of nonGradeTables) {
    const text = tbl.textContent || "";
    if (/\bCOURSE\b/i.test(text) || /\bMôn\s*học\b/i.test(text) || tbl.querySelector('a[href*="course="]') || tbl.querySelector('a[href*="courseId="]') || tbl.querySelector('a[href*="StudentGrade"]') || tbl.querySelector('a[href*="Report/Grade"]')) {
      courseTable = tbl;
      break;
    }
  }

  if (courseTable) {
    // A. Collect inactive course links inside courseTable
    const courseLinks = Array.from(courseTable.querySelectorAll('a[href*="course="], a[href*="courseId="]'));
    courseLinks.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const m = href.match(/course(?:Id)?=([^&]+)/i);
      if (m) {
        const courseId = m[1];
        if (!seen.has(courseId)) {
          seen.add(courseId);
          const fullText = (a.textContent || "").trim();
          const { courseCode, courseName } = extractCourseCodeAndName(fullText, courseId);
          let fullHref = a.href || href;
          if (fullHref && !/^https?:\/\//i.test(fullHref) && activeHref) {
            try {
              fullHref = new URL(fullHref, activeHref).href;
            } catch (_) {}
          }
          courses.push({
            id: courseId,
            href: fullHref,
            courseCode,
            courseName,
            fullText,
            isActive: courseId === currentCourseId
          });
        }
      }
    });

    // B. Find the active (non-link) course in courseTable
    let activeText = "";
    const boldEls = Array.from(courseTable.querySelectorAll("b, strong, u, .selected, span[style*='bold']"));
    for (const el of boldEls) {
      if (el.closest("a")) continue;
      const t = (el.textContent || "").trim();
      if (
        t &&
        !/^(TERM|COURSE)$/i.test(t) &&
        !/^(Spring|Summer|Fall|Winter)\d{4}$/i.test(t) &&
        !/^Grade report/i.test(t)
      ) {
        activeText = t;
        break;
      }
    }

    if (!activeText) {
      const cells = Array.from(courseTable.querySelectorAll("td"));
      for (const cell of cells) {
        if (cell.querySelector('a[href*="course="], a[href*="courseId="]')) continue;
        const t = (cell.textContent || "").trim();
        if (
          t &&
          !/^(TERM|COURSE)$/i.test(t) &&
          !/^(Spring|Summer|Fall|Winter)\d{4}$/i.test(t) &&
          !/^Grade report/i.test(t) &&
          t.length > 3
        ) {
          activeText = t;
          break;
        }
      }
    }

    if (activeText) {
      const activeId = currentCourseId || "current";
      if (!seen.has(activeId)) {
        seen.add(activeId);
        const { courseCode, courseName } = extractCourseCodeAndName(activeText, activeId);
        courses.unshift({
          id: activeId,
          href: activeHref,
          courseCode,
          courseName,
          fullText: activeText,
          isActive: true
        });
      }
    }
  }

  // 2. Fallback: all <a> links with course=ID across doc
  const links = Array.from(doc.querySelectorAll('a[href*="course="], a[href*="courseId="]'));
  links.forEach((a) => {
    try {
      const href = a.getAttribute("href") || "";
      const m = href.match(/course(?:Id)?=([^&]+)/i);
      if (m) {
        const courseId = m[1];
        if (!seen.has(courseId)) {
          seen.add(courseId);
          const fullText = (a.textContent || "").trim();
          const { courseCode, courseName } = extractCourseCodeAndName(fullText, courseId);
          let fullHref = a.href || href;
          if (fullHref && !/^https?:\/\//i.test(fullHref) && activeHref) {
            try {
              fullHref = new URL(fullHref, activeHref).href;
            } catch (_) {}
          }
          courses.push({
            id: courseId,
            href: fullHref,
            courseCode,
            courseName,
            fullText,
            isActive: courseId === currentCourseId
          });
        }
      }
    } catch (_) {}
  });

  if (currentCourseId) {
    const existing = courses.find((c) => c.id === currentCourseId);
    if (existing) {
      existing.isActive = true;
    }
  }

  return courses;
}

function getActiveCourseInfo(doc) {
  if (!doc) doc = typeof document !== "undefined" ? document : null;
  const win = (doc && doc.defaultView) || (typeof window !== "undefined" ? window : null);
  let currentCourseId = "";
  let currentTerm = "";

  try {
    const search = (win && win.location ? win.location.search : "") || "";
    const params = new URLSearchParams(search);
    currentCourseId = params.get("courseId") || params.get("course") || "";
    currentTerm = params.get("termId") || params.get("term") || "";
  } catch (_) {}

  // 1. Check modern term dropdown for currently selected term
  const termSel = doc ? doc.querySelector('#grade-report-term, select.academic-report-term-select, select[id*="term" i], select[name*="term" i]') : null;
  let dropdownTerm = "";
  if (termSel && termSel.options && termSel.options.length > 0) {
    const selIdx = termSel.selectedIndex >= 0 ? termSel.selectedIndex : 0;
    const opt = Array.from(termSel.options).find((o) => o.selected) || termSel.options[selIdx];
    if (opt) {
      const text = (opt.textContent || "").trim();
      const tm = text.match(/(Spring|Summer|Fall|Winter)\d{4}/i);
      dropdownTerm = tm ? tm[0] : text;
    }
  }

  // 2. Check modern .fap-result-card
  const card = doc ? doc.querySelector(".fap-result-card") : null;
  let cardCourseCode = "";
  let cardCourseName = "";
  let cardTerm = "";

  if (card) {
    const codeEl = card.querySelector(".fap-result-card__code");
    if (codeEl) cardCourseCode = (codeEl.textContent || "").trim();

    const titleEl = card.querySelector(".fap-result-card__title");
    if (titleEl) {
      const clone = titleEl.cloneNode(true);
      const codeSpan = clone.querySelector(".fap-result-card__code");
      if (codeSpan) codeSpan.remove();
      cardCourseName = (clone.textContent || "").trim();
    }

    const metaEl = card.querySelector(".fap-result-card__meta");
    if (metaEl) {
      const metaText = metaEl.textContent || "";
      const tm = metaText.match(/(Spring|Summer|Fall|Winter)\d{4}/i);
      if (tm) cardTerm = tm[0];
    }
  }

  // 3. Term resolution: prefer dropdownTerm or cardTerm over raw UUID
  let finalTerm = dropdownTerm || cardTerm;
  if (!finalTerm && currentTerm && !/^[0-9a-f-]{30,}$/i.test(currentTerm)) {
    finalTerm = currentTerm;
  }
  if (!finalTerm && doc) {
    const termLink = doc.querySelector('a[href*="term="], a[href*="termId="]');
    if (termLink) {
      const tm = (termLink.getAttribute("href") || "").match(/term(?:Id)?=([^&]+)/i);
      if (tm && !/^[0-9a-f-]{30,}$/i.test(tm[1])) finalTerm = tm[1];
    }
    if (!finalTerm) {
      const termEl = doc.querySelector('a[href*="term="].selected, b, strong, .fap-result-card__meta');
      if (termEl) {
        const tm = (termEl.textContent || "").match(/(Spring|Summer|Fall|Winter)\d{4}/i);
        if (tm) finalTerm = tm[0];
      }
    }
  }
  if (!finalTerm) finalTerm = currentTerm || "";

  const courses = getGradePageCourses(doc);
  let activeCourse = null;

  if (cardCourseCode) {
    activeCourse = courses.find((c) => c.courseCode === cardCourseCode || (c.fullText && c.fullText.includes(cardCourseCode)));
    if (!activeCourse) {
      activeCourse = {
        id: currentCourseId || "current",
        courseCode: cardCourseCode,
        courseName: cardCourseName || cardCourseCode,
        fullText: cardCourseName ? `${cardCourseName} (${cardCourseCode})` : cardCourseCode,
        isActive: true
      };
    }
  }

  if (!activeCourse && currentCourseId) {
    activeCourse = courses.find((c) => c.id === currentCourseId);
  }
  if (!activeCourse) {
    activeCourse = courses.find((c) => c.isActive);
  }
  if (!activeCourse && courses.length > 0) {
    activeCourse = courses[0];
  } else if (!activeCourse && currentCourseId) {
    activeCourse = {
      id: currentCourseId,
      courseCode: `COURSE_${currentCourseId}`,
      courseName: `Môn học (${currentCourseId})`,
      isActive: true
    };
  }

  return {
    course: activeCourse,
    term: finalTerm,
    courses
  };
}

function extractStudentGradeFromPage(doc) {
  if (!doc) doc = typeof document !== "undefined" ? document : null;
  if (!doc) return null;

  const table = findFapGradeTable(doc);
  if (!table) return null;

  const { course, term } = getActiveCourseInfo(doc);
  const courseCode = course ? course.courseCode : "UNKNOWN";
  const courseName = course ? course.courseName : courseCode;

  let parsed = null;
  let parseFn = typeof parseFapGradeTable === "function"
    ? parseFapGradeTable
    : (typeof window !== "undefined" && typeof window.parseFapGradeTable === "function" ? window.parseFapGradeTable : null);

  if (!parseFn && typeof require === "function") {
    try {
      const g = require("./lib/grades.js");
      if (g && typeof g.parseFapGradeTable === "function") parseFn = g.parseFapGradeTable;
    } catch (_) {}
  }

  if (parseFn) {
    parsed = parseFn(table);
  } else {
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const categories = [];
    rows.forEach((r) => {
      const cells = Array.from(r.cells).map((c) => c.textContent.trim());
      if (cells.length >= 4) {
        categories.push({
          category: cells[0],
          item: cells[1],
          weight: parseFloat(cells[2].replace(/,/g, ".")) || 0,
          value: parseFloat(cells[3].replace(/,/g, ".")) || null
        });
      }
    });
    parsed = { categories, bonus: 0, average: null, status: null };
  }

  return {
    courseCode: courseCode || "UNKNOWN",
    courseName: courseName || courseCode || "Môn học",
    term: term || "",
    ...parsed,
    lastUpdated: Date.now()
  };
}

function getGradePageControls(doc) {
  if (!doc) doc = typeof document !== "undefined" ? document : null;
  const { courses, term } = getActiveCourseInfo(doc);
  return {
    ok: courses.length > 0,
    term,
    courses
  };
}

async function fetchCourseGradeFromPage(url) {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Try full extractStudentGradeFromPage if available
    const extractFn = typeof extractStudentGradeFromPage === "function"
      ? extractStudentGradeFromPage
      : (typeof window !== "undefined" && typeof window.extractStudentGradeFromPage === "function" ? window.extractStudentGradeFromPage : null);
    if (extractFn) {
      const fullGrade = extractFn(doc);
      if (fullGrade && fullGrade.categories && fullGrade.categories.length > 0) {
        return fullGrade;
      }
    }

    const findFn = typeof findFapGradeTable === "function"
      ? findFapGradeTable
      : (typeof window !== "undefined" && typeof window.findFapGradeTable === "function"
          ? window.findFapGradeTable
          : (typeof globalThis !== "undefined" && typeof globalThis.findFapGradeTable === "function" ? globalThis.findFapGradeTable : null));
    const table = findFn ? findFn(doc) : (doc.querySelector('table[summary="Report"]') || doc.querySelector("table.student-mark-sheet, .fap-result-card table"));
    if (!table) return null;
    let parseFn = typeof parseFapGradeTable === "function"
      ? parseFapGradeTable
      : (typeof window !== "undefined" && typeof window.parseFapGradeTable === "function"
          ? window.parseFapGradeTable
          : (typeof globalThis !== "undefined" && typeof globalThis.parseFapGradeTable === "function" ? globalThis.parseFapGradeTable : null));
    if (!parseFn) {
      try {
        const g = require("./lib/grades.js");
        if (g && typeof g.parseFapGradeTable === "function") parseFn = g.parseFapGradeTable;
      } catch (_) {}
    }
    if (!parseFn) return null;
    return parseFn(table);
  } catch (err) {
    return null;
  }
}

if (typeof window !== "undefined" && /(StudentGrade|GradeReport|Grade|Report\/Grade)/i.test(window.location.pathname || "")) {
  setTimeout(() => {
    try {
      const grade = extractStudentGradeFromPage();
      if (grade && grade.courseCode && grade.courseCode !== "UNKNOWN") {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: "SAVE_STUDENT_GRADE", type: "SAVE_STUDENT_GRADE", grade }).catch(() => {});
        }
      }
    } catch (_) {}
  }, 500);
}

if (typeof window !== "undefined" && typeof window.location !== "undefined") {
  const isCandidate = typeof isFapSessionCandidate === "function"
    ? isFapSessionCandidate(window.location.pathname)
    : (typeof FapKeepAlive !== "undefined" && typeof FapKeepAlive.isFapSessionCandidate === "function"
        ? FapKeepAlive.isFapSessionCandidate(window.location.pathname)
        : !window.location.pathname.toLowerCase().includes("default.aspx") && !window.location.pathname.toLowerCase().includes("logout.aspx"));

  if (isCandidate) {
    try {
      const createFn = typeof createFapKeepAlive === "function"
        ? createFapKeepAlive
        : (typeof FapKeepAlive !== "undefined" && FapKeepAlive.createFapKeepAlive ? FapKeepAlive.createFapKeepAlive : null);
      if (createFn) {
        const pingUrl = isCandidate && window.location.pathname ? window.location.pathname : undefined;
        const keepAlive = createFn(pingUrl ? { pingUrl } : {});
        keepAlive.start();
        window.__fapKeepAlive = keepAlive;
      }
    } catch (_) {}
  }
}

if (typeof window !== "undefined" && /(Feedback|Survey)/i.test(window.location.pathname || "")) {
  setTimeout(() => {
    try {
      const injectFn = typeof injectFapFeedbackToolbar === "function"
        ? injectFapFeedbackToolbar
        : (typeof FapFeedback !== "undefined" && FapFeedback.injectFapFeedbackToolbar ? FapFeedback.injectFapFeedbackToolbar : null);
      if (injectFn) {
        injectFn(document);
      }
    } catch (_) {}
  }, 400);
}

if (typeof window !== "undefined") {
  window.extractWeeklyScheduleFromTable = extractWeeklyScheduleFromTable;
  window.extractExamScheduleFromPage = extractExamScheduleFromPage;
  window.getScheduleOfWeekControls = getScheduleOfWeekControls;
  window.getIsoWeeksForYear = getIsoWeeksForYear;
  window.fetchAndExtractWeekSchedule = fetchAndExtractWeekSchedule;
  window.extractStudentGradeFromPage = extractStudentGradeFromPage;
  window.getGradePageControls = getGradePageControls;
  window.findFapGradeTable = findFapGradeTable;
  window.findGradeCourseSelect = findGradeCourseSelect;
  window.extractCourseCodeAndName = extractCourseCodeAndName;
  window.getGradePageCourses = getGradePageCourses;
  window.getActiveCourseInfo = getActiveCourseInfo;
  window.fetchCourseGradeFromPage = fetchCourseGradeFromPage;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    extractWeeklyScheduleFromTable,
    extractExamScheduleFromPage,
    getScheduleOfWeekControls,
    getIsoWeeksForYear,
    fetchAndExtractWeekSchedule,
    extractStudentGradeFromPage,
    getGradePageControls,
    findFapGradeTable,
    findGradeCourseSelect,
    extractCourseCodeAndName,
    getGradePageCourses,
    getActiveCourseInfo,
    fetchCourseGradeFromPage
  };
}

