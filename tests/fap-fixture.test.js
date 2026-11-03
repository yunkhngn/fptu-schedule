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
  assert.doesNotMatch(html, /[\w.+-]+@(?!example\.com)[\w-]+(\.[\w-]+)+/, "only example.com emails");
  assert.doesNotMatch(html, /\b(?!SE000000\b)[A-Z]{2}\d{5,}\b/, "no student ids");
  assert.strictEqual(doc.querySelectorAll("script").length, 0, "no scripts");
  assert.strictEqual(doc.querySelectorAll('input[type="hidden"]').length, 0, "no hidden tokens");
});
