import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseOklch,
  oklchToRgb,
  relativeLuminance,
  contrastRatio,
  hexToOklch,
  type OklchColor,
} from "./color";
import * as paletteModule from "../accent/palette";

const TOKENS_PATH = resolve(__dirname, "tokens.css");

function parseBlockTokens(cssText: string, selectorRegex: RegExp): Record<string, string> {
  const match = cssText.match(selectorRegex);
  if (!match) return {};
  const block = match[1];
  const tokens: Record<string, string> = {};
  const regex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(block)) !== null) {
    const name = m[1].trim();
    const rawVal = m[2].replace(/\/\*[\s\S]*?\*\//g, "").trim();
    tokens[name] = rawVal.replace(/\s+/g, " ");
  }
  return tokens;
}

function contrastBetween(color1Css: string, color2Css: string): number {
  const c1 = parseOklch(color1Css);
  const c2 = parseOklch(color2Css);
  const rgb1 = oklchToRgb(c1);
  const rgb2 = oklchToRgb(c2);
  const lum1 = relativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = relativeLuminance(rgb2[0], rgb2[1], rgb2[2]);
  return contrastRatio(lum1, lum2);
}

describe("dark color tokens and color utilities", () => {
  describe("color.ts math and parsing utilities", () => {
    it("parses oklch strings without alpha", () => {
      const parsed = parseOklch("oklch(0.98 0.005 275)");
      expect(parsed.l).toBeCloseTo(0.98, 4);
      expect(parsed.c).toBeCloseTo(0.005, 4);
      expect(parsed.h).toBeCloseTo(275, 4);
      expect(parsed.alpha).toBeUndefined();
    });

    it("parses oklch strings with alpha as decimal or percentage", () => {
      const withAlphaDecimal = parseOklch("oklch(1 0 0 / 0.72)");
      expect(withAlphaDecimal.l).toBeCloseTo(1, 4);
      expect(withAlphaDecimal.c).toBeCloseTo(0, 4);
      expect(withAlphaDecimal.h).toBeCloseTo(0, 4);
      expect(withAlphaDecimal.alpha).toBeCloseTo(0.72, 4);

      const withAlphaPercent = parseOklch("oklch(0.82 0.09 284 / 55%)");
      expect(withAlphaPercent.l).toBeCloseTo(0.82, 4);
      expect(withAlphaPercent.c).toBeCloseTo(0.09, 4);
      expect(withAlphaPercent.h).toBeCloseTo(284, 4);
      expect(withAlphaPercent.alpha).toBeCloseTo(0.55, 4);
    });

    it("throws on invalid oklch string", () => {
      expect(() => parseOklch("rgb(255, 255, 255)")).toThrow(/Cannot parse oklch/);
      expect(() => parseOklch("invalid")).toThrow(/Cannot parse oklch/);
    });

    it("re-exports all color functions from ui/src/accent/palette.ts for backward compatibility", () => {
      expect(typeof paletteModule.contrastRatio).toBe("function");
      expect(typeof paletteModule.hexToOklch).toBe("function");
      expect(typeof paletteModule.oklchToRgb).toBe("function");
      expect(typeof paletteModule.relativeLuminance).toBe("function");
      expect(typeof paletteModule.parseOklch).toBe("function");

      const parsed = paletteModule.parseOklch("oklch(0.5 0.1 200)");
      expect(parsed.l).toBeCloseTo(0.5, 4);
    });
  });

  describe("dark tokens block in tokens.css", () => {
    it("defines :host([data-theme=\"dark\"]) with color-scheme: dark", () => {
      expect(existsSync(TOKENS_PATH)).toBe(true);
      const css = readFileSync(TOKENS_PATH, "utf8");
      const darkMatch = css.match(/:host\(\[data-theme="dark"\]\)\s*\{([\s\S]*?)\}/);
      expect(darkMatch, "tokens.css must contain a :host([data-theme=\"dark\"]) block").toBeTruthy();
      expect(darkMatch![1]).toMatch(/color-scheme\s*:\s*dark\s*;/);
    });

    it("defines the exact matching set of color, shadow, and gradient tokens as the light :host block", () => {
      const css = readFileSync(TOKENS_PATH, "utf8");
      const lightTokens = parseBlockTokens(css, /:host\s*\{([\s\S]*?)\}/);
      const darkTokens = parseBlockTokens(css, /:host\(\[data-theme="dark"\]\)\s*\{([\s\S]*?)\}/);

      // Exclude --radius (structural, not color/shadow/gradient)
      const expectedKeys = Object.keys(lightTokens)
        .filter((k) => k !== "--radius")
        .sort();

      const darkKeys = Object.keys(darkTokens)
        .filter((k) => k !== "--radius")
        .sort();

      expect(darkKeys.length).toBeGreaterThan(0);
      expect(darkKeys).toEqual(expectedKeys);
    });
  });

  describe("WCAG contrast checks for dark tokens", () => {
    it("satisfies all WCAG contrast ratio requirements for dark theme", () => {
      const css = readFileSync(TOKENS_PATH, "utf8");
      const dark = parseBlockTokens(css, /:host\(\[data-theme="dark"\]\)\s*\{([\s\S]*?)\}/);

      // 1. foreground on background >= 7:1
      const fgOnBg = contrastBetween(dark["--foreground"], dark["--background"]);
      expect(fgOnBg, `foreground on background: ${fgOnBg.toFixed(2)}`).toBeGreaterThanOrEqual(7);

      // 2. foreground on surface >= 7:1
      const fgOnSurface = contrastBetween(dark["--foreground"], dark["--surface"]);
      expect(fgOnSurface, `foreground on surface: ${fgOnSurface.toFixed(2)}`).toBeGreaterThanOrEqual(7);

      // 3. muted-foreground on surface >= 4.5:1
      const mutedOnSurface = contrastBetween(dark["--muted-foreground"], dark["--surface"]);
      expect(mutedOnSurface, `muted-foreground on surface: ${mutedOnSurface.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);

      // 4. primary-strong on surface >= 4.5:1 and on primary-soft >= 4.5:1
      const primaryOnSurface = contrastBetween(dark["--primary-strong"], dark["--surface"]);
      expect(primaryOnSurface, `primary-strong on surface: ${primaryOnSurface.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);

      const primaryOnSoft = contrastBetween(dark["--primary-strong"], dark["--primary-soft"]);
      expect(primaryOnSoft, `primary-strong on primary-soft: ${primaryOnSoft.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);

      // 5. ink-foreground on ink >= 4.5:1
      const inkFgOnInk = contrastBetween(dark["--ink-foreground"], dark["--ink"]);
      expect(inkFgOnInk, `ink-foreground on ink: ${inkFgOnInk.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);

      // 6. *-strong on *-soft >= 4.5:1 for success, warning, danger
      const successContrast = contrastBetween(dark["--success-strong"], dark["--success-soft"]);
      expect(successContrast, `success-strong on success-soft: ${successContrast.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);

      const warningContrast = contrastBetween(dark["--warning-strong"], dark["--warning-soft"]);
      expect(warningContrast, `warning-strong on warning-soft: ${warningContrast.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);

      const dangerContrast = contrastBetween(dark["--danger-strong"], dark["--danger-soft"]);
      expect(dangerContrast, `danger-strong on danger-soft: ${dangerContrast.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);

      // 7. border on background >= 1.15:1
      const borderOnBg = contrastBetween(dark["--border"], dark["--background"]);
      expect(borderOnBg, `border on background: ${borderOnBg.toFixed(2)}`).toBeGreaterThanOrEqual(1.15);
    });
  });

  describe("glass and scrollbar tokenization", () => {
    it("defines --glass and --scrollbar in both light and dark host blocks with expected values", () => {
      const css = readFileSync(TOKENS_PATH, "utf8");
      const light = parseBlockTokens(css, /:host\s*\{([\s\S]*?)\}/);
      const dark = parseBlockTokens(css, /:host\(\[data-theme="dark"\]\)\s*\{([\s\S]*?)\}/);

      expect(light["--glass"]).toBe("oklch(1 0 0 / 0.72)");
      expect(light["--scrollbar"]).toBe("oklch(0.88 0.015 280)");

      expect(dark["--glass"]).toBe("oklch(0.2 0.014 277 / 0.72)");
      expect(dark["--scrollbar"]).toBe("oklch(0.35 0.015 276)");
    });

    it("@utility glass and @utility scrollbar-thin use CSS tokens and do not contain oklch()", () => {
      const css = readFileSync(TOKENS_PATH, "utf8");

      const glassMatch = css.match(/@utility\s+glass\s*\{([\s\S]*?)\}/);
      expect(glassMatch, "@utility glass block must exist").toBeTruthy();
      const glassBody = glassMatch![1];
      expect(glassBody).toContain("var(--glass)");
      expect(glassBody).not.toContain("oklch(");

      const scrollbarMatch = css.match(/@utility\s+scrollbar-thin\s*\{([\s\S]*?)\}/);
      expect(scrollbarMatch, "@utility scrollbar-thin block must exist").toBeTruthy();
      const scrollbarBody = scrollbarMatch![1];
      expect(scrollbarBody).toContain("var(--scrollbar)");
      expect(scrollbarBody).not.toContain("oklch(");
    });
  });
});
