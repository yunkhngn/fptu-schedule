import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { boot } from "@/boot";
import { registry } from "./registry";

const fixture = (name: string) => fs.readFileSync(path.resolve(__dirname, `../../../tests/fixtures/pages/${name}.html`), "utf8");
const SHELL = `<div class="fap-topbar-user"><h5>Nguyễn Văn A</h5><h6>SE000000</h6></div>`;

// Write pages the interface does not rebuild. Each one is kept as FAP's own content inside the new frame, because
// rebuilding it would mean re-implementing something FAP's scripts do (uploads, a Select2 preview that loads later,
// fields fetched from a schema) and a mistake there could send a wrong application.
const WRAPPED_FORM_PAGES = [
  { id: "application-create", path: "/Application/Create", fixture: "application-create", why: "has a file upload and fields loaded from a schema" },
  { id: "wishlist-register", path: "/Wishlist/Register", fixture: "wishlist-register", why: "uses a Select2 whose preview FAP loads after the choice" },
  { id: "cross-class-change-create", path: "/CrossClassChange/Create", fixture: "cross-class-change-create", why: "has no form to drive in the saved page" },
  { id: "startup-group-add", path: "/StartupGroup/Add", fixture: "startup-group-add", why: "has no form to drive in the saved page" },
];

describe("write pages that stay in FAP's own content", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.documentElement.removeAttribute("data-fptu-ui");
  });
  afterEach(() => {
    document.getElementById("fptu-ui-host")?.remove();
    delete (window as any).__fptuUi;
  });

  for (const page of WRAPPED_FORM_PAGES) {
    it(`${page.path} is shown wrapped (${page.why}) and nothing is submitted`, async () => {
      expect(registry[page.id]).toBeUndefined();

      const wrapper = document.createElement("div");
      wrapper.className = "wrapper";
      wrapper.innerHTML = SHELL + fixture(page.fixture);
      document.body.appendChild(wrapper);

      let submits = 0;
      document.querySelectorAll("form").forEach((f) => f.addEventListener("submit", (e) => { submits++; e.preventDefault(); }));
      const original = Array.from(document.querySelectorAll("form"));

      const win = { location: { pathname: page.path }, document: window.document, customElements: window.customElements } as unknown as Window;
      await boot({ win, timeoutMs: 100 });

      const host = document.getElementById("fptu-ui-host");
      expect(host).not.toBe(null);
      expect(document.documentElement.getAttribute("data-fptu-ui")).toBe("active");
      // FAP's own forms are still the very same nodes, now inside the frame.
      original.forEach((f) => expect(host!.contains(f)).toBe(true));
      expect(submits).toBe(0);
    });
  }
});
