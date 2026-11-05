import { normalizePreference, resolveTheme, type ThemePreference, type EffectiveTheme } from "../theme/theme";
import { accentVarsFor, ACCENT_VARS } from "../accent/palette";

export type Appearance = {
  theme: ThemePreference;
  accent: string | null;
};

export { type ThemePreference, type EffectiveTheme };

export function readAppearance(
  chromeApi: typeof chrome | undefined,
  timeoutMs: number = 300
): Promise<Appearance> {
  const fallback: Appearance = { theme: "auto", accent: null };
  const api = chromeApi || (typeof chrome !== "undefined" ? chrome : undefined);
  if (!api?.storage?.local?.get) {
    return Promise.resolve(fallback);
  }

  return new Promise<Appearance>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, timeoutMs);

    const onDone = (res: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (res && typeof res === "object") {
        const themeRaw = (res as { theme?: unknown }).theme;
        const theme = normalizePreference(themeRaw);

        const accentRaw = (res as { accentColor?: unknown }).accentColor;
        const accent =
          typeof accentRaw === "string" && accentRaw.trim() ? accentRaw.trim() : null;

        resolve({ theme, accent });
      } else {
        resolve(fallback);
      }
    };

    try {
      const ret = api.storage.local.get(
        ["theme", "accentColor"],
        onDone as (items: { [key: string]: unknown }) => void
      );
      if (ret && typeof (ret as Promise<unknown>).then === "function") {
        (ret as Promise<unknown>).then(onDone, () => onDone(fallback));
      }
    } catch (_) {
      onDone(fallback);
    }
  });
}

export function applyAppearance(
  host: HTMLElement,
  appearance: Appearance,
  win: Window = typeof window !== "undefined" ? window : ({} as Window)
): void {
  if (!host || !host.style) return;

  const effectiveTheme = resolveTheme(appearance.theme, win);
  host.setAttribute("data-theme", effectiveTheme);

  const vars = accentVarsFor(appearance.accent, effectiveTheme);
  for (const v of ACCENT_VARS) {
    const val = vars[v];
    if (val !== undefined && val !== null && val !== "") {
      host.style.setProperty(v, val);
    } else {
      host.style.removeProperty(v);
    }
  }
}

export function watchAppearance(
  host: HTMLElement,
  chromeApi: typeof chrome | undefined,
  win: Window = typeof window !== "undefined" ? window : ({} as Window),
  initial: Appearance
): { stop(): void } {
  const currentAppearance: Appearance = { ...initial };

  const api = chromeApi || (typeof chrome !== "undefined" ? chrome : undefined);
  const onChanged = api?.storage?.onChanged;
  let storageRegistered = false;

  const storageListener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area !== "local" || !changes) return;

    let changed = false;
    if ("theme" in changes) {
      currentAppearance.theme = normalizePreference(changes.theme?.newValue);
      changed = true;
    }
    if ("accentColor" in changes) {
      const raw = changes.accentColor?.newValue;
      currentAppearance.accent = typeof raw === "string" && raw.trim() ? raw.trim() : null;
      changed = true;
    }

    if (changed) {
      applyAppearance(host, currentAppearance, win);
    }
  };

  if (onChanged?.addListener) {
    onChanged.addListener(storageListener);
    storageRegistered = true;
  }

  const mql =
    typeof win?.matchMedia === "function" ? win.matchMedia("(prefers-color-scheme: dark)") : null;

  const mediaListener = () => {
    if (currentAppearance.theme === "auto") {
      applyAppearance(host, currentAppearance, win);
    }
  };

  if (mql) {
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", mediaListener);
    } else if (typeof (mql as any).addListener === "function") {
      (mql as any).addListener(mediaListener);
    }
  }

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;

      if (storageRegistered && onChanged?.removeListener) {
        try {
          onChanged.removeListener(storageListener);
        } catch (_) {}
      }

      if (mql) {
        try {
          if (typeof mql.removeEventListener === "function") {
            mql.removeEventListener("change", mediaListener);
          } else if (typeof (mql as any).removeListener === "function") {
            (mql as any).removeListener(mediaListener);
          }
        } catch (_) {}
      }
    },
  };
}
