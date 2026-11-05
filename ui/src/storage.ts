export async function readOriginalPreference(
  page: string,
  chromeApi?: typeof chrome
): Promise<boolean> {
  const api = chromeApi || (typeof chrome !== "undefined" ? chrome : undefined);
  const key = `fapUiOriginal:${page}`;
  if (api?.storage?.local?.get) {
    try {
      const res = await api.storage.local.get([key]);
      return Boolean(res[key]);
    } catch (_) {
      return false;
    }
  }
  return false;
}

export async function saveOriginalPreference(
  page: string,
  value: boolean,
  chromeApi?: typeof chrome
): Promise<void> {
  const api = chromeApi || (typeof chrome !== "undefined" ? chrome : undefined);
  const key = `fapUiOriginal:${page}`;
  if (api?.storage?.local?.set) {
    try {
      await api.storage.local.set({ [key]: value });
    } catch (_) {}
  }
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
