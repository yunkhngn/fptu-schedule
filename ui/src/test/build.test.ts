// @vitest-environment node
import { describe, it, expect } from "vitest";
import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("ui build pipeline", () => {
  it("builds unminified IIFE fap-ui.js with marker", async () => {
    const tempOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "fap-ui-build-test-"));
    try {
      await build({
        configFile: path.resolve(__dirname, "../../vite.config.ts"),
        build: {
          outDir: tempOutDir,
          emptyOutDir: true,
        },
      });

      const outFile = path.join(tempOutDir, "fap-ui.js");
      expect(fs.existsSync(outFile)).toBe(true);

      const content = fs.readFileSync(outFile, "utf-8");
      expect(content).toContain("__fptuUi");

      const lineBreaks = (content.match(/\n/g) || []).length;
      expect(lineBreaks).toBeGreaterThanOrEqual(50);
    } finally {
      fs.rmSync(tempOutDir, { recursive: true, force: true });
    }
  });
});

