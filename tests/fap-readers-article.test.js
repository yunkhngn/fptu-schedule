const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

let articleReader;
try {
  articleReader = require("../lib/fap-readers-article.js");
} catch (_) {
  articleReader = {};
}
const { readArticle } = articleReader;

const loadFixtureDoc = (filename) => {
  const html = fs.readFileSync(path.resolve(__dirname, "fixtures/pages", filename), "utf8");
  return new JSDOM(html).window.document;
};

describe("fap-readers-article", () => {
  test("extracts article details from news-detail fixture", () => {
    assert.equal(typeof readArticle, "function", "readArticle should be a function");
    const doc = loadFixtureDoc("news-detail.html");
    const res = readArticle(doc);
    assert.ok(res, "expected news article data to be extracted");
    assert.equal(
      res.title,
      "Thông báo lịch thi kết thúc học phần lần 1, lần 2 các môn học Block 1-4 học kỳ Fall 2026"
    );
    assert.ok(Array.isArray(res.meta), "meta should be an array");
    assert.ok(res.meta.length >= 1, "meta should have items");
    assert.ok(
      res.meta.some((m) => m.value.includes("Thông tin Khảo Thí")),
      "expected category in meta"
    );
    assert.equal(res.bodySelector, ".fap-news-content");
    assert.ok(Array.isArray(res.attachments));
    assert.ok(res.backHref && res.backHref.includes("News"));
  });

  test("extracts article details and file attachments from document-detail fixture", () => {
    assert.equal(typeof readArticle, "function", "readArticle should be a function");
    const doc = loadFixtureDoc("document-detail.html");
    const res = readArticle(doc);
    assert.ok(res, "expected document detail data to be extracted");
    assert.equal(res.title, "View syllabus");
    assert.ok(Array.isArray(res.meta));
    assert.ok(res.meta.length >= 1);
    assert.ok(
      res.meta.some((m) => m.label.includes("Aaa") || m.value.includes("Aaaa aaaaaaaa")),
      "expected field in meta"
    );
    assert.ok(Array.isArray(res.attachments));
    assert.equal(res.attachments.length, 1);
    assert.equal(res.attachments[0].name, "Mở tệp");
    assert.equal(res.attachments[0].href, "https://flm.fpt.edu.vn/");
    assert.ok(res.bodySelector === ".fap-document-body" || res.bodySelector === ".fap-document-content");
    assert.ok(res.backHref && res.backHref.includes("Document"));
  });

  test("filters out javascript: links from attachments", () => {
    assert.equal(typeof readArticle, "function");
    const dom = new JSDOM(`
      <div class="fap-news-detail-card">
        <h1 class="fap-news-detail-title">Test Title</h1>
        <div class="fap-news-content">Body text</div>
        <a class="fap-document-file-btn" href="javascript:alert(1)">Bad Link</a>
        <a class="fap-document-file-btn" href="https://fap.fpt.edu.vn/valid.pdf">Valid File</a>
      </div>
    `);
    const res = readArticle(dom.window.document);
    assert.ok(res);
    assert.equal(res.attachments.length, 1);
    assert.equal(res.attachments[0].href, "https://fap.fpt.edu.vn/valid.pdf");
  });

  test("returns null when article body is missing", () => {
    assert.equal(typeof readArticle, "function");
    const dom = new JSDOM(`
      <div class="fap-news-detail-card">
        <h1 class="fap-news-detail-title">Test Title</h1>
        <!-- missing body -->
      </div>
    `);
    const res = readArticle(dom.window.document);
    assert.equal(res, null);
  });

  test("returns null for unrelated page or empty document", () => {
    assert.equal(typeof readArticle, "function");
    const dom = new JSDOM(`<div><h1>Some page</h1></div>`);
    const res = readArticle(dom.window.document);
    assert.equal(res, null);
  });
});
