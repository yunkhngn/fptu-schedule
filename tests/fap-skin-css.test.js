const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { ACCENT_PRESETS } = require("../lib/accent.js");

/**
 * Parses CSS text into individual rule blocks, stripping comments and supporting
 * one level of @media / @supports grouping.
 */
function parseRules(cssText) {
  const clean = (cssText || "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
  const rules = [];

  let i = 0;
  while (i < clean.length) {
    while (i < clean.length && /\s/.test(clean[i])) i++;
    if (i >= clean.length) break;

    if (clean[i] === "@") {
      const atStart = i;
      while (i < clean.length && clean[i] !== "{" && clean[i] !== ";") i++;
      if (i >= clean.length) break;
      if (clean[i] === ";") {
        i++;
        continue;
      }
      const atHeader = clean.slice(atStart, i).trim();
      i++; // skip '{'
      let depth = 1;
      const bodyStart = i;
      while (i < clean.length && depth > 0) {
        if (clean[i] === "{") depth++;
        else if (clean[i] === "}") depth--;
        i++;
      }
      const atBody = clean.slice(bodyStart, i - 1);
      if (/^@(media|supports)/i.test(atHeader)) {
        const inner = parseRules(atBody);
        for (const r of inner) {
          rules.push({ selector: r.selector, body: r.body, at: atHeader });
        }
      }
      continue;
    }

    const selStart = i;
    while (i < clean.length && clean[i] !== "{" && clean[i] !== "}") i++;
    if (i >= clean.length || clean[i] === "}") break;
    const selector = clean.slice(selStart, i).trim();
    i++; // skip '{'
    let depth = 1;
    const bodyStart = i;
    while (i < clean.length && depth > 0) {
      if (clean[i] === "{") depth++;
      else if (clean[i] === "}") depth--;
      i++;
    }
    const body = clean.slice(bodyStart, i - 1).trim();
    if (selector) {
      rules.push({ selector, body, at: null });
    }
  }

  return rules;
}

const manifestPath = path.join(__dirname, "../manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const cssPath = path.join(__dirname, "../lib/fap-skin.css");
const css = fs.readFileSync(cssPath, "utf8");
const rules = parseRules(css);

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
  const allowed = /(navbar-custom|fap-topbar|leftside-menu|fap-sidebar|modal-content|dropdown-menu|fap-sticky)/;
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
    "fap-chip",
    "fap-empty-state",
    "fap-page-title__crumb-link"
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

module.exports = { parseRules };
