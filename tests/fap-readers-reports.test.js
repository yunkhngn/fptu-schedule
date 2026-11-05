const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const reports = require("../lib/fap-readers-reports.js");
const { readAttendanceReport, readGradeReport, readTranscript } = reports;

const loadFixtureDoc = (filename) => {
  const html = fs.readFileSync(path.resolve(__dirname, "fixtures/pages", filename), "utf8");
  return new JSDOM(html).window.document;
};

describe("fap-readers-reports", () => {
  describe("readAttendanceReport", () => {
    test("extracts courses, filter, sessions and computes attendance rate", () => {
      const doc = loadFixtureDoc("report-attendance.html");
      const res = readAttendanceReport(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.courses));
      assert.ok(res.courses.length >= 1);

      // Sessions match the number of tbody rows in attendance sheet
      const expectedRows = doc.querySelectorAll(".attendance-session-sheet tbody tr").length;
      assert.equal(res.sessions.length, expectedRows);

      // Selected course
      assert.ok(res.selectedCourse);

      // Filter has options
      assert.ok(res.filter);
      assert.ok(res.filter.options.length >= 1);
      assert.ok(res.filter.options[0].href);

      // Courses preserve id, href, and selected status
      assert.ok(res.courses[0].id);
      assert.ok(res.courses[0].href);
      assert.equal(res.courses[0].selected, true);
      if (res.courses.length > 1) {
        assert.equal(res.courses[1].selected, false);
      }

      // Rate is a number between 0 and 1 (or null if total is 0)
      const current = res.courses[0];
      if (current.total > 0) {
        assert.equal(typeof current.rate, "number");
        assert.ok(current.rate >= 0 && current.rate <= 1);
      } else {
        assert.equal(current.rate, null);
      }
    });

    test("returns null for empty document", () => {
      const emptyDoc = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
      assert.equal(readAttendanceReport(emptyDoc), null);
    });
  });

  describe("readGradeReport", () => {
    test("extracts term filter, courses, and grade components", () => {
      const doc = loadFixtureDoc("report-grade.html");
      const res = readGradeReport(doc);
      assert.ok(res);
      assert.ok(res.term);
      assert.ok(res.term.options.length >= 1);
      assert.ok(res.term.options[0].href);
      assert.ok(Array.isArray(res.courses));
      assert.ok(res.courses.length >= 1);
      assert.ok(res.courses[0].id);
      assert.ok(res.courses[0].href);

      const course = res.courses[0];
      assert.ok(course.components.length >= 1);
      assert.equal(course.selected, true);
      assert.equal(course.className, "SE1961-NJ");
      assert.ok(course.status);
      for (const comp of course.components) {
        assert.ok(typeof comp.name === "string");
        assert.ok(typeof comp.weight === "string");
        assert.ok(typeof comp.value === "string");
      }
    });

    test("extracts average, status and calculates result on modern FAP mark sheet", () => {
      const html = `
        <div id="grade-report" class="academic-report" data-report-url="/Report/Grade">
          <div class="card fap-result-card">
            <div class="card-header">
              <h5 class="fap-result-card__title">Philosophy of Marxism – Leninism <span class="fap-result-card__code">MLN111</span></h5>
              <p class="fap-result-card__meta">
                <span>SE1938-NJ</span>
                <span>Fall2026</span>
              </p>
            </div>
            <table class="student-mark-sheet">
              <tbody>
                <tr><td>Assignment 2</td><td>20%</td><td>9,5</td><td>-</td></tr>
                <tr><td>Assignment 1</td><td>20%</td><td>9,6</td><td>-</td></tr>
                <tr><td>Participation</td><td>10%</td><td>9,2</td><td>-</td></tr>
                <tr><td>Progress tests</td><td>20%</td><td>6,0</td><td>-</td></tr>
                <tr><td>Final exam</td><td>30%</td><td>5,8</td><td>-</td></tr>
                <tr><td>Final exam (Resit)</td><td>30%</td><td>-</td><td>-</td></tr>
                <tr class="sheet-grand-total">
                  <td>Tổng môn</td>
                  <td>Điểm trung bình</td>
                  <td><span class="grade-average">7,7</span></td>
                  <td><span class="grade-status">Trạng thái: Passed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      const doc = new JSDOM(html).window.document;
      const res = readGradeReport(doc);
      assert.ok(res);
      assert.equal(res.courses.length, 1);
      const c = res.courses[0];
      assert.equal(c.code, "MLN111");
      assert.equal(c.className, "SE1938-NJ");
      assert.equal(c.total, "7,7");
      assert.equal(c.status, "Passed");
      assert.equal(c.components.length, 6);
    });

    test("returns null for empty document", () => {
      const emptyDoc = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
      assert.equal(readGradeReport(emptyDoc), null);
    });
  });

  describe("readTranscript", () => {
    test("extracts transcript programs and course rows", () => {
      const doc = loadFixtureDoc("report-transcript.html");
      const res = readTranscript(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.programs));
      assert.ok(res.programs.length >= 1);

      const prog = res.programs[0];
      assert.ok(prog.title);
      assert.ok(prog.rows.length >= 1);

      const firstRow = prog.rows[0];
      assert.ok(firstRow.code);
      assert.ok(firstRow.name);
      assert.ok(firstRow.grade);
    });

    test("returns null for empty document", () => {
      const emptyDoc = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
      assert.equal(readTranscript(emptyDoc), null);
    });
  });
});

