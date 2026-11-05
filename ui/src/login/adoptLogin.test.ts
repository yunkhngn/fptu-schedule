import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { adoptLoginCard } from "./adoptLogin";

const loginHtml = fs.readFileSync(path.resolve(__dirname, "../../../tests/fixtures/pages/auth-login.html"), "utf8");

describe("adoptLoginCard", () => {
  let host: HTMLElement;
  beforeEach(() => {
    document.body.className = "authentication-bg";
    document.body.innerHTML = loginHtml;
    host = document.createElement("div");
    host.id = "fptu-ui-host";
    document.body.appendChild(host);
  });

  it("moves FAP's whole sign-in block into the new frame, as the very same nodes", () => {
    const block = document.getElementById("login-step-credentials")!;
    const username = document.getElementById("Username")!;
    const password = document.getElementById("Password")!;
    const form = document.getElementById("frm-parent-login")!;
    const google = document.getElementById("login-google-link")!;

    const adopted = adoptLoginCard(document, host)!;

    expect(adopted).not.toBeNull();
    expect(block.parentElement).toBe(host);
    expect(block.getAttribute("slot")).toBe("fap-login");
    // untouched inside: same nodes, same form membership, so autofill, validation and reCAPTCHA keep working
    expect(document.getElementById("Username")).toBe(username);
    expect(document.getElementById("Password")).toBe(password);
    expect(form.contains(username) && form.contains(password)).toBe(true);
    expect(document.getElementById("login-google-link")).toBe(google);
  });

  it("never reads or writes an input's value", () => {
    let touched = 0;
    for (const id of ["Username", "Password"]) {
      Object.defineProperty(document.getElementById(id)!, "value", {
        get() { touched++; return ""; },
        set() { touched++; },
      });
    }
    adoptLoginCard(document, host)!.restore();
    expect(touched).toBe(0);
  });

  it("restore puts the block back in its original place, and can be called twice", () => {
    const block = document.getElementById("login-step-credentials")!;
    const parent = block.parentElement!;
    const next = block.nextElementSibling;

    const adopted = adoptLoginCard(document, host)!;
    adopted.restore();
    adopted.restore();

    expect(block.parentElement).toBe(parent);
    expect(block.nextElementSibling).toBe(next);
    expect(block.hasAttribute("slot")).toBe(false);
  });

  it("returns null when the block is missing", () => {
    document.body.innerHTML = "<p>no login here</p>";
    expect(adoptLoginCard(document, host)).toBeNull();
  });
});
