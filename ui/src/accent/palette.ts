import * as accentModule from "@lib/accent.js";

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

export const ACCENT_PRESETS: AccentPreset[] =
  mod.ACCENT_PRESETS ?? mod.default?.ACCENT_PRESETS ?? [];

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

export type OklchColor = { l: number; c: number; h: number };

function hexToRgb(hex: string): [number, number, number] {
  let clean = String(hex).replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  const n = parseInt(clean, 16);
  if (Number.isNaN(n) || clean.length !== 6) {
    return [0, 0, 0];
  }
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function srgbToLinear(c: number): number {
  const v = Math.max(0, Math.min(255, c)) / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  const c = Math.max(0, Math.min(1, v));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function rgbToOklab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  const l = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin;
  const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin;
  const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return [
    Math.round(linearToSrgb(rLin) * 255),
    Math.round(linearToSrgb(gLin) * 255),
    Math.round(linearToSrgb(bLin) * 255),
  ];
}

export function oklchToRgb(oklch: OklchColor): [number, number, number] {
  const hRad = (oklch.h * Math.PI) / 180;
  const a = oklch.c * Math.cos(hRad);
  const b = oklch.c * Math.sin(hRad);
  return oklabToRgb(oklch.l, a, b);
}

export function hexToOklch(hex: string): OklchColor {
  const [r, g, b] = hexToRgb(hex);
  const lab = rgbToOklab(r, g, b);
  const c = Math.hypot(lab.a, lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: lab.L, c, h };
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

export function contrastRatio(lum1: number, lum2: number): number {
  const max = Math.max(lum1, lum2);
  const min = Math.min(lum1, lum2);
  return (max + 0.05) / (min + 0.05);
}

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

export function accentVarsFor(id: string | null | undefined): Record<string, string> {
  if (typeof id !== "string" || !id || id === "lavender") {
    return {};
  }

  const preset = ACCENT_PRESETS.find((p) => p.id === id);
  if (!preset) {
    return {};
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
