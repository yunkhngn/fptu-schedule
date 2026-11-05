const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

let accountReader;
try {
  accountReader = require("../lib/fap-readers-account.js");
} catch (_) {
  accountReader = {};
}
const { readAccount } = accountReader;

const loadFixtureDoc = (filename) => {
  const html = fs.readFileSync(path.resolve(__dirname, "fixtures/pages", filename), "utf8");
  return new JSDOM(html).window.document;
};

describe("fap-readers-account", () => {
  test("extracts sections, fields, and editHref from account fixture", () => {
    assert.equal(typeof readAccount, "function", "readAccount should be a function");
    const doc = loadFixtureDoc("account.html");
    const res = readAccount(doc);
    assert.ok(res, "expected account data to be extracted");

    assert.equal(res.sections.length, 8, "should have 8 sections");

    const expectedTitles = [
      "Định danh",
      "Khác",
      "Học thuật",
      "Cá nhân & liên hệ",
      "CMND / Hộ chiếu",
      "Phụ huynh",
      "Bảo hiểm y tế",
      "Đồ án tốt nghiệp",
    ];
    assert.deepEqual(
      res.sections.map((s) => s.title),
      expectedTitles
    );

    const expectedCounts = [9, 5, 16, 7, 5, 6, 4, 3];
    assert.deepEqual(
      res.sections.map((s) => s.items.length),
      expectedCounts
    );

    // Check first section labels and values
    const firstSection = res.sections[0];
    assert.equal(firstSection.items[0].label, "AAAA");
    assert.equal(firstSection.items[0].value, "AA 000000");

    // Empty or "-" values should be normalized to "—"
    const emptyItem = firstSection.items.find((item) => item.label === "Aaa aaa");
    assert.ok(emptyItem);
    assert.equal(emptyItem.value, "—");

    assert.ok(res.editHref);
    assert.ok(res.editHref.includes("StudentProfile"));
  });

  test("normalizes whitespace and empty values to —", () => {
    assert.equal(typeof readAccount, "function");
    const dom = new JSDOM(`
      <div class="student-profile">
        <div class="card">
          <div class="card-header"><h5>Thông tin mẫu</h5></div>
          <div class="card-body">
            <div class="student-profile-field">
              <div class="student-profile-field__label">Mục trống 1</div>
              <div class="student-profile-field__value">-</div>
            </div>
            <div class="student-profile-field">
              <div class="student-profile-field__label">Mục trống 2</div>
              <div class="student-profile-field__value">   </div>
            </div>
            <div class="student-profile-field">
              <div class="student-profile-field__label">Mục có giá trị</div>
              <div class="student-profile-field__value">Hà Nội</div>
            </div>
          </div>
        </div>
      </div>
    `);
    const res = readAccount(dom.window.document);
    assert.ok(res);
    assert.equal(res.sections.length, 1);
    assert.equal(res.sections[0].items[0].value, "—");
    assert.equal(res.sections[0].items[1].value, "—");
    assert.equal(res.sections[0].items[2].value, "Hà Nội");
    assert.equal(res.editHref, null);
  });

  test("returns null for unrelated page or empty document", () => {
    assert.equal(typeof readAccount, "function");
    const dom = new JSDOM(`<div><h1>Not account</h1></div>`);
    const res = readAccount(dom.window.document);
    assert.equal(res, null);
  });
});
