/* Shared by popup (script tag) and background (importScripts). */
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
  const existingKeys = new Set();
  allSchedule.forEach((event) => {
    const k = classScheduleDedupeKey(event);
    if (k) existingKeys.add(k);
  });
  const uniqueNewEvents = newEvents.filter((event) => {
    const k = classScheduleDedupeKey(event);
    if (k) return !existingKeys.has(k);
    return true;
  });
  return { uniqueNewEvents, merged: allSchedule.concat(uniqueNewEvents) };
}

function mirrorClassScheduleToStorage(jsonString) {
  try {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ classSchedule: jsonString });
    }
  } catch (_) {}
}
