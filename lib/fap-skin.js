(function (root, factory) {
  let deps = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      deps = require("./accent.js");
    } catch (_) {
      deps = null;
    }
  }
  if (!deps && typeof globalThis !== "undefined") {
    deps = {
      ACCENT_PRESETS: globalThis.ACCENT_PRESETS,
      normalizeAccentId: globalThis.normalizeAccentId,
      mixHex: globalThis.mixHex
    };
  }
  const api = factory(deps);
  if (root) {
    root.FapSkin = api;
    Object.assign(root, api);
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (deps) {
  "use strict";

  deps = deps || {};

  const FAP_SKIN_KEYS = {
    enabled: "fapSkinEnabled",
    accent: "accentColor",
    noticeSeen: "fapSkinNoticeSeen"
  };

  const SKIN_ATTR = "data-fptu-skin";
  const ACCENT_STYLE_ID = "fptu-skin-accent";

  function hexToRgb(hex) {
    const n = parseInt(String(hex).replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(rgb) {
    return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  }

  function defaultMixHex(a, b, t) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    return rgbToHex(ca.map((v, i) => v + (cb[i] - v) * t));
  }

  const ACCENT_PRESETS = deps.ACCENT_PRESETS || (typeof globalThis !== "undefined" && globalThis.ACCENT_PRESETS) || [
    { id: "blue", label: "Xanh duong", light: "#2563eb", dark: "#3b82f6" },
    { id: "indigo", label: "Cham", light: "#4f46e5", dark: "#6366f1" },
    { id: "violet", label: "Tim", light: "#7c3aed", dark: "#8b5cf6" },
    { id: "pink", label: "Hong", light: "#db2777", dark: "#ec4899" },
    { id: "orange", label: "Cam", light: "#e0510a", dark: "#ea580c" },
    { id: "teal", label: "Xanh ngoc", light: "#0f766e", dark: "#0d9488" },
    { id: "green", label: "Xanh la", light: "#15803d", dark: "#059669" },
    { id: "graphite", label: "Xam than", light: "#475569", dark: "#64748b" }
  ];

  const normalizeAccentId = deps.normalizeAccentId || (typeof globalThis !== "undefined" && globalThis.normalizeAccentId) || function (id) {
    return ACCENT_PRESETS.some((p) => p.id === id) ? id : "blue";
  };

  const mixHex = deps.mixHex || (typeof globalThis !== "undefined" && globalThis.mixHex) || defaultMixHex;

  function buildFapAccentCss(id) {
    const key = normalizeAccentId(id);
    if (key === "blue") return "";
    const p = ACCENT_PRESETS.find((x) => x.id === key);
    if (!p) return "";
    const [dr, dg, db] = hexToRgb(p.dark);
    return (
      `html:not([${SKIN_ATTR}="off"]){--fptu-accent:${p.light};--fptu-accent-hover:${mixHex(p.light, "#000000", 0.15)};--fptu-accent-soft:${mixHex(p.light, "#ffffff", 0.92)};}` +
      `html:not([${SKIN_ATTR}="off"])[data-bs-theme="dark"]{--fptu-accent:${p.dark};--fptu-accent-hover:${mixHex(p.dark, "#ffffff", 0.25)};--fptu-accent-soft:rgba(${dr}, ${dg}, ${db}, 0.2);}`
    );
  }

  function applyFapSkin(doc, settings = {}) {
    const documentObj = doc || (typeof document !== "undefined" ? document : null);
    if (!documentObj || !documentObj.documentElement) return;

    const isOff = settings && settings.enabled === false;
    if (isOff) {
      documentObj.documentElement.setAttribute(SKIN_ATTR, "off");
    } else {
      documentObj.documentElement.removeAttribute(SKIN_ATTR);
    }

    const accentColor = settings && settings.accentColor;
    const css = buildFapAccentCss(accentColor);
    let el = documentObj.getElementById(ACCENT_STYLE_ID);

    if (!css) {
      if (el) {
        if (typeof el.remove === "function") {
          el.remove();
        } else if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }
      return;
    }

    if (!el) {
      el = documentObj.createElement("style");
      el.id = ACCENT_STYLE_ID;
      const parent = documentObj.head || documentObj.documentElement;
      if (parent) {
        parent.appendChild(el);
      }
    }
    el.textContent = css;
  }

  function startFapSkin(win, chromeApi) {
    const windowObj = win || (typeof window !== "undefined" ? window : null);
    if (!windowObj) return { stop: () => {} };

    if (windowObj.__fptuFapSkin) {
      return windowObj.__fptuFapSkin;
    }

    const doc = windowObj.document;
    const api = chromeApi !== undefined ? chromeApi : (typeof chrome !== "undefined" ? chrome : null);

    let currentEnabled = true;
    let currentAccent = "blue";

    if (doc) {
      applyFapSkin(doc, { enabled: currentEnabled, accentColor: currentAccent });
    }

    let storageListener = null;

    function onSettingsLoaded(items) {
      if (!items) return;
      if (items[FAP_SKIN_KEYS.enabled] !== undefined) {
        currentEnabled = items[FAP_SKIN_KEYS.enabled];
      }
      if (items[FAP_SKIN_KEYS.accent] !== undefined) {
        currentAccent = items[FAP_SKIN_KEYS.accent];
      }
      if (doc) {
        applyFapSkin(doc, { enabled: currentEnabled, accentColor: currentAccent });
      }
    }

    if (api && api.storage) {
      try {
        if (api.storage.local && typeof api.storage.local.get === "function") {
          let cbCalled = false;
          const maybePromise = api.storage.local.get([FAP_SKIN_KEYS.enabled, FAP_SKIN_KEYS.accent], (items) => {
            cbCalled = true;
            onSettingsLoaded(items);
          });
          if (!cbCalled && maybePromise && typeof maybePromise.then === "function") {
            maybePromise.then(
              (items) => {
                if (!cbCalled) onSettingsLoaded(items);
              },
              () => {}
            );
          }
        }
      } catch (_) {
        // storage unusable; keep defaults
      }

      try {
        if (api.storage.onChanged && typeof api.storage.onChanged.addListener === "function") {
          storageListener = (changes, areaName) => {
            if (areaName !== "local" || !changes) return;
            let changed = false;
            if (FAP_SKIN_KEYS.enabled in changes) {
              const newVal = changes[FAP_SKIN_KEYS.enabled].newValue;
              currentEnabled = newVal !== undefined ? newVal : true;
              changed = true;
            }
            if (FAP_SKIN_KEYS.accent in changes) {
              const newVal = changes[FAP_SKIN_KEYS.accent].newValue;
              currentAccent = newVal !== undefined ? newVal : "blue";
              changed = true;
            }
            if (changed && doc) {
              applyFapSkin(doc, { enabled: currentEnabled, accentColor: currentAccent });
            }
          };
          api.storage.onChanged.addListener(storageListener);
        }
      } catch (_) {
        // ignore listener registration errors
      }
    }

    const instance = {
      stop() {
        if (storageListener && api && api.storage && api.storage.onChanged && typeof api.storage.onChanged.removeListener === "function") {
          try {
            api.storage.onChanged.removeListener(storageListener);
          } catch (_) {}
          storageListener = null;
        }
        if (windowObj.__fptuFapSkin === instance) {
          delete windowObj.__fptuFapSkin;
        }
      }
    };

    windowObj.__fptuFapSkin = instance;
    return instance;
  }

  if (
    typeof window !== "undefined" &&
    typeof chrome !== "undefined" &&
    typeof location !== "undefined" &&
    location.hostname === "fap.fpt.edu.vn"
  ) {
    try {
      startFapSkin(window, chrome);
    } catch (_) {}
  }

  return {
    FAP_SKIN_KEYS,
    SKIN_ATTR,
    ACCENT_STYLE_ID,
    buildFapAccentCss,
    applyFapSkin,
    startFapSkin
  };
});
