/** Earlier builds remembered "show the original page" per page; the single master switch replaced that. */
export async function clearLegacyOriginalPreferences(chromeApi?: typeof chrome): Promise<void> {
  const api = chromeApi || (typeof chrome !== "undefined" ? chrome : undefined);
  if (!api?.storage?.local?.remove) return;
  try {
    await api.storage.local.remove(["overview", "timetable", "exams", "news"].map((page) => `fapUiOriginal:${page}`));
  } catch (_) {}
}

export async function isFapUiEnabled(chromeApi?: typeof chrome): Promise<boolean> {
  const api = chromeApi || (typeof chrome !== "undefined" ? chrome : undefined);
  if (api?.storage?.local?.get) {
    try {
      const res = await api.storage.local.get(["fapUiEnabled"]);
      if (res.fapUiEnabled !== undefined) {
        return Boolean(res.fapUiEnabled);
      }
    } catch (_) {}
  }
  return true;
}

export async function setFapUiEnabled(
  value: boolean,
  chromeApi?: typeof chrome
): Promise<void> {
  const api = chromeApi || (typeof chrome !== "undefined" ? chrome : undefined);
  if (api?.storage?.local?.set) {
    try {
      await api.storage.local.set({ fapUiEnabled: value });
    } catch (_) {}
  }
}

