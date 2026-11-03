const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const { createWeekAutoCapture } = require("../content.js");

function weekDom() {
  const html = fs.readFileSync(path.join(__dirname, "fixtures", "week.html"), "utf8");
  return new JSDOM(html, { url: "https://fap.fpt.edu.vn/WeeklyTimetable" });
}

test("capture sends the visible week once and stays quiet while nothing changes", () => {
  const dom = weekDom();
  const sent = [];
  const cap = createWeekAutoCapture({ doc: dom.window.document, send: (p) => sent.push(p) });

  assert.strictEqual(cap.capture(), true);
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].schedule.length, 10);
  assert.strictEqual(sent[0].skipped, 0);

  assert.strictEqual(cap.capture(), false, "same content is not sent twice");
  assert.strictEqual(sent.length, 1);
});

test("capture sends again when the page content changes", () => {
  const dom = weekDom();
  const sent = [];
  const cap = createWeekAutoCapture({ doc: dom.window.document, send: (p) => sent.push(p) });
  cap.capture();

  const room = dom.window.document.querySelector('[title="Phòng"], [title="Room"]');
  assert.ok(room, "fixture has a room cell");
  room.textContent = "ZZ-999";
  assert.strictEqual(cap.capture(), true);
  assert.strictEqual(sent.length, 2);
  assert.ok(JSON.stringify(sent[1].schedule).includes("ZZ-999"));
});

test("capture sends nothing on a page without a timetable", () => {
  const dom = new JSDOM("<html><body><p>Hello</p></body></html>", { url: "https://fap.fpt.edu.vn/HomePage.aspx" });
  const sent = [];
  const cap = createWeekAutoCapture({ doc: dom.window.document, send: (p) => sent.push(p) });
  assert.strictEqual(cap.capture(), false);
  assert.deepStrictEqual(sent, []);
});

test("watching the page re-captures after the timetable changes, debounced", async () => {
  const dom = weekDom();
  const sent = [];
  const cap = createWeekAutoCapture({ doc: dom.window.document, win: dom.window, debounceMs: 10, send: (p) => sent.push(p) });
  cap.start();
  assert.strictEqual(sent.length, 1, "start captures immediately");

  const room = dom.window.document.querySelector('[title="Phòng"], [title="Room"]');
  room.textContent = "ZZ-111";
  room.textContent = "ZZ-222";
  await new Promise((r) => setTimeout(r, 60));
  assert.strictEqual(sent.length, 2, "a burst of mutations produces one capture");
  assert.ok(JSON.stringify(sent[1].schedule).includes("ZZ-222"));

  cap.stop();
  room.textContent = "ZZ-333";
  await new Promise((r) => setTimeout(r, 60));
  assert.strictEqual(sent.length, 2, "stopped captures stay stopped");
});

test("a send failure does not break the page", () => {
  const dom = weekDom();
  const cap = createWeekAutoCapture({ doc: dom.window.document, send: () => { throw new Error("no receiver"); } });
  assert.doesNotThrow(() => cap.capture());
});

function runContentScript(url) {
  const html = fs.readFileSync(path.join(__dirname, "fixtures", "week.html"), "utf8");
  const messages = [];
  const dom = new JSDOM(html, {
    url,
    runScripts: "outside-only",
    beforeParse(window) {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: (m) => { messages.push(m); return Promise.resolve({}); }
        },
        storage: { local: { get(_k, cb) { cb && cb({}); } } }
      };
      window.fetch = () => Promise.resolve({ ok: true, status: 200, redirected: false, url });
    }
  });
  const src = fs.readFileSync(path.join(__dirname, "..", "content.js"), "utf8");
  return { dom, messages, inject: () => dom.window.eval(src) };
}

test("content script on /WeeklyTimetable sends the week once, even if injected twice", async () => {
  const { dom, messages, inject } = runContentScript("https://fap.fpt.edu.vn/WeeklyTimetable");
  inject();
  inject(); // the popup re-injects content.js on every sync
  await new Promise((r) => setTimeout(r, 1200));
  const saves = messages.filter((m) => m.type === "SAVE_WEEK_SCHEDULE");
  assert.strictEqual(saves.length, 1);
  assert.strictEqual(saves[0].schedule.length, 10);
  dom.window.__fptuWeekCapture.stop();
  dom.window.__fapKeepAlive && dom.window.__fapKeepAlive.stop();
});

test("content script does not capture on other FAP pages", async () => {
  const { dom, messages, inject } = runContentScript("https://fap.fpt.edu.vn/HomePage.aspx");
  inject();
  await new Promise((r) => setTimeout(r, 1200));
  assert.strictEqual(messages.filter((m) => m.type === "SAVE_WEEK_SCHEDULE").length, 0);
  dom.window.__fapKeepAlive && dom.window.__fapKeepAlive.stop();
});
