const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const {
  FAP_SKIN_KEYS,
  SKIN_ATTR,
  ACCENT_STYLE_ID,
  buildFapAccentCss,
  applyFapSkin,
  startFapSkin
} = require("../lib/fap-skin.js");

const tick = () => new Promise((resolve) => setTimeout(resolve, 15));

function fakeChrome({ store = {}, throwOnGet = false } = {}) {
  const listeners = new Set();
  return {
    storage: {
      local: {
        get(keys, callback) {
          if (throwOnGet) {
            throw new Error("storage failure");
          }
          const result = {};
          const list = Array.isArray(keys) ? keys : [keys];
          for (const k of list) {
            if (k in store) result[k] = store[k];
          }
          if (typeof callback === "function") {
            queueMicrotask(() => callback(result));
          }
          return Promise.resolve(result);
        }
      },
      onChanged: {
        addListener(fn) {
          listeners.add(fn);
        },
        removeListener(fn) {
          listeners.delete(fn);
        }
      }
    },
    listenerCount() {
      return listeners.size;
    },
    fire(changes, areaName) {
      for (const fn of listeners) {
        fn(changes, areaName);
      }
    }
  };
}

test("constants are defined as expected", () => {
  assert.deepStrictEqual(FAP_SKIN_KEYS, {
    enabled: "fapSkinEnabled",
    accent: "accentColor",
    noticeSeen: "fapSkinNoticeSeen"
  });
  assert.strictEqual(SKIN_ATTR, "data-fptu-skin");
  assert.strictEqual(ACCENT_STYLE_ID, "fptu-skin-accent");
});

test("buildFapAccentCss is empty for blue and keyed on data-bs-theme for other presets", () => {
  assert.strictEqual(buildFapAccentCss("blue"), "");
  assert.strictEqual(buildFapAccentCss("nope"), "");
  const css = buildFapAccentCss("orange");
  assert.ok(css.includes('html:not([data-fptu-skin="off"])[data-bs-theme="dark"]'));
  assert.ok(css.includes("--fptu-accent:#e0510a") && css.includes("--fptu-accent:#ea580c"));
  assert.doesNotMatch(css, /prefers-color-scheme/);
});

test("applyFapSkin toggles the off attribute and manages one accent style element", () => {
  const doc = new JSDOM("<html><head></head><body></body></html>").window.document;
  applyFapSkin(doc, { enabled: false, accentColor: "orange" });
  assert.strictEqual(doc.documentElement.getAttribute("data-fptu-skin"), "off");
  assert.strictEqual(doc.querySelectorAll("#fptu-skin-accent").length, 1);
  applyFapSkin(doc, { enabled: true, accentColor: "blue" });
  assert.strictEqual(doc.documentElement.hasAttribute("data-fptu-skin"), false);
  assert.strictEqual(doc.getElementById("fptu-skin-accent"), null);
});

test("startFapSkin applies stored settings and follows changes from other tabs", async () => {
  const win = new JSDOM("<html><head></head></html>").window;
  const chrome = fakeChrome({ store: { fapSkinEnabled: false, accentColor: "violet" } });
  startFapSkin(win, chrome);
  await tick();
  assert.strictEqual(win.document.documentElement.getAttribute("data-fptu-skin"), "off");
  chrome.fire({ fapSkinEnabled: { newValue: true } }, "local");
  assert.strictEqual(win.document.documentElement.hasAttribute("data-fptu-skin"), false);
  chrome.fire({ accentColor: { newValue: "pink" } }, "sync"); // other areas are ignored
  assert.ok(win.document.getElementById("fptu-skin-accent").textContent.includes("violet") === false);
  // local changes update accent style
  chrome.fire({ accentColor: { newValue: "pink" } }, "local");
  assert.ok(win.document.getElementById("fptu-skin-accent").textContent.includes("#db2777"));
});

test("startFapSkin keeps the defaults and does not throw when storage is unusable", async () => {
  const win = new JSDOM("<html><head></head></html>").window;
  assert.doesNotThrow(() => startFapSkin(win, undefined));
  assert.doesNotThrow(() => startFapSkin(new JSDOM("<html></html>").window, fakeChrome({ throwOnGet: true })));
  await tick();
  assert.strictEqual(win.document.documentElement.hasAttribute("data-fptu-skin"), false);
});

test("startFapSkin is idempotent per window", () => {
  const win = new JSDOM("<html><head></head></html>").window;
  const chrome = fakeChrome({ store: {} });
  assert.strictEqual(startFapSkin(win, chrome), startFapSkin(win, chrome));
  assert.strictEqual(chrome.listenerCount(), 1);
});

test("startFapSkin stop removes listener and unbinds from window", () => {
  const win = new JSDOM("<html><head></head></html>").window;
  const chrome = fakeChrome({ store: {} });
  const instance = startFapSkin(win, chrome);
  assert.strictEqual(chrome.listenerCount(), 1);
  instance.stop();
  assert.strictEqual(chrome.listenerCount(), 0);
  assert.strictEqual(win.__fptuFapSkin, undefined);
});
