import * as fapRoutesModule from "@lib/fap-routes.js";

export type RouteKind = "native" | "form" | "auth" | "wrapped";

export interface MatchedRoute {
  id: string;
  kind: RouteKind;
  nav: string | null;
}

export type PageId = "overview" | "timetable" | "exams" | "news";

interface FapRoutesShape {
  matchRoute?: (pathname: string) => MatchedRoute | null;
  ROUTES?: Array<{ id: string; patterns: string[]; kind: RouteKind; nav: string | null }>;
}

const mod = fapRoutesModule as unknown as FapRoutesShape & {
  default?: FapRoutesShape;
};

export const matchRoute: (pathname: string) => MatchedRoute | null =
  mod.matchRoute ??
  mod.default?.matchRoute ??
  ((pathname: string) => {
    if (typeof (globalThis as any).FapRoutes?.matchRoute === "function") {
      return (globalThis as any).FapRoutes.matchRoute(pathname);
    }
    return null;
  });

export const ROUTES = mod.ROUTES ?? mod.default?.ROUTES ?? [];

/**
 * Backward compatibility helper for matchPage.
 * Returns the page id for known native pages or null.
 */
export function matchPage(pathname: string): PageId | null {
  if (typeof pathname !== "string") return null;
  const res = matchRoute(pathname);
  if (!res) return null;
  if (res.kind === "auth" || res.kind === "wrapped") return null;
  if (["overview", "timetable", "exams", "news"].includes(res.id)) {
    return res.id as PageId;
  }
  return null;
}
