import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountShadow } from "./mount";

describe("mountShadow", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    const existing = document.getElementById("fptu-ui-host");
    if (existing) existing.remove();
    const existingDocStyle = document.getElementById("fptu-ui-document-styles");
    if (existingDocStyle) existingDocStyle.remove();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates host element with id fptu-ui-host and attaches shadow root", () => {
    const { host, root, unmount } = mountShadow({
      css: ".test { color: red; }",
      documentCss: "@property --test { syntax: '<color>'; inherits: false; initial-value: red; }",
    });

    expect(host.id).toBe("fptu-ui-host");
    expect(document.getElementById("fptu-ui-host")).toBe(host);
    expect(root).toBeDefined();

    unmount();
    expect(document.getElementById("fptu-ui-host")).toBeNull();
  });

  it("idempotently returns the same host and root when called multiple times", () => {
    const first = mountShadow({
      css: ".first { color: blue; }",
      documentCss: "",
    });

    const second = mountShadow({
      css: ".second { color: green; }",
      documentCss: "",
    });

    expect(document.querySelectorAll("#fptu-ui-host").length).toBe(1);
    expect(first.host).toBe(second.host);
    expect(first.root).toBe(second.root);

    second.unmount();
    expect(document.querySelectorAll("#fptu-ui-host").length).toBe(0);
  });

  it("applies shadow css via adoptedStyleSheets or style element", () => {
    const { root, unmount } = mountShadow({
      css: ".box { padding: 10px; }",
      documentCss: "",
    });

    const hasAdopted = root.adoptedStyleSheets && root.adoptedStyleSheets.length > 0;
    const hasStyleTag = root.querySelector("style") !== null;

    expect(hasAdopted || hasStyleTag).toBe(true);

    unmount();
  });

  it("injects documentCss into document head and cleans it up on unmount", () => {
    const docCss = "@font-face { font-family: 'TestFont'; src: local('Arial'); }";
    const { unmount } = mountShadow({
      css: "",
      documentCss: docCss,
    });

    const styleEl = document.getElementById("fptu-ui-document-styles");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.textContent).toContain("TestFont");

    unmount();
    expect(document.getElementById("fptu-ui-document-styles")).toBeNull();
  });

  it("injects font-face when fontBaseUrl is provided", () => {
    const { unmount } = mountShadow({
      css: "",
      documentCss: "",
      fontBaseUrl: "chrome-extension://mock-id/dist/fonts",
    });

    const styleEl = document.getElementById("fptu-ui-document-styles");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.textContent).toContain("chrome-extension://mock-id/dist/fonts/inter-latin-wght-normal.woff2");

    unmount();
    expect(document.getElementById("fptu-ui-document-styles")).toBeNull();
  });
});
