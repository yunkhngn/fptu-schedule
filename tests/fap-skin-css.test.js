const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { ACCENT_PRESETS } = require("../lib/accent.js");
const { css, stripComments, parseRules, rules } = require("./helpers/fap-skin-css.js");

const manifestPath = path.join(__dirname, "../manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const fixturePath = path.join(__dirname, "fixtures/fap-home.html");
const html = fs.readFileSync(fixturePath, "utf8");
const doc = new JSDOM(html).window.document;

test("every skin selector is gated so the skin can be switched off instantly", () => {
  assert.ok(rules.length > 0, "skin rules must not be empty");
  rules.forEach((r) => r.selector.split(",").forEach((s) =>
    assert.ok(s.trim().startsWith('html:not([data-fptu-skin="off"])'), `ungated: ${s.trim()}`)));
});

test("the skin never hides FAP content", () => {
  rules.forEach((r) => assert.doesNotMatch(r.body, /display:\s*none|visibility:\s*hidden|opacity:\s*0(?![.\d])|content:\s*["']/));
});

test("light and dark follow FAP's data-bs-theme, not the OS", () => {
  assert.doesNotMatch(css, /prefers-color-scheme/);
});

test("accent defaults match the blue preset and nothing else hard-codes a color accent", () => {
  const blue = ACCENT_PRESETS[0];
  assert.ok(css.includes(`--fptu-accent: ${blue.light}`) && css.includes(`--fptu-accent: ${blue.dark}`));
  assert.doesNotMatch(css.replace(/--fptu-accent[\w-]*:[^;]+;/g, ""), /#(2563eb|3b82f6|4254ba)\b/i);
});

test("backdrop-filter is limited to bars, dialogs and menus", () => {
  const allowed = /(navbar-custom|fap-topbar|leftside-menu|fap-sidebar|modal-content|dropdown-menu|fap-sticky|select2-dropdown)/;
  rules.filter((r) => /backdrop-filter/.test(r.body)).forEach((r) => assert.match(r.selector, allowed));
});

test("transparency can be turned off", () => {
  assert.match(css, /@media \(prefers-reduced-transparency: reduce\)/);
});

test("core components are covered by the skin", () => {
  ["\\.card", "\\.btn-primary", "\\.form-control", "\\.table", "\\.badge", "\\.dropdown-menu", "\\.modal-content", "\\.pagination"]
    .forEach((sel) => assert.match(css, new RegExp(sel)));
});

test("the dashboard blocks are styled", () => {
  ["fap-home-student-card", "fap-home-news-card", "fap-home-news-item", "fap-home-quick-menu__link", "fap-home-fee"]
    .forEach((c) => assert.ok(css.includes("." + c), c));
});

test("the fap-* classes the skin targets exist in the home fixture", () => {
  const KNOWN_ABSENT = [
    "fap-home-fee",
    "fap-home-fee-card",
    "fap-home-fee-warning",
    "fap-home-news-item__icon--pinned",
    "fap-home-news-item__meta--pinned",
    "fap-filter-card",
    "fap-filter-actions",
    "fap-result-card",
    "fap-chip",
    "fap-empty-state",
    "fap-page-title__crumb-link",
    "fap-sheet",
    "fap-table--stack",
    "fap-page-size-select",
    "fap-table-card",
    "fap-empty-card",
    "fap-create-btn",
    "fap-back-btn",
    "fap-list-page",
    "fap-status"
  ]; // in home.css or other page components (style.css)
  const used = [...new Set(css.match(/\.fap-[\w-]+/g) || [])].map((c) => c.slice(1));
  used.filter((c) => !KNOWN_ABSENT.some((k) => c.startsWith(k)))
      .forEach((c) => assert.ok(doc.querySelector("." + c) || html.includes(c), c));
});

test("manifest loads the skin early, on FAP only", () => {
  const block = manifest.content_scripts.find((b) => (b.css || []).includes("lib/fap-skin.css"));
  assert.ok(block, "content_scripts block with lib/fap-skin.css must exist");
  assert.deepStrictEqual(block.matches, ["*://fap.fpt.edu.vn/*"]);
  assert.strictEqual(block.run_at, "document_start");
  assert.deepStrictEqual(block.js, ["lib/accent.js", "lib/fap-skin.js"]);
});

test("weekly timetable components are styled and selectors avoid column index or nth-child", () => {
  ["weekly-timetable-grid", "weekly-timetable-week-actions__button", "weekly-timetable-mobile-card", "fap-filter-card"]
    .forEach((cls) => assert.ok(css.includes(cls), `missing CSS target: ${cls}`));

  const timetableRules = rules.filter((r) => r.selector.includes("weekly-timetable"));
  assert.ok(timetableRules.length > 0, "must have weekly timetable rules");
  timetableRules.forEach((r) => {
    assert.doesNotMatch(
      r.selector,
      /:nth-(?:child|of-type)/,
      `timetable selectors must not use :nth-child or :nth-of-type: ${r.selector}`
    );
  });
});

test("exam schedule table and card mode are styled without overriding content property", () => {
  ["fap-sheet", "fap-table--stack"].forEach((cls) =>
    assert.ok(css.includes(cls), `missing CSS target: ${cls}`)
  );

  const sheetRules = rules.filter(
    (r) => r.selector.includes("fap-sheet") || r.selector.includes("fap-table--stack")
  );
  assert.ok(sheetRules.length > 0, "must have fap-sheet or fap-table--stack rules");

  // Contract test: the skin must NOT override content property on fap-sheet or fap-table--stack
  // so FAP's native content: attr(data-label) functions properly on mobile stacked cards
  sheetRules.forEach((r) => {
    assert.doesNotMatch(
      r.body,
      /(?:^|;)\s*content\s*:/i,
      `skin must not override content property on ${r.selector}`
    );
  });
});

test("the login skin only restyles: it never targets inputs by type, value or name", () => {
  assert.doesNotMatch(stripComments(css), /password|\[value|\[autocomplete|\[name=/i); // comments are ignored
});

test("login styles are gated and use the accent variables", () => {
  const login = rules.filter((r) => /authentication-bg|account-pages|login-role-tabs|login-auth-backdrop/.test(r.selector));
  assert.ok(login.length > 0);
  login.forEach((r) => assert.match(r.selector, /^html:not\(\[data-fptu-skin="off"\]\)/));
  assert.ok(login.some((r) => /var\(--fptu-accent/.test(r.body)));
});

test("list and table pattern styles (DataTables, Select2, Sheet, Filter) are styled and avoid :nth-child", () => {
  const targetClasses = [
    "select2-dropdown",
    "select2-container",
    "dataTables_paginate",
    "paginate_button",
    "fap-sheet-scroll",
    "fap-filter-card",
    "fap-result-card"
  ];
  targetClasses.forEach((cls) => {
    assert.ok(css.includes(cls), `missing CSS target: ${cls}`);
  });

  const listAndTableRules = rules.filter((r) =>
    /(fap-sheet|fap-filter|fap-result|dataTables|paginate_button|select2|sheet-row-total|sheet-grand-total|sheet-group-cell|fap-table)/.test(
      r.selector
    )
  );
  assert.ok(listAndTableRules.length > 0, "must have list and table rules");
  listAndTableRules.forEach((r) => {
    assert.match(
      r.selector,
      /^html:not\(\[data-fptu-skin="off"\]\)/,
      `selector must be gated: ${r.selector}`
    );
    assert.doesNotMatch(
      r.selector,
      /:nth-(?:child|of-type)/,
      `list and table selectors must not use :nth-child or :nth-of-type: ${r.selector}`
    );
    assert.doesNotMatch(
      r.body,
      /(?:^|;)\s*content\s*:/i,
      `skin must not override content property on ${r.selector}`
    );
  });
});

test("academic reports (grade, attendance, transcript, conditions) are styled and score columns use tabular-nums", () => {
  const targetClasses = [
    "academic-report",
    "academic-report-content",
    "academic-report-loading",
    "academic-report-select-hint",
    "academic-report-term-select",
    "academic-report-course-select",
    "attendance-chip",
    "attendance-status",
    "attendance-summary",
    "attendance-session-sheet",
    "attendance-col-index",
    "grade-status",
    "grade-average",
    "mark-score",
    "student-mark-sheet",
    "student-mark-col-score",
    "is-passed",
    "is-failed",
    "graduate-condition-table-scroll"
  ];
  targetClasses.forEach((cls) => {
    assert.ok(css.includes(cls), `missing CSS target: ${cls}`);
  });

  const academicRules = rules.filter((r) =>
    /(academic-report|attendance-|grade-|student-mark|student-thesis|graduate-condition|is-passed|is-failed|mark-score)/.test(
      r.selector
    )
  );
  assert.ok(academicRules.length > 0, "must have academic report rules");
  academicRules.forEach((r) => {
    assert.match(
      r.selector,
      /^html:not\(\[data-fptu-skin="off"\]\)/,
      `selector must be gated: ${r.selector}`
    );
    assert.doesNotMatch(
      r.selector,
      /:nth-(?:child|of-type)/,
      `academic report selectors must not use :nth-child or :nth-of-type: ${r.selector}`
    );
    assert.doesNotMatch(
      r.body,
      /(?:^|;)\s*content\s*:\s*["']/i,
      `skin must not override content property with string literals on ${r.selector}`
    );
  });

  // Verify student-mark-sheet score columns are right-aligned and use tabular-nums
  const scoreRule = rules.find(
    (r) =>
      r.selector.includes("student-mark-col-score") &&
      r.selector.includes("mark-score")
  );
  assert.ok(scoreRule, "must have score column rule");
  assert.match(scoreRule.body, /tabular-nums/, "score column must use tabular-nums");
  assert.match(scoreRule.body, /text-align:\s*right/, "score column must be right-aligned");
});

test("academic report status variants have dedicated rules and do not use accent variables", () => {
  const statusVariants = ["present", "absent", "pending", "passed", "failed"];
  for (const variant of statusVariants) {
    const matchingRules = rules.filter((r) =>
      new RegExp(`(?:attendance-status--|grade-status--|is-)${variant}\\b`).test(r.selector)
    );
    assert.ok(
      matchingRules.length > 0,
      `status variant "${variant}" must have dedicated CSS rules`
    );
    matchingRules.forEach((r) => {
      assert.match(
        r.selector,
        /^html:not\(\[data-fptu-skin="off"\]\)/,
        `rule must be gated: ${r.selector}`
      );
      assert.doesNotMatch(
        r.body,
        /var\(--fptu-accent/,
        `status variant "${variant}" must not use accent variable: ${r.selector} { ${r.body} }`
      );
    });
  }
});

module.exports = { parseRules, stripComments, css, rules };
