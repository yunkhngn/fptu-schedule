import { describe, it, expect, afterEach, vi } from "vitest";
import { boot } from "./boot";

// Reloading the extension while a FAP tab is open leaves an orphaned script whose every chrome.* call throws
// "Extension context invalidated". That is not a bug to report: hand the page back and stay quiet.
describe("boot after the extension was reloaded under an open tab", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-fptu-ui");
    document.documentElement.removeAttribute("data-fptu-ui-reason");
    document.getElementById("fptu-ui-host")?.remove();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("gives the page back without logging an error or a warning", async () => {
    document.body.innerHTML = `<div class="content-page"><p>Original</p></div>`;
    document.documentElement.setAttribute("data-fptu-ui", "pending");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const chromeApi = {
      storage: {
        local: {
          get: () => {
            throw new Error("Extension context invalidated.");
          },
        },
      },
    } as unknown as typeof chrome;
    const win = { location: { pathname: "/Subject" }, document: window.document } as unknown as Window;

    await boot({ win, chromeApi });

    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
    expect(document.documentElement.getAttribute("data-fptu-ui-reason")).toBe("extension-reloaded");
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("still reports other boot failures", async () => {
    document.body.innerHTML = `<div class="content-page"></div>`;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const chromeApi = {
      storage: { local: { get: () => { throw new Error("boom"); } } },
    } as unknown as typeof chrome;
    const win = { location: { pathname: "/Subject" }, document: window.document } as unknown as Window;

    await boot({ win, chromeApi });

    expect(error).toHaveBeenCalled();
    expect(document.documentElement.getAttribute("data-fptu-ui-reason")).toMatch(/^error: boom/);
  });
});
