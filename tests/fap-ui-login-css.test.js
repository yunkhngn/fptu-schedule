const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "../lib/fap-ui-login.css"), "utf8");
const early = fs.readFileSync(path.join(__dirname, "../lib/fap-ui-early.css"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../manifest.json"), "utf8"));

const selectors = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("{")
    .slice(0, -1)
    .map((chunk) => chunk.split("}").pop().trim())
    .filter((s) => s && !s.startsWith("@"))
    .flatMap((s) => s.split(",").map((x) => x.trim()));

test("the sign-in styles only apply while the new sign-in page is active, and only to FAP's sign-in block", () => {
  const list = selectors(css);
  assert.ok(list.length > 10, "styles the tabs, buttons and inputs");
  for (const sel of list) {
    assert.match(sel, /^html\[data-fptu-ui="active"\] #login-step-credentials/, `gated: ${sel}`);
  }
});

test("the sign-in block is styled from the design tokens, with fallbacks for the colours", () => {
  assert.match(css, /var\(--surface[-\w]*,/);
  assert.match(css, /var\(--primary-strong,/);
  assert.match(css, /var\(--border,/);
  assert.match(css, /var\(--ring,/);
  assert.doesNotMatch(css, /!important[\s\S]{0,0}display:\s*none/, "never hides FAP's own controls");
});

test("every interactive control keeps a visible focus style", () => {
  for (const control of [".nav-link", ".btn", ".form-control"]) {
    assert.match(css, new RegExp(`#login-step-credentials ${control.replace(".", "\\.")}[^{]*:focus-visible|#login-step-credentials ${control.replace(".", "\\.")}:focus`), `focus style for ${control}`);
  }
});

test("while the page waits and once the new page is shown, FAP's original sign-in chrome is hidden", () => {
  assert.match(early, /html\[data-fptu-ui="pending"\] body\.authentication-bg \.account-pages/);
  assert.match(early, /html\[data-fptu-ui="active"\] body\.authentication-bg \.account-pages/);
  assert.match(early, /body\.authentication-bg \.login-auth-backdrop/);
});

test("the manifest loads the sign-in stylesheet and the reader on the FAP pages", () => {
  const ui = manifest.content_scripts.find((c) => (c.js || []).includes("lib/fap-ui-early.js"));
  assert.ok(ui.css.includes("lib/fap-ui-login.css"));
  const idle = manifest.content_scripts.find((c) => (c.js || []).includes("dist/fap-ui.js"));
  const js = idle.js;
  assert.ok(js.includes("lib/fap-readers-login.js"));
  assert.ok(js.indexOf("lib/fap-readers-login.js") > js.indexOf("lib/fap-page-data.js"), "after FapPageData exists");
  assert.ok(js.indexOf("lib/fap-readers-login.js") < js.indexOf("dist/fap-ui.js"));
});
