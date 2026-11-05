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
      assert.ok(Array.isArray(res.courses));
      assert.ok(res.courses.length >= 1);

      const course = res.courses[0];
      assert.ok(course.components.length >= 1);
      for (const comp of course.components) {
        assert.ok(typeof comp.name === "string");
        assert.ok(typeof comp.weight === "string");
        assert.ok(typeof comp.value === "string");
      }
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
