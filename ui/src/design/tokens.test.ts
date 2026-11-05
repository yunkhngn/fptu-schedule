import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { ACCENT_PRESETS } from "../accent/palette";

export function parseTokens(cssText: string): Record<string, string> {
  const blockMatch = cssText.match(/(?::root|:host)\s*\{([\s\S]*?)\}/);
  if (!blockMatch) return {};
  const block = blockMatch[1];
  const tokens: Record<string, string> = {};
  const regex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(block)) !== null) {
    const name = m[1].trim();
    const rawVal = m[2].replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const normalizedVal = rawVal.replace(/\s+/g, " ");
    tokens[name] = normalizedVal;
  }
  return tokens;
}

const REFERENCE_PATH = resolve(__dirname, "../../reference/lovable-styles.css");
const TOKENS_PATH = resolve(__dirname, "tokens.css");
const DESIGN_MD_PATH = resolve(__dirname, "../../../DESIGN.md");
const GEN_SCRIPT_PATH = resolve(__dirname, "../../scripts/gen-design-md.mjs");

describe("design tokens parity and specifications", () => {
  it("has identical tokens between lovable reference and tokens.css", () => {
    expect(existsSync(REFERENCE_PATH)).toBe(true);
    expect(existsSync(TOKENS_PATH)).toBe(true);

    const refCss = readFileSync(REFERENCE_PATH, "utf8");
    const tokensCss = readFileSync(TOKENS_PATH, "utf8");

    const refTokens = parseTokens(refCss);
    const hostTokens = parseTokens(tokensCss);

    expect(Object.keys(refTokens).length).toBeGreaterThan(0);
    expect(hostTokens).toEqual(refTokens);
  });

  it("defines all color tokens in pure oklch without raw hex #000 or #fff", () => {
    const tokensCss = readFileSync(TOKENS_PATH, "utf8");
    const hostTokens = parseTokens(tokensCss);

    const colorTokens = Object.entries(hostTokens).filter(([key]) =>
      /--(?:background|foreground|surface|card|popover|primary|ink|secondary|muted|accent|success|warning|danger|destructive|border|input|ring|chart-|sidebar)/.test(
        key
      )
    );

    expect(colorTokens.length).toBeGreaterThan(0);

    for (const [name, val] of colorTokens) {
      expect(
        /#(?:000|fff|000000|ffffff)\b/i.test(val),
        `Color token ${name} contains forbidden raw hex: ${val}`
      ).toBe(false);
      expect(
        val.startsWith("oklch("),
        `Color token ${name} must be an oklch value, got: ${val}`
      ).toBe(true);
    }
  });

  it("documents every color token and exact oklch value in DESIGN.md", () => {
    expect(existsSync(DESIGN_MD_PATH)).toBe(true);
    const designMd = readFileSync(DESIGN_MD_PATH, "utf8");
    const tokensCss = readFileSync(TOKENS_PATH, "utf8");
    const hostTokens = parseTokens(tokensCss);

    const colorTokens = Object.entries(hostTokens).filter(([key]) =>
      /--(?:background|foreground|surface|card|popover|primary|ink|secondary|muted|accent|success|warning|danger|destructive|border|input|ring|chart-|sidebar)/.test(
        key
      )
    );

    for (const [name, val] of colorTokens) {
      expect(
        designMd.includes(name),
        `DESIGN.md missing token name: ${name}`
      ).toBe(true);
      expect(
        designMd.includes(val),
        `DESIGN.md missing token value for ${name}: ${val}`
      ).toBe(true);
    }
  });

  it("verifies that gen-design-md.mjs passes check against DESIGN.md", () => {
    expect(existsSync(GEN_SCRIPT_PATH)).toBe(true);
    expect(existsSync(DESIGN_MD_PATH)).toBe(true);

    const projectRoot = resolve(__dirname, "../../..");
    const result = execSync(`node ui/scripts/gen-design-md.mjs --check`, {
      cwd: projectRoot,
      encoding: "utf8"
    });
    expect(result).toContain("DESIGN.md is up-to-date");
  });

  it("documents accent colors (Màu nhấn), presets, default behavior, and derivation formula in DESIGN.md", () => {
    expect(existsSync(DESIGN_MD_PATH)).toBe(true);
    const designMd = readFileSync(DESIGN_MD_PATH, "utf8");

    // Section "Màu nhấn"
    expect(designMd).toContain("Màu nhấn");

    // All presets from ACCENT_PRESETS are listed
    expect(ACCENT_PRESETS.length).toBeGreaterThan(0);
    for (const preset of ACCENT_PRESETS) {
      expect(
        designMd.includes(preset.id),
        `DESIGN.md must document accent preset ID: ${preset.id}`
      ).toBe(true);
    }

    // Default behavior description
    expect(designMd).toMatch(/lavender/i);
    expect(designMd).toMatch(/mặc định|default/i);

    // Derivation formula description
    expect(designMd).toContain("OKLCH");
    expect(designMd).toMatch(/hue|hueDelta|283\.1/i);
    expect(designMd).toMatch(/chroma/i);
    expect(designMd).toMatch(/4\.5\s*:\s*1|WCAG/i);
    expect(designMd).toContain("--primary-strong");
  });

  it("documents dark theme (Chế độ tối), dark tokens, contrast ratios, storage key theme, and system preference in DESIGN.md", () => {
    expect(existsSync(DESIGN_MD_PATH)).toBe(true);
    const designMd = readFileSync(DESIGN_MD_PATH, "utf8");
    const tokensCss = readFileSync(TOKENS_PATH, "utf8");

    // Section "Chế độ tối"
    expect(designMd).toMatch(/Chế độ tối/i);

    // Parse dark tokens from :host([data-theme="dark"])
    const darkMatch = tokensCss.match(/:host\(\[data-theme="dark"\]\)\s*\{([\s\S]*?)\}/);
    expect(darkMatch).toBeTruthy();
    const darkBlock = darkMatch![1];
    const regex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
    let m: RegExpExecArray | null;
    const darkTokens: Record<string, string> = {};
    while ((m = regex.exec(darkBlock)) !== null) {
      darkTokens[m[1].trim()] = m[2].replace(/\/\*[\s\S]*?\*\//g, "").trim().replace(/\s+/g, " ");
    }

    // Every dark color token and its exact oklch value is in DESIGN.md
    const darkColorTokens = Object.entries(darkTokens).filter(([name]) =>
      /--(?:background|foreground|surface|card|popover|primary|ink|secondary|muted|accent|success|warning|danger|destructive|border|input|ring|chart-|sidebar)/.test(
        name
      )
    );
    expect(darkColorTokens.length).toBeGreaterThan(0);
    for (const [name, val] of darkColorTokens) {
      expect(
        designMd.includes(name),
        `DESIGN.md missing dark token name: ${name}`
      ).toBe(true);
      expect(
        designMd.includes(val),
        `DESIGN.md missing dark token value for ${name}: ${val}`
      ).toBe(true);
    }

    // Calculated contrast ratios table / references
    expect(designMd).toMatch(/tương phản|contrast/i);
    expect(designMd).toMatch(/--foreground.*--(?:surface|background)/i);
    expect(designMd).toMatch(/--primary-strong.*--(?:surface|primary-soft)/i);

    // Source of truth: storage key theme ("auto" | "light" | "dark")
    expect(designMd).toContain("theme");
    expect(designMd).toMatch(/auto/);
    expect(designMd).toMatch(/light/);
    expect(designMd).toMatch(/dark/);

    // System auto behavior (prefers-color-scheme: dark)
    expect(designMd).toMatch(/prefers-color-scheme/);
    expect(designMd).toMatch(/Tự động theo hệ thống|hệ thống/i);

    // Accent section documents derivation rules for both light and dark themes
    expect(designMd).toMatch(/chế độ sáng/i);
    expect(designMd).toMatch(/chế độ tối/i);
    expect(designMd).toMatch(/0\.95|trần/i); // dark contrast adjustment ceiling
    expect(designMd).toMatch(/0\.40|sàn/i); // light contrast adjustment floor
  });

  it("contains zero emojis across all design specification and token files", () => {
    const filesToCheck = [
      REFERENCE_PATH,
      TOKENS_PATH,
      DESIGN_MD_PATH,
      GEN_SCRIPT_PATH,
      resolve(__dirname, "tokens.test.ts")
    ];

    const emojiRegex = /\p{Extended_Pictographic}/u;

    for (const file of filesToCheck) {
      if (existsSync(file)) {
        const content = readFileSync(file, "utf8");
        expect(
          emojiRegex.test(content),
          `File ${file} contains disallowed emoji characters`
        ).toBe(false);
      }
    }
  });
});
