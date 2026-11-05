import * as themeModule from "@lib/theme.js";

export type ThemePreference = "auto" | "light" | "dark";
export type EffectiveTheme = "light" | "dark";

interface ThemeModuleShape {
  THEME_VALUES?: {
    AUTO: string;
    LIGHT: string;
    DARK: string;
  };
  resolveEffectiveTheme?: (savedTheme: string, systemPrefersDark: boolean) => string;
  getNextTheme?: (currentTheme: string) => string;
  getThemeLabel?: (theme: string) => string;
}

const mod = themeModule as unknown as ThemeModuleShape & {
  default?: ThemeModuleShape;
};

const THEME_VALUES = mod.THEME_VALUES ?? mod.default?.THEME_VALUES ?? {
  AUTO: "auto",
  LIGHT: "light",
  DARK: "dark",
};

const resolveEffectiveTheme =
  mod.resolveEffectiveTheme ??
  mod.default?.resolveEffectiveTheme ??
  ((savedTheme: string, systemPrefersDark: boolean): string => {
    if (savedTheme === THEME_VALUES.LIGHT) return THEME_VALUES.LIGHT;
    if (savedTheme === THEME_VALUES.DARK) return THEME_VALUES.DARK;
    return systemPrefersDark ? THEME_VALUES.DARK : THEME_VALUES.LIGHT;
  });

export function normalizePreference(value: unknown): ThemePreference {
  if (value === THEME_VALUES.LIGHT) return "light";
  if (value === THEME_VALUES.DARK) return "dark";
  if (value === THEME_VALUES.AUTO) return "auto";
  return "auto";
}

export function resolveTheme(
  pref: ThemePreference,
  win: Window = typeof window !== "undefined" ? window : ({} as Window)
): EffectiveTheme {
  const normalized = normalizePreference(pref);
  const systemPrefersDark =
    typeof win?.matchMedia === "function"
      ? Boolean(win.matchMedia("(prefers-color-scheme: dark)")?.matches)
      : false;
  const effective = resolveEffectiveTheme(normalized, systemPrefersDark);
  return effective === THEME_VALUES.DARK ? "dark" : "light";
}

export function getNextTheme(current: ThemePreference): ThemePreference {
  const fn = mod.getNextTheme ?? mod.default?.getNextTheme;
  if (fn) return normalizePreference(fn(current));
  if (current === "auto") return "light";
  if (current === "light") return "dark";
  return "auto";
}

export function getThemeLabel(theme: ThemePreference): string {
  const fn = mod.getThemeLabel ?? mod.default?.getThemeLabel;
  if (fn) return fn(theme);
  if (theme === "light") return "Giao diện: Sáng";
  if (theme === "dark") return "Giao diện: Tối";
  return "Giao diện: Tự động (theo hệ thống)";
}
