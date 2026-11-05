import { vi } from "vitest";

export function makeChrome(store: Record<string, unknown> = {}) {
  const listeners: Array<(changes: Record<string, { newValue?: unknown; oldValue?: unknown }>, area: string) => void> = [];
  return {
    storage: {
      local: {
        get: vi.fn((keys: unknown, callback?: (items: Record<string, unknown>) => void) => {
          let result: Record<string, unknown> = {};
          if (Array.isArray(keys)) {
            result = Object.fromEntries(keys.map((k) => [k, store[k]]));
          } else if (keys && typeof keys === "object") {
            result = Object.fromEntries(Object.keys(keys).map((k) => [k, store[k] ?? (keys as any)[k]]));
          } else if (typeof keys === "string") {
            result = { [keys]: store[keys] };
          } else {
            result = { ...store };
          }

          if (typeof callback === "function") {
            callback(result);
          }
          return Promise.resolve(result);
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          const changes = Object.fromEntries(
            Object.entries(items).map(([k, v]) => [k, { oldValue: store[k], newValue: v }])
          );
          Object.assign(store, items);
          listeners.forEach((l) => l(changes, "local"));
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          const arr = Array.isArray(keys) ? keys : [keys];
          const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};
          arr.forEach((k) => {
            changes[k] = { oldValue: store[k], newValue: undefined };
            delete store[k];
          });
          listeners.forEach((l) => l(changes, "local"));
        }),
      },
      onChanged: {
        addListener: vi.fn((l: (typeof listeners)[number]) => listeners.push(l)),
        removeListener: vi.fn((l: (typeof listeners)[number]) => {
          const idx = listeners.indexOf(l);
          if (idx >= 0) listeners.splice(idx, 1);
        }),
      },
    },
    _listeners: listeners,
    _store: store,
  } as unknown as typeof chrome & {
    _listeners: typeof listeners;
    _store: Record<string, unknown>;
  };
}
