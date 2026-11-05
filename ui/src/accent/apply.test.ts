import { describe, it, expect, beforeEach } from "vitest";
import { applyAccent } from "./apply";
import { ACCENT_VARS, accentVarsFor } from "./palette";

describe("applyAccent (legacy adapter)", () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement("div");
  });

  it("sets --primary and all accent variables on host.style for 'orange'", () => {
    applyAccent(host, "orange");
    const vars = accentVarsFor("orange", "light");
    expect(host.style.getPropertyValue("--primary")).toBe(vars["--primary"]);
    expect(host.style.getPropertyValue("--primary")).not.toBe("");
    for (const v of ACCENT_VARS) {
      expect(host.style.getPropertyValue(v)).toBe(vars[v]);
    }
  });

  it("subsequent applyAccent(host, null) removes all 12 ACCENT_VARS", () => {
    applyAccent(host, "orange");
    expect(host.style.getPropertyValue("--primary")).not.toBe("");

    applyAccent(host, null);
    for (const v of ACCENT_VARS) {
      expect(host.style.getPropertyValue(v)).toBe("");
    }
  });

  it("applyAccent(host, 'lavender') removes all accent variables (default palette)", () => {
    applyAccent(host, "orange");
    applyAccent(host, "lavender");
    for (const v of ACCENT_VARS) {
      expect(host.style.getPropertyValue(v)).toBe("");
    }
  });

  it("respects host data-theme='dark' when setting accent variables", () => {
    host.setAttribute("data-theme", "dark");
    applyAccent(host, "orange");
    const darkVars = accentVarsFor("orange", "dark");
    expect(host.getAttribute("data-theme")).toBe("dark");
    expect(host.style.getPropertyValue("--primary")).toBe(darkVars["--primary"]);
  });
});
