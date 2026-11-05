import { describe, it, expect } from "vitest";
import { ROUTES, matchRoute } from "@/routes";
import { registry } from "./registry";
import { NAV_GROUPS, FAP_URLS, navHref, isParent, type NavLeaf } from "@/data/nav";

const leaves: NavLeaf[] = NAV_GROUPS.flatMap((g) => g.items.flatMap((i) => (isParent(i) ? i.children : [i])));

describe("every FAP page has a handler", () => {
  it("each native or form route has a page definition", () => {
    ROUTES.filter((r) => r.kind === "native" || r.kind === "form").forEach((r) => {
      expect(registry[r.id], `route ${r.id} has no entry in the page registry`).toBeDefined();
    });
  });

  it("each page definition belongs to a route that is native or form", () => {
    Object.keys(registry).forEach((id) => {
      const route = ROUTES.find((r) => r.id === id);
      expect(route, `registry entry ${id} has no route`).toBeDefined();
      expect(["native", "form"]).toContain(route!.kind);
    });
  });

  it("wrapped and auth routes have no page definition", () => {
    ROUTES.filter((r) => r.kind === "wrapped" || r.kind === "auth").forEach((r) => {
      expect(registry[r.id], r.id).toBeUndefined();
    });
  });
});

describe("sidebar entries", () => {
  it("every entry maps to a FAP page that has its own route", () => {
    leaves.forEach((leaf) => {
      expect(FAP_URLS[leaf.to], `${leaf.title} (${leaf.to}) has no FAP address`).toBeDefined();
      const match = matchRoute(navHref(leaf.to));
      expect(match, leaf.title).not.toBeNull();
      expect(match!.id, `${leaf.title} falls through to the generic fallback`).not.toBe("wrapped");
    });
  });

  it("each route's nav key is a sidebar address, so the right entry is highlighted", () => {
    // "/" is the Overview link above the groups, not one of the group entries.
    const known = new Set(["/", ...leaves.map((l) => l.to)]);
    ROUTES.filter((r) => r.nav).forEach((r) => {
      expect(known.has(r.nav!), `${r.id} highlights ${r.nav}, which is not in the sidebar`).toBe(true);
    });
  });

  it("the cart and pending-payment pages (QR code, pay button) are never rebuilt", () => {
    expect(matchRoute("/ShoppingCart")!.kind).toBe("wrapped");
    expect(matchRoute("/CoursePendingPayment")!.kind).toBe("wrapped");
  });
});
