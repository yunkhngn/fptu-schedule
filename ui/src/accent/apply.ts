import { applyAppearance } from "../appearance/appearance";

/**
 * Legacy/harness helper to apply accent variables to a host.
 * Delegates to the unified appearance controller.
 */
export function applyAccent(host: HTMLElement, id: string | null | undefined): void {
  const currentTheme = host?.getAttribute("data-theme") === "dark" ? "dark" : "light";
  applyAppearance(
    host,
    { theme: currentTheme, accent: id ?? null },
    typeof window !== "undefined" ? window : ({} as Window)
  );
}
