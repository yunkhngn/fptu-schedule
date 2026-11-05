import { accentVarsFor, ACCENT_VARS } from "./palette";

export function readAccent(
  chromeApi: typeof chrome | undefined,
  timeoutMs: number = 300
): Promise<string | null> {
  const api = chromeApi || (typeof chrome !== "undefined" ? chrome : undefined);
  if (!api?.storage?.local?.get) {
    return Promise.resolve(null);
  }

  return new Promise<string | null>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    const onDone = (res: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (
        res &&
        typeof res === "object" &&
        "accentColor" in res &&
        typeof (res as { accentColor?: unknown }).accentColor === "string"
      ) {
        const val = (res as { accentColor: string }).accentColor.trim();
        resolve(val || null);
      } else {
        resolve(null);
      }
    };

    try {
      const ret = api.storage.local.get(["accentColor"], onDone as (items: { [key: string]: unknown }) => void);
      if (ret && typeof (ret as Promise<unknown>).then === "function") {
        (ret as Promise<unknown>).then(onDone, () => onDone(null));
      }
    } catch (_) {
      onDone(null);
    }
  });
}

export function applyAccent(host: HTMLElement, id: string | null | undefined): void {
  if (!host || !host.style) return;
  const vars = accentVarsFor(id);
  for (const v of ACCENT_VARS) {
    const val = vars[v];
    if (val !== undefined && val !== null && val !== "") {
      host.style.setProperty(v, val);
    } else {
      host.style.removeProperty(v);
    }
  }
}

export function watchAccent(
  host: HTMLElement,
  chromeApi: typeof chrome | undefined
): { stop(): void } {
  const api = chromeApi || (typeof chrome !== "undefined" ? chrome : undefined);
  const onChanged = api?.storage?.onChanged;
  if (!onChanged?.addListener) {
    return { stop: () => {} };
  }

  const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area === "local" && changes && "accentColor" in changes) {
      const newVal = changes.accentColor?.newValue;
      applyAccent(host, typeof newVal === "string" ? newVal : null);
    }
  };

  onChanged.addListener(listener);

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      try {
        if (typeof onChanged.removeListener === "function") {
          onChanged.removeListener(listener);
        }
      } catch (_) {}
    },
  };
}
