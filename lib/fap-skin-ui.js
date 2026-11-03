(function (root, factory) {
  let deps = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      deps = require("./fap-skin.js");
    } catch (_) {
      deps = null;
    }
  }
  if (!deps && typeof globalThis !== "undefined") {
    deps = {
      FAP_SKIN_KEYS: globalThis.FAP_SKIN_KEYS || (globalThis.FapSkin && globalThis.FapSkin.FAP_SKIN_KEYS)
    };
  }
  const api = factory(deps);
  if (root) {
    root.FapSkinUi = api;
    Object.assign(root, api);
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (deps) {
  "use strict";

  deps = deps || {};
  const FAP_SKIN_KEYS = deps.FAP_SKIN_KEYS || (typeof globalThis !== "undefined" && globalThis.FAP_SKIN_KEYS) || {
    enabled: "fapSkinEnabled",
    accent: "accentColor",
    noticeSeen: "fapSkinNoticeSeen"
  };

  const HOST_ID = "fptu-skin-ui";

  function resolveAccentColor(win) {
    try {
      if (win && typeof win.getComputedStyle === "function" && win.document && win.document.documentElement) {
        const computed = win.getComputedStyle(win.document.documentElement);
        const val = computed ? computed.getPropertyValue("--fptu-accent") : "";
        if (val && val.trim()) {
          return val.trim();
        }
      }
    } catch (_) {}
    return "blue";
  }

  function mountSkinUi(win, chromeApi) {
    const windowObj = win || (typeof window !== "undefined" ? window : null);
    if (!windowObj || !windowObj.document) {
      return { unmount: () => {} };
    }

    if (windowObj.__fptuSkinUi) {
      return windowObj.__fptuSkinUi;
    }

    const doc = windowObj.document;
    const rootEl = doc.documentElement || doc.body;
    if (!rootEl) {
      return { unmount: () => {} };
    }

    const api = chromeApi !== undefined ? chromeApi : (typeof chrome !== "undefined" ? chrome : null);

    let host = doc.getElementById(HOST_ID);
    if (!host) {
      host = doc.createElement("div");
      host.id = HOST_ID;
      rootEl.appendChild(host);
    }

    const accent = resolveAccentColor(windowObj);
    host.setAttribute(
      "style",
      "position: fixed; inset: 0; pointer-events: none; z-index: 999999; overflow: hidden; --fptu-accent: " + accent + ";"
    );

    let shadow = host.shadowRoot;
    if (!shadow) {
      shadow = host.attachShadow({ mode: "open" });
    }

    let currentEnabled = true;
    let currentNoticeSeen = false;

    function saveSettings(items) {
      if (api && api.storage && api.storage.local && typeof api.storage.local.set === "function") {
        try {
          api.storage.local.set(items, () => {});
        } catch (_) {}
      }
    }

    function render() {
      const switchLabel = currentEnabled ? "Dùng giao diện FAP gốc" : "Dùng giao diện FAP mới";
      const shouldShowNotice = currentEnabled !== false && currentNoticeSeen !== true;

      const styleMarkup = `<style>
:host {
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #f8fafc;
}

*, *::before, *::after {
  box-sizing: border-box;
}

.fptu-skin-switch-btn {
  position: fixed;
  bottom: 16px;
  left: 16px;
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
  user-select: none;
}

.fptu-skin-switch-btn:hover {
  background: rgba(30, 41, 59, 0.96);
  border-color: rgba(255, 255, 255, 0.3);
}

.fptu-skin-switch-btn:active {
  transform: scale(0.98);
}

.fptu-skin-switch-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  display: inline-block;
}

.fptu-skin-notice-card {
  position: fixed;
  bottom: 16px;
  right: 16px;
  pointer-events: auto;
  max-width: 380px;
  width: calc(100vw - 32px);
  background: rgba(15, 23, 42, 0.94);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  user-select: none;
}

.fptu-notice-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fptu-notice-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.fptu-notice-body {
  font-size: 13px;
  line-height: 1.5;
  color: #cbd5e1;
  margin: 0;
}

.fptu-notice-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.fptu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  user-select: none;
}

.fptu-btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.fptu-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}

.fptu-btn-primary {
  background: var(--fptu-accent, #2563eb);
  color: #ffffff;
}

.fptu-btn-primary:hover {
  filter: brightness(1.1);
}
</style>`;

      const switchMarkup = `<button type="button" class="fptu-skin-switch-btn" aria-label="${switchLabel}" title="${switchLabel}">` +
        `<svg class="fptu-skin-switch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/>` +
        `</svg>` +
        `<span>${switchLabel}</span>` +
        `</button>`;

      const noticeMarkup = shouldShowNotice
        ? `<div class="fptu-skin-notice-card" role="region" aria-label="Thông báo giao diện mới">` +
            `<div class="fptu-notice-header">` +
              `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--fptu-accent, #2563eb)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
                `<circle cx="12" cy="12" r="10"/>` +
                `<line x1="12" y1="16" x2="12" y2="12"/>` +
                `<line x1="12" y1="8" x2="12.01" y2="8"/>` +
              `</svg>` +
              `<div class="fptu-notice-title">Giao diện FAP mới</div>` +
            `</div>` +
            `<p class="fptu-notice-body">` +
              `Giao diện FAP đã được FPTU Schedule làm mới, chỉ đổi diện mạo, chức năng giữ nguyên, tắt được bất cứ lúc nào.` +
            `</p>` +
            `<div class="fptu-notice-actions">` +
              `<button type="button" class="fptu-btn fptu-btn-secondary">Dùng giao diện gốc</button>` +
              `<button type="button" class="fptu-btn fptu-btn-primary">Đã hiểu</button>` +
            `</div>` +
          `</div>`
        : "";

      shadow.innerHTML = styleMarkup + switchMarkup + noticeMarkup;

      const switchBtn = shadow.querySelector(".fptu-skin-switch-btn");
      if (switchBtn) {
        switchBtn.addEventListener("click", () => {
          currentEnabled = !currentEnabled;
          saveSettings({ [FAP_SKIN_KEYS.enabled]: currentEnabled });
          render();
        });
      }

      if (shouldShowNotice) {
        const dismissBtn = [...shadow.querySelectorAll("button")].find(
          (b) => b.textContent.trim() === "Đã hiểu"
        );
        if (dismissBtn) {
          dismissBtn.addEventListener("click", () => {
            currentNoticeSeen = true;
            saveSettings({ [FAP_SKIN_KEYS.noticeSeen]: true });
            render();
          });
        }

        const revertBtn = [...shadow.querySelectorAll("button")].find(
          (b) => b.textContent.trim() === "Dùng giao diện gốc"
        );
        if (revertBtn) {
          revertBtn.addEventListener("click", () => {
            currentEnabled = false;
            currentNoticeSeen = true;
            saveSettings({
              [FAP_SKIN_KEYS.enabled]: false,
              [FAP_SKIN_KEYS.noticeSeen]: true
            });
            render();
          });
        }
      }
    }

    render();

    function onStoredSettingsLoaded(items) {
      if (!items) return;
      let changed = false;
      if (items[FAP_SKIN_KEYS.enabled] !== undefined) {
        currentEnabled = items[FAP_SKIN_KEYS.enabled];
        changed = true;
      }
      if (items[FAP_SKIN_KEYS.noticeSeen] !== undefined) {
        currentNoticeSeen = items[FAP_SKIN_KEYS.noticeSeen];
        changed = true;
      }
      if (changed) {
        render();
      }
    }

    if (api && api.storage && api.storage.local && typeof api.storage.local.get === "function") {
      try {
        let cbCalled = false;
        const maybePromise = api.storage.local.get([FAP_SKIN_KEYS.enabled, FAP_SKIN_KEYS.noticeSeen], (items) => {
          cbCalled = true;
          onStoredSettingsLoaded(items);
        });
        if (!cbCalled && maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(
            (items) => {
              if (!cbCalled) onStoredSettingsLoaded(items);
            },
            () => {}
          );
        }
      } catch (_) {
        // storage failure; keep defaults
      }
    }

    let storageListener = null;
    if (api && api.storage && api.storage.onChanged && typeof api.storage.onChanged.addListener === "function") {
      storageListener = (changes, areaName) => {
        if (areaName !== "local" || !changes) return;
        let changed = false;
        if (FAP_SKIN_KEYS.enabled in changes) {
          const newVal = changes[FAP_SKIN_KEYS.enabled].newValue;
          currentEnabled = newVal !== undefined ? newVal : true;
          changed = true;
        }
        if (FAP_SKIN_KEYS.noticeSeen in changes) {
          const newVal = changes[FAP_SKIN_KEYS.noticeSeen].newValue;
          currentNoticeSeen = newVal !== undefined ? newVal : false;
          changed = true;
        }
        if (changed) {
          render();
        }
      };
      try {
        api.storage.onChanged.addListener(storageListener);
      } catch (_) {}
    }

    const instance = {
      unmount() {
        if (storageListener && api && api.storage && api.storage.onChanged && typeof api.storage.onChanged.removeListener === "function") {
          try {
            api.storage.onChanged.removeListener(storageListener);
          } catch (_) {}
          storageListener = null;
        }
        if (host && host.parentNode) {
          host.parentNode.removeChild(host);
        }
        if (windowObj.__fptuSkinUi === instance) {
          delete windowObj.__fptuSkinUi;
        }
      }
    };

    windowObj.__fptuSkinUi = instance;
    return instance;
  }

  if (
    typeof window !== "undefined" &&
    typeof chrome !== "undefined" &&
    typeof location !== "undefined" &&
    location.hostname === "fap.fpt.edu.vn"
  ) {
    try {
      mountSkinUi(window, chrome);
    } catch (_) {}
  }

  return {
    mountSkinUi
  };
});
