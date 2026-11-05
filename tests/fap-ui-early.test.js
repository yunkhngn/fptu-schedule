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

test("fap-ui-early does not set attribute on unhandled page /Auth/Logout", async () => {
  const { win, doc, chromeApi } = setupEnvironment({
    pathname: "/Auth/Logout",
    storage: {}
  });

  const { initEarlyHide } = require("../lib/fap-ui-early.js");
  await initEarlyHide(win, chromeApi);

  assert.strictEqual(doc.documentElement.getAttribute("data-fptu-ui"), null);
});

test("fap-ui-early sets data-fptu-ui='pending' on auth page /Auth/Login", async () => {
  const { win, doc, chromeApi } = setupEnvironment({
    pathname: "/Auth/Login",
    storage: {}
  });

  const { initEarlyHide } = require("../lib/fap-ui-early.js");
  await initEarlyHide(win, chromeApi);

  assert.strictEqual(doc.documentElement.getAttribute("data-fptu-ui"), "pending");
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


// ---------------------------------------------------------------------------------------------
// Splash screen: what the student sees while the new interface waits for its data (up to 8 s).
// ---------------------------------------------------------------------------------------------
const fs = require("node:fs");
const path = require("node:path");

/** The mascot as the splash draws it: no <style> block (its .s0 classes would leak into FAP's CSS) and no fixed size. */
function inlineFrog() {
  const raw = fs.readFileSync(path.join(__dirname, "../ui/src/assets/frog.svg"), "utf8");
  const fills = {};
  for (const m of raw.matchAll(/\.(s\d+)\s*\{\s*fill:\s*(#[0-9a-fA-F]{3,8})\s*\}/g)) fills[m[1]] = m[2];
  return raw
    .replace(/<style>[\s\S]*?<\/style>/, "")
    .replace(/class="(s\d+)"/g, (_m, c) => `fill="${fills[c]}"`)
    .replace(/<svg([^>]*)>/, (_m, attrs) => `<svg${attrs.replace(/\s(?:width|height)="[^"]*"/g, "")} aria-hidden="true" focusable="false">`)
    .replace(/>\s+</g, "><")
    .trim();
}

test("splash: a matching page gets one splash element with the mascot drawn inline", async () => {
  const { win, doc, chromeApi } = setupEnvironment({ pathname: "/" });
  const { initEarlyHide } = require("../lib/fap-ui-early.js");
  await initEarlyHide(win, chromeApi);
  await initEarlyHide(win, chromeApi);

  const splashes = doc.querySelectorAll("#fptu-splash");
  assert.strictEqual(splashes.length, 1, "never more than one splash");
  const splash = splashes[0];
  assert.strictEqual(splash.getAttribute("aria-hidden"), "true");
  assert.ok(splash.querySelector("svg"), "the mascot is drawn inline, so the page's image rules cannot block it");
  assert.strictEqual(splash.querySelector("style"), null, "no global style block that could clash with FAP");
  assert.strictEqual(splash.querySelectorAll(".fptu-splash__dot").length, 3);
});

test("splash: not shown when the page is not handled or the interface is off", async () => {
  const { initEarlyHide } = require("../lib/fap-ui-early.js");

  const off = setupEnvironment({ pathname: "/", storage: { fapUiEnabled: false } });
  await initEarlyHide(off.win, off.chromeApi);
  assert.strictEqual(off.doc.getElementById("fptu-splash"), null);

  const other = setupEnvironment({ pathname: "/Auth/Logout" });
  await initEarlyHide(other.win, other.chromeApi);
  assert.strictEqual(other.doc.getElementById("fptu-splash"), null);
});

test("splash: removed as soon as the page stops waiting (interface mounted or given back)", async () => {
  const { win, doc, chromeApi } = setupEnvironment({ pathname: "/" });
  const { initEarlyHide } = require("../lib/fap-ui-early.js");
  await initEarlyHide(win, chromeApi);
  assert.ok(doc.getElementById("fptu-splash"));

  doc.documentElement.setAttribute("data-fptu-ui", "active");
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.strictEqual(doc.getElementById("fptu-splash"), null, "removed once the interface is active");

  const second = setupEnvironment({ pathname: "/" });
  await initEarlyHide(second.win, second.chromeApi);
  second.doc.documentElement.removeAttribute("data-fptu-ui");
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.strictEqual(second.doc.getElementById("fptu-splash"), null, "removed when the original page is given back");
});

test("splash: follows the extension theme, and the system theme in auto mode", async () => {
  const { initEarlyHide } = require("../lib/fap-ui-early.js");
  const themeOf = async (theme, systemDark) => {
    const env = setupEnvironment({ pathname: "/", storage: theme === undefined ? {} : { theme } });
    env.win.matchMedia = (q) => ({ matches: systemDark && /dark/.test(q), addEventListener() {}, removeEventListener() {} });
    await initEarlyHide(env.win, env.chromeApi);
    return env.doc.getElementById("fptu-splash").getAttribute("data-theme");
  };

  assert.strictEqual(await themeOf("dark", false), "dark");
  assert.strictEqual(await themeOf("light", true), "light");
  assert.strictEqual(await themeOf("auto", true), "dark");
  assert.strictEqual(await themeOf("auto", false), "light");
  assert.strictEqual(await themeOf(undefined, true), "dark", "no choice yet means auto");
  assert.strictEqual(await themeOf("nonsense", false), "light", "a corrupt value means auto");
});

test("splash: the mascot it draws is the bundled artwork, so the two cannot drift apart", () => {
  const { FROG_SVG } = require("../lib/fap-ui-early.js");
  assert.strictEqual(FROG_SVG, inlineFrog());
});

test("splash styles: shown only while waiting, delayed against flicker, calm for reduced motion, dark variant", () => {
  const css = fs.readFileSync(path.join(__dirname, "../lib/fap-ui-early.css"), "utf8");

  assert.match(css, /#fptu-splash\s*\{[^}]*visibility:\s*hidden/, "hidden by default");
  assert.match(css, /html\[data-fptu-ui="pending"\]\s+#fptu-splash\s*\{[^}]*visibility:\s*visible/, "visible only while pending");
  assert.match(css, /animation:\s*fptu-splash-in[^;]*\.\d+s\s+both/, "fades in after a short delay so fast loads show no splash");
  assert.match(css, /#fptu-splash\[data-theme="dark"\]/, "has a dark variant");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*#fptu-splash[\s\S]*animation:\s*none/, "no motion when the system asks for none");
  assert.match(css, /z-index:\s*2147483\d{3}/, "above the page");
});
