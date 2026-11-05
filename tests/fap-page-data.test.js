const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const contentScraper = require("../content.js");
const FapPageData = require("../lib/fap-page-data.js");

function loadFixture(relPath) {
  const fullPath = path.join(__dirname, "fixtures", relPath);
  return fs.readFileSync(fullPath, "utf8");
}

function createDoc(html = "") {
  const dom = new JSDOM(html);
  return dom.window.document;
}

test("readShell extracts student info, campus and notifications from fap-home.html", () => {
  const html = loadFixture("fap-home.html");
  const doc = createDoc(html);

  const shell = FapPageData.readShell(doc);
  assert.ok(shell, "Shell data should be present");
  assert.strictEqual(shell.student.studentId, "SE000000");
  assert.strictEqual(shell.student.name, "Nguyễn Văn A");
  assert.strictEqual(shell.student.initials, "NA");
  assert.strictEqual(shell.campus, "Cơ sở Hà Nội (HN)");
  assert.strictEqual(typeof shell.unreadNotifications, "number");
});

test("readShell returns null when topbar or student info is absent", () => {
  const emptyDoc = createDoc("<div>No topbar here</div>");
  const shell = FapPageData.readShell(emptyDoc);
  assert.strictEqual(shell, null);
});

test("readHome extracts metrics and news items from home.html", () => {
  const html = loadFixture("pages/home.html");
  const doc = createDoc(html);

  const home = FapPageData.readHome(doc);
  assert.ok(home, "Home data should be present");
  assert.ok(home.metrics, "Metrics should be present");
  assert.strictEqual(home.metrics.status, "AA");
  assert.strictEqual(home.metrics.program, "AAA_AA_00A_AA");
  assert.strictEqual(home.metrics.email, "aaaaaaa.aaaa-aaaaa.aaa");
  assert.strictEqual(home.metrics.cohort, "00");
  assert.ok(home.metrics.balance.includes("0"), "Balance should contain 0");

  const newsItemsInDoc = doc.querySelectorAll(".fap-home-news-item");
  assert.strictEqual(home.news.length, newsItemsInDoc.length);
  assert.ok(home.categories.length > 0, "Categories should be extracted");
});

test("readHome returns null when data-home-slot is empty or missing", () => {
  const emptySlotDoc = createDoc('<div data-home-slot="student"></div><div data-home-slot="news"></div>');
  assert.strictEqual(FapPageData.readHome(emptySlotDoc), null);

  const emptyDoc = createDoc("<div>Nothing</div>");
  assert.strictEqual(FapPageData.readHome(emptyDoc), null);
});

test("readNews extracts news items and categories from pages/news.html", () => {
  const html = loadFixture("pages/news.html");
  const doc = createDoc(html);

  const newsData = FapPageData.readNews(doc);
  assert.ok(newsData, "News data should be present");
  assert.ok(Array.isArray(newsData.news), "News should be an array");
  assert.ok(newsData.news.length > 0, "Should have news items");
  assert.ok(Array.isArray(newsData.categories), "Categories should be an array");
  assert.ok(newsData.categories.includes("Tất cả"), "Categories should include Tất cả");
});

test("toTimetable converts weekly schedule from week.html to ClassSession array", () => {
  const html = loadFixture("week.html");
  const doc = createDoc(html);

  const { schedule } = contentScraper.extractWeeklyScheduleFromTable(doc);
  const timetable = FapPageData.toTimetable(schedule);

  assert.strictEqual(timetable.sessions.length, 10, "Should have 10 class sessions");
  assert.match(timetable.weekStart, /^\d{4}-\d{2}-\d{2}$/, "weekStart must be yyyy-MM-dd");

  const slot1Sunday = timetable.sessions.find((s) => s.date === "2026-09-27" && s.slot === 1);
  assert.ok(slot1Sunday, "Slot 1 on 2026-09-27 must exist");
  assert.strictEqual(slot1Sunday.date, "2026-09-27");
  assert.strictEqual(slot1Sunday.slot, 1);
  assert.strictEqual(slot1Sunday.mode, "online");
  assert.strictEqual(slot1Sunday.attendance, "not-yet");

  const slot4Wednesday = timetable.sessions.find((s) => s.date === "2026-09-23" && s.slot === 4);
  assert.ok(slot4Wednesday, "Slot 4 on 2026-09-23 must exist");
  assert.strictEqual(slot4Wednesday.attendance, "absent");

  const sessionWithMeet = timetable.sessions.find((s) => s.meetUrl);
  assert.ok(sessionWithMeet, "At least one session has meetUrl");
  assert.match(sessionWithMeet.meetUrl, /^https:\/\/meet\.google\.com\//);
});

test("toExams converts exam schedule from exam.html to ExamItem array", () => {
  const html = loadFixture("exam.html");
  const doc = createDoc(html);

  const events = contentScraper.extractExamScheduleFromPage(doc);
  const exams = FapPageData.toExams(events);

  assert.strictEqual(exams.length, 2, "Should have 2 exam items");
  exams.forEach((exam) => {
    assert.strictEqual(exam.courseCode, "WDP301");
    assert.strictEqual(exam.date, "2026-11-15");
    assert.match(exam.time, /^12:50-17:/, "Time must match start/end (12:50-17:...)");
  });
});

test("missing fields (meetUrl, location) result in undefined, not string 'undefined'", () => {
  const rawSchedule = [
    {
      title: "PRJ301",
      date: "21/09/2026",
      slot: "Slot 1",
      location: "",
      meetUrl: "",
      attendanceStatus: "not yet",
      isOnline: false,
      rawDate: { timeRange: "07:30-09:50" }
    }
  ];

  const timetable = FapPageData.toTimetable(rawSchedule);
  assert.strictEqual(timetable.sessions[0].room, undefined);
  assert.strictEqual(timetable.sessions[0].meetUrl, undefined);
  assert.notStrictEqual(timetable.sessions[0].room, "undefined");
  assert.notStrictEqual(timetable.sessions[0].meetUrl, "undefined");
});

test("news title with html tags or onerror retains raw text, not parsed into elements", () => {
  const doc = createDoc(`
    <div class="fap-home-news-item">
      <span class="fap-home-news-item__title">&lt;img src=x onerror=alert(1)&gt;</span>
      <span class="fap-home-news-item__meta">
        <span>Thông báo</span>
        <span>01/11/2026</span>
      </span>
    </div>
  `);

  const home = FapPageData.readHome(doc);
  assert.ok(home, "Home data extracted");
  assert.strictEqual(home.news[0].title, "<img src=x onerror=alert(1)>");
});

test("hasOriginalRows detects presence of original data rows", () => {
  const weekHtml = loadFixture("week.html");
  const weekDoc = createDoc(weekHtml);
  assert.strictEqual(FapPageData.hasOriginalRows(weekDoc, "timetable"), true);

  const examHtml = loadFixture("exam.html");
  const examDoc = createDoc(examHtml);
  assert.strictEqual(FapPageData.hasOriginalRows(examDoc, "exams"), true);

  const newsHtml = loadFixture("pages/news.html");
  const newsDoc = createDoc(newsHtml);
  assert.strictEqual(FapPageData.hasOriginalRows(newsDoc, "news"), true);

  const homeHtml = loadFixture("pages/home.html");
  const homeDoc = createDoc(homeHtml);
  assert.strictEqual(FapPageData.hasOriginalRows(homeDoc, "overview"), true);

  const emptyDoc = createDoc("<div><table><tbody></tbody></table></div>");
  assert.strictEqual(FapPageData.hasOriginalRows(emptyDoc, "timetable"), false);
  assert.strictEqual(FapPageData.hasOriginalRows(emptyDoc, "exams"), false);
  assert.strictEqual(FapPageData.hasOriginalRows(emptyDoc, "news"), false);
  assert.strictEqual(FapPageData.hasOriginalRows(emptyDoc, "overview"), false);
});

test("null and empty inputs are handled safely", () => {
  assert.strictEqual(FapPageData.readShell(null), null);
  assert.strictEqual(FapPageData.readHome(null), null);
  assert.strictEqual(FapPageData.readNews(null), null);
  assert.strictEqual(FapPageData.hasOriginalRows(null, "timetable"), false);

  const emptyTimetable = FapPageData.toTimetable([], new Date("2026-11-05"));
  assert.deepStrictEqual(emptyTimetable.sessions, []);
  assert.strictEqual(emptyTimetable.weekStart, "2026-11-02");

  assert.deepStrictEqual(FapPageData.toExams([]), []);
});

test("readTopbar extracts campus, language, notifications, and profile from fap-home.html", () => {
  const html = loadFixture("fap-home.html");
  const doc = createDoc(html);

  const topbar = FapPageData.readTopbar(doc);
  assert.ok(topbar, "Topbar data should be present");

  assert.deepStrictEqual(topbar.campus, {
    name: "Cơ sở Hà Nội (HN)",
    code: "HN",
    isMain: true,
  });

  assert.ok(topbar.language, "Language data should be present");
  assert.strictEqual(topbar.language.current, "vi");
  assert.deepStrictEqual(topbar.language.options, [
    { culture: "vi", label: "Tiếng Việt" },
    { culture: "en", label: "English" },
  ]);

  assert.ok(topbar.notifications, "Notifications data should be present");
  assert.strictEqual(topbar.notifications.available, true);
  assert.strictEqual(typeof topbar.notifications.unread, "number");

  assert.ok(topbar.profile, "Profile data should be present");
  assert.strictEqual(topbar.profile.name, "Nguyễn Văn A");
  assert.strictEqual(topbar.profile.studentId, "SE000000");
  assert.ok(topbar.profile.accountHref.endsWith("/Account"), "accountHref should end with /Account");
  assert.strictEqual(topbar.profile.canLogout, true);
});

test("readTopbar returns null fields on empty document or missing blocks", () => {
  const emptyDoc = createDoc("<div>Nothing</div>");
  const topbar = FapPageData.readTopbar(emptyDoc);
  assert.deepStrictEqual(topbar, {
    campus: null,
    language: null,
    notifications: null,
    profile: null,
  });

  assert.deepStrictEqual(FapPageData.readTopbar(null), {
    campus: null,
    language: null,
    notifications: null,
    profile: null,
  });
});

test("readTopbar safely handles malicious tags in profile name", () => {
  const html = `
    <div class="fap-topbar-user">
      <h5>&lt;img src=x onerror=alert(1)&gt;</h5>
      <h6>SE123456</h6>
    </div>
  `;
  const doc = createDoc(html);
  const topbar = FapPageData.readTopbar(doc);
  assert.ok(topbar.profile);
  assert.strictEqual(topbar.profile.name, "<img src=x onerror=alert(1)>");
});

