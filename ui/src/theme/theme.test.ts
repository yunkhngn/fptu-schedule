import { describe, it, expect } from "vitest";
import {
  normalizePreference,
  resolveTheme,
  getNextTheme,
  getThemeLabel,
  type ThemePreference,
  type EffectiveTheme,
} from "./theme";

describe("theme preference normalization", () => {
  it("preserves valid theme preferences", () => {
    expect(normalizePreference("dark")).toBe("dark");
    expect(normalizePreference("light")).toBe("light");
    expect(normalizePreference("auto")).toBe("auto");
  });

  it("normalizes invalid or missing values to 'auto'", () => {
    expect(normalizePreference(undefined)).toBe("auto");
    expect(normalizePreference("nope")).toBe("auto");
    expect(normalizePreference(42)).toBe("auto");
    expect(normalizePreference(null)).toBe("auto");
    expect(normalizePreference("")).toBe("auto");
    expect(normalizePreference({})).toBe("auto");
    expect(normalizePreference(false)).toBe("auto");
  });
});

describe("resolveTheme", () => {
  function createMockWindow(prefersDark: boolean | null): Window {
    if (prefersDark === null) {
      return {} as unknown as Window;
    }
    return {
      matchMedia: (query: string) => ({
        matches: query === "(prefers-color-scheme: dark)" ? prefersDark : false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    } as unknown as Window;
  }

  it("resolves 'auto' to 'dark' when system prefers dark", () => {
    const winDark = createMockWindow(true);
    expect(resolveTheme("auto", winDark)).toBe("dark");
  });

  it("resolves 'auto' to 'light' when system does not prefer dark", () => {
    const winLight = createMockWindow(false);
    expect(resolveTheme("auto", winLight)).toBe("light");
  });

  it("always resolves 'light' to 'light' regardless of system preference", () => {
    const winDark = createMockWindow(true);
    expect(resolveTheme("light", winDark)).toBe("light");

    const winLight = createMockWindow(false);
    expect(resolveTheme("light", winLight)).toBe("light");
  });

  it("always resolves 'dark' to 'dark' regardless of system preference", () => {
    const winLight = createMockWindow(false);
    expect(resolveTheme("dark", winLight)).toBe("dark");

    const winDark = createMockWindow(true);
    expect(resolveTheme("dark", winDark)).toBe("dark");
  });

  it("resolves 'auto' to 'light' when window has no matchMedia", () => {
    const winNoMatchMedia = createMockWindow(null);
    expect(resolveTheme("auto", winNoMatchMedia)).toBe("light");
  });

  it("normalizes unknown preference string before resolution", () => {
    const winDark = createMockWindow(true);
    // @ts-expect-error test runtime fallback for malformed preference
    expect(resolveTheme("unexpected", winDark)).toBe("dark");
  });
});

describe("getNextTheme and getThemeLabel helpers", () => {
  it("cycles through auto -> light -> dark -> auto", () => {
    expect(getNextTheme("auto")).toBe("light");
    expect(getNextTheme("light")).toBe("dark");
    expect(getNextTheme("dark")).toBe("auto");
  });

  it("returns descriptive Vietnamese label for each preference", () => {
    expect(getThemeLabel("auto")).toBe("Giao diện: Tự động (theo hệ thống)");
    expect(getThemeLabel("light")).toBe("Giao diện: Sáng");
    expect(getThemeLabel("dark")).toBe("Giao diện: Tối");
  });
});
