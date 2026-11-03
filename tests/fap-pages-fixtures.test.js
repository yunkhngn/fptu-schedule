const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const dir = path.join(__dirname, "fixtures", "pages");
const index = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));

test("every page in the survey has a fixture", () => {
  assert.ok(index.length >= 31);
  index.forEach((p) => assert.ok(fs.existsSync(path.join(dir, p.slug + ".html")), p.slug));
  assert.ok(new Set(index.map((p) => p.pattern)).size >= 6);
});
test("fixtures are structure-only and free of personal data", () => {
  index.forEach(({ slug }) => {
    const html = fs.readFileSync(path.join(dir, slug + ".html"), "utf8");
    const doc = new JSDOM(html).window.document;
    assert.ok(doc.querySelector(".content-page"), slug);
    assert.strictEqual(doc.querySelectorAll("script,style,link,iframe,input[type=hidden]").length, 0, slug);
    assert.doesNotMatch(html, /[\w.+-]+@[\w-]+(\.[\w-]+)+/, slug + ": email");
    assert.doesNotMatch(html, /\b[A-Z]{2}\d{5,}\b/, slug + ": student id");
    assert.doesNotMatch(html, /(?:\+84|\b0)\d{8,10}\b|\b\d{9,}\b/, slug + ": phone or long number");
    doc.querySelectorAll("tbody").forEach((tb) => assert.ok(tb.querySelectorAll(":scope > tr").length <= 3, slug));
    doc.querySelectorAll("input:not([type=checkbox]):not([type=radio]), textarea").forEach((el) =>
      assert.ok(!(el.getAttribute("value") || el.textContent), slug + ": field value"));
  });
});
