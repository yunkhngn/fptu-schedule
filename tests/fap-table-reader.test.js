const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const tableReader = require("../lib/fap-table-reader.js");
const { readTables, readSelect } = tableReader;

const loadFixtureDoc = (filename) => {
  const html = fs.readFileSync(path.resolve(__dirname, "fixtures/pages", filename), "utf8");
  return new JSDOM(html).window.document;
};

describe("fap-table-reader", () => {
  test("readTables extracts headers, rows and links matching tbody rows from subject.html", () => {
    const doc = loadFixtureDoc("subject.html");
    const tables = readTables(doc);
    assert.ok(Array.isArray(tables));
    assert.ok(tables.length >= 1);

    const first = tables[0];
    assert.ok(first.headers.length > 0);
    const tbodyTrs = doc.querySelectorAll("table tbody tr");
    assert.equal(first.rows.length, tbodyTrs.length);
    assert.equal(first.links.length, first.rows.length);
  });

  test("readTables extracts rows from report-grade.html and transaction.html", () => {
    const gradeDoc = loadFixtureDoc("report-grade.html");
    const gradeTables = readTables(gradeDoc);
    assert.ok(gradeTables.length >= 1);
    const gradeTbodyTrs = gradeDoc.querySelectorAll("table tbody tr");
    assert.equal(gradeTables[0].rows.length, gradeTbodyTrs.length);

    const txDoc = loadFixtureDoc("transaction.html");
    const txTables = readTables(txDoc);
    assert.ok(txTables.length >= 1);
    const txTbodyTrs = txDoc.querySelectorAll("table tbody tr");
    assert.equal(txTables[0].rows.length, txTbodyTrs.length);
  });

  test("readTables handles empty tables, empty cells, and escapes html in textContent", () => {
    const dom = new JSDOM(`
      <table>
        <thead>
          <tr><th>Col 1</th><th>Col 2</th></tr>
        </thead>
        <tbody>
          <tr><td></td><td><img src="x" onerror="alert(1)">Some <b>bold</b> text</td></tr>
        </tbody>
      </table>
      <table id="empty-table">
        <thead><tr><th>A</th></tr></thead>
        <tbody></tbody>
      </table>
    `);
    const tables = readTables(dom.window.document);
    assert.equal(tables.length, 2);

    const first = tables[0];
    assert.equal(first.rows.length, 1);
    assert.equal(first.rows[0][0], "");
    assert.equal(first.rows[0][1], "Some bold text");

    const second = tables[1];
    assert.deepEqual(second.rows, []);
  });

  test("readSelect extracts selected value and options", () => {
    const dom = new JSDOM(`
      <form>
        <select id="term" name="term">
          <option value="1">Spring 2026</option>
          <option value="2" selected>Summer 2026</option>
          <option value="3">Fall 2026</option>
        </select>
      </form>
    `);
    const result = readSelect(dom.window.document, "#term");
    assert.ok(result);
    assert.equal(result.value, "2");
    assert.equal(result.options.length, 3);
    assert.deepEqual(result.options[1], { value: "2", label: "Summer 2026" });

    // Non-existent selector returns null
    assert.equal(readSelect(dom.window.document, "#missing"), null);
  });
});
