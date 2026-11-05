const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const records = require("../lib/fap-readers-records.js");
const {
  readTransactions,
  readDocuments,
  readWishlist,
  readFyeLog,
  readApplications,
  readApplicationCatalog,
  readListOrEmpty,
} = records;

const loadFixtureDoc = (filename) => {
  const html = fs.readFileSync(path.resolve(__dirname, "fixtures/pages", filename), "utf8");
  return new JSDOM(html).window.document;
};

describe("fap-readers-records", () => {
  describe("readTransactions", () => {
    test("extracts transaction rows, amounts, and direction", () => {
      const doc = loadFixtureDoc("transaction.html");
      const res = readTransactions(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.rows));
      assert.ok(res.rows.length >= 1);

      const first = res.rows[0];
      assert.ok(first.date);
      assert.ok(first.description);
      assert.ok(first.amount);
      assert.equal(first.direction, "out");

      const second = res.rows[1];
      assert.equal(second.direction, "in");
    });

    test("returns null for empty document", () => {
      const emptyDoc = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
      assert.equal(readTransactions(emptyDoc), null);
    });
  });

  describe("readDocuments", () => {
    test("extracts document rows with category and link", () => {
      const doc = loadFixtureDoc("document.html");
      const res = readDocuments(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.rows));
      assert.ok(res.rows.length >= 1);

      const first = res.rows[0];
      assert.ok(first.title);
    });

    test("returns null for empty document", () => {
      const emptyDoc = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
      assert.equal(readDocuments(emptyDoc), null);
    });
  });

  describe("readWishlist", () => {
    test("extracts wishlist rows and register link", () => {
      const doc = loadFixtureDoc("wishlist.html");
      const res = readWishlist(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.rows));
      assert.equal(res.rows.length, 0); // empty state fixture
    });

    test("returns null for empty document", () => {
      const emptyDoc = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
      assert.equal(readWishlist(emptyDoc), null);
    });
  });

  describe("readFyeLog", () => {
    test("extracts FYE log rows", () => {
      const doc = loadFixtureDoc("fye-check-in-log.html");
      const res = readFyeLog(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.rows));
    });

    test("extracts FYE mentor feedback", () => {
      const doc = loadFixtureDoc("fye-mentor-feedback.html");
      const res = readFyeLog(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.rows));
    });
  });

  describe("readApplications", () => {
    test("extracts student submitted applications", () => {
      const doc = loadFixtureDoc("application.html");
      const res = readApplications(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.rows));
      assert.ok(res.rows.length >= 1);

      const first = res.rows[0];
      assert.ok(first.type);
      assert.ok(first.status);
    });
  });

  describe("readApplicationCatalog", () => {
    test("extracts application catalog card items", () => {
      const doc = loadFixtureDoc("application-catalog.html");
      const res = readApplicationCatalog(doc);
      assert.ok(res);
      assert.ok(Array.isArray(res.items));
      assert.ok(res.items.length >= 1);

      const first = res.items[0];
      assert.ok(first.title);
      assert.ok(first.href);
    });
  });

  describe("readListOrEmpty", () => {
    test("extracts empty state and createHref for startup group", () => {
      const doc = loadFixtureDoc("startup-group.html");
      const res = readListOrEmpty(doc);
      assert.ok(res);
      assert.equal(res.empty, true);
      assert.ok(res.createHref && res.createHref.includes("StartupGroup/Add"));
    });

    test("extracts empty state and createHref for cross class change", () => {
      const doc = loadFixtureDoc("cross-class-change.html");
      const res = readListOrEmpty(doc);
      assert.ok(res);
      assert.equal(res.empty, true);
      assert.ok(res.createHref && res.createHref.includes("CrossClassChange/Create"));
    });
  });
});
