import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "fapUiReadNews";

export function useReadNews(chromeApi?: typeof chrome) {
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const api = chromeApi || (typeof chrome !== "undefined" ? chrome : undefined);

  useEffect(() => {
    let active = true;
    if (api?.storage?.local?.get) {
      try {
        api.storage.local.get([STORAGE_KEY], (res) => {
          if (!active) return;
          if (res && Array.isArray(res[STORAGE_KEY])) {
            setReadIds(res[STORAGE_KEY]);
          }
        });
      } catch (_) {}
    }
    return () => {
      active = false;
    };
  }, [api]);

  const saveIds = useCallback(
    (newIds: string[]) => {
      setReadIds(newIds);
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
        } catch (_) {}
      }
      if (api?.storage?.local?.set) {
        try {
          api.storage.local.set({ [STORAGE_KEY]: newIds });
        } catch (_) {}
      }
    },
    [api]
  );

  const isRead = useCallback(
    (id: string) => readIds.includes(id),
    [readIds]
  );

  const markRead = useCallback(
    (id: string) => {
      if (!readIds.includes(id)) {
        saveIds([...readIds, id]);
      }
    },
    [readIds, saveIds]
  );

  const markAllRead = useCallback(
    (ids: string[]) => {
      const merged = Array.from(new Set([...readIds, ...ids]));
      saveIds(merged);
    },
    [readIds, saveIds]
  );

  const unreadCount = useCallback(
    (ids: string[]) => ids.filter((id) => !readIds.includes(id)).length,
    [readIds]
  );

  return {
    readIds,
    isRead,
    markRead,
    markAllRead,
    unreadCount,
  };
}

