import { describe, it, expect } from "vitest";
import { remToPx, splitDocumentCss, buildFontFaceCss } from "./css";

describe("css pipeline for shadow DOM", () => {
  describe("remToPx", () => {
    it("converts positive and negative rem values to px using base 16", () => {
      const input = "a{padding:0.5rem 1.25rem; margin:-0.5rem;}";
      const expected = "a{padding:8px 20px; margin:-8px;}";
      expect(remToPx(input)).toBe(expected);
    });

    it("supports custom base value", () => {
      const input = "a{padding:2rem;}";
      const expected = "a{padding:20px;}";
      expect(remToPx(input, 10)).toBe(expected);
    });

    it("leaves calc expressions without rem untouched", () => {
      const input = ".card{border-radius:calc(var(--radius) - 8px);}";
      expect(remToPx(input)).toBe(input);
    });

    it("converts rem inside calc expressions correctly", () => {
      const input = "div{width:calc(100% - 2rem);}";
      const expected = "div{width:calc(100% - 32px);}";
      expect(remToPx(input)).toBe(expected);
    });
  });

  describe("splitDocumentCss", () => {
    it("separates @property and @font-face rules into documentCss and keeps normal rules in shadowCss", () => {
      const input = `
        @font-face {
          font-family: 'Inter';
          src: url('inter.woff2');
        }
        @property --tw-x {
          syntax: '<length>';
          inherits: false;
          initial-value: 0px;
        }
        :root {
          --primary: blue;
        }
        :host {
          display: block;
        }
        .btn {
          color: red;
        }
      `;

      const { shadowCss, documentCss } = splitDocumentCss(input);

      expect(documentCss).toContain("@font-face");
      expect(documentCss).toContain("@property --tw-x");
      expect(documentCss).not.toContain(".btn");

      expect(shadowCss).toContain(".btn");
      expect(shadowCss).toContain(":host {\n          --primary: blue;\n        }");
      expect(shadowCss).toContain(":host {\n          display: block;\n        }");
      expect(shadowCss).not.toContain(":root");
      expect(shadowCss).not.toContain("@font-face");
      expect(shadowCss).not.toContain("@property --tw-x");
    });
  });

  describe("buildFontFaceCss", () => {
    it("generates @font-face rules with configurable base URL", () => {
      const css = buildFontFaceCss("chrome-extension://mock-id/dist/fonts/");
      expect(css).toContain("@font-face");
      expect(css).toContain("chrome-extension://mock-id/dist/fonts/inter-latin-wght-normal.woff2");
      expect(css).toContain("chrome-extension://mock-id/dist/fonts/inter-vietnamese-wght-normal.woff2");
      expect(css).toContain("font-family: 'Inter'");
    });

    it("appends trailing slash to baseUrl if missing", () => {
      const css = buildFontFaceCss("chrome-extension://mock-id/dist/fonts");
      expect(css).toContain("chrome-extension://mock-id/dist/fonts/inter-latin-wght-normal.woff2");
    });
  });
});
