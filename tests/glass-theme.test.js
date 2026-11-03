const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "..", "popup.css"), "utf8");

function block(selector) {
  const start = css.indexOf(selector + " {");
  assert.ok(start !== -1, `${selector} block exists`);
  return css.slice(start, css.indexOf("}", start));
}

function lastBlock(selector) {
  const start = css.lastIndexOf("\n" + selector + " {");
  assert.ok(start !== -1, `${selector} block exists`);
  return css.slice(start, css.indexOf("}", start));
}

const alpha = (value) => {
  const m = /rgba\([^)]*,\s*([0-9.]+)\)/.exec(value);
  return m ? parseFloat(m[1]) : 1;
};

test("surface tokens are translucent in both themes so the ambient background shows through", () => {
  const light = block(":root");
  const dark = block('[data-theme="dark"]');
  [light, dark].forEach((tokens) => {
    ["--bg-elevated", "--bg-subtle", "--border"].forEach((name) => {
      const m = new RegExp(`${name}:\\s*([^;]+);`).exec(tokens);
      assert.ok(m, `${name} is defined`);
      assert.ok(/rgba\(/.test(m[1]), `${name} is rgba`);
      assert.ok(alpha(m[1]) < 1, `${name} has alpha below 1`);
    });
  });
});

test("cards stay readable: elevated surfaces keep at least 55% opacity", () => {
  ["--bg-elevated"].forEach((name) => {
    [block(":root"), block('[data-theme="dark"]')].forEach((tokens) => {
      const v = new RegExp(`${name}:\\s*([^;]+);`).exec(tokens)[1];
      assert.ok(alpha(v) >= 0.55, `${name} ${v}`);
    });
  });
});

test("the popup sits on an ambient gradient driven by the accent color", () => {
  const wrapper = lastBlock(".popup-wrapper");
  assert.ok(wrapper.includes("radial-gradient"), "radial-gradient ambient");
  assert.ok(wrapper.includes("var(--ambient-a)"));
  assert.ok(/--ambient-a:\s*color-mix\([^;]*var\(--accent\)/.test(css), "ambient follows --accent");
});

test("bars that content scrolls under are frosted", () => {
  ["popup-header", "popup-actions", "popup-footer", "tab-bar", "modal-content"].forEach((cls) => {
    assert.ok(new RegExp(`\\.${cls}[^{]*\\{[^}]*backdrop-filter`).test(css.slice(css.indexOf("Glass layer"))), `${cls} has backdrop-filter`);
  });
});

test("long lists stay smooth: list cards do not use backdrop-filter", () => {
  const glass = css.slice(css.indexOf("Glass layer"));
  const cardRule = /\.exam-card,\s*#scheduleTab \.class-card,\s*\.grade-card,\s*\.agenda-card\s*\{[^}]*\}/.exec(glass);
  assert.ok(cardRule, "shared card rule exists");
  assert.ok(!/backdrop-filter/.test(cardRule[0]));
  assert.ok(!/(^|\n)\.(exam-card|class-card|grade-card)[^{]*\{[^}]*backdrop-filter/.test(glass));
});

test("transparency can be turned off", () => {
  assert.ok(css.includes("@media (prefers-reduced-transparency: reduce)"));
  const fallback = css.slice(css.indexOf("@media (prefers-reduced-transparency: reduce)"));
  assert.ok(/--bg-elevated:\s*#ffffff/.test(fallback), "solid light surface restored");
  assert.ok(/--bg-elevated:\s*#1e293b/.test(fallback), "solid dark surface restored");
  assert.ok(/backdrop-filter:\s*none/.test(fallback));
});
