import { describe, it, expect } from "vitest";
import { remToPx, splitDocumentCss } from "./css";

describe("css pipeline for shadow DOM", () => {
  describe("remToPx", () => {
    it("converts positive and negative rem values to px using base 16", () => {
      const input = "a{padding:0.5rem 1.25rem; margin:-0.5rem;}";
      const expected = "a{padding:8px 20px; margin:-8px;}";
      expect(remToPx(input)).toBe(expected);
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
        .btn {
          color: red;
        }
      `;

      const { shadowCss, documentCss } = splitDocumentCss(input);

      expect(documentCss).toContain("@font-face");
      expect(documentCss).toContain("@property --tw-x");
      expect(documentCss).not.toContain(".btn");

      expect(shadowCss).toContain(".btn");
      expect(shadowCss).not.toContain("@font-face");
      expect(shadowCss).not.toContain("@property --tw-x");
    });
  });
});
