const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const conditions = require("../lib/fap-readers-conditions.js");
const { readConditions } = conditions;

const loadFixtureDoc = (filename) => {
  const html = fs.readFileSync(path.resolve(__dirname, "fixtures/pages", filename), "utf8");
  return new JSDOM(html).window.document;
};

describe("fap-readers-conditions", () => {
  test("extracts OJT conditions from fixture", () => {
    const doc = loadFixtureDoc("report-ojt-conditions.html");
    const res = readConditions(doc);
    assert.ok(res);
    assert.ok(res.summary);
    assert.equal(res.summary.eligible, null);
    assert.ok(res.summary.message.length > 0);
    assert.ok(Array.isArray(res.checks));
    assert.equal(res.checks.length, 0);
  });

  test("extracts Thesis conditions from fixture", () => {
    const doc = loadFixtureDoc("report-thesis-conditions.html");
    const res = readConditions(doc);
    assert.ok(res);
    assert.ok(res.summary);
    assert.equal(res.summary.eligible, null);
    assert.ok(res.summary.message.length > 0);
    assert.ok(Array.isArray(res.checks));
    assert.equal(res.checks.length, 0);
  });

  test("evaluates checks from table correctly", () => {
    const html = `
      <div class="content-page">
        <span class="fap-page-title__crumb-current">Thông báo điều kiện OJT</span>
        <table class="table">
          <thead>
            <tr><th>Điều kiện</th><th>Yêu cầu</th><th>Thực tế</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Số tín chỉ tích lũy</td>
              <td>&gt;= 90</td>
              <td>105</td>
              <td><span class="badge bg-success">Đạt</span></td>
            </tr>
            <tr>
              <td>Tiếng Anh OJT</td>
              <td>Pass</td>
              <td>Pass</td>
              <td><span class="badge bg-success">Đạt</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    const doc = new JSDOM(html).window.document;
    const res = readConditions(doc);
    assert.ok(res);
    assert.equal(res.checks.length, 2);
    assert.equal(res.checks[0].label, "Số tín chỉ tích lũy");
    assert.equal(res.checks[0].required, ">= 90");
    assert.equal(res.checks[0].actual, "105");
    assert.equal(res.checks[0].passed, true);
    assert.equal(res.summary.eligible, true);
  });

  test("detects failed conditions", () => {
    const html = `
      <div class="content-page">
        <span class="fap-page-title__crumb-current">Điều kiện xét khóa luận</span>
        <table class="table">
          <tbody>
            <tr>
              <td>Số tín chỉ tích lũy</td>
              <td>120</td>
              <td>105</td>
              <td><span class="badge bg-danger">Không đạt</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    const doc = new JSDOM(html).window.document;
    const res = readConditions(doc);
    assert.ok(res);
    assert.equal(res.checks[0].passed, false);
    assert.equal(res.summary.eligible, false);
  });

  test("marks indeterminate when status icon or badge is unknown", () => {
    const html = `
      <div class="content-page">
        <span class="fap-page-title__crumb-current">Điều kiện xét khóa luận</span>
        <table class="table">
          <tbody>
            <tr>
              <td>Điều kiện đặc biệt</td>
              <td>Xét duyệt</td>
              <td>Đang chờ</td>
              <td><span>Đang duyệt</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    const doc = new JSDOM(html).window.document;
    const res = readConditions(doc);
    assert.ok(res);
    assert.equal(res.checks[0].passed, null);
    assert.equal(res.summary.eligible, null);
  });

  test("returns null for empty document", () => {
    const emptyDoc = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
    assert.equal(readConditions(emptyDoc), null);
  });
});
