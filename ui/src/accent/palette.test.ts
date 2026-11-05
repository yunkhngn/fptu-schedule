import { describe, it, expect } from "vitest";
import {
  ACCENT_VARS,
  hexToOklch,
  accentVarsFor,
  oklchToRgb,
  relativeLuminance,
  contrastRatio,
  type OklchColor,
} from "./palette";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as accentModule from "@lib/accent.js";

const mod = accentModule as unknown as {
  default?: { ACCENT_PRESETS?: Array<{ id: string; light: string; dark: string; label: string }> };
  ACCENT_PRESETS?: Array<{ id: string; light: string; dark: string; label: string }>;
};
const ACCENT_PRESETS = mod.ACCENT_PRESETS ?? mod.default?.ACCENT_PRESETS ?? [];

function parseOklchString(str: string): OklchColor & { alpha?: number } {
  const match = str.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/
  );
  if (!match) throw new Error(`Cannot parse oklch string: ${str}`);
  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
    alpha: match[4] !== undefined ? parseFloat(match[4]) : undefined,
  };
}

describe("OKLCH palette derivation", () => {
  describe("hexToOklch conversion", () => {
    it("converts #ffffff to L near 1 and #000000 to L near 0", () => {
      const white = hexToOklch("#ffffff");
      const black = hexToOklch("#000000");

      expect(white.l).toBeGreaterThan(0.99);
      expect(white.l).toBeLessThanOrEqual(1.001);
      expect(white.c).toBeLessThan(0.001);

      expect(black.l).toBeGreaterThanOrEqual(0);
      expect(black.l).toBeLessThan(0.01);
      expect(black.c).toBeLessThan(0.001);
    });

    it("converts known hex colors accurately", () => {
      const lavender = hexToOklch("#6d5fd6");
      expect(lavender.l).toBeCloseTo(0.56, 1);
      expect(lavender.h).toBeGreaterThan(280);
      expect(lavender.h).toBeLessThan(290);
    });
  });

  describe("accentVarsFor fallback handling", () => {
    it("returns {} for undefined, null, empty string, unknown id, wrong type, and lavender", () => {
      expect(accentVarsFor(undefined)).toEqual({});
      expect(accentVarsFor(null)).toEqual({});
      expect(accentVarsFor("")).toEqual({});
      expect(accentVarsFor("nope")).toEqual({});
      expect(accentVarsFor(42 as any)).toEqual({});
      expect(accentVarsFor("lavender")).toEqual({});
    });

    it("returns {} for undefined, null, empty string, unknown id, wrong type, and lavender in dark mode", () => {
      expect(accentVarsFor(undefined, "dark")).toEqual({});
      expect(accentVarsFor(null, "dark")).toEqual({});
      expect(accentVarsFor("", "dark")).toEqual({});
      expect(accentVarsFor("nope", "dark")).toEqual({});
      expect(accentVarsFor(42 as any, "dark")).toEqual({});
      expect(accentVarsFor("lavender", "dark")).toEqual({});
    });
  });

  describe("accentVarsFor for non-lavender presets", () => {
    const nonLavenderPresets = ACCENT_PRESETS.filter((p) => p.id !== "lavender");

    it("has non-empty presets list with blue, orange, graphite, etc.", () => {
      expect(nonLavenderPresets.length).toBeGreaterThanOrEqual(8);
      expect(nonLavenderPresets.some((p) => p.id === "orange")).toBe(true);
      expect(nonLavenderPresets.some((p) => p.id === "blue")).toBe(true);
      expect(nonLavenderPresets.some((p) => p.id === "graphite")).toBe(true);
    });

    it("includes all keys in ACCENT_VARS with valid CSS values for every non-lavender preset", () => {
      for (const preset of nonLavenderPresets) {
        const vars = accentVarsFor(preset.id);
        const keys = Object.keys(vars);

        expect(keys.sort()).toEqual([...ACCENT_VARS].sort());

        for (const [key, val] of Object.entries(vars)) {
          if (key === "--gradient-lavender") {
            expect(val.startsWith("linear-gradient(")).toBe(true);
          } else if (key === "--gradient-lavender-glow") {
            expect(val.startsWith("radial-gradient(")).toBe(true);
          } else {
            expect(val.startsWith("oklch(")).toBe(true);
          }
        }
      }
    });

    it("preserves L=0.707 for --primary and places orange hue within ±3 deg of #e0510a", () => {
      const orangeVars = accentVarsFor("orange");
      const primaryOklch = parseOklchString(orangeVars["--primary"]);
      const orangeRefOklch = hexToOklch("#e0510a");

      expect(primaryOklch.l).toBeCloseTo(0.707, 3);
      expect(Math.abs(primaryOklch.h - orangeRefOklch.h)).toBeLessThanOrEqual(3);
    });

    it("derives lower chroma for graphite than orange", () => {
      const orangeVars = accentVarsFor("orange");
      const graphiteVars = accentVarsFor("graphite");

      const orangePrimary = parseOklchString(orangeVars["--primary"]);
      const graphitePrimary = parseOklchString(graphiteVars["--primary"]);

      expect(graphitePrimary.c).toBeLessThan(orangePrimary.c);
    });

    it("guarantees WCAG contrast >= 4.5:1 for --primary-strong against #ffffff and --primary-soft across all presets", () => {
      const whiteRgb: [number, number, number] = [255, 255, 255];
      const whiteLum = relativeLuminance(whiteRgb[0], whiteRgb[1], whiteRgb[2]);

      for (const preset of nonLavenderPresets) {
        const vars = accentVarsFor(preset.id);
        const strongOklch = parseOklchString(vars["--primary-strong"]);
        const softOklch = parseOklchString(vars["--primary-soft"]);

        const strongRgb = oklchToRgb(strongOklch);
        const softRgb = oklchToRgb(softOklch);

        const strongLum = relativeLuminance(strongRgb[0], strongRgb[1], strongRgb[2]);
        const softLum = relativeLuminance(softRgb[0], softRgb[1], softRgb[2]);

        const contrastOnWhite = contrastRatio(strongLum, whiteLum);
        const contrastOnSoft = contrastRatio(strongLum, softLum);

        expect(
          contrastOnWhite,
          `Preset ${preset.id} failed contrast on white: ${contrastOnWhite.toFixed(2)}`
        ).toBeGreaterThanOrEqual(4.5);

        expect(
          contrastOnSoft,
          `Preset ${preset.id} failed contrast on primary-soft: ${contrastOnSoft.toFixed(2)}`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe("accentVarsFor in dark theme", () => {
    const nonLavenderPresets = ACCENT_PRESETS.filter((p) => p.id !== "lavender");

    it("matches existing light mode result when theme argument is omitted", () => {
      expect(accentVarsFor("orange")).toEqual(accentVarsFor("orange", "light"));
    });

    it("preserves L=0.72 for --primary and places orange hue within ±3 deg of preset.dark", () => {
      const orangePreset = ACCENT_PRESETS.find((p) => p.id === "orange")!;
      const orangeDarkOklch = hexToOklch(orangePreset.dark);
      const orangeVars = accentVarsFor("orange", "dark");
      const primaryOklch = parseOklchString(orangeVars["--primary"]);

      expect(primaryOklch.l).toBeCloseTo(0.72, 2);
      expect(Math.abs(primaryOklch.h - orangeDarkOklch.h)).toBeLessThanOrEqual(3);
    });

    it("guarantees WCAG contrast >= 4.5:1 for --primary-strong against dark surface and --primary-soft across all presets", () => {
      // Dark surface is oklch(0.2 0.014 277)
      const darkSurfaceRgb = oklchToRgb({ l: 0.2, c: 0.014, h: 277 });
      const darkSurfaceLum = relativeLuminance(darkSurfaceRgb[0], darkSurfaceRgb[1], darkSurfaceRgb[2]);

      for (const preset of nonLavenderPresets) {
        const vars = accentVarsFor(preset.id, "dark");
        const strongOklch = parseOklchString(vars["--primary-strong"]);
        const softOklch = parseOklchString(vars["--primary-soft"]);

        const strongRgb = oklchToRgb(strongOklch);
        const softRgb = oklchToRgb(softOklch);

        const strongLum = relativeLuminance(strongRgb[0], strongRgb[1], strongRgb[2]);
        const softLum = relativeLuminance(softRgb[0], softRgb[1], softRgb[2]);

        const contrastOnSurface = contrastRatio(strongLum, darkSurfaceLum);
        const contrastOnSoft = contrastRatio(strongLum, softLum);

        expect(
          contrastOnSurface,
          `Preset ${preset.id} failed contrast on dark surface: ${contrastOnSurface.toFixed(2)}`
        ).toBeGreaterThanOrEqual(4.5);

        expect(
          contrastOnSoft,
          `Preset ${preset.id} failed contrast on dark primary-soft: ${contrastOnSoft.toFixed(2)}`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe("reference tokens consistency with tokens.css", () => {
    it("ACCENT_VARS contains exactly the 12 variable names from spec section 4", () => {
      expect(ACCENT_VARS).toEqual([
        "--primary",
        "--primary-strong",
        "--primary-soft",
        "--primary-muted",
        "--ring",
        "--chart-1",
        "--accent",
        "--sidebar-primary",
        "--sidebar-accent",
        "--sidebar-ring",
        "--gradient-lavender",
        "--gradient-lavender-glow",
      ]);
    });

    it("verifies tokens.css contains every variable in ACCENT_VARS", () => {
      const tokensCssPath = resolve(__dirname, "../design/tokens.css");
      const tokensCss = readFileSync(tokensCssPath, "utf8");

      for (const varName of ACCENT_VARS) {
        expect(tokensCss.includes(varName)).toBe(true);
      }
    });
  });
});
