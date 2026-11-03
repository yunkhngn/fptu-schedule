const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "fixtures", "fap-home.html"), "utf8");
const doc = new JSDOM(html).window.document;

test("fap-home fixture has the shell and dashboard blocks the skin targets", () => {
  ["div.wrapper", ".navbar-custom .fap-topbar", "aside.leftside-menu.fap-sidebar", ".content-page .container-fluid",
   ".fap-home-student-card", ".fap-home-news-card", ".fap-home-news-item", ".fap-home-quick-menu__link", "footer.footer"]
    .forEach((sel) => assert.ok(doc.querySelector(sel), sel));
});

test("fap-home fixture is sanitized", () => {
  assert.strictEqual(doc.querySelector(".fap-home-student-card__name").textContent.trim(), "Nguyễn Văn A");
  assert.strictEqual(doc.querySelector(".fap-home-student-card__roll").textContent.trim(), "SE000000");
  assert.strictEqual(doc.querySelector(".fap-topbar-avatar").textContent.trim(), "NA");
  assert.doesNotMatch(html, /[\w.+-]+@(?!example\.com)[\w-]+(\.[\w-]+)+/, "only example.com emails");
  assert.doesNotMatch(html, /\b(?!SE000000\b)[A-Z]{2}\d{5,}\b/, "no student ids");
  assert.strictEqual(doc.querySelectorAll("script").length, 0, "no scripts");
  assert.strictEqual(doc.querySelectorAll('input[type="hidden"]').length, 0, "no hidden tokens");

  // Web notification tokens and sensitive identifiers sanitized
  const notifConfig = doc.querySelector("#web-notification-config");
  if (notifConfig) {
    assert.strictEqual(notifConfig.getAttribute("data-user-id"), "dummy-user-id");
    assert.strictEqual(notifConfig.getAttribute("data-login-registration-id"), "dummy-login-registration-id");
    assert.strictEqual(notifConfig.getAttribute("data-request-verification-token"), "dummy-request-verification-token");
  }
  assert.doesNotMatch(html, /01a0dfa7-5de9-72f4-93e8-33dabaa1b5af/, "no real user id");
  assert.doesNotMatch(html, /b1815caf47d54b80be61984e13057d5a/, "no real login registration id");
  assert.doesNotMatch(html, /CfDJ8IPsJUoLRnlMl9hToTu1vBwb/, "no raw anti-forgery token");

  // No residual third-party extension elements
  assert.strictEqual(doc.querySelectorAll("#jpenglishdictionaryLang, #jpenglishdictionary, #englishjpSetting, #jpenglishdictionaryOff, #mttContainer").length, 0, "no third-party extension elements");
});

const timetableFixturePath = path.join(__dirname, "fixtures", "fap-timetable.html");

test("fap-timetable fixture has the weekly timetable blocks the skin targets", () => {
  const timetableHtml = fs.readFileSync(timetableFixturePath, "utf8");
  const timetableDoc = new JSDOM(timetableHtml).window.document;
  [".weekly-timetable-grid", "#weekly-timetable-prev", ".weekly-timetable-mobile-card"]
    .forEach((sel) => assert.ok(timetableDoc.querySelector(sel), sel));
});

test("fap-timetable fixture is sanitized", () => {
  const timetableHtml = fs.readFileSync(timetableFixturePath, "utf8");
  const timetableDoc = new JSDOM(timetableHtml).window.document;
  assert.doesNotMatch(timetableHtml, /[\w.+-]+@(?!example\.com)[\w-]+(\.[\w-]+)+/, "only example.com emails");
  assert.doesNotMatch(timetableHtml, /\b(?!SE000000\b)[A-Z]{2}\d{5,}\b/, "no student ids");
  assert.strictEqual(timetableDoc.querySelectorAll("script").length, 0, "no scripts");
  assert.strictEqual(timetableDoc.querySelectorAll('input[type="hidden"]').length, 0, "no hidden tokens");

  // No real student name or real ID
  assert.doesNotMatch(timetableHtml, /Nguyễn Đăng Khoa/, "no real student name");
  assert.doesNotMatch(timetableHtml, /HE190183/, "no real student id");

  // Web notification tokens and sensitive identifiers sanitized
  const notifConfig = timetableDoc.querySelector("#web-notification-config");
  if (notifConfig) {
    assert.strictEqual(notifConfig.getAttribute("data-user-id"), "dummy-user-id");
    assert.strictEqual(notifConfig.getAttribute("data-login-registration-id"), "dummy-login-registration-id");
    assert.strictEqual(notifConfig.getAttribute("data-request-verification-token"), "dummy-request-verification-token");
  }

  // No residual third-party extension elements
  assert.strictEqual(timetableDoc.querySelectorAll("#jpenglishdictionaryLang, #jpenglishdictionary, #englishjpSetting, #jpenglishdictionaryOff, #mttContainer").length, 0, "no third-party extension elements");
});

const examFixturePath = path.join(__dirname, "fixtures", "fap-exam.html");

test("fap-exam fixture has the exam schedule table blocks the skin targets", () => {
  const examHtml = fs.readFileSync(examFixturePath, "utf8");
  const examDoc = new JSDOM(examHtml).window.document;
  const table = examDoc.querySelector("table.fap-sheet.fap-table--stack");
  assert.ok(table, "table.fap-sheet.fap-table--stack must exist");
  const cellsWithDataLabel = table.querySelectorAll("tbody td[data-label]");
  assert.ok(cellsWithDataLabel.length > 0, "must have cells with data-label attributes");
  assert.ok(examDoc.querySelector(".fap-result-card"), ".fap-result-card must exist");
});

test("fap-exam fixture is sanitized", () => {
  const examHtml = fs.readFileSync(examFixturePath, "utf8");
  const examDoc = new JSDOM(examHtml).window.document;
  assert.doesNotMatch(examHtml, /[\w.+-]+@(?!example\.com)[\w-]+(\.[\w-]+)+/, "only example.com emails");
  assert.doesNotMatch(examHtml, /\b(?!SE000000\b)[A-Z]{2}\d{5,}\b/, "no student ids");
  assert.strictEqual(examDoc.querySelectorAll("script").length, 0, "no scripts");
  assert.strictEqual(examDoc.querySelectorAll('input[type="hidden"]').length, 0, "no hidden tokens");

  // No real student name or real ID
  assert.doesNotMatch(examHtml, /Nguyễn Đăng Khoa/, "no real student name");
  assert.doesNotMatch(examHtml, /HE190183/, "no real student id");

  // Web notification tokens and sensitive identifiers sanitized
  const notifConfig = examDoc.querySelector("#web-notification-config");
  if (notifConfig) {
    assert.strictEqual(notifConfig.getAttribute("data-user-id"), "dummy-user-id");
    assert.strictEqual(notifConfig.getAttribute("data-login-registration-id"), "dummy-login-registration-id");
    assert.strictEqual(notifConfig.getAttribute("data-request-verification-token"), "dummy-request-verification-token");
  }

  // No residual third-party extension elements
  assert.strictEqual(examDoc.querySelectorAll("#jpenglishdictionaryLang, #jpenglishdictionary, #englishjpSetting, #jpenglishdictionaryOff, #mttContainer").length, 0, "no third-party extension elements");
});
