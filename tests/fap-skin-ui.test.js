const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { mountSkinUi } = require("../lib/fap-skin-ui.js");

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));
const sleepPastAnyTimer = () => new Promise((resolve) => setTimeout(resolve, 50));

function fakeChrome({ store = {}, throwOnGet = false, throwOnSet = false } = {}) {
  const listeners = new Set();
  return {
    store,
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
        },
        set(items, callback) {
          if (throwOnSet) {
            throw new Error("storage set failure");
          }
          Object.assign(store, items);
          if (typeof callback === "function") {
            queueMicrotask(() => callback());
          }
          return Promise.resolve();
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
    fire(changes, areaName = "local") {
      for (const fn of listeners) {
        fn(changes, areaName);
      }
    }
  };
}

test("the notice shows once, stays until dismissed, and never again after", async () => {
  const win = new JSDOM("<html><body></body></html>").window;
  const chrome = fakeChrome({ store: {} });
  mountSkinUi(win, chrome);
  await tick();
  const root = win.document.getElementById("fptu-skin-ui").shadowRoot;
  assert.ok(root.querySelector('[role="region"]'));
  await sleepPastAnyTimer(); // no auto-dismiss
  assert.ok(root.querySelector('[role="region"]'));
  [...root.querySelectorAll("button")].find((b) => b.textContent.trim() === "Đã hiểu").click();
  assert.strictEqual(chrome.store.fapSkinNoticeSeen, true);
  const win2 = new JSDOM("<html><body></body></html>").window;
  mountSkinUi(win2, chrome);
  await tick();
  assert.strictEqual(win2.document.getElementById("fptu-skin-ui").shadowRoot.querySelector('[role="region"]'), null);
});

test("'Dùng giao diện gốc' turns the skin off and marks the notice seen", async () => {
  const win = new JSDOM("<html><body></body></html>").window;
  const chrome = fakeChrome({ store: {} });
  mountSkinUi(win, chrome);
  await tick();
  const root = win.document.getElementById("fptu-skin-ui").shadowRoot;
  const btn = [...root.querySelectorAll("button")].find((b) => b.textContent.trim() === "Dùng giao diện gốc");
  assert.ok(btn, "button 'Dùng giao diện gốc' must exist");
  btn.click();
  assert.strictEqual(chrome.store.fapSkinEnabled, false);
  assert.strictEqual(chrome.store.fapSkinNoticeSeen, true);
  assert.strictEqual(root.querySelector('[role="region"]'), null);
  const switchBtn = [...root.querySelectorAll("button")].find((b) => b.textContent.trim() === "Dùng giao diện FAP mới");
  assert.ok(switchBtn, "switch button should now show 'Dùng giao diện FAP mới'");
});

test("no notice while the skin is off, but the switch is still there", async () => {
  const win = new JSDOM("<html><body></body></html>").window;
  const chrome = fakeChrome({ store: { fapSkinEnabled: false } });
  mountSkinUi(win, chrome);
  await tick();
  const root = win.document.getElementById("fptu-skin-ui").shadowRoot;
  assert.strictEqual(root.querySelector('[role="region"]'), null);
  const switchBtn = [...root.querySelectorAll("button")].find((b) => b.textContent.trim() === "Dùng giao diện FAP mới");
  assert.ok(switchBtn, "switch button with label 'Dùng giao diện FAP mới' must exist");
});

test("the switch flips the setting and its label", async () => {
  const win = new JSDOM("<html><body></body></html>").window;
  const chrome = fakeChrome({ store: { fapSkinEnabled: true, fapSkinNoticeSeen: true } });
  mountSkinUi(win, chrome);
  await tick();
  const root = win.document.getElementById("fptu-skin-ui").shadowRoot;
  let switchBtn = [...root.querySelectorAll("button")].find((b) => b.textContent.trim() === "Dùng giao diện FAP gốc");
  assert.ok(switchBtn, "switch button initially says 'Dùng giao diện FAP gốc'");
  switchBtn.click();
  assert.strictEqual(chrome.store.fapSkinEnabled, false);
  await tick();
  switchBtn = [...root.querySelectorAll("button")].find((b) => b.textContent.trim() === "Dùng giao diện FAP mới");
  assert.ok(switchBtn, "switch button flipped to 'Dùng giao diện FAP mới'");
  switchBtn.click();
  assert.strictEqual(chrome.store.fapSkinEnabled, true);
  await tick();
  switchBtn = [...root.querySelectorAll("button")].find((b) => b.textContent.trim() === "Dùng giao diện FAP gốc");
  assert.ok(switchBtn, "switch button flipped back to 'Dùng giao diện FAP gốc'");
});

test("dismissing in one tab removes the notice in another", async () => {
  const win = new JSDOM("<html><body></body></html>").window;
  const chrome = fakeChrome({ store: {} });
  mountSkinUi(win, chrome);
  await tick();
  const root = win.document.getElementById("fptu-skin-ui").shadowRoot;
  assert.ok(root.querySelector('[role="region"]'));
  chrome.fire({ fapSkinNoticeSeen: { newValue: true } }, "local");
  await tick();
  assert.strictEqual(root.querySelector('[role="region"]'), null);
});

test("mounting twice leaves a single host and a single listener", () => {
  const win = new JSDOM("<html><body></body></html>").window;
  const chrome = fakeChrome({ store: {} });
  const inst1 = mountSkinUi(win, chrome);
  const inst2 = mountSkinUi(win, chrome);
  assert.strictEqual(inst1, inst2);
  assert.strictEqual(win.document.querySelectorAll("#fptu-skin-ui").length, 1);
  assert.strictEqual(chrome.listenerCount(), 1);
});

test("mounting does not steal focus or cover inputs", async () => {
  const win = new JSDOM('<html><body><input id="pw" type="password"></body></html>').window;
  win.document.getElementById("pw").focus();
  mountSkinUi(win, fakeChrome({ store: {} }));
  await tick();
  assert.strictEqual(win.document.activeElement.id, "pw");
  const host = win.document.getElementById("fptu-skin-ui");
  assert.match(host.getAttribute("style") || "", /pointer-events:\s*none/);
  assert.strictEqual(host.shadowRoot.querySelectorAll("[autofocus]").length, 0);
});

test("mounting survives missing or throwing storage", () => {
  const win = new JSDOM("<html></html>").window;
  assert.doesNotThrow(() => mountSkinUi(win, undefined));
  assert.doesNotThrow(() => mountSkinUi(new JSDOM("<html></html>").window, fakeChrome({ throwOnGet: true })));
});

test("unmount cleans up the host element and storage listener", () => {
  const win = new JSDOM("<html><body></body></html>").window;
  const chrome = fakeChrome({ store: {} });
  const inst = mountSkinUi(win, chrome);
  assert.strictEqual(win.document.querySelectorAll("#fptu-skin-ui").length, 1);
  assert.strictEqual(chrome.listenerCount(), 1);
  inst.unmount();
  assert.strictEqual(win.document.querySelectorAll("#fptu-skin-ui").length, 0);
  assert.strictEqual(chrome.listenerCount(), 0);
  assert.strictEqual(win.__fptuSkinUi, undefined);
});

test("UI strings and source code contain no emoji characters", () => {
  const win = new JSDOM("<html><body></body></html>").window;
  mountSkinUi(win, fakeChrome({ store: {} }));
  const host = win.document.getElementById("fptu-skin-ui");
  const html = host.shadowRoot.innerHTML;
  const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.strictEqual(EMOJI_REGEX.test(html), false, "Shadow DOM HTML should not contain emoji");

  const sourceCode = fs.readFileSync(path.resolve(__dirname, "../lib/fap-skin-ui.js"), "utf8");
  assert.strictEqual(EMOJI_REGEX.test(sourceCode), false, "Source file should not contain emoji");
});
