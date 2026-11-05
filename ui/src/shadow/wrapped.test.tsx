import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { adoptContent, resolveWrappedTitle } from "./wrapped";
import { WrappedPage } from "@/pages/Wrapped";

const FIXTURE_PATH = path.resolve(__dirname, "../../../tests/fixtures/pages/subject.html");
const subjectHtml = fs.readFileSync(FIXTURE_PATH, "utf8");

describe("adoptContent and WrappedPage", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("adopts .content-page as a child of host with slot='fap-content'", () => {
    // Setup wrapper and content-page
    const wrapper = document.createElement("div");
    wrapper.className = "wrapper";
    wrapper.innerHTML = subjectHtml;
    const siblingAfter = document.createElement("div");
    siblingAfter.className = "after-content";
    wrapper.appendChild(siblingAfter);
    document.body.appendChild(wrapper);

    const host = document.createElement("div");
    host.id = "fptu-ui-host";
    document.body.appendChild(host);

    const originalContent = document.querySelector(".content-page");
    const originalBtn = originalContent?.querySelector("button, input[type='submit']");
    expect(originalContent).toBeTruthy();
    expect(originalBtn).toBeTruthy();

    const clickSpy = vi.fn();
    originalBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      clickSpy();
    });

    const handle = adoptContent(document, host);
    expect(handle).not.toBeNull();

    // 1. .content-page is child of host
    expect(host.contains(originalContent!)).toBe(true);
    expect(originalContent?.getAttribute("slot")).toBe("fap-content");

    // 2. Nodes inside are the exact same instances
    const newBtn = host.querySelector("button, input[type='submit']");
    expect(newBtn).toBe(originalBtn);

    // 3. Click listener still works
    newBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(clickSpy).toHaveBeenCalledTimes(1);

    // 4. restore() puts node back to exact original parent, before next sibling, removes slot
    handle?.restore();
    expect(wrapper.contains(originalContent!)).toBe(true);
    expect(originalContent?.nextSibling).toBe(siblingAfter);
    expect(originalContent?.hasAttribute("slot")).toBe(false);

    // 5. Calling restore() twice does not throw or duplicate
    expect(() => handle?.restore()).not.toThrow();
    expect(wrapper.contains(originalContent!)).toBe(true);
  });

  it("returns null if .content-page is missing", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const handle = adoptContent(document, host);
    expect(handle).toBeNull();
  });

  it("extracts title from breadcrumb or document.title", () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = subjectHtml;
    document.body.appendChild(wrapper);

    const title = resolveWrappedTitle(document);
    expect(title).toBe("Quản lý môn học");

    // Fallback to document.title without suffix
    wrapper.innerHTML = "";
    document.title = "Tra cứu điểm - FAP - FPT Education";
    expect(resolveWrappedTitle(document)).toBe("Tra cứu điểm");
  });

  it("renders WrappedPage with slot and safely escapes HTML in title", () => {
    const maliciousTitle = '<img src=x onerror=alert(1)>Quản lý môn học';
    const { container } = render(<WrappedPage title={maliciousTitle} />);

    // Slot with name fap-content
    const slot = container.querySelector('slot[name="fap-content"]');
    expect(slot).toBeTruthy();

    // Title is rendered as text, not HTML
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(maliciousTitle);
  });
});
