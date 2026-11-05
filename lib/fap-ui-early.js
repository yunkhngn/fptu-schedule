(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    const mod = factory();
    root.FapUiEarly = mod;
    if (typeof window !== "undefined") {
      mod.initEarlyHide(window, window.chrome);
    }
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function matchPage(pathname) {
    if (typeof pathname !== "string") return null;
    const normalized = pathname.trim().replace(/\/+$/, "");
    if (normalized === "" || normalized === "/") return "overview";
    if (normalized.startsWith("/Auth") || normalized.startsWith("/Default")) return null;
    if (normalized === "/WeeklyTimetable" || normalized.startsWith("/WeeklyTimetable/")) return "timetable";
    if (normalized === "/ExamSchedule" || normalized.startsWith("/ExamSchedule/")) return "exams";
    if (normalized === "/News" || normalized === "/News/Index") return "news";
    if (normalized.startsWith("/News/Detail")) return null;
    return null;
  }

  function getStorageData(api, keys) {
    return new Promise(function (resolve) {
      if (!api || !api.storage || !api.storage.local || typeof api.storage.local.get !== "function") {
        resolve({});
        return;
      }
      try {
        let resolved = false;
        const result = api.storage.local.get(keys, function (data) {
          if (!resolved) {
            resolved = true;
            resolve(data || {});
          }
        });
        if (result && typeof result.then === "function") {
          result.then(function (data) {
            if (!resolved) {
              resolved = true;
              resolve(data || {});
            }
          }).catch(function () {
            if (!resolved) {
              resolved = true;
              resolve({});
            }
          });
        }
      } catch (_) {
        resolve({});
      }
    });
  }

  async function initEarlyHide(win, chromeApi) {
    const w = win || (typeof window !== "undefined" ? window : null);
    if (!w || !w.document) return;

    const page = matchPage(w.location ? w.location.pathname : "");
    if (!page) return;

    const api = chromeApi || w.chrome;
    let enabled = true;
    let originalPref = false;

    const key = "fapUiOriginal:" + page;
    const data = await getStorageData(api, ["fapUiEnabled", key]);
    if (data.fapUiEnabled === false) enabled = false;
    if (data[key] === true) originalPref = true;

    if (!enabled || originalPref) {
      return;
    }

    const docEl = w.document.documentElement;
    if (docEl) {
      docEl.setAttribute("data-fptu-ui", "pending");

      // 10 second failsafe to prevent permanent blank screen
      w.setTimeout(function () {
        if (docEl.getAttribute("data-fptu-ui") === "pending") {
          docEl.removeAttribute("data-fptu-ui");
        }
      }, 10000);
    }
  }

  return {
    matchPage,
    initEarlyHide
  };
});

