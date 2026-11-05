const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const academic = require("../lib/fap-readers-academic.js");
const { readSubjects, readCurriculum, readCertificates } = academic;

const loadFixtureDoc = (filename) => {
  const html = fs.readFileSync(path.resolve(__dirname, "fixtures/pages", filename), "utf8");
  return new JSDOM(html).window.document;
};

describe("fap-readers-academic", () => {
  describe("readSubjects", () => {
    test("extracts subject rows from fixture", () => {
      const doc = loadFixtureDoc("subject.html");
      const res = readSubjects(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.rows));
      assert.ok(res.rows.length >= 1);

      const first = res.rows[0];
      assert.ok(first.code);
      assert.ok(first.name);

      const expectedRows = doc.querySelectorAll("tbody tr").length;
      assert.equal(res.rows.length, expectedRows);
    });

    test("returns null for empty document", () => {
      const emptyDoc = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
      assert.equal(readSubjects(emptyDoc), null);
    });
  });

  describe("readCurriculum", () => {
    test("extracts curriculum groups and rows from fixture", () => {
      const doc = loadFixtureDoc("curriculum.html");
      const res = readCurriculum(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.groups));
      assert.ok(res.groups.length >= 1);

      const group = res.groups[0];
      assert.ok(group.title);
      assert.ok(Array.isArray(group.rows));
      assert.ok(group.rows.length >= 1);

      const first = group.rows[0];
      assert.ok(first.code);
      assert.ok(first.name);
    });

    test("returns null for empty document", () => {
      const emptyDoc = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
      assert.equal(readCurriculum(emptyDoc), null);
    });
  });

  describe("readCertificates", () => {
    test("extracts certificate items and filters unsafe links", () => {
      const doc = loadFixtureDoc("my-certificates.html");
      const res = readCertificates(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.items));
      assert.ok(res.items.length >= 1);

      const cert = res.items[0];
      assert.ok(cert.name);
      assert.ok(cert.date);
      assert.ok(cert.href && !cert.href.startsWith("javascript:"));
    });

    test("discards javascript: links", () => {
      const html = `
        <div class="content-page">
          <span class="fap-page-title__crumb-current">Chứng chỉ của tôi</span>
          <table>
            <tbody>
              <tr>
                <td>1</td>
                <td>Chứng chỉ A</td>
                <td>Ref-01</td>
                <td>QD-01</td>
                <td>Fall2026</td>
                <td>01/01/2026</td>
                <td><a href="javascript:alert(1)">Tải</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      const doc = new JSDOM(html).window.document;
      const res = readCertificates(doc);
      assert.ok(res);
      assert.equal(res.items[0].href, null);
    });

    test("returns null for empty document", () => {
      const emptyDoc = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
      assert.equal(readCertificates(emptyDoc), null);
    });
  });
});
