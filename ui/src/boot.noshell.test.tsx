import { describe, it, expect, afterEach } from "vitest";
import { boot } from "./boot";

// A FAP page without the site's own top bar and sidebar is not a page the new interface can wrap: the student
// is not signed in, or it is an error page. Waiting for data there only keeps the splash on screen.
describe("boot on a page that has no FAP shell (signed out, error pages)", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-fptu-ui");
    document.documentElement.removeAttribute("data-fptu-ui-reason");
    document.getElementById("fptu-ui-host")?.remove();
    document.body.innerHTML = "";
  });

  for (const pathname of ["/", "/Subject", "/WeeklyTimetable"]) {
    it(`gives ${pathname} back at once instead of waiting for data that will never come`, async () => {
      document.body.innerHTML = `<div class="content-page"><p>Please sign in</p></div>`;
      document.documentElement.setAttribute("data-fptu-ui", "pending");
      const mockWin = { location: { pathname }, document: window.document } as unknown as Window;

      const started = Date.now();
      await boot({ win: mockWin, timeoutMs: 5000 });

      expect(Date.now() - started).toBeLessThan(1000);
      expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
      expect(document.documentElement.getAttribute("data-fptu-ui-reason")).toBe("no-shell");
      expect(document.getElementById("fptu-ui-host")).toBe(null);
    });
  }
});
