const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const {
  ACCENT_PRESETS,
  DEFAULT_ACCENT_ID,
  normalizeAccentId,
  mixHex,
  contrastRatio,
  buildAccentCss,
  applyAccent
} = require("../lib/accent.js");

const HEX = /^#[0-9a-f]{6}$/i;

test("presets have unique ids, labels and valid hex colors, with blue as the default", () => {
  assert.ok(ACCENT_PRESETS.length >= 6);
  assert.strictEqual(DEFAULT_ACCENT_ID, "blue");
  assert.strictEqual(ACCENT_PRESETS[0].id, "blue");
  assert.strictEqual(new Set(ACCENT_PRESETS.map((p) => p.id)).size, ACCENT_PRESETS.length);
  ACCENT_PRESETS.forEach((p) => {
    assert.ok(p.label, `${p.id} has a label`);
    assert.match(p.light, HEX);
    assert.match(p.dark, HEX);
  });
});

test("white text stays readable on every preset in both themes", () => {
  ACCENT_PRESETS.forEach((p) => {
    assert.ok(contrastRatio("#ffffff", p.light) >= 3.5, `${p.id} light ${contrastRatio("#ffffff", p.light).toFixed(2)}`);
    assert.ok(contrastRatio("#ffffff", p.dark) >= 3.5, `${p.id} dark ${contrastRatio("#ffffff", p.dark).toFixed(2)}`);
  });
});

test("normalizeAccentId falls back to the default for unknown values", () => {
  assert.strictEqual(normalizeAccentId("violet"), "violet");
  assert.strictEqual(normalizeAccentId("nope"), DEFAULT_ACCENT_ID);
  assert.strictEqual(normalizeAccentId(null), DEFAULT_ACCENT_ID);
  assert.strictEqual(normalizeAccentId(undefined), DEFAULT_ACCENT_ID);
});

test("mixHex blends two colors", () => {
  assert.strictEqual(mixHex("#000000", "#ffffff", 0.5), "#808080");
  assert.strictEqual(mixHex("#2563eb", "#ffffff", 0), "#2563eb");
  assert.strictEqual(mixHex("#2563eb", "#ffffff", 1), "#ffffff");
});

test("the default accent adds no override, so the stylesheet keeps its own blue", () => {
  assert.strictEqual(buildAccentCss("blue"), "");
  assert.strictEqual(buildAccentCss("nope"), "");
});

test("another accent overrides the accent variables for light and dark themes", () => {
  const violet = ACCENT_PRESETS.find((p) => p.id === "violet");
  const css = buildAccentCss("violet");
  assert.ok(css.includes(`:root{`), "light block");
  assert.ok(css.includes(`:root[data-theme="dark"]{`), "dark block outranks [data-theme=dark]");
  assert.ok(css.includes(`--accent:${violet.light}`));
  assert.ok(css.includes(`--accent:${violet.dark}`));
  assert.ok(css.includes("--accent-hover:"));
  assert.ok(css.includes("--accent-soft:"));
});

function fakeDoc() {
  const head = { children: [], appendChild(el) { this.children.push(el); el.parentNode = this; return el; } };
  return {
    head,
    getElementById: (id) => head.children.find((c) => c.id === id) || null,
    createElement: () => ({
      id: "",
      textContent: "",
      remove() { head.children = head.children.filter((c) => c !== this); }
    })
  };
}

test("applyAccent injects, updates and removes a single style element", () => {
  const doc = fakeDoc();
  applyAccent(doc, "violet");
  const el = doc.getElementById("accent-style");
  assert.ok(el && el.textContent.includes("--accent"));

  applyAccent(doc, "pink");
  assert.strictEqual(doc.head.children.length, 1, "reuses the same element");
  assert.ok(doc.getElementById("accent-style").textContent.includes(ACCENT_PRESETS.find((p) => p.id === "pink").light));

  applyAccent(doc, "blue");
  assert.strictEqual(doc.getElementById("accent-style"), null, "default removes the override");
});

test("popup.css keeps no hard-coded blue outside the variable definitions", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "popup.css"), "utf8");
  const offenders = css.split("\n")
    .map((line, i) => ({ line, n: i + 1 }))
    .filter(({ line }) => !/^\s*--accent(-soft|-hover)?:/.test(line))
    .filter(({ line }) => /#(2563eb|1d4ed8|3b82f6|60a5fa|eff6ff|dbeafe|bfdbfe|93c5fd|1e40af)\b|rgba\((37, ?99, ?235|59, ?130, ?246|96, ?165, ?250|30, ?58, ?138)/i.test(line));
  assert.deepStrictEqual(offenders, [], "use var(--accent*) so the accent setting reaches it");
});

test("the popup header logo is inline SVG painted from the accent variables, not a fixed PNG", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "popup.html"), "utf8");
  const header = html.slice(html.indexOf('<header class="popup-header">'), html.indexOf("</header>"));
  const mark = header.slice(header.indexOf('class="popup-header__mark"'), header.indexOf('class="popup-header__titles"'));
  assert.ok(mark.includes("<svg"), "logo is an inline SVG");
  assert.ok(!mark.includes("icon-128.png"), "no fixed-colour PNG in the header");
  assert.ok(mark.includes("var(--accent"), "colours come from the accent variables");
  assert.doesNotMatch(mark, /#(2563eb|3b82f6|1d4ed8|1e40af|dbeafe)\b/i, "no hard-coded blue in the logo");
});

test("orange is available as a preset and blue stays the default", () => {
  const orange = ACCENT_PRESETS.find((p) => p.id === "orange");
  assert.ok(orange);
  assert.strictEqual(orange.label, "Cam");
  assert.strictEqual(DEFAULT_ACCENT_ID, "blue");
  assert.ok(ACCENT_PRESETS.findIndex((p) => p.id === "orange") === ACCENT_PRESETS.findIndex((p) => p.id === "pink") + 1);
  assert.ok(contrastRatio("#ffffff", orange.light) >= 3.5 && contrastRatio("#ffffff", orange.dark) >= 3.5);
});

test("lavender is available as a preset placed after violet and blue stays the default", () => {
  const lavender = ACCENT_PRESETS.find((p) => p.id === "lavender");
  assert.ok(lavender, "lavender preset exists");
  assert.strictEqual(lavender.label, "Tím lavender");
  assert.strictEqual(lavender.light, "#6d5fd6");
  assert.strictEqual(lavender.dark, "#7c6fe0");
  assert.strictEqual(DEFAULT_ACCENT_ID, "blue");
  assert.strictEqual(ACCENT_PRESETS[0].id, "blue");
  assert.strictEqual(normalizeAccentId("lavender"), "lavender");
  assert.strictEqual(
    ACCENT_PRESETS.findIndex((p) => p.id === "lavender"),
    ACCENT_PRESETS.findIndex((p) => p.id === "violet") + 1,
    "lavender is placed immediately after violet"
  );
  assert.ok(contrastRatio("#ffffff", "#6d5fd6") >= 4.5, "light contrast >= 4.5");
  assert.ok(contrastRatio("#ffffff", "#7c6fe0") >= 3.5, "dark contrast >= 3.5");
});

