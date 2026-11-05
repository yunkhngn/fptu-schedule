/**
 * Accent colour presets for the popup. Each preset has a light-theme and a dark-theme colour;
 * everything else (hover, soft tint, borders, glows) is derived from --accent in popup.css
 * with color-mix(), so one colour per theme is all a preset has to provide.
 * Shared by the popup and tests/ (UMD).
 */
(function (root, factory) {
  const api = factory();
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DEFAULT_ACCENT_ID = "blue";
  const ACCENT_STYLE_ID = "accent-style";

  // blue mirrors the stylesheet's own defaults (#2563eb light, #3b82f6 dark). Dark colours are
  // chosen so white button text keeps at least 3.5:1 contrast (checked in tests/accent.test.js).
  const ACCENT_PRESETS = [
    { id: "blue", label: "Xanh dương", light: "#2563eb", dark: "#3b82f6" },
    { id: "indigo", label: "Chàm", light: "#4f46e5", dark: "#6366f1" },
    { id: "violet", label: "Tím", light: "#7c3aed", dark: "#8b5cf6" },
    { id: "lavender", label: "Tím lavender", light: "#6d5fd6", dark: "#7c6fe0" },
    { id: "pink", label: "Hồng", light: "#db2777", dark: "#ec4899" },
    { id: "orange", label: "Cam", light: "#e0510a", dark: "#ea580c" },
    { id: "teal", label: "Xanh ngọc", light: "#0f766e", dark: "#0d9488" },
    { id: "green", label: "Xanh lá", light: "#15803d", dark: "#059669" },
    { id: "graphite", label: "Xám than", light: "#475569", dark: "#64748b" }
  ];

  function normalizeAccentId(id) {
    return ACCENT_PRESETS.some((p) => p.id === id) ? id : DEFAULT_ACCENT_ID;
  }

  function hexToRgb(hex) {
    const n = parseInt(String(hex).replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(rgb) {
    return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  }

  /** Mix `a` toward `b` by `t` (0 = a, 1 = b). */
  function mixHex(a, b, t) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    return rgbToHex(ca.map((v, i) => v + (cb[i] - v) * t));
  }

  function relativeLuminance(hex) {
    const lin = hexToRgb(hex).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  }

  function contrastRatio(a, b) {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  /** CSS overriding the accent variables, or "" for the default (the stylesheet already has it). */
  function buildAccentCss(id) {
    const key = normalizeAccentId(id);
    if (key === DEFAULT_ACCENT_ID) return "";
    const p = ACCENT_PRESETS.find((x) => x.id === key);
    const [dr, dg, db] = hexToRgb(p.dark);
    return (
      `:root{--accent:${p.light};--accent-hover:${mixHex(p.light, "#000000", 0.15)};--accent-soft:${mixHex(p.light, "#ffffff", 0.92)};}` +
      `:root[data-theme="dark"]{--accent:${p.dark};--accent-hover:${mixHex(p.dark, "#ffffff", 0.25)};--accent-soft:rgba(${dr}, ${dg}, ${db}, 0.2);}`
    );
  }

  function applyAccent(doc, id) {
    const documentObj = doc || (typeof document !== "undefined" ? document : null);
    if (!documentObj || !documentObj.head) return;
    const css = buildAccentCss(id);
    let el = documentObj.getElementById(ACCENT_STYLE_ID);
    if (!css) {
      if (el && typeof el.remove === "function") el.remove();
      return;
    }
    if (!el) {
      el = documentObj.createElement("style");
      el.id = ACCENT_STYLE_ID;
      documentObj.head.appendChild(el);
    }
    el.textContent = css;
  }

  return {
    ACCENT_PRESETS,
    DEFAULT_ACCENT_ID,
    ACCENT_STYLE_ID,
    normalizeAccentId,
    mixHex,
    contrastRatio,
    buildAccentCss,
    applyAccent
  };
});
