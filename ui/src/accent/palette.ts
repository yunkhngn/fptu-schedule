import * as accentModule from "@lib/accent.js";
import {
  type OklchColor,
  hexToOklch,
  oklchToRgb,
  relativeLuminance,
  contrastRatio,
  parseOklch,
} from "@/design/color";

export {
  type OklchColor,
  hexToOklch,
  oklchToRgb,
  relativeLuminance,
  contrastRatio,
  parseOklch,
};

export interface AccentPreset {
  id: string;
  label: string;
  light: string;
  dark: string;
}

const mod = accentModule as unknown as {
  default?: { ACCENT_PRESETS?: AccentPreset[] };
  ACCENT_PRESETS?: AccentPreset[];
};

// lib/accent.js is a UMD file written for the popup's <script> tag and for Node. Inside the bundle there is no
// CommonJS `module`, so the import above is empty and the file instead publishes its API on the global object
// (`Object.assign(root, api)`). Read it from there when the import has nothing, or the presets silently vanish.
const published = (globalThis as unknown as { ACCENT_PRESETS?: AccentPreset[] }).ACCENT_PRESETS;

export const ACCENT_PRESETS: AccentPreset[] =
  mod.ACCENT_PRESETS ?? mod.default?.ACCENT_PRESETS ?? published ?? [];

export const ACCENT_VARS = [
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
] as const;

const BASE_LAVENDER_HUE = 283.1;
const BASE_LAVENDER_HEX = "#6d5fd6";
const BASE_LAVENDER_CHROMA = hexToOklch(BASE_LAVENDER_HEX).c;

const COLOR_TOKENS: Record<string, OklchColor> = {
  "--primary": { l: 0.707, c: 0.129, h: 283.1 },
  "--primary-strong": { l: 0.56, c: 0.16, h: 281 },
  "--primary-soft": { l: 0.939, c: 0.031, h: 287.8 },
  "--primary-muted": { l: 0.849, c: 0.065, h: 285.9 },
  "--ring": { l: 0.707, c: 0.129, h: 283.1 },
  "--chart-1": { l: 0.707, c: 0.129, h: 283.1 },
  "--accent": { l: 0.955, c: 0.018, h: 284 },
  "--sidebar-primary": { l: 0.707, c: 0.129, h: 283.1 },
  "--sidebar-accent": { l: 0.955, c: 0.018, h: 284 },
  "--sidebar-ring": { l: 0.707, c: 0.129, h: 283.1 },
};

const DARK_BASE_LAVENDER_HUE = 283;
const DARK_BASE_LAVENDER_HEX = "#7c6fe0";
const DARK_BASE_LAVENDER_CHROMA = hexToOklch(DARK_BASE_LAVENDER_HEX).c;

const DARK_COLOR_TOKENS: Record<string, OklchColor> = {
  "--primary": { l: 0.72, c: 0.13, h: 283 },
  "--primary-strong": { l: 0.82, c: 0.1, h: 283 },
  "--primary-soft": { l: 0.3, c: 0.06, h: 285 },
  "--primary-muted": { l: 0.4, c: 0.07, h: 285 },
  "--ring": { l: 0.72, c: 0.13, h: 283 },
  "--chart-1": { l: 0.72, c: 0.13, h: 283 },
  "--accent": { l: 0.26, c: 0.02, h: 284 },
  "--sidebar-primary": { l: 0.72, c: 0.13, h: 283 },
  "--sidebar-accent": { l: 0.26, c: 0.02, h: 284 },
  "--sidebar-ring": { l: 0.72, c: 0.13, h: 283 },
};

function normalizeHue(h: number): number {
  const mod = h % 360;
  return mod < 0 ? mod + 360 : mod;
}

function formatNum(n: number, decimals = 4): string {
  return Number(n.toFixed(decimals)).toString();
}

function formatOklch(l: number, c: number, h: number, alpha?: number): string {
  if (alpha !== undefined) {
    return `oklch(${formatNum(l)} ${formatNum(c)} ${formatNum(h)} / ${formatNum(alpha)})`;
  }
  return `oklch(${formatNum(l)} ${formatNum(c)} ${formatNum(h)})`;
}

export function accentVarsFor(
  id: string | null | undefined,
  theme: "light" | "dark" = "light"
): Record<string, string> {
  if (typeof id !== "string" || !id || id === "lavender") {
    return {};
  }

  const preset = ACCENT_PRESETS.find((p) => p.id === id);
  if (!preset) {
    return {};
  }

  if (theme === "dark") {
    const presetOklch = hexToOklch(preset.dark);
    const hueDelta = presetOklch.h - DARK_BASE_LAVENDER_HUE;
    const k = DARK_BASE_LAVENDER_CHROMA > 0 ? presetOklch.c / DARK_BASE_LAVENDER_CHROMA : 1;

    const result: Record<string, string> = {};

    // Dark surface is oklch(0.2 0.014 277)
    const darkSurfaceRgb = oklchToRgb({ l: 0.2, c: 0.014, h: 277 });
    const darkSurfaceLum = relativeLuminance(darkSurfaceRgb[0], darkSurfaceRgb[1], darkSurfaceRgb[2]);

    const softRef = DARK_COLOR_TOKENS["--primary-soft"];
    const softOklch: OklchColor = {
      l: softRef.l,
      c: softRef.c * k,
      h: normalizeHue(softRef.h + hueDelta),
    };
    const softRgb = oklchToRgb(softOklch);
    const softLum = relativeLuminance(softRgb[0], softRgb[1], softRgb[2]);

    const strongRef = DARK_COLOR_TOKENS["--primary-strong"];
    let strongL = strongRef.l;
    const strongC = strongRef.c * k;
    const strongH = normalizeHue(strongRef.h + hueDelta);

    let strongRgb = oklchToRgb({ l: strongL, c: strongC, h: strongH });
    let strongLum = relativeLuminance(strongRgb[0], strongRgb[1], strongRgb[2]);

    while (
      (contrastRatio(strongLum, darkSurfaceLum) < 4.5 || contrastRatio(strongLum, softLum) < 4.5) &&
      strongL < 0.95
    ) {
      strongL = Math.min(0.95, Number((strongL + 0.02).toFixed(4)));
      strongRgb = oklchToRgb({ l: strongL, c: strongC, h: strongH });
      strongLum = relativeLuminance(strongRgb[0], strongRgb[1], strongRgb[2]);
    }

    for (const [key, base] of Object.entries(DARK_COLOR_TOKENS)) {
      if (key === "--primary-strong") {
        result[key] = formatOklch(strongL, strongC, strongH);
      } else if (key === "--primary-soft") {
        result[key] = formatOklch(softOklch.l, softOklch.c, softOklch.h);
      } else {
        const derivedC = base.c * k;
        const derivedH = normalizeHue(base.h + hueDelta);
        result[key] = formatOklch(base.l, derivedC, derivedH);
      }
    }

    const stop1 = `${formatOklch(0.28, 0.05 * k, normalizeHue(288 + hueDelta))} 0%`;
    const stop2 = `${formatOklch(0.24, 0.07 * k, normalizeHue(284 + hueDelta))} 45%`;
    const stop3 = `${formatOklch(0.26, 0.05 * k, normalizeHue(250 + hueDelta))} 100%`;
    result["--gradient-lavender"] = `linear-gradient(135deg, ${stop1}, ${stop2}, ${stop3})`;

    const glowStop1 = `${formatOklch(0.4, 0.1 * k, normalizeHue(284 + hueDelta), 0.35)} 0%`;
    result["--gradient-lavender-glow"] = `radial-gradient(120% 120% at 100% 0%, ${glowStop1}, transparent 55%)`;

    return result;
  }

  const presetOklch = hexToOklch(preset.light);
  const hueDelta = presetOklch.h - BASE_LAVENDER_HUE;
  const k = BASE_LAVENDER_CHROMA > 0 ? presetOklch.c / BASE_LAVENDER_CHROMA : 1;

  const result: Record<string, string> = {};

  // Compute soft token first for contrast checks
  const softRef = COLOR_TOKENS["--primary-soft"];
  const softOklch: OklchColor = {
    l: softRef.l,
    c: softRef.c * k,
    h: normalizeHue(softRef.h + hueDelta),
  };
  const softRgb = oklchToRgb(softOklch);
  const softLum = relativeLuminance(softRgb[0], softRgb[1], softRgb[2]);

  // White reference luminance (sRGB [255, 255, 255] is 1.0)
  const whiteLum = relativeLuminance(255, 255, 255);

  // Compute strong token with contrast enforcement
  const strongRef = COLOR_TOKENS["--primary-strong"];
  let strongL = strongRef.l;
  const strongC = strongRef.c * k;
  const strongH = normalizeHue(strongRef.h + hueDelta);

  let strongRgb = oklchToRgb({ l: strongL, c: strongC, h: strongH });
  let strongLum = relativeLuminance(strongRgb[0], strongRgb[1], strongRgb[2]);

  while (
    (contrastRatio(strongLum, whiteLum) < 4.5 || contrastRatio(strongLum, softLum) < 4.5) &&
    strongL > 0.40
  ) {
    strongL = Math.max(0.40, Number((strongL - 0.02).toFixed(4)));
    strongRgb = oklchToRgb({ l: strongL, c: strongC, h: strongH });
    strongLum = relativeLuminance(strongRgb[0], strongRgb[1], strongRgb[2]);
  }

  // Derive all color tokens
  for (const [key, base] of Object.entries(COLOR_TOKENS)) {
    if (key === "--primary-strong") {
      result[key] = formatOklch(strongL, strongC, strongH);
    } else if (key === "--primary-soft") {
      result[key] = formatOklch(softOklch.l, softOklch.c, softOklch.h);
    } else {
      const derivedC = base.c * k;
      const derivedH = normalizeHue(base.h + hueDelta);
      result[key] = formatOklch(base.l, derivedC, derivedH);
    }
  }

  // Derive gradient tokens
  // --gradient-lavender: linear-gradient(135deg, oklch(0.93 0.04 288) 0%, oklch(0.89 0.06 284) 45%, oklch(0.94 0.035 250) 100%)
  const stop1 = `${formatOklch(0.93, 0.04 * k, normalizeHue(288 + hueDelta))} 0%`;
  const stop2 = `${formatOklch(0.89, 0.06 * k, normalizeHue(284 + hueDelta))} 45%`;
  const stop3 = `${formatOklch(0.94, 0.035 * k, normalizeHue(250 + hueDelta))} 100%`;
  result["--gradient-lavender"] = `linear-gradient(135deg, ${stop1}, ${stop2}, ${stop3})`;

  // --gradient-lavender-glow: radial-gradient(120% 120% at 100% 0%, oklch(0.82 0.09 284 / 0.55) 0%, transparent 55%)
  const glowStop1 = `${formatOklch(0.82, 0.09 * k, normalizeHue(284 + hueDelta), 0.55)} 0%`;
  result["--gradient-lavender-glow"] = `radial-gradient(120% 120% at 100% 0%, ${glowStop1}, transparent 55%)`;

  return result;
}
