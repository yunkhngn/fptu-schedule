import { describe, it, expect, afterEach } from "vitest";
import { boot } from "./boot";

describe("boot on the login page before it has its own interface", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-fptu-ui");
    document.documentElement.removeAttribute("data-fptu-ui-reason");
    document.getElementById("fptu-ui-host")?.remove();
  });

  it("gives the original login page back at once instead of leaving it hidden until the safety timer", async () => {
    // The early script has already hidden the page and is showing its splash.
    document.documentElement.setAttribute("data-fptu-ui", "pending");
    const mockWin = {
      location: { pathname: "/Auth/Login" },
      document: window.document,
    } as unknown as Window;

    await boot({ win: mockWin });

    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
    expect(document.documentElement.getAttribute("data-fptu-ui-reason")).toBe("login-not-built");
    expect(document.getElementById("fptu-ui-host")).toBe(null);
  });
});
