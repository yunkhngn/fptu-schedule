import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  readAppearance,
  applyAppearance,
  watchAppearance,
  type Appearance,
} from "./appearance";
import { ACCENT_VARS, accentVarsFor, hexToOklch } from "../accent/palette";
import { makeChrome } from "../test/chrome";

function createMockWindow(prefersDark: boolean): {
  win: Window;
  setPrefersDark: (dark: boolean) => void;
  mediaListeners: Array<() => void>;
} {
  let isDark = prefersDark;
  const mediaListeners: Array<() => void> = [];

  const win = {
    matchMedia: vi.fn((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? isDark : false,
      media: query,
      onchange: null,
      addListener: (l: () => void) => mediaListeners.push(l),
      removeListener: (l: () => void) => {
        const idx = mediaListeners.indexOf(l);
        if (idx >= 0) mediaListeners.splice(idx, 1);
      },
      addEventListener: (_ev: string, l: () => void) => mediaListeners.push(l),
      removeEventListener: (_ev: string, l: () => void) => {
        const idx = mediaListeners.indexOf(l);
        if (idx >= 0) mediaListeners.splice(idx, 1);
      },
      dispatchEvent: () => false,
    })),
  } as unknown as Window;

  return {
    win,
    setPrefersDark: (dark: boolean) => {
      isDark = dark;
      mediaListeners.forEach((l) => l());
    },
    mediaListeners,
  };
}

describe("readAppearance", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with stored theme and accent when both are present", async () => {
    const mockChrome = makeChrome({ theme: "dark", accentColor: "orange" });
    const result = await readAppearance(mockChrome);
    expect(result).toEqual({ theme: "dark", accent: "orange" });
    expect(mockChrome.storage.local.get).toHaveBeenCalledTimes(1);
    expect(mockChrome.storage.local.get).toHaveBeenCalledWith(
      ["theme", "accentColor"],
      expect.any(Function)
    );
  });

  it("resolves with defaults { theme: 'auto', accent: null } when keys are missing", async () => {
    const mockChrome = makeChrome({});
    const result = await readAppearance(mockChrome);
    expect(result).toEqual({ theme: "auto", accent: null });
  });

  it("resolves with defaults when chromeApi is undefined", async () => {
    const result = await readAppearance(undefined);
    expect(result).toEqual({ theme: "auto", accent: null });
  });

  it("resolves with defaults when get never calls back (timeout fires after 300ms)", async () => {
    vi.useFakeTimers();
    const mockChrome = {
      storage: {
        local: {
          get: vi.fn(() => {
            // never calls callback, returns pending promise
            return new Promise(() => {});
          }),
        },
      },
    } as unknown as typeof chrome;

    const promise = readAppearance(mockChrome, 300);
    await vi.advanceTimersByTimeAsync(350);
    const result = await promise;
    expect(result).toEqual({ theme: "auto", accent: null });
  });

  it("normalizes corrupt values (theme: 42, accentColor: {}) to defaults", async () => {
    const mockChrome = makeChrome({ theme: 42, accentColor: {} });
    const result = await readAppearance(mockChrome);
    expect(result).toEqual({ theme: "auto", accent: null });
  });

  it("trims whitespace from accentColor and treats empty string as null", async () => {
    const mockChrome = makeChrome({ theme: "light", accentColor: "   " });
    const result = await readAppearance(mockChrome);
    expect(result).toEqual({ theme: "light", accent: null });
  });
});

describe("applyAppearance", () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement("div");
  });

  it("sets data-theme='dark' and no accent variables when accent is null", () => {
    const { win } = createMockWindow(false);
    applyAppearance(host, { theme: "dark", accent: null }, win);

    expect(host.getAttribute("data-theme")).toBe("dark");
    for (const v of ACCENT_VARS) {
      expect(host.style.getPropertyValue(v)).toBe("");
    }
  });

  it("sets data-theme='dark' and dark derived accent variables for 'orange'", () => {
    const { win } = createMockWindow(false);
    applyAppearance(host, { theme: "dark", accent: "orange" }, win);

    expect(host.getAttribute("data-theme")).toBe("dark");
    const darkOrangeVars = accentVarsFor("orange", "dark");
    expect(host.style.getPropertyValue("--primary")).toBe(darkOrangeVars["--primary"]);
    expect(host.style.getPropertyValue("--primary")).not.toBe("");
  });

  it("resolves 'auto' with light matchMedia to data-theme='light' and light accent variables", () => {
    const { win } = createMockWindow(false);
    applyAppearance(host, { theme: "auto", accent: "orange" }, win);

    expect(host.getAttribute("data-theme")).toBe("light");
    const lightOrangeVars = accentVarsFor("orange", "light");
    expect(host.style.getPropertyValue("--primary")).toBe(lightOrangeVars["--primary"]);
  });

  it("removes all ACCENT_VARS when called again with accent: null", () => {
    const { win } = createMockWindow(false);
    applyAppearance(host, { theme: "dark", accent: "orange" }, win);
    expect(host.style.getPropertyValue("--primary")).not.toBe("");

    applyAppearance(host, { theme: "dark", accent: null }, win);
    expect(host.getAttribute("data-theme")).toBe("dark");
    for (const v of ACCENT_VARS) {
      expect(host.style.getPropertyValue(v)).toBe("");
    }
  });
});

describe("watchAppearance", () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement("div");
  });

  it("registers only one storage listener and reacts to theme changes by updating data-theme and recomputing accent vars", () => {
    const mockChrome = makeChrome({ theme: "dark", accentColor: "orange" });
    const { win } = createMockWindow(false);
    const initial: Appearance = { theme: "dark", accent: "orange" };

    applyAppearance(host, initial, win);
    const watcher = watchAppearance(host, mockChrome, win, initial);

    expect(mockChrome._listeners.length).toBe(1);

    // Switch theme from dark to light
    mockChrome._listeners[0]({ theme: { newValue: "light" } }, "local");

    expect(host.getAttribute("data-theme")).toBe("light");
    const lightOrangeVars = accentVarsFor("orange", "light");
    expect(host.style.getPropertyValue("--primary")).toBe(lightOrangeVars["--primary"]);

    watcher.stop();
  });

  it("reacts to accentColor changes by updating accent vars while preserving data-theme", () => {
    const mockChrome = makeChrome({ theme: "dark", accentColor: "orange" });
    const { win } = createMockWindow(false);
    const initial: Appearance = { theme: "dark", accent: "orange" };

    applyAppearance(host, initial, win);
    const watcher = watchAppearance(host, mockChrome, win, initial);

    mockChrome._listeners[0]({ accentColor: { newValue: "teal" } }, "local");

    expect(host.getAttribute("data-theme")).toBe("dark");
    const darkTealVars = accentVarsFor("teal", "dark");
    expect(host.style.getPropertyValue("--primary")).toBe(darkTealVars["--primary"]);

    watcher.stop();
  });

  it("matchMedia change triggers re-computation only when theme is 'auto'", () => {
    const mockChrome = makeChrome({ theme: "auto", accentColor: "orange" });
    const mockWinObj = createMockWindow(false);
    const initial: Appearance = { theme: "auto", accent: "orange" };

    applyAppearance(host, initial, mockWinObj.win);
    expect(host.getAttribute("data-theme")).toBe("light");

    const watcher = watchAppearance(host, mockChrome, mockWinObj.win, initial);

    // System dark mode toggles on
    mockWinObj.setPrefersDark(true);
    expect(host.getAttribute("data-theme")).toBe("dark");
    const darkOrangeVars = accentVarsFor("orange", "dark");
    expect(host.style.getPropertyValue("--primary")).toBe(darkOrangeVars["--primary"]);

    // If explicit theme is set to 'light', matchMedia changes must be ignored
    mockChrome._listeners[0]({ theme: { newValue: "light" } }, "local");
    expect(host.getAttribute("data-theme")).toBe("light");

    mockWinObj.setPrefersDark(true);
    expect(host.getAttribute("data-theme")).toBe("light");

    watcher.stop();
  });

  it("ignores onChanged events in sync area or for unrelated keys", () => {
    const mockChrome = makeChrome({ theme: "dark", accentColor: "orange" });
    const { win } = createMockWindow(false);
    const initial: Appearance = { theme: "dark", accent: "orange" };

    applyAppearance(host, initial, win);
    const watcher = watchAppearance(host, mockChrome, win, initial);

    // Sync area should be ignored
    mockChrome._listeners[0]({ theme: { newValue: "light" } }, "sync");
    expect(host.getAttribute("data-theme")).toBe("dark");

    // Unrelated keys should be ignored
    mockChrome._listeners[0]({ otherKey: { newValue: "val" } }, "local");
    expect(host.getAttribute("data-theme")).toBe("dark");

    watcher.stop();
  });

  it("stop() cleans up both storage and media listeners and is safe when removeListener is missing", () => {
    const mockChrome = makeChrome({ theme: "dark", accentColor: "orange" });
    const mockWinObj = createMockWindow(false);
    const initial: Appearance = { theme: "dark", accent: "orange" };

    const watcher = watchAppearance(host, mockChrome, mockWinObj.win, initial);
    expect(mockChrome._listeners.length).toBe(1);
    expect(mockWinObj.mediaListeners.length).toBe(1);

    watcher.stop();
    expect(mockChrome._listeners.length).toBe(0);
    expect(mockWinObj.mediaListeners.length).toBe(0);

    // Safe if called twice
    expect(() => watcher.stop()).not.toThrow();
  });
});
