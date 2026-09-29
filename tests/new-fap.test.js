const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const contentScraper = require("../content.js");

function loadFixture(filename) {
  const fixturePath = path.join(__dirname, "fixtures", filename);
  if (fs.existsSync(fixturePath)) {
    return fs.readFileSync(fixturePath, "utf8");
  }
  return fs.readFileSync(path.join(__dirname, "..", filename), "utf8");
}

test("New FAP UI (v4.0.0): parses week.html timetable accurately", () => {
  const html = loadFixture("week.html");
  const dom = new JSDOM(html, { url: "https://fap.fpt.edu.vn/WeeklyTimetable" });
  const doc = dom.window.document;

  const { schedule, skipped } = contentScraper.extractWeeklyScheduleFromTable(doc);

  assert.strictEqual(skipped, 0, "No cells should be skipped in valid week.html");
  assert.strictEqual(schedule.length, 10, "Should extract exactly 10 class sessions");

  // Verify Slot 1 Sunday EXE201
  const slot1Sunday = schedule.find((e) => e.date === "27/9/2026" && e.slot === "Slot 1");
  assert.ok(slot1Sunday, "Slot 1 on Sunday must exist");
  assert.strictEqual(slot1Sunday.title, "EXE201");
  assert.strictEqual(slot1Sunday.attendanceStatus, "not yet");
  assert.strictEqual(slot1Sunday.isOnline, true);
  assert.strictEqual(slot1Sunday.location, "DE-C405");
  assert.strictEqual(slot1Sunday.rawDate.timeRange, "7:30-9:50");

  // Verify Slot 2 Friday EXE201 with Meet link and teacher
  const slot2Friday = schedule.find((e) => e.date === "25/9/2026" && e.slot === "Slot 2");
  assert.ok(slot2Friday, "Slot 2 on Friday must exist");
  assert.strictEqual(slot2Friday.title, "EXE201");
  assert.strictEqual(slot2Friday.attendanceStatus, "attended");
  assert.strictEqual(slot2Friday.isOnline, true);
  assert.strictEqual(slot2Friday.location, "BE-410");
  assert.strictEqual(slot2Friday.meetUrl, "https://meet.google.com/aaz-nwiq-tbo");
  assert.match(slot2Friday.description, /HieuDT46/);

  // Verify Slot 4 Wednesday WDP301 absent session
  const slot4Wednesday = schedule.find((e) => e.date === "23/9/2026" && e.slot === "Slot 4");
  assert.ok(slot4Wednesday, "Slot 4 on Wednesday must exist");
  assert.strictEqual(slot4Wednesday.title, "WDP301");
  assert.strictEqual(slot4Wednesday.attendanceStatus, "absent");
  assert.strictEqual(slot4Wednesday.attendanceColor, "red");
  assert.strictEqual(slot4Wednesday.isOnline, false);
  assert.strictEqual(slot4Wednesday.location, "DE-331");
  assert.strictEqual(slot4Wednesday.rawDate.timeRange, "15:20-17:40");

  // Verify Slot 6 Thursday EXE201g (night class with accented room name)
  const slot6Thursday = schedule.find((e) => e.date === "24/9/2026" && e.slot === "Slot 6");
  assert.ok(slot6Thursday, "Slot 6 on Thursday must exist");
  assert.strictEqual(slot6Thursday.title, "EXE201g");
  assert.strictEqual(slot6Thursday.attendanceStatus, "attended");
  assert.strictEqual(slot6Thursday.isOnline, true);
  assert.strictEqual(slot6Thursday.location, "Phòng EXE 4");
  assert.strictEqual(slot6Thursday.meetUrl, "https://meet.google.com/tzf-pqxg-wvn");
  assert.strictEqual(slot6Thursday.rawDate.timeRange, "20:00-22:20");

  // Verify Slot 9 Saturday EXE201
  const slot9Saturday = schedule.find((e) => e.date === "26/9/2026" && e.slot === "Slot 9");
  assert.ok(slot9Saturday, "Slot 9 on Saturday must exist");
  assert.strictEqual(slot9Saturday.title, "EXE201");
  assert.strictEqual(slot9Saturday.attendanceStatus, "not yet");
  assert.strictEqual(slot9Saturday.isOnline, true);
  assert.strictEqual(slot9Saturday.location, "EP-202");
  assert.strictEqual(slot9Saturday.rawDate.timeRange, "8:00-11:40");
});

test("New FAP UI (v4.0.0): getScheduleOfWeekControls detects modern container and returns full ISO weeks", () => {
  const html = loadFixture("week.html");
  const dom = new JSDOM(html, { url: "https://fap.fpt.edu.vn/WeeklyTimetable" });
  const doc = dom.window.document;

  const controls = contentScraper.getScheduleOfWeekControls(doc);
  assert.strictEqual(controls.ok, true);
  assert.strictEqual(controls.isNewUi, true);
  assert.strictEqual(controls.weeks.length, 53, "Year 2026 has 53 ISO weeks");
  assert.strictEqual(controls.weekIndex, 38, "Week (21/09 - 27/09) corresponds to ISO Week 39 (index 38)");
  assert.strictEqual(controls.weeks[38].value, "2026-W39");
  assert.strictEqual(controls.weeks[38].startDate, "2026-09-21");
  assert.strictEqual(controls.weeks[38].endDate, "2026-09-27");
  assert.strictEqual(controls.weeks[38].label, "Tuần 39 (21/09 - 27/09)");
  assert.strictEqual(controls.years.length >= 1, true);
  assert.strictEqual(controls.yearValue, "2026");
});

test("New FAP UI (v4.0.0): getScheduleOfWeekControls detects native weekly-timetable-week-actions picker", () => {
  const customHtml = `
    <div id="weekly-timetable-week-actions" class="weekly-timetable-week-actions row g-2 align-items-end">
      <div class="col-md-3 col-lg-2 weekly-timetable-week-actions__picker">
        <label class="form-label" for="weekly-timetable-week">Chọn tuần</label>
        <input class="form-control" id="weekly-timetable-week" type="week" name="week" title="Chọn tuần" value="2026-W42">
      </div>
      <div class="col-md-9 col-lg-10">
        <div class="fap-filter-actions">
          <button type="button" id="weekly-timetable-prev" class="btn btn-outline-secondary weekly-timetable-week-actions__button">Tuần trước</button>
          <button type="button" id="weekly-timetable-current" class="btn btn-primary weekly-timetable-week-actions__button weekly-timetable-week-actions__button--current">Tuần hiện tại</button>
          <button type="button" id="weekly-timetable-next" class="btn btn-outline-secondary weekly-timetable-week-actions__button">Tuần sau</button>
        </div>
      </div>
    </div>
    <div id="weekly-timetable-container" data-fetch-url="/WeeklyTimetable/WeekPartial" data-reference-date="2026-10-12">
      <div class="fw-semibold mb-3">Tuần (12/10 - 18/10)</div>
      <div class="weekly-timetable-grid"><table class="table"><thead><tr><th>Slot</th><th>Thứ 2 (12/10)</th></tr></thead><tbody></tbody></table></div>
    </div>
  `;
  const dom = new JSDOM(customHtml, { url: "https://fap.fpt.edu.vn/WeeklyTimetable" });
  const doc = dom.window.document;

  const controls = contentScraper.getScheduleOfWeekControls(doc);
  assert.strictEqual(controls.ok, true);
  assert.strictEqual(controls.isNewUi, true);
  assert.strictEqual(controls.weekIndex, 41, "2026-W42 corresponds to index 41");
  assert.strictEqual(controls.weeks[41].value, "2026-W42");
  assert.strictEqual(controls.weeks[41].label, "Tuần 42 (12/10 - 18/10)");
  assert.strictEqual(controls.weeks[41].startDate, "2026-10-12");
  assert.strictEqual(controls.weeks[41].endDate, "2026-10-18");
});

test("New FAP UI (v4.0.0): getIsoWeeksForYear calculates ISO-8601 calendar accurately", () => {
  const weeks2026 = contentScraper.getIsoWeeksForYear(2026);
  assert.strictEqual(weeks2026.length, 53);
  assert.strictEqual(weeks2026[0].value, "2026-W01");
  assert.strictEqual(weeks2026[0].startDate, "2025-12-29");
  assert.strictEqual(weeks2026[0].endDate, "2026-01-04");
  assert.strictEqual(weeks2026[0].label, "Tuần 1 (29/12 - 04/01)");

  const weeks2025 = contentScraper.getIsoWeeksForYear(2025);
  assert.strictEqual(weeks2025.length, 52);
  assert.strictEqual(weeks2025[0].value, "2025-W01");
  assert.strictEqual(weeks2025[0].startDate, "2024-12-30");
  assert.strictEqual(weeks2025[0].endDate, "2025-01-05");
});

test("New FAP UI (v4.0.0): fetchAndExtractWeekSchedule extracts directly when week matches DOM", async () => {
  const html = loadFixture("week.html");
  const dom = new JSDOM(html, { url: "https://fap.fpt.edu.vn/WeeklyTimetable" });
  const doc = dom.window.document;

  const weekMeta = {
    index: 38,
    weekNumber: 39,
    value: "2026-W39",
    refDate: "2026-09-28",
    label: "Tuần (21/09 - 27/09)"
  };

  const result = await contentScraper.fetchAndExtractWeekSchedule(weekMeta, doc);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.schedule.length, 10);
  assert.strictEqual(result.skipped, 0);
});

test("New FAP UI (v4.0.0): fetchAndExtractWeekSchedule handles background AJAX fetch with clean parameters", async () => {
  const html = loadFixture("week.html");
  const dom = new JSDOM(`
    <div id="weekly-timetable-container" data-fetch-url="/WeeklyTimetable/WeekPartial" data-reference-date="2026-10-05">
      <div class="fw-semibold">Tuần (05/10 - 11/10)</div>
      <div class="weekly-timetable-grid"></div>
    </div>
  `, { url: "https://fap.fpt.edu.vn/WeeklyTimetable" });
  const doc = dom.window.document;

  const attemptedUrls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    attemptedUrls.push(url);
    if (url.includes("referenceDate=2026-09-21")) {
      return {
        ok: true,
        status: 200,
        redirected: false,
        text: async () => html
      };
    }
    return { ok: false, status: 404, redirected: false, text: async () => "" };
  };

  try {
    const weekMeta = {
      index: 38,
      weekNumber: 39,
      value: "2026-W39",
      refDate: "2026-09-21",
      startDate: "2026-09-21",
      label: "Tuần 39 (21/09 - 27/09)"
    };

    const result = await contentScraper.fetchAndExtractWeekSchedule(weekMeta, doc);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.schedule.length, 10);
    assert.ok(attemptedUrls[0].includes("referenceDate=2026-09-21"), "First attempted URL should use clean referenceDate");
  } finally {
    global.fetch = originalFetch;
  }
});

test("New FAP UI (v4.0.0): fetchAndExtractWeekSchedule rejects wrong-week HTML and moves to matching candidate", async () => {
  const html = loadFixture("week.html");
  const dom = new JSDOM(`
    <div id="weekly-timetable-container" data-fetch-url="/WeeklyTimetable/WeekPartial" data-reference-date="2026-10-05">
      <div class="fw-semibold">Tuần (05/10 - 11/10)</div>
      <div class="weekly-timetable-grid"></div>
    </div>
  `, { url: "https://fap.fpt.edu.vn/WeeklyTimetable" });
  const doc = dom.window.document;

  const wrongWeekHtml = `
    <div id="weekly-timetable-container">
      <div class="fw-semibold">Tuần (05/10 - 11/10)</div>
      <div class="weekly-timetable-grid"><table class="table"><thead><tr><th>Slot</th><th>Thứ 2 (05/10)</th></tr></thead><tbody></tbody></table></div>
    </div>
  `;

  let callCount = 0;
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    callCount += 1;
    // First candidate returns default week (wrong week)
    if (callCount === 1) {
      return { ok: true, status: 200, redirected: false, text: async () => wrongWeekHtml };
    }
    // Second candidate returns the target week
    return { ok: true, status: 200, redirected: false, text: async () => html };
  };

  try {
    const weekMeta = {
      index: 38,
      weekNumber: 39,
      value: "2026-W39",
      refDate: "2026-09-21",
      startDate: "2026-09-21",
      label: "Tuần 39 (21/09 - 27/09)"
    };

    const result = await contentScraper.fetchAndExtractWeekSchedule(weekMeta, doc);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.schedule.length, 10);
    assert.ok(callCount >= 2, "Must reject the first response and try subsequent candidate URL");
  } finally {
    global.fetch = originalFetch;
  }
});

test("New FAP UI (v4.0.0): fetchAndExtractWeekSchedule detects session expiration / login redirect", async () => {
  const dom = new JSDOM(`
    <div id="weekly-timetable-container" data-fetch-url="/WeeklyTimetable/WeekPartial"></div>
  `, { url: "https://fap.fpt.edu.vn/WeeklyTimetable" });
  const doc = dom.window.document;

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 401,
    redirected: true,
    url: "https://fap.fpt.edu.vn/Default.aspx"
  });

  try {
    const res = await contentScraper.fetchAndExtractWeekSchedule({ value: "2026-W39" }, doc);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.loginRequired, true);
  } finally {
    global.fetch = originalFetch;
  }
});

test("New FAP UI (v4.0.0): parses exam.html schedule accurately", () => {
  const html = loadFixture("exam.html");
  const dom = new JSDOM(html, { url: "https://fap.fpt.edu.vn/ExamSchedule" });
  const doc = dom.window.document;

  const exams = contentScraper.extractExamScheduleFromPage(doc);
  assert.strictEqual(exams.length, 2, "Should extract both exam entries");

  exams.forEach((exam) => {
    assert.strictEqual(exam.title, "WDP301");
    assert.strictEqual(exam.tag, "2NDFE");
    assert.strictEqual(exam.location, "");
    assert.match(exam.description, /Dự án phát triển Web/);
    assert.match(exam.description, /Note: This exam schedule/);

    assert.strictEqual(exam.start.getFullYear(), 2026);
    assert.strictEqual(exam.start.getMonth(), 10); // 0-indexed: 10 is November
    assert.strictEqual(exam.start.getDate(), 15);
    assert.strictEqual(exam.start.getHours(), 12);
    assert.strictEqual(exam.start.getMinutes(), 50);

    assert.strictEqual(exam.end.getFullYear(), 2026);
    assert.strictEqual(exam.end.getMonth(), 10);
    assert.strictEqual(exam.end.getDate(), 15);
    assert.strictEqual(exam.end.getHours(), 17);
    assert.strictEqual(exam.end.getMinutes(), 40);
  });
});

test("New FAP UI (v4.0.0): keepalive and grade route compatibility", () => {
  const { isFapSessionCandidate } = require("../lib/fap-keepalive.js");
  assert.strictEqual(isFapSessionCandidate("/WeeklyTimetable"), true);
  assert.strictEqual(isFapSessionCandidate("/ExamSchedule"), true);
  assert.strictEqual(isFapSessionCandidate("/StudentGrade"), true);
  assert.strictEqual(isFapSessionCandidate("/Report/Grade"), true);
  assert.strictEqual(isFapSessionCandidate("/Default"), false);
  assert.strictEqual(isFapSessionCandidate("/Login"), false);
  assert.strictEqual(isFapSessionCandidate("/Logout"), false);
});

test("New FAP UI (v4.0.0): attendance matching keys cross-match between new and legacy event titles", () => {
  const keyOf = (ev) => {
    if (ev && ev.rawDate) {
      const rd = ev.rawDate;
      const code = (ev.code || (ev.title || "").split(/\s*-\s*/)[0] || ev.title || "").trim().toUpperCase();
      const y = Number(rd.year);
      const m = Number(rd.month);
      const d = Number(rd.day);
      const sh = Number(rd.startHour);
      const sm = Number(rd.startMinute);
      return `${code}__${y}-${m}-${d}__${sh}:${sm}`;
    }
    return null;
  };

  const oldEv = {
    title: "EXE201",
    rawDate: { year: 2026, month: 9, day: 25, startHour: 8, startMinute: 30 }
  };
  const newEv = {
    title: "EXE201 - GD1911-AD",
    rawDate: { year: 2026, month: 9, day: 25, startHour: 8, startMinute: 30 }
  };

  assert.strictEqual(keyOf(oldEv), keyOf(newEv));
  assert.strictEqual(keyOf(newEv), "EXE201__2026-9-25__8:30");
});
