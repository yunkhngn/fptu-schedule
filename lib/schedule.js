/**
 * Class-schedule dedupe/merge, shared by the popup and the background service worker
 * so the two cannot drift apart. Required directly by tests/.
 */
(function (root, factory) {
  const api = factory();
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
"use strict";

function classScheduleDedupeKey(event) {
  if (event.rawDate) {
    return `${event.title}-${event.rawDate.day}/${event.rawDate.month}-${event.rawDate.startHour}:${event.rawDate.startMinute}`;
  }
  if (event.start) {
    const start = typeof event.start === "string" ? new Date(event.start) : event.start;
    if (!isNaN(start.getTime())) {
      return `${event.title}-${start.getDate()}/${start.getMonth() + 1}-${start.getHours()}:${start.getMinutes()}`;
    }
  }
  return null;
}

function mergeNewClassEventsInto(allSchedule, newEvents) {
  const incomingMap = new Map();
  newEvents.forEach((ev) => {
    const k = classScheduleDedupeKey(ev);
    if (k) incomingMap.set(k, ev);
  });

  const existingKeys = new Set();
  const merged = allSchedule.map((event) => {
    const k = classScheduleDedupeKey(event);
    if (k) {
      existingKeys.add(k);
      const inc = incomingMap.get(k);
      if (inc && (inc.attendanceStatus || inc.attendanceColor || inc.meetUrl)) {
        return {
          ...event,
          attendanceStatus: inc.attendanceStatus || event.attendanceStatus,
          attendanceColor: inc.attendanceColor || event.attendanceColor,
          meetUrl: inc.meetUrl || event.meetUrl
        };
      }
    }
    return event;
  });

  const uniqueNewEvents = newEvents.filter((event) => {
    const k = classScheduleDedupeKey(event);
    if (k) return !existingKeys.has(k);
    return true;
  });

  return { uniqueNewEvents, merged: merged.concat(uniqueNewEvents) };
}

/** Local start Date of a class event (rawDate preferred, `start` as fallback), or null. */
function classEventStartDate(event) {
  if (!event) return null;
  const rd = event.rawDate;
  if (rd && Number.isFinite(rd.year) && Number.isFinite(rd.month) && Number.isFinite(rd.day)) {
    return new Date(rd.year, rd.month - 1, rd.day, rd.startHour || 0, rd.startMinute || 0, 0, 0);
  }
  if (event.start) {
    const d = typeof event.start === "string" ? new Date(event.start) : event.start;
    if (d && !isNaN(d.getTime())) return d;
  }
  return null;
}

/** "YYYY-M-D" of the Monday of the event's week (weeks run Monday to Sunday), or null. */
function classEventWeekKey(event) {
  const d = classEventStartDate(event);
  if (!d) return null;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
}

/**
 * Merge a fresh sync into the stored schedule, replacing every week the sync covers.
 * Unlike mergeNewClassEventsInto this lets a cancelled or moved class disappear instead of
 * lingering next to its replacement. A week counts as covered when the sync returned at
 * least one event for it, so a week FAP returned empty is left untouched.
 */
function replaceCoveredWeeks(allSchedule, newEvents) {
  const covered = new Set();
  newEvents.forEach((ev) => {
    const w = classEventWeekKey(ev);
    if (w) covered.add(w);
  });

  const kept = [];
  const replacedOld = [];
  allSchedule.forEach((ev) => {
    const w = classEventWeekKey(ev);
    if (w && covered.has(w)) replacedOld.push(ev);
    else kept.push(ev);
  });

  const oldByKey = new Map();
  replacedOld.forEach((ev) => {
    const k = classScheduleDedupeKey(ev);
    if (k) oldByKey.set(k, ev);
  });

  const fresh = new Map();
  const undatedFresh = [];
  newEvents.forEach((ev) => {
    const k = classScheduleDedupeKey(ev);
    if (!k) { undatedFresh.push(ev); return; }
    const prev = oldByKey.get(k);
    fresh.set(k, prev
      ? {
          ...ev,
          attendanceStatus: ev.attendanceStatus || prev.attendanceStatus,
          attendanceColor: ev.attendanceColor || prev.attendanceColor,
          meetUrl: ev.meetUrl || prev.meetUrl
        }
      : ev);
  });

  const uniqueNewEvents = [];
  fresh.forEach((ev, k) => { if (!oldByKey.has(k)) uniqueNewEvents.push(ev); });
  uniqueNewEvents.push(...undatedFresh);

  return {
    merged: kept.concat(Array.from(fresh.values()), undatedFresh),
    uniqueNewEvents,
    replacedOld
  };
}

function normRoom(location) {
  return String(location || "").trim().toLowerCase();
}

/**
 * Compare the previous copy of the re-synced weeks with the fresh one and describe what a
 * student would care about: a room or time change, a cancelled class, an added class.
 * Only classes that have not started yet are reported. With no previous data for the weeks
 * this is a first sync, so nothing is reported.
 * @returns {{kind: "changed"|"removed"|"added", fields: string[], before: object|null, after: object|null}[]}
 */
function detectScheduleChanges(oldEvents, newEvents, now = new Date()) {
  if (!Array.isArray(oldEvents) || oldEvents.length === 0 || !Array.isArray(newEvents)) return [];
  const nowMs = now.getTime();

  const groupByDayAndTitle = (list) => {
    const groups = new Map();
    list.forEach((ev) => {
      const start = classEventStartDate(ev);
      if (!start) return;
      const key = `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}|${(ev.title || "").trim()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ ev, ms: start.getTime() });
    });
    return groups;
  };

  const oldGroups = groupByDayAndTitle(oldEvents);
  const newGroups = groupByDayAndTitle(newEvents);
  const changes = [];

  new Set([...oldGroups.keys(), ...newGroups.keys()]).forEach((key) => {
    const olds = (oldGroups.get(key) || []).slice().sort((a, b) => a.ms - b.ms);
    const news = (newGroups.get(key) || []).slice().sort((a, b) => a.ms - b.ms);

    // Same start time = same class; pair those first, then pair what is left in time order.
    const pairs = [];
    for (let i = olds.length - 1; i >= 0; i--) {
      const j = news.findIndex((n) => n.ms === olds[i].ms);
      if (j !== -1) {
        pairs.push([olds[i], news[j]]);
        olds.splice(i, 1);
        news.splice(j, 1);
      }
    }
    while (olds.length && news.length) pairs.push([olds.shift(), news.shift()]);

    pairs.forEach(([o, n]) => {
      if (o.ms < nowMs && n.ms < nowMs) return;
      const fields = [];
      if (o.ms !== n.ms) fields.push("time");
      if (normRoom(o.ev.location) !== normRoom(n.ev.location)) fields.push("room");
      if (fields.length) changes.push({ kind: "changed", fields, before: o.ev, after: n.ev });
    });
    olds.forEach((o) => {
      if (o.ms >= nowMs) changes.push({ kind: "removed", fields: [], before: o.ev, after: null });
    });
    news.forEach((n) => {
      if (n.ms >= nowMs) changes.push({ kind: "added", fields: [], before: null, after: n.ev });
    });
  });

  const startOf = (c) => classEventStartDate(c.after || c.before).getTime();
  return changes.sort((a, b) => startOf(a) - startOf(b));
}

function stableStringify(value) {
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort()
      .filter((k) => value[k] !== undefined)
      .map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}

/** Order- and key-order-independent fingerprint of a class list, used to tell "nothing changed". */
function scheduleFingerprint(events) {
  return events.map((e) => stableStringify(e)).sort().join("\n");
}

/**
 * Fold a week the student is looking at on FAP into the stored schedule (JSON string).
 * `skipped` is the number of cells the parser could not read: an incomplete capture only adds,
 * it never removes, so a parsing hiccup cannot look like a cancellation.
 * @returns {{mergedJson: string, changed: boolean, changes: object[], uniqueNewEvents: object[]}}
 */
function applyWeekCapture(storedJson, freshEvents, skipped, now = new Date()) {
  let stored = [];
  try {
    const parsed = JSON.parse(storedJson || "[]");
    if (Array.isArray(parsed)) stored = parsed;
  } catch (_) {
    stored = [];
  }
  const fresh = Array.isArray(freshEvents) ? freshEvents : [];

  let merged;
  let uniqueNewEvents;
  let changes = [];
  if (!(skipped > 0)) {
    const replaced = replaceCoveredWeeks(stored, fresh);
    merged = replaced.merged;
    uniqueNewEvents = replaced.uniqueNewEvents;
    changes = detectScheduleChanges(replaced.replacedOld, fresh, now);
  } else {
    ({ merged, uniqueNewEvents } = mergeNewClassEventsInto(stored, fresh));
  }

  return {
    mergedJson: JSON.stringify(merged),
    changed: scheduleFingerprint(merged) !== scheduleFingerprint(stored),
    changes,
    uniqueNewEvents
  };
}

/** Valid values for the class-schedule range filter, in the order the popup lists them. */
const CLASS_RANGE_MODES = ["all", "today", "week", "2weeks", "month"];

/** Midnight of the day an event falls on, or null when it carries no usable date. */
function classEventDay(event) {
  if (event && event.rawDate) {
    const rd = event.rawDate;
    const d = new Date(rd.year, (rd.month || 1) - 1, rd.day || 1);
    return isNaN(d.getTime()) ? null : d;
  }
  if (event && event.start) {
    const d = new Date(event.start);
    if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return null;
}

/**
 * Inclusive day bounds for a range mode, or null for "all".
 *
 * Ranges follow the calendar the way FAP does — weeks run Monday to Sunday — but always
 * start at today, so a filter never shows classes that have already happened.
 */
function classScheduleRangeBounds(mode, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (mode === "today") return { from: today, to: today };

  // getDay() is 0 for Sunday; treat Sunday as the 7th day so weeks end on it.
  const isoDay = today.getDay() === 0 ? 7 : today.getDay();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - isoDay));

  if (mode === "week") return { from: today, to: endOfWeek };
  if (mode === "2weeks") {
    const end = new Date(endOfWeek);
    end.setDate(endOfWeek.getDate() + 7);
    return { from: today, to: end };
  }
  if (mode === "month") {
    return { from: today, to: new Date(today.getFullYear(), today.getMonth() + 1, 0) };
  }
  return null; // "all", and anything unrecognised
}

/** Events inside the range, dateless ones kept so nothing disappears without explanation. */
function filterClassScheduleByRange(schedule, mode, now = new Date()) {
  if (!Array.isArray(schedule)) return [];
  const bounds = classScheduleRangeBounds(mode, now);
  if (!bounds) return schedule.slice();
  return schedule.filter((event) => {
    const day = classEventDay(event);
    if (!day) return true;
    return day >= bounds.from && day <= bounds.to;
  });
}

/**
 * FPTU bans a student from the final exam of a course once unauthorized absences pass 20%
 * of its graded sessions. 15% is an early warning before that line.
 */
const ATTENDANCE_WARNING_THRESHOLD = 0.15;
const ATTENDANCE_DANGER_THRESHOLD = 0.2;

/**
 * Detailed attendance stats per course code, including attended, absent, total scheduled,
 * and maximum/remaining absences permitted under the FPT 20% limit.
 * A course with no graded session is left out of the result entirely.
 */
function computeCourseAttendanceStats(schedule) {
  if (!Array.isArray(schedule)) return {};
  const counts = {};
  schedule.forEach((event) => {
    const title = event && event.title;
    if (!title) return;
    const status = (event && event.attendanceStatus || "").toLowerCase();
    if (!counts[title]) {
      counts[title] = { attended: 0, absent: 0, notYet: 0, totalScheduled: 0 };
    }
    counts[title].totalScheduled += 1;
    if (status.includes("absent")) counts[title].absent += 1;
    else if (status.includes("attended")) counts[title].attended += 1;
    else counts[title].notYet += 1;
  });

  const byCourse = {};
  Object.keys(counts).forEach((title) => {
    const { attended, absent, notYet, totalScheduled } = counts[title];
    const totalGraded = attended + absent;
    if (totalGraded === 0) return;

    const rate = absent / totalGraded;
    const hasFullSchedule = totalScheduled >= 10;
    const maxAllowedAbsent = Math.floor(totalScheduled * 0.20);
    const remainingAbsent = maxAllowedAbsent - absent;

    byCourse[title] = {
      attended,
      absent,
      notYet,
      totalGraded,
      totalScheduled,
      rate,
      hasFullSchedule,
      maxAllowedAbsent,
      remainingAbsent,
    };
  });
  return byCourse;
}

/**
 * Absence rate per course code, counting only sessions that have actually been graded
 * ("attended" or "absent") — "not yet" sessions are future/unknown and never enter the
 * denominator, so the rate reflects standing as of today rather than a diluted worst case.
 * A course with no graded session at all is left out of the result entirely, not reported
 * as 0%, since there is nothing yet to judge it by.
 */
function computeAttendanceByCourse(schedule) {
  const stats = computeCourseAttendanceStats(schedule);
  const byCourse = {};
  Object.keys(stats).forEach((title) => {
    const { attended, absent, rate } = stats[title];
    byCourse[title] = { attended, absent, rate };
  });
  return byCourse;
}

/** null below the warning threshold; "warning" or "danger" (both bounds inclusive) above it. */
function attendanceRiskLevel(rate) {
  if (typeof rate !== "number" || Number.isNaN(rate)) return null;
  if (rate >= ATTENDANCE_DANGER_THRESHOLD) return "danger";
  if (rate >= ATTENDANCE_WARNING_THRESHOLD) return "warning";
  return null;
}

/**
 * Returns Monday to Sunday date range and day details for a week given refDate and weekOffset.
 */
function getWeekDateRange(refDate = new Date(), weekOffset = 0) {
  const now = new Date(refDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const realToday = new Date();
  const realTodayStr = `${realToday.getFullYear()}-${realToday.getMonth()}-${realToday.getDate()}`;

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    days.push({
      date: d,
      isoDay: i + 1,
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      isToday: dStr === realTodayStr,
    });
  }
  return { startMonday: monday, endSunday: sunday, days };
}

/**
 * Maps an event to a FPT standard slot number (1 to 6) based on slot text or start time.
 */
function mapEventToSlot(event) {
  if (!event) return null;
  const rawSlot = String(event.slot || event.type || "").trim();
  const match = rawSlot.match(/slot\s*([1-6])/i);
  if (match) return parseInt(match[1], 10);

  let startHour = null;
  if (event.rawDate && typeof event.rawDate.startHour === "number") {
    startHour = event.rawDate.startHour;
  } else if (event.start) {
    const d = new Date(event.start);
    if (!isNaN(d.getTime())) startHour = d.getHours();
  }

  if (typeof startHour === "number") {
    if (startHour < 10) return 1;
    if (startHour < 12) return 2;
    if (startHour < 15) return 3;
    if (startHour < 17) return 4;
    if (startHour < 19) return 5;
    return 6;
  }

  return null;
}

/**
 * Groups events occurring within a weekRange by key "${isoDay}_${slot}".
 */
function groupScheduleByWeekAndSlot(schedule, weekRange) {
  if (!Array.isArray(schedule) || !weekRange) return {};
  const grouped = {};
  schedule.forEach((event) => {
    const day = classEventDay(event);
    if (!day) return;
    if (day < weekRange.startMonday || day > weekRange.endSunday) return;
    const isoDay = day.getDay() === 0 ? 7 : day.getDay();
    const slot = mapEventToSlot(event);
    if (!slot) return;
    const key = `${isoDay}_${slot}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(event);
  });
  return grouped;
}

const FPT_SLOT_TIMES = {
  1: { startHour: 7, startMinute: 30, endHour: 9, endMinute: 50 },
  2: { startHour: 10, startMinute: 0, endHour: 12, endMinute: 20 },
  3: { startHour: 12, startMinute: 50, endHour: 15, endMinute: 10 },
  4: { startHour: 15, startMinute: 20, endHour: 17, endMinute: 40 },
  5: { startHour: 17, startMinute: 50, endHour: 20, endMinute: 10 },
  6: { startHour: 20, startMinute: 20, endHour: 22, endMinute: 40 },
};

function getEventOrSlotBounds(event, dayObj, slotNumber) {
  let start = null;
  let end = null;

  if (event && event.rawDate) {
    const rd = event.rawDate;
    const y = rd.year || (dayObj && dayObj.year);
    const m = typeof rd.month === "number" ? rd.month - 1 : (dayObj ? dayObj.month - 1 : 0);
    const d = rd.day || (dayObj && dayObj.day);
    start = new Date(y, m, d, rd.startHour || 0, rd.startMinute || 0, 0);
    if (typeof rd.endHour === "number") {
      end = new Date(y, m, d, rd.endHour, rd.endMinute || 0, 0);
    } else {
      end = new Date(start.getTime() + 140 * 60 * 1000);
    }
  } else if (event && event.start) {
    start = new Date(event.start);
    end = event.end ? new Date(event.end) : new Date(start.getTime() + 140 * 60 * 1000);
  }

  if (!start || isNaN(start.getTime())) {
    const sConf = FPT_SLOT_TIMES[slotNumber] || FPT_SLOT_TIMES[1];
    const y = dayObj ? dayObj.year : new Date().getFullYear();
    const m = dayObj ? dayObj.month - 1 : new Date().getMonth();
    const d = dayObj ? dayObj.day : new Date().getDate();
    start = new Date(y, m, d, sConf.startHour, sConf.startMinute, 0);
    end = new Date(y, m, d, sConf.endHour, sConf.endMinute, 0);
  }

  return { start, end };
}

function getSlotTimingStatus(event, dayObj, slotNumber, now = new Date()) {
  const bounds = getEventOrSlotBounds(event, dayObj, slotNumber);
  const nowMs = now.getTime();
  if (nowMs >= bounds.start.getTime() && nowMs <= bounds.end.getTime()) {
    return "in_progress";
  }
  if (nowMs > bounds.end.getTime()) {
    return "past";
  }
  return "upcoming";
}

return {
  classScheduleDedupeKey,
  mergeNewClassEventsInto,
  replaceCoveredWeeks,
  detectScheduleChanges,
  applyWeekCapture,
  classEventStartDate,
  classEventWeekKey,
  classEventDay,
  classScheduleRangeBounds,
  filterClassScheduleByRange,
  CLASS_RANGE_MODES,
  computeAttendanceByCourse,
  computeCourseAttendanceStats,
  attendanceRiskLevel,
  ATTENDANCE_WARNING_THRESHOLD,
  ATTENDANCE_DANGER_THRESHOLD,
  getWeekDateRange,
  mapEventToSlot,
  groupScheduleByWeekAndSlot,
  FPT_SLOT_TIMES,
  getEventOrSlotBounds,
  getSlotTimingStatus
};
});

