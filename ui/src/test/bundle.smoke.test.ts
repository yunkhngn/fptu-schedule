// @vitest-environment node
//
// Runs the BUILT bundle (dist/fap-ui.js, the file the browser loads), not the source. Several bugs only
// existed in the bundle (the stylesheet that was never passed in, the accent presets that vanished because
// a UMD file from lib/ is not a CommonJS module once bundled), and the unit tests could not see them.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { build } from "vite";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const req = createRequire(import.meta.url);
const { JSDOM } = req("jsdom");
const root = path.resolve(__dirname, "../../..");

let bundleCode = "";
let tmp = "";

beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fap-ui-smoke-"));
  // Vitest sets NODE_ENV to "test", which would make the React plugin emit its development JSX runtime.
  // Build exactly as `npm run build` does.
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    await build({
      configFile: path.resolve(__dirname, "../../vite.config.ts"),
      mode: "production",
      logLevel: "silent",
      build: { outDir: tmp, emptyOutDir: true },
    });
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
  bundleCode = fs.readFileSync(path.join(tmp, "fap-ui.js"), "utf8");
}, 60000);

afterAll(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

function pageHtml(): string {
  const shell = fs.readFileSync(path.join(root, "tests/fixtures/fap-home.html"), "utf8");
  const home = fs.readFileSync(path.join(root, "tests/fixtures/pages/home.html"), "utf8");
  // The dashboard content FAP loads late, added where the readers look for it.
  return shell.replace("</body>", `<div hidden>${home}</div></body>`);
}

async function runBundle(stored: Record<string, unknown>) {
  const dom = new JSDOM(pageHtml(), { url: "https://fap.fpt.edu.vn/", runScripts: "outside-only", pretendToBeVisual: true });
  const win = dom.window as unknown as Window & Record<string, any>;
  win.chrome = {
    runtime: { getURL: (p: string) => p },
    storage: {
      onChanged: { addListener() {}, removeListener() {} },
      local: {
        get: (_keys: unknown, cb?: (r: unknown) => void) => {
          if (cb) cb(stored);
          return Promise.resolve(stored);
        },
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
      },
    },
  };
  // What the extension loads before the bundle: the FAP readers.
  win.eval(fs.readFileSync(path.join(root, "lib/fap-page-data.js"), "utf8"));
  win.eval(bundleCode);

  const started = Date.now();
  while (Date.now() - started < 8000) {
    const host = win.document.getElementById("fptu-ui-host");
    if (host && host.shadowRoot && host.shadowRoot.childNodes.length > 0) return { win, host };
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(
    "the interface did not mount: " + (win.document.documentElement.getAttribute("data-fptu-ui-reason") || "no reason recorded")
  );
}

describe("the built bundle in a page", () => {
  it("mounts and carries the stylesheet", async () => {
    const { host } = await runBundle({});
    const css = Array.from(host.shadowRoot!.querySelectorAll("style")).map((s) => s.textContent).join("");
    expect(css).toContain("--color-primary");
  }, 30000);

  it("applies the accent colour the student chose, not the default lavender", async () => {
    const { host } = await runBundle({ theme: "light", accentColor: "orange" });
    const primary = host.style.getPropertyValue("--primary");
    expect(primary).toMatch(/^oklch\(/);
    // Orange sits near hue 40-60 in OKLCH; the default lavender is 283.
    const hue = Number(primary.replace(/^oklch\(\s*[\d.]+\s+[\d.]+\s+/, "").replace(/[^\d.].*$/, ""));
    expect(hue).toBeGreaterThan(20);
    expect(hue).toBeLessThan(90);
    expect(host.style.getPropertyValue("--primary-strong")).toMatch(/^oklch\(/);
    expect(host.style.getPropertyValue("--gradient-lavender")).toContain("linear-gradient");
  }, 30000);

  it("leaves the default lavender untouched when no accent was chosen", async () => {
    const { host } = await runBundle({ theme: "light" });
    expect(host.style.getPropertyValue("--primary")).toBe("");
    expect(host.getAttribute("data-theme")).toBe("light");
  }, 30000);

  it("follows the chosen theme", async () => {
    const { host } = await runBundle({ theme: "dark" });
    expect(host.getAttribute("data-theme")).toBe("dark");
  }, 30000);
});
