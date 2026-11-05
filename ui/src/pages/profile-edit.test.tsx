import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { I18nProvider } from "@/i18n";
import { registry } from "./registry";
import { StudentProfileEdit } from "./StudentProfileEdit";

const profileHtml = fs.readFileSync(path.resolve(__dirname, "../../../tests/fixtures/pages/student-profile.html"), "utf8");
const SELECTOR = 'form[action$="/StudentProfile"]';

function mountOriginal(extra = "") {
  document.body.innerHTML = `<div id="fap">${extra}${profileHtml}</div>`;
  const form = document.querySelector<HTMLFormElement>(SELECTOR)!;
  form.addEventListener("submit", (e) => e.preventDefault());
  return form;
}

const shell = { student: { name: "A", initials: "A", studentId: "SE1" }, campus: "HN", unreadNotifications: 0 };

function show(doc = document) {
  const def = registry["student-profile"];
  const data = def.read(doc, window);
  return { def, data, ...render(<I18nProvider lang="vi">{def.Component({ data, shell, lang: "vi" })}</I18nProvider>) };
}

describe("student profile editing", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is a registered page that reads the profile form", () => {
    mountOriginal();
    const data = registry["student-profile"].read(document, window);
    expect(data.form.fields.length).toBeGreaterThan(5);
    expect(data.selector).toBe(SELECTOR);
  });

  it("falls back to FAP's own page when the form has something we cannot drive (a file input)", () => {
    mountOriginal();
    document.querySelector(SELECTOR)!.insertAdjacentHTML("beforeend", `<input type="file" name="Photo">`);
    expect(registry["student-profile"].read(document, window)).toBeNull();
  });

  it("falls back when the page has no profile form", () => {
    document.body.innerHTML = "<p>nothing</p>";
    expect(registry["student-profile"].read(document, window)).toBeNull();
  });

  it("shows read-only data locked and the editable fields as inputs", () => {
    mountOriginal();
    const { container } = show();
    const page = within(container);

    expect(page.getByText("Bảo hiểm y tế")).not.toBeNull();
    // Editable: reachable by label, writes into FAP's own control
    const place = page.getByLabelText(/Nơi cấp/) as HTMLInputElement;
    fireEvent.change(place, { target: { value: "Hà Nội" } });
    expect((document.querySelector('[name="Form.PlaceOfIssue"]') as HTMLInputElement).value).toBe("Hà Nội");
    // Read-only birth date is text, not an input
    expect(container.querySelectorAll("input[readonly]").length).toBe(0);
  });

  it("saves through FAP's own button, once, however often it is pressed", () => {
    const form = mountOriginal();
    let presses = 0;
    form.querySelector('button[type="submit"]')!.addEventListener("click", () => presses++);
    const { container } = show();

    const save = within(container).getByRole("button", { name: "Lưu thông tin" });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(presses).toBe(1);
  });

  it("shows FAP's own success or error messages from the page", () => {
    mountOriginal(`<div class="alert alert-success" role="alert">Đã lưu thông tin</div><div class="alert alert-danger">Có lỗi khi lưu</div>`);
    const { container } = show();
    const page = within(container);
    expect(page.getByText("Đã lưu thông tin")).not.toBeNull();
    expect(page.getByText("Có lỗi khi lưu")).not.toBeNull();
  });

  it("never writes what the student types or reads to the console or to storage", () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    mountOriginal();
    const { container } = show();

    fireEvent.change(within(container).getByLabelText(/Địa chỉ theo sổ hộ khẩu/), { target: { value: "SECRET-ADDRESS-123" } });
    fireEvent.click(within(container).getByRole("button", { name: "Lưu thông tin" }));

    const printed = spies.flatMap((s) => s.mock.calls).map((c) => c.map(String).join(" ")).join("\n");
    expect(printed).not.toContain("SECRET-ADDRESS-123");
    expect(setItem).not.toHaveBeenCalled();
  });
});
