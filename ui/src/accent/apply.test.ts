import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readAccent, applyAccent, watchAccent } from "./apply";
import { ACCENT_VARS, accentVarsFor } from "./palette";

describe("readAccent", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with 'orange' when storage has { accentColor: 'orange' }", async () => {
    const mockChrome = {
      storage: {
        local: {
          get: vi.fn(async () => ({ accentColor: "orange" })),
        },
      },
    } as unknown as typeof chrome;

    const result = await readAccent(mockChrome);
    expect(result).toBe("orange");
  });

  it("resolves with 'orange' when storage.local.get uses callback style", async () => {
    const mockChrome = {
      storage: {
        local: {
          get: vi.fn((_keys: string[], callback: (items: Record<string, unknown>) => void) => {
            callback({ accentColor: "orange" });
          }),
        },
      },
    } as unknown as typeof chrome;

    const result = await readAccent(mockChrome);
    expect(result).toBe("orange");
  });

  it("resolves with null when storage has no accentColor key", async () => {
    const mockChrome = {
      storage: {
        local: {
          get: vi.fn(async () => ({})),
        },
      },
    } as unknown as typeof chrome;

    const result = await readAccent(mockChrome);
    expect(result).toBe(null);
  });

  it("resolves with null when chromeApi is undefined", async () => {
    const result = await readAccent(undefined);
    expect(result).toBe(null);
  });

  it("resolves with null when get never calls callback (timeout fires after 300ms)", async () => {
    vi.useFakeTimers();
    const mockChrome = {
      storage: {
        local: {
          get: vi.fn(() => {
            // Never calls callback and returns undefined
          }),
        },
      },
    } as unknown as typeof chrome;

    const promise = readAccent(mockChrome, 300);
    await vi.advanceTimersByTimeAsync(350);
    const result = await promise;
    expect(result).toBe(null);
  });
});

describe("applyAccent", () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement("div");
  });

  it("sets --primary and all accent variables on host.style for 'orange'", () => {
    applyAccent(host, "orange");
    const vars = accentVarsFor("orange");
    expect(host.style.getPropertyValue("--primary")).toBe(vars["--primary"]);
    expect(host.style.getPropertyValue("--primary")).not.toBe("");
    for (const v of ACCENT_VARS) {
      expect(host.style.getPropertyValue(v)).toBe(vars[v]);
    }
  });

  it("subsequent applyAccent(host, null) removes all 12 ACCENT_VARS", () => {
    applyAccent(host, "orange");
    expect(host.style.getPropertyValue("--primary")).not.toBe("");

    applyAccent(host, null);
    for (const v of ACCENT_VARS) {
      expect(host.style.getPropertyValue(v)).toBe("");
    }
  });

  it("applyAccent(host, 'lavender') removes all accent variables (default palette)", () => {
    applyAccent(host, "orange");
    applyAccent(host, "lavender");
    for (const v of ACCENT_VARS) {
      expect(host.style.getPropertyValue(v)).toBe("");
    }
  });
});

describe("watchAccent", () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement("div");
  });

  it("updates host styles when onChanged fires with accentColor in local storage", () => {
    let storedListener: ((changes: Record<string, { newValue?: unknown }>, area: string) => void) | null = null;
    const mockChrome = {
      storage: {
        onChanged: {
          addListener: vi.fn((l) => {
            storedListener = l;
          }),
          removeListener: vi.fn(),
        },
      },
    } as unknown as typeof chrome;

    const watcher = watchAccent(host, mockChrome);
    expect(storedListener).not.toBeNull();

    storedListener!({ accentColor: { newValue: "teal" } }, "local");
    const tealVars = accentVarsFor("teal");
    expect(host.style.getPropertyValue("--primary")).toBe(tealVars["--primary"]);

    watcher.stop();
  });

  it("ignores onChanged events in sync area or for unrelated keys", () => {
    let storedListener: ((changes: Record<string, { newValue?: unknown }>, area: string) => void) | null = null;
    const mockChrome = {
      storage: {
        onChanged: {
          addListener: vi.fn((l) => {
            storedListener = l;
          }),
          removeListener: vi.fn(),
        },
      },
    } as unknown as typeof chrome;

    watchAccent(host, mockChrome);

    // Sync area event should be ignored
    storedListener!({ accentColor: { newValue: "teal" } }, "sync");
    expect(host.style.getPropertyValue("--primary")).toBe("");

    // Other keys should be ignored
    storedListener!({ someOtherKey: { newValue: "teal" } }, "local");
    expect(host.style.getPropertyValue("--primary")).toBe("");
  });

  it("stop() unbinds listener so subsequent onChanged events do nothing", () => {
    const listeners: Array<(changes: Record<string, { newValue?: unknown }>, area: string) => void> = [];
    const mockChrome = {
      storage: {
        onChanged: {
          addListener: vi.fn((l) => listeners.push(l)),
          removeListener: vi.fn((l) => {
            const idx = listeners.indexOf(l);
            if (idx >= 0) listeners.splice(idx, 1);
          }),
        },
      },
    } as unknown as typeof chrome;

    const watcher = watchAccent(host, mockChrome);
    expect(listeners.length).toBe(1);

    watcher.stop();
    expect(listeners.length).toBe(0);
    expect(mockChrome.storage.onChanged.removeListener).toHaveBeenCalled();
  });

  it("stop() is safe when removeListener is undefined on onChanged", () => {
    const mockChrome = {
      storage: {
        onChanged: {
          addListener: vi.fn(),
        },
      },
    } as unknown as typeof chrome;

    const watcher = watchAccent(host, mockChrome);
    expect(() => watcher.stop()).not.toThrow();
  });
});
