const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { injectFapFeedbackToolbar } = require("../lib/fap-feedback.js");

const SYMBOL_CHARS = /[\u2190-\u2BFF\u{1F000}-\u{1FAFF}]/u;

function createMockDocument() {
  const elements = [];
  const head = {
    children: [],
    appendChild(child) {
      head.children.push(child);
      elements.push(child);
      return child;
    }
  };
  const body = {
    children: [],
    appendChild(child) {
      body.children.push(child);
      elements.push(child);
      return child;
    }
  };

  const doc = {
    head,
    body,
    getElementById(id) {
      return elements.find((el) => el.id === id) || null;
    },
    querySelector(selector) {
      if (selector === "#fptu-feedback-toolbar") return doc.getElementById("fptu-feedback-toolbar");
      if (selector === "#fptu-feedback-toolbar-style") return doc.getElementById("fptu-feedback-toolbar-style");
      return null;
    },
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        id: "",
        className: "",
        style: {},
        innerHTML: "",
        textContent: "",
        children: [],
        listeners: {},
        addEventListener(event, fn) {
          if (!this.listeners[event]) this.listeners[event] = [];
          this.listeners[event].push(fn);
        },
        dispatchEvent(e) {
          const fns = this.listeners[e.type] || [];
          fns.forEach((f) => f(e));
        },
        querySelector(sel) {
          return this.children.find((c) => {
            if (sel.startsWith(".")) return c.className && c.className.includes(sel.slice(1));
            if (sel.startsWith("#")) return c.id === sel.slice(1);
            return c.tagName === sel.toUpperCase();
          }) || null;
        },
        querySelectorAll(sel) {
          return this.children.filter((c) => {
            if (sel.startsWith(".")) return c.className && c.className.includes(sel.slice(1));
            return c.tagName === sel.toUpperCase();
          });
        },
        appendChild(c) {
          this.children.push(c);
          elements.push(c);
          return c;
        }
      };
      return el;
    }
  };

  return doc;
}

describe("FAP Feedback Toolbar UI Injection", () => {
  test("injectFapFeedbackToolbar returns null if no document is provided", () => {
    assert.strictEqual(injectFapFeedbackToolbar(null), null);
  });

  test("injectFapFeedbackToolbar creates style and toolbar in document", () => {
    const doc = createMockDocument();
    const toolbar = injectFapFeedbackToolbar(doc);
    assert.ok(toolbar);
    assert.strictEqual(toolbar.id, "fptu-feedback-toolbar");
    assert.ok(doc.getElementById("fptu-feedback-toolbar-style"));
  });

  test("injectFapFeedbackToolbar returns existing element if already injected", () => {
    const doc = createMockDocument();
    const first = injectFapFeedbackToolbar(doc);
    const second = injectFapFeedbackToolbar(doc);
    assert.strictEqual(first, second);
  });

  test("toolbar markup uses inline SVG icons and no character emoji or symbols", () => {
    const doc = createMockDocument();
    const toolbar = injectFapFeedbackToolbar(doc);
    const panel = toolbar.children[0];
    const pill = toolbar.children[1];
    assert.ok(panel.innerHTML.includes("<svg"), "panel should render SVG icons");
    assert.ok(pill.innerHTML.includes("<svg"), "pill should render an SVG icon");
    assert.doesNotMatch(panel.innerHTML, SYMBOL_CHARS);
    assert.doesNotMatch(pill.innerHTML, SYMBOL_CHARS);
  });

  test("fap-feedback.js source contains no emoji or symbol characters", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "lib", "fap-feedback.js"), "utf8");
    assert.doesNotMatch(src, SYMBOL_CHARS);
  });
});
