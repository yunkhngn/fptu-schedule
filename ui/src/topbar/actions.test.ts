import { describe, it, expect, vi } from "vitest";
import { submitLanguage } from "./actions";

describe("topbar actions: submitLanguage", () => {
  it("clicks the culture button in the form and prevents duplicate submission", () => {
    document.body.innerHTML = `
      <form action="/Language/SetLanguage" method="post">
        <button name="culture" value="vi">Tiếng Việt</button>
        <button name="culture" value="en">English</button>
      </form>
    `;

    const enBtn = document.querySelector('button[value="en"]') as HTMLButtonElement;
    let clicked = false;
    enBtn.addEventListener("click", (e) => {
      e.preventDefault(); // prevent navigation in test
      clicked = true;
    });

    // First call: returns true and clicks button
    const result1 = submitLanguage(document, "en");
    expect(result1).toBe(true);
    expect(clicked).toBe(true);

    // Second call: blocked by double submission flag, returns false
    const result2 = submitLanguage(document, "en");
    expect(result2).toBe(false);
  });

  it("returns false when form or culture is missing", () => {
    document.body.innerHTML = `
      <form action="/Language/SetLanguage" method="post">
        <button name="culture" value="vi">Tiếng Việt</button>
      </form>
    `;

    // Unknown culture
    expect(submitLanguage(document, "fr")).toBe(false);

    // Empty doc
    const emptyDoc = document.implementation.createHTMLDocument();
    expect(submitLanguage(emptyDoc, "vi")).toBe(false);

    // Null doc
    expect(submitLanguage(null as any, "vi")).toBe(false);
  });
});
