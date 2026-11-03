const test = require("node:test");
const assert = require("node:assert");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const tick = () => new Promise((r) => setTimeout(r, 5));

/** Loads the real background.js against a recording fake of the chrome APIs. */
function loadBackground({ store = {}, permission = "granted", createError = null, weekSchedule = [], weekSkipped = 0 } = {}) {
  const alarms = {};
  const notifications = [];
  const listeners = { installed: [], startup: [], alarm: [], message: [] };
  const badge = { text: "", color: null, textColor: null };
  const chrome = {
    runtime: {
      lastError: null,
      onInstalled: { addListener: (f) => listeners.installed.push(f) },
      onStartup: { addListener: (f) => listeners.startup.push(f) },
      onMessage: { addListener: (f) => listeners.message.push(f) },
      sendMessage: () => Promise.resolve()
    },
    storage: {
      local: {
        get: (keys, cb) => {
          const out = {};
          keys.forEach((k) => { out[k] = store[k]; });
          setTimeout(() => cb(out));
        },
        set: (obj, cb) => { Object.assign(store, obj); if (cb) setTimeout(cb); }
      }
    },
    alarms: {
      getAll: (cb) => setTimeout(() => cb(Object.keys(alarms).map((name) => ({ name, scheduledTime: alarms[name].when || Date.now() })))),
      get: (name, cb) => setTimeout(() => cb(alarms[name] ? { name } : undefined)),
      clear: (name, cb) => { delete alarms[name]; if (cb) setTimeout(cb); },
      create: (name, info) => { alarms[name] = info; },
      onAlarm: { addListener: (f) => listeners.alarm.push(f) }
    },
    notifications: {
      create: (id, opts, cb) => {
        notifications.push({ id, ...opts });
        if (cb) {
          chrome.runtime.lastError = createError ? { message: createError } : null;
          cb(id);
          chrome.runtime.lastError = null;
        }
      },
      getPermissionLevel: (cb) => cb(permission),
      onClicked: { addListener() {} },
      clear() {}
    },
    tabs: {
      onUpdated: { addListener() {}, removeListener() {} },
      sendMessage: (tabId, msg, cb) => setTimeout(() => cb({ success: true, schedule: weekSchedule, skipped: weekSkipped })),
      create() {}
    },
    scripting: { executeScript: (opts, cb) => cb && cb([]) },
    action: {
      setBadgeText: ({ text }) => { badge.text = text; },
      setBadgeBackgroundColor: ({ color }) => { badge.color = color; },
      setBadgeTextColor: ({ color }) => { badge.textColor = color; }
    }
  };
  const ctx = {
    chrome,
    console,
    setTimeout,
    clearTimeout,
    importScripts: (f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx)
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "background.js"), "utf8"), ctx);

  const send = (msg) => new Promise((resolve) => {
    let replied = false;
    const reply = (r) => { replied = true; resolve(r); };
    const asyncReply = listeners.message.map((l) => l(msg, {}, reply)).some(Boolean);
    if (!asyncReply && !replied) resolve(undefined);
  });
  return { chrome, ctx, alarms, notifications, listeners, store, send, badge };
}

const futureClass = () => {
  const t = new Date(Date.now() + 3 * 3600e3);
  return {
    title: "PRJ301",
    location: "AL-L302",
    slot: "Slot 1",
    rawDate: { year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate(), startHour: t.getHours(), startMinute: t.getMinutes(), timeRange: "7:30-9:50" }
  };
};

test("startup and install re-arm class alarms and the daily maintenance alarm", async () => {
  for (const hook of ["installed", "startup"]) {
    const bg = loadBackground({ store: { classSchedule: JSON.stringify([futureClass()]) } });
    assert.strictEqual(bg.listeners[hook].length, 1, `${hook} listener registered`);
    bg.listeners[hook][0]();
    await tick();
    await tick();
    assert.ok(Object.keys(bg.alarms).some((n) => n.startsWith("fptu:class:")), `${hook}: class alarm created`);
    assert.ok(bg.alarms["fptu-refresh"], `${hook}: maintenance alarm created`);
    assert.strictEqual(bg.alarms["fptu-refresh"].periodInMinutes, 24 * 60);
  }
});

test("rescheduling never clears the maintenance alarm", async () => {
  const bg = loadBackground({ store: { classSchedule: JSON.stringify([futureClass()]) } });
  bg.alarms["fptu-refresh"] = { periodInMinutes: 1440 };
  await bg.send({ type: "RESCHEDULE_ALARMS" });
  assert.ok(bg.alarms["fptu-refresh"], "still there after a reschedule");
});

test("the maintenance alarm re-arms alarms without showing a notification", async () => {
  const bg = loadBackground({ store: { classSchedule: JSON.stringify([futureClass()]) } });
  bg.listeners.alarm[0]({ name: "fptu-refresh" });
  await tick();
  await tick();
  assert.ok(Object.keys(bg.alarms).some((n) => n.startsWith("fptu:class:")));
  assert.strictEqual(bg.notifications.length, 0);
});

test("a class alarm firing shows a notification", async () => {
  const bg = loadBackground({ store: { classSchedule: JSON.stringify([futureClass()]) } });
  await bg.send({ type: "RESCHEDULE_ALARMS" });
  const name = Object.keys(bg.alarms).find((n) => n.startsWith("fptu:class:"));
  bg.listeners.alarm[0]({ name });
  await tick();
  assert.strictEqual(bg.notifications.length, 1);
  assert.match(bg.notifications[0].title, /PRJ301/);
});

test("TEST_NOTIFICATION reports success, a blocked permission, and API errors", async () => {
  const ok = await loadBackground().send({ type: "TEST_NOTIFICATION" });
  assert.strictEqual(ok.ok, true);

  const denied = loadBackground({ permission: "denied" });
  const blocked = await denied.send({ type: "TEST_NOTIFICATION" });
  assert.strictEqual(blocked.ok, false);
  assert.strictEqual(blocked.reason, "denied");
  assert.strictEqual(denied.notifications.length, 0, "nothing is sent when blocked");

  const broken = loadBackground({ createError: "Unable to download all specified images." });
  const res = await broken.send({ type: "TEST_NOTIFICATION" });
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.reason, "error");
});

test("GET_ALARM_SUMMARY counts only the extension's reminder alarms", async () => {
  const bg = loadBackground({ store: { classSchedule: JSON.stringify([futureClass()]) } });
  await bg.send({ type: "RESCHEDULE_ALARMS" });
  bg.alarms["fptu-refresh"] = { periodInMinutes: 1440 };
  const res = await bg.send({ type: "GET_ALARM_SUMMARY" });
  assert.strictEqual(res.count, 1);
  assert.ok(res.nextTime);
});

const roomChange = () => [{
  kind: "changed",
  fields: ["room"],
  before: { ...futureClass(), location: "P.201" },
  after: { ...futureClass(), location: "P.305" }
}];

test("SCHEDULE_CHANGES raises a notification naming the old and new room", async () => {
  const bg = loadBackground();
  await bg.send({ type: "SCHEDULE_CHANGES", changes: roomChange() });
  await tick();
  assert.strictEqual(bg.notifications.length, 1);
  assert.match(bg.notifications[0].message, /P\.201/);
  assert.match(bg.notifications[0].message, /P\.305/);
});

test("SCHEDULE_CHANGES respects the change-alert and master switches", async () => {
  const off = loadBackground({ store: { notificationSettings: { enabled: true, changes: { enabled: false } } } });
  await off.send({ type: "SCHEDULE_CHANGES", changes: roomChange() });
  await tick();
  assert.strictEqual(off.notifications.length, 0, "change alerts switched off");

  const master = loadBackground({ store: { notificationSettings: { enabled: false } } });
  await master.send({ type: "SCHEDULE_CHANGES", changes: roomChange() });
  await tick();
  assert.strictEqual(master.notifications.length, 0, "master switch off");

  const legacy = loadBackground({ store: { notificationSettings: { enabled: true, class: { enabled: true } } } });
  await legacy.send({ type: "SCHEDULE_CHANGES", changes: roomChange() });
  await tick();
  assert.strictEqual(legacy.notifications.length, 1, "settings saved before the option existed still alert");
});

const slotEvent = (title, day, room) => ({
  title,
  location: room,
  slot: "Slot 1",
  rawDate: { year: 2099, month: 9, day, startHour: 9, startMinute: 0, endHour: 11, endMinute: 0, timeRange: "9:00-11:00" }
});

function runRangeSync(bg, seed) {
  return new Promise((resolve) => {
    bg.runWeekRangeSync(1, 0, 0, ["Tuần 1"], JSON.stringify(seed), true, [{ label: "Tuần 1" }], () => resolve());
  });
}

test("a week sync replaces the stored week and notifies about a room change", async () => {
  const bg = loadBackground({ weekSchedule: [slotEvent("SWP391", 22, "P.305")] });
  bg.runWeekRangeSync = (...a) => vm.runInContext("runWeekRangeSync", bg.ctx)(...a);
  await runRangeSync(bg, [slotEvent("SWP391", 22, "P.201")]);
  await tick();
  const saved = JSON.parse(bg.store.classSchedule);
  assert.strictEqual(saved.length, 1, "the old copy is replaced, not kept next to the new one");
  assert.strictEqual(saved[0].location, "P.305");
  assert.strictEqual(bg.notifications.filter((n) => n.id.startsWith("fptu:change:")).length, 1);
});

test("a week sync notifies about a cancelled class and drops it from storage", async () => {
  const bg = loadBackground({ weekSchedule: [slotEvent("PRJ301", 21, "P.101")] });
  bg.runWeekRangeSync = (...a) => vm.runInContext("runWeekRangeSync", bg.ctx)(...a);
  await runRangeSync(bg, [slotEvent("PRJ301", 21, "P.101"), slotEvent("SWP391", 22, "P.201")]);
  await tick();
  const saved = JSON.parse(bg.store.classSchedule);
  assert.deepStrictEqual(saved.map((e) => e.title), ["PRJ301"]);
  const note = bg.notifications.find((n) => n.id.startsWith("fptu:change:"));
  assert.ok(note && /SWP391/.test(note.title));
});

test("an incomplete sync (skipped cells) keeps stored classes and raises no alerts", async () => {
  const bg = loadBackground({ weekSchedule: [slotEvent("PRJ301", 21, "P.101")], weekSkipped: 2 });
  bg.runWeekRangeSync = (...a) => vm.runInContext("runWeekRangeSync", bg.ctx)(...a);
  await runRangeSync(bg, [slotEvent("PRJ301", 21, "P.101"), slotEvent("SWP391", 22, "P.201")]);
  await tick();
  assert.strictEqual(JSON.parse(bg.store.classSchedule).length, 2, "nothing is erased");
  assert.strictEqual(bg.notifications.filter((n) => n.id.startsWith("fptu:change:")).length, 0);
});

test("the first sync of a week is a baseline and stays silent", async () => {
  const bg = loadBackground({ weekSchedule: [slotEvent("PRJ301", 21, "P.101")] });
  bg.runWeekRangeSync = (...a) => vm.runInContext("runWeekRangeSync", bg.ctx)(...a);
  await runRangeSync(bg, []);
  await tick();
  assert.strictEqual(bg.notifications.filter((n) => n.id.startsWith("fptu:change:")).length, 0);
});

// A class that started a minute ago and ends in ten, so it counts as "today, not finished".
const classInProgress = (title = "PRJ301") => {
  const start = new Date(Date.now() - 60 * 1000);
  const end = new Date(Date.now() + 10 * 60 * 1000);
  return {
    title,
    location: "AL-L302",
    rawDate: { year: start.getFullYear(), month: start.getMonth() + 1, day: start.getDate(), startHour: start.getHours(), startMinute: start.getMinutes(), endHour: end.getHours(), endMinute: end.getMinutes() }
  };
};

test("the toolbar badge shows how many of today's classes are left, and schedules its next refresh", async () => {
  const bg = loadBackground({ store: { classSchedule: JSON.stringify([classInProgress("A"), classInProgress("B")]) } });
  await bg.send({ type: "RESCHEDULE_ALARMS" });
  assert.strictEqual(bg.badge.text, "2");
  assert.ok(bg.badge.color, "badge has a background colour");
  assert.ok(bg.alarms["fptu-badge"], "a refresh alarm is armed for when a class ends");
  assert.ok(bg.alarms["fptu-badge"].when > Date.now());
});

test("the badge is blank when there are no classes left today", async () => {
  const bg = loadBackground({ store: { classSchedule: JSON.stringify([]) } });
  await bg.send({ type: "RESCHEDULE_ALARMS" });
  assert.strictEqual(bg.badge.text, "");
});

test("the badge alarm re-evaluates the badge", async () => {
  const bg = loadBackground({ store: { classSchedule: JSON.stringify([classInProgress()]) } });
  await bg.send({ type: "RESCHEDULE_ALARMS" });
  assert.strictEqual(bg.badge.text, "1");
  bg.store.classSchedule = JSON.stringify([]);
  bg.listeners.alarm[0]({ name: "fptu-badge" });
  await tick();
  await tick();
  assert.strictEqual(bg.badge.text, "");
});

test("the badge can be switched off in settings", async () => {
  const bg = loadBackground({
    store: {
      classSchedule: JSON.stringify([classInProgress()]),
      notificationSettings: { enabled: true, badge: { enabled: false } }
    }
  });
  await bg.send({ type: "RESCHEDULE_ALARMS" });
  assert.strictEqual(bg.badge.text, "");
  assert.strictEqual(bg.alarms["fptu-badge"], undefined);
});

test("settings saved before the badge option existed still show the badge", async () => {
  const bg = loadBackground({
    store: {
      classSchedule: JSON.stringify([classInProgress()]),
      notificationSettings: { enabled: true, class: { enabled: true, offset15: true } }
    }
  });
  await bg.send({ type: "RESCHEDULE_ALARMS" });
  assert.strictEqual(bg.badge.text, "1");
});

test("a very long day is capped so the badge stays legible", async () => {
  const many = Array.from({ length: 120 }, (_, i) => classInProgress("C" + i));
  const bg = loadBackground({ store: { classSchedule: JSON.stringify(many) } });
  await bg.send({ type: "RESCHEDULE_ALARMS" });
  assert.strictEqual(bg.badge.text, "99+");
});

const viewedWeek = (room) => [slotEvent("SWP391", 22, room)];

test("viewing a timetable page merges the week, notifies about a room change and re-arms alarms", async () => {
  const bg = loadBackground({ store: { classSchedule: JSON.stringify([slotEvent("SWP391", 22, "P.201")]) } });
  const res = await bg.send({ type: "SAVE_WEEK_SCHEDULE", schedule: viewedWeek("P.305"), skipped: 0 });
  await tick();
  assert.strictEqual(res.changed, true);
  const saved = JSON.parse(bg.store.classSchedule);
  assert.strictEqual(saved.length, 1);
  assert.strictEqual(saved[0].location, "P.305");
  const note = bg.notifications.find((n) => n.id.startsWith("fptu:change:"));
  assert.ok(note && /P\.305/.test(note.message));
});

test("viewing an unchanged week writes nothing and stays silent", async () => {
  const same = JSON.stringify(viewedWeek("P.201"));
  const bg = loadBackground({ store: { classSchedule: same } });
  let writes = 0;
  const origSet = bg.chrome.storage.local.set;
  bg.chrome.storage.local.set = (o, cb) => { writes += 1; origSet(o, cb); };
  const res = await bg.send({ type: "SAVE_WEEK_SCHEDULE", schedule: viewedWeek("P.201"), skipped: 0 });
  await tick();
  assert.strictEqual(res.changed, false);
  assert.strictEqual(writes, 0);
  assert.strictEqual(bg.notifications.length, 0);
});

test("the first viewed week is saved as a silent baseline", async () => {
  const bg = loadBackground();
  await bg.send({ type: "SAVE_WEEK_SCHEDULE", schedule: viewedWeek("P.201"), skipped: 0 });
  await tick();
  assert.strictEqual(JSON.parse(bg.store.classSchedule).length, 1);
  assert.strictEqual(bg.notifications.length, 0);
});

test("a passive capture is ignored while a multi-week sync is running", async () => {
  const bg = loadBackground({
    store: { classSchedule: JSON.stringify([slotEvent("SWP391", 22, "P.201")]), weekRangeSyncRunning: true }
  });
  const res = await bg.send({ type: "SAVE_WEEK_SCHEDULE", schedule: viewedWeek("P.305"), skipped: 0 });
  await tick();
  assert.strictEqual(res.changed, false);
  assert.strictEqual(JSON.parse(bg.store.classSchedule)[0].location, "P.201", "the sync owns the data");
  assert.strictEqual(bg.notifications.length, 0);
});

test("a passive capture with skipped cells never erases stored classes", async () => {
  const bg = loadBackground({
    store: { classSchedule: JSON.stringify([slotEvent("PRJ301", 21, "P.1"), slotEvent("SWP391", 22, "P.2")]) }
  });
  await bg.send({ type: "SAVE_WEEK_SCHEDULE", schedule: [slotEvent("PRJ301", 21, "P.1")], skipped: 3 });
  await tick();
  assert.strictEqual(JSON.parse(bg.store.classSchedule).length, 2);
  assert.strictEqual(bg.notifications.length, 0);
});

test("an empty or malformed capture message is ignored", async () => {
  const bg = loadBackground({ store: { classSchedule: JSON.stringify([slotEvent("SWP391", 22, "P.201")]) } });
  await bg.send({ type: "SAVE_WEEK_SCHEDULE", schedule: [], skipped: 0 });
  await bg.send({ type: "SAVE_WEEK_SCHEDULE" });
  await tick();
  assert.strictEqual(JSON.parse(bg.store.classSchedule).length, 1);
});
