import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { boot } from "./boot";

const loginHtml = fs.readFileSync(path.resolve(__dirname, "../../tests/fixtures/pages/auth-login.html"), "utf8");

function chromeWith(stored: Record<string, unknown>) {
  return {
    storage: {
      local: {
        get: vi.fn(async (keys: string[]) => Object.fromEntries(keys.map((k) => [k, stored[k]]))),
        set: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
      },
      onChanged: { addListener() {}, removeListener() {} },
    },
  } as unknown as typeof chrome;
}

const loginWin = () =>
  ({ location: { pathname: "/Auth/Login" }, document: window.document, customElements: window.customElements }) as unknown as Window;

describe("boot on the login page", () => {
  beforeEach(() => {
    document.body.className = "authentication-bg";
    document.body.innerHTML = loginHtml;
    document.documentElement.setAttribute("data-fptu-ui", "pending");
  });
  afterEach(() => {
    document.documentElement.removeAttribute("data-fptu-ui");
    document.documentElement.removeAttribute("data-fptu-ui-reason");
    document.getElementById("fptu-ui-host")?.remove();
    document.getElementById("fptu-ui-return")?.remove();
    document.body.className = "";
    delete (window as any).__fptuUi;
    delete (window as any).__fptuUiGiveBack;
  });

  it("shows the new sign-in page and keeps FAP's own inputs in the normal page", async () => {
    const username = document.getElementById("Username")!;
    const password = document.getElementById("Password")!;
    const chromeApi = chromeWith({});
    await boot({ win: loginWin(), chromeApi });

    const host = document.getElementById("fptu-ui-host");
    expect(host).not.toBe(null);
    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe("active");
    await waitFor(() => expect(host!.shadowRoot!.querySelector('slot[name="fap-login"]')).not.toBe(null));
    // The inputs are FAP's own nodes, in the ordinary DOM (so the browser's password manager can fill them).
    expect(document.getElementById("Username")).toBe(username);
    expect(document.getElementById("Password")).toBe(password);
    expect(host!.contains(username)).toBe(true);
    expect(host!.shadowRoot!.contains(username)).toBe(false);
  });

  it("applies the student's theme and accent colour to the sign-in page", async () => {
    await boot({ win: loginWin(), chromeApi: chromeWith({ theme: "dark", accentColor: "orange" }) });
    const host = document.getElementById("fptu-ui-host")!;
    expect(host.getAttribute("data-theme")).toBe("dark");
    expect(host.style.getPropertyValue("--primary")).toMatch(/^oklch\(/);
  });

  it("gives the original page back, naming the reason, when the sign-in block is not recognised", async () => {
    document.body.innerHTML = "<p>Chuyển hướng...</p>";
    await boot({ win: loginWin(), chromeApi: chromeWith({}) });
    expect(document.getElementById("fptu-ui-host")).toBe(null);
    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
    expect(document.documentElement.getAttribute("data-fptu-ui-reason")).toBe("login-structure");
  });

  it("leaves the original page alone while the new interface is switched off", async () => {
    await boot({ win: loginWin(), chromeApi: chromeWith({ fapUiEnabled: false }) });
    expect(document.getElementById("fptu-ui-host")).toBe(null);
    expect(document.documentElement.getAttribute("data-fptu-ui-reason")).toBe("disabled");
    expect(document.getElementById("login-step-credentials")!.hasAttribute("slot")).toBe(false);
  });

  it("puts FAP's block back where it was when the interface is switched off again", async () => {
    const win = loginWin();
    await boot({ win, chromeApi: chromeWith({}) });
    const block = document.getElementById("login-step-credentials")!;
    expect(document.getElementById("fptu-ui-host")!.contains(block)).toBe(true);
    const parent = document.querySelector(".card-body");

    (win as any).__fptuUiGiveBack("disabled");

    await waitFor(() => expect(document.getElementById("fptu-ui-host")).toBe(null));
    expect(block.hasAttribute("slot")).toBe(false);
    expect(block.parentElement).toBe(parent);
    expect(document.body.contains(block)).toBe(true);
  });

  it("never logs or stores anything the student types", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    (document.getElementById("Password") as HTMLInputElement).value = "SECRET-PASSWORD";
    await boot({ win: loginWin(), chromeApi: chromeWith({}) });
    const printed = spies.flatMap((s) => s.mock.calls).map((c) => c.map(String).join(" ")).join("\n");
    expect(printed).not.toContain("SECRET-PASSWORD");
    expect(setItem).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
