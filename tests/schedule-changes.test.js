const test = require("node:test");
const assert = require("node:assert");
const {
  replaceCoveredWeeks,
  detectScheduleChanges
} = require("../lib/schedule.js");
const { formatScheduleChangeNotifications } = require("../lib/notifications.js");

// 2026-09-21 is a Monday; the week runs 21..27.
const NOW = new Date(2026, 8, 21, 6, 0, 0);

const ev = (title, day, startHour, extra = {}) => ({
  title,
  location: "AL-101",
  rawDate: { year: 2026, month: 9, day, startHour, startMinute: 0, endHour: startHour + 2, endMinute: 0 },
  ...extra
});

test("replaceCoveredWeeks drops stale events of a re-synced week and keeps other weeks", () => {
  const old = [ev("PRJ301", 21, 7), ev("SWP391", 22, 9), ev("MAD101", 30, 9)];
  const fresh = [ev("PRJ301", 21, 7)];
  const { merged, replacedOld } = replaceCoveredWeeks(old, fresh);

  assert.deepStrictEqual(merged.map((e) => e.title).sort(), ["MAD101", "PRJ301"]);
  assert.deepStrictEqual(replacedOld.map((e) => e.title).sort(), ["PRJ301", "SWP391"]);
});

test("replaceCoveredWeeks reports only genuinely new events as uniqueNewEvents", () => {
  const old = [ev("PRJ301", 21, 7)];
  const fresh = [ev("PRJ301", 21, 7), ev("SWP391", 22, 9)];
  const { uniqueNewEvents, merged } = replaceCoveredWeeks(old, fresh);
  assert.deepStrictEqual(uniqueNewEvents.map((e) => e.title), ["SWP391"]);
  assert.strictEqual(merged.length, 2);
});

test("replaceCoveredWeeks keeps stored attendance when the fresh copy has none", () => {
  const old = [ev("PRJ301", 21, 7, { attendanceStatus: "attended", attendanceColor: "green" })];
  const fresh = [ev("PRJ301", 21, 7)];
  const { merged } = replaceCoveredWeeks(old, fresh);
  assert.strictEqual(merged[0].attendanceStatus, "attended");
});

test("replaceCoveredWeeks leaves undated events alone", () => {
  const undated = { title: "Mystery" };
  const { merged } = replaceCoveredWeeks([undated], [ev("PRJ301", 21, 7)]);
  assert.ok(merged.includes(undated));
});

test("detectScheduleChanges reports a room change", () => {
  const changes = detectScheduleChanges(
    [ev("SWP391", 22, 9, { location: "P.201" })],
    [ev("SWP391", 22, 9, { location: "P.305" })],
    NOW
  );
  assert.strictEqual(changes.length, 1);
  assert.strictEqual(changes[0].kind, "changed");
  assert.deepStrictEqual(changes[0].fields, ["room"]);
  assert.strictEqual(changes[0].before.location, "P.201");
  assert.strictEqual(changes[0].after.location, "P.305");
});

test("detectScheduleChanges reports a time change on the same day", () => {
  const changes = detectScheduleChanges(
    [ev("SWP391", 22, 9)],
    [ev("SWP391", 22, 13)],
    NOW
  );
  assert.strictEqual(changes.length, 1);
  assert.strictEqual(changes[0].kind, "changed");
  assert.deepStrictEqual(changes[0].fields, ["time"]);
});

test("detectScheduleChanges reports cancelled and added classes", () => {
  const changes = detectScheduleChanges(
    [ev("SWP391", 22, 9), ev("PRJ301", 21, 7)],
    [ev("PRJ301", 21, 7), ev("MAD101", 23, 9)],
    NOW
  );
  const byKind = Object.fromEntries(changes.map((c) => [c.kind, c]));
  assert.strictEqual(byKind.removed.before.title, "SWP391");
  assert.strictEqual(byKind.added.after.title, "MAD101");
  assert.strictEqual(changes.length, 2);
});

test("detectScheduleChanges ignores classes that already started", () => {
  const later = new Date(2026, 8, 22, 12, 0, 0);
  const changes = detectScheduleChanges(
    [ev("SWP391", 22, 9, { location: "P.201" })],
    [ev("SWP391", 22, 9, { location: "P.305" })],
    later
  );
  assert.deepStrictEqual(changes, []);
});

test("detectScheduleChanges treats an empty previous week as a baseline, not a flood of new classes", () => {
  assert.deepStrictEqual(detectScheduleChanges([], [ev("PRJ301", 21, 7)], NOW), []);
});

test("detectScheduleChanges is quiet when nothing differs", () => {
  const week = [ev("PRJ301", 21, 7), ev("SWP391", 22, 9)];
  assert.deepStrictEqual(detectScheduleChanges(week, week.map((e) => ({ ...e })), NOW), []);
});

test("detectScheduleChanges ignores attendance-only differences", () => {
  const changes = detectScheduleChanges(
    [ev("PRJ301", 22, 9)],
    [ev("PRJ301", 22, 9, { attendanceStatus: "attended" })],
    NOW
  );
  assert.deepStrictEqual(changes, []);
});

test("formatScheduleChangeNotifications writes one specific line per change", () => {
  const changes = detectScheduleChanges(
    [ev("SWP391", 22, 9, { location: "P.201" })],
    [ev("SWP391", 22, 9, { location: "P.305" })],
    NOW
  );
  const out = formatScheduleChangeNotifications(changes);
  assert.strictEqual(out.length, 1);
  assert.match(out[0].title, /SWP391/);
  assert.match(out[0].message, /22\/9/);
  assert.match(out[0].message, /P\.201/);
  assert.match(out[0].message, /P\.305/);
});

test("formatScheduleChangeNotifications collapses a long list into one summary", () => {
  const many = ["A", "B", "C", "D", "E"].map((t, i) => ({
    kind: "removed",
    fields: [],
    before: ev(t + "101", 22 + (i % 3), 9),
    after: null
  }));
  const out = formatScheduleChangeNotifications(many);
  assert.strictEqual(out.length, 1);
  assert.match(out[0].title, /5/);
});

test("formatScheduleChangeNotifications returns nothing for no changes", () => {
  assert.deepStrictEqual(formatScheduleChangeNotifications([]), []);
  assert.deepStrictEqual(formatScheduleChangeNotifications(null), []);
});

const { applyWeekCapture } = require("../lib/schedule.js");

test("applyWeekCapture merges a viewed week into storage and reports changes", () => {
  const stored = JSON.stringify([ev("SWP391", 22, 9, { location: "P.201" }), ev("MAD101", 30, 9)]);
  const out = applyWeekCapture(stored, [ev("SWP391", 22, 9, { location: "P.305" })], 0, NOW);
  assert.strictEqual(out.changed, true);
  const saved = JSON.parse(out.mergedJson);
  assert.strictEqual(saved.length, 2, "the other week is untouched");
  assert.strictEqual(saved.find((e) => e.title === "SWP391").location, "P.305");
  assert.strictEqual(out.changes.length, 1);
  assert.deepStrictEqual(out.changes[0].fields, ["room"]);
});

test("applyWeekCapture reports unchanged when the same week is viewed again, even if order differs", () => {
  const week = [ev("PRJ301", 21, 7), ev("SWP391", 22, 9)];
  const stored = JSON.stringify([ev("MAD101", 30, 9), ...week]);
  const out = applyWeekCapture(stored, week.slice().reverse().map((e) => ({ ...e })), 0, NOW);
  assert.strictEqual(out.changed, false);
  assert.deepStrictEqual(out.changes, []);
});

test("applyWeekCapture treats the first capture as a silent baseline", () => {
  const out = applyWeekCapture(undefined, [ev("PRJ301", 21, 7)], 0, NOW);
  assert.strictEqual(out.changed, true);
  assert.strictEqual(JSON.parse(out.mergedJson).length, 1);
  assert.deepStrictEqual(out.changes, []);
});

test("applyWeekCapture never erases classes when cells were skipped", () => {
  const stored = JSON.stringify([ev("PRJ301", 21, 7), ev("SWP391", 22, 9)]);
  const out = applyWeekCapture(stored, [ev("PRJ301", 21, 7)], 2, NOW);
  assert.strictEqual(JSON.parse(out.mergedJson).length, 2);
  assert.deepStrictEqual(out.changes, []);
});

test("applyWeekCapture survives corrupt stored data", () => {
  const out = applyWeekCapture("{not json", [ev("PRJ301", 21, 7)], 0, NOW);
  assert.strictEqual(JSON.parse(out.mergedJson).length, 1);
});

test("applyWeekCapture notices an attendance update", () => {
  const stored = JSON.stringify([ev("PRJ301", 21, 7)]);
  const out = applyWeekCapture(stored, [ev("PRJ301", 21, 7, { attendanceStatus: "attended" })], 0, NOW);
  assert.strictEqual(out.changed, true);
  assert.deepStrictEqual(out.changes, [], "attendance is not a schedule change");
});
