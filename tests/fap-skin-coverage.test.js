const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { rules } = require("./helpers/fap-skin-css.js");

const BOOTSTRAP_UTILITY_AND_THIRD_PARTY = [
  /^m[tblsrexy]?-/,     // m*- (margin utilities)
  /^p[tblsrexy]?-/,     // p*- (padding utilities)
  /^d-/,                // d- (display utilities)
  /^col(\b|-)/,         // col* (grid columns)
  /^row(\b|-)/,         // row (grid rows)
  /^g[xy]?-/,           // g- (gutters)
  /^gap-/,              // gap- (flex/grid gaps)
  /^text-/,             // text- (text alignment/color utilities)
  /^fw-/,               // fw- (font weight utilities)
  /^fs-/,               // fs- (font size utilities)
  /^flex(\b|-)/,        // flex* (flex layout utilities)
  /^align(\b|-)/,       // align* (alignment utilities)
  /^justify-/,          // justify* (justify utilities)
  /^w-/,                // w- (width utilities)
  /^h-/,                // h- (height utilities)
  /^border(\b|-)/,      // border* (border utilities)
  /^rounded(\b|-)/,     // rounded* (rounded utilities)
  /^bg-/,               // bg-* (background utilities)
  /^ri-/,               // ri-* (Remixicon icon classes)
  /^js-/,               // js-* (JavaScript hook classes)
  /^o-/,                // o-* (overflow / helper utilities)
  /^bootstrapiso$/,     // bootstrapiso (isolation wrapper)
];

function classesInFixtures({ ignore = [] } = {}) {
  const dir = path.join(__dirname, "fixtures/pages");
  const index = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
  const classes = new Set();

  for (const page of index) {
    const file = path.join(dir, page.slug + ".html");
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    const doc = new JSDOM(html).window.document;
    const contentPage = doc.querySelector(".content-page");
    if (!contentPage) continue;

    const elements = [contentPage, ...contentPage.querySelectorAll("*")];
    for (const el of elements) {
      for (const cls of el.classList) {
        if (!cls) continue;
        const isIgnored = ignore.some((pattern) =>
          pattern instanceof RegExp ? pattern.test(cls) : pattern === cls
        );
        if (!isIgnored) {
          classes.add(cls);
        }
      }
    }
  }

  return Array.from(classes).sort();
}

const used = classesInFixtures({ ignore: BOOTSTRAP_UTILITY_AND_THIRD_PARTY });
const selectors = rules.map((r) => r.selector).join(" ");
const excused = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/pages/unstyled-ok.json"), "utf8"));

test("every FAP class on every page is styled or explicitly excused", () => {
  const missing = used.filter((c) => !selectors.includes("." + c) && !(c in excused));
  assert.deepStrictEqual(missing, [], "style these or add them to unstyled-ok.json with a reason");
});

test("every excuse still applies to a class that exists", () => {
  Object.keys(excused).forEach((c) => assert.ok(used.includes(c), c + " is excused but unused"));
  Object.values(excused).forEach((why) => assert.ok(why.length >= 10));
});

module.exports = {
  BOOTSTRAP_UTILITY_AND_THIRD_PARTY,
  classesInFixtures
};
