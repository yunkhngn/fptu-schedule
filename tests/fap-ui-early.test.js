const { test } = require("node:test");
const assert = require("node:assert");
const { JSDOM } = require("jsdom");

function setupEnvironment({ pathname = "/", storage = {}, url = "https://fap.fpt.edu.vn" + pathname } = {}) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body><div class="wrapper"></div></body></html>`, {
    url
  });
  const win = dom.window;
  const doc = win.document;

  const storageData = { ...storage };
  const chromeApi = {
    storage: {
      local: {
        get: (keys, cb) => {
          const res = {};
          if (Array.isArray(keys)) {
            keys.forEach((k) => { res[k] = storageData[k]; });
          } else if (typeof keys === "string") {
            res[keys] = storageData[keys];
          } else if (typeof keys === "object" && keys !== null) {
            Object.keys(keys).forEach((k) => {
              res[k] = storageData[k] !== undefined ? storageData[k] : keys[k];
            });
          }
          if (typeof cb === "function") cb(res);
          return Promise.resolve(res);
        },
        set: (items, cb) => {
          Object.assign(storageData, items);
          if (typeof cb === "function") cb();
          return Promise.resolve();
        }
      }
    }
  };

  win.chrome = chromeApi;
  return { dom, win, doc, chromeApi, storageData };
}

test("fap-ui-early does not set attribute if fapUiEnabled is false", async () => {
  const { win, doc, chromeApi } = setupEnvironment({
    pathname: "/",
    storage: { fapUiEnabled: false }
  });

  const { initEarlyHide } = require("../lib/fap-ui-early.js");
  await initEarlyHide(win, chromeApi);

  assert.strictEqual(doc.documentElement.getAttribute("data-fptu-ui"), null);
});

test("fap-ui-early sets data-fptu-ui='pending' on matching page with default enabled", async () => {
  const { win, doc, chromeApi } = setupEnvironment({
    pathname: "/WeeklyTimetable",
    storage: {}
  });

  const { initEarlyHide } = require("../lib/fap-ui-early.js");
  await initEarlyHide(win, chromeApi);

  assert.strictEqual(doc.documentElement.getAttribute("data-fptu-ui"), "pending");
});

test("fap-ui-early does not set attribute on unhandled page /Auth/Login", async () => {
  const { win, doc, chromeApi } = setupEnvironment({
    pathname: "/Auth/Login",
    storage: {}
  });

  const { initEarlyHide } = require("../lib/fap-ui-early.js");
  await initEarlyHide(win, chromeApi);

  assert.strictEqual(doc.documentElement.getAttribute("data-fptu-ui"), null);
});

test("fap-ui-early does not set attribute when fapUiOriginal preference is true for the page", async () => {
  const { win, doc, chromeApi } = setupEnvironment({
    pathname: "/",
    storage: { "fapUiOriginal:overview": true }
  });

  const { initEarlyHide } = require("../lib/fap-ui-early.js");
  await initEarlyHide(win, chromeApi);

  assert.strictEqual(doc.documentElement.getAttribute("data-fptu-ui"), null);
});

test("fap-ui-early removes pending attribute after 10s safety timeout if not active", async () => {
  const { win, doc, chromeApi } = setupEnvironment({
    pathname: "/",
    storage: {}
  });

  let timerCb = null;
  win.setTimeout = (fn, delay) => {
    if (delay === 10000) {
      timerCb = fn;
    }
    return 1;
  };

  const { initEarlyHide } = require("../lib/fap-ui-early.js");
  await initEarlyHide(win, chromeApi);

  assert.strictEqual(doc.documentElement.getAttribute("data-fptu-ui"), "pending");
  assert.ok(timerCb, "10s timeout must be scheduled");

  // Fire 10s timeout
  timerCb();
  assert.strictEqual(doc.documentElement.getAttribute("data-fptu-ui"), null);
});
