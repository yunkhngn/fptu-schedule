import { describe, it, expect, beforeEach, vi } from "vitest";
import { setFieldValue, submitForm } from "./formActions";

const FORM = "#f";

function page(inner: string) {
  document.body.innerHTML = `<form id="f" method="post" action="/x">${inner}<button type="submit" id="go">Lưu</button></form>`;
}

describe("setFieldValue writes into FAP's own control", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("changes the original value and fires input then change, so FAP's scripts and validation react", () => {
    page(`<input name="Form.Address" type="text" value="cũ">`);
    const el = document.querySelector<HTMLInputElement>('[name="Form.Address"]')!;
    const seen: string[] = [];
    el.addEventListener("input", () => seen.push("input:" + el.value));
    el.addEventListener("change", () => seen.push("change:" + el.value));

    expect(setFieldValue(document, FORM, "Form.Address", "mới")).toBe(true);

    expect(el.value).toBe("mới");
    expect(seen).toEqual(["input:mới", "change:mới"]);
  });

  it("selects an option, ticks a checkbox and picks a radio", () => {
    page(`
      <select name="S"><option value="">--</option><option value="a">A</option><option value="b">B</option></select>
      <input type="checkbox" name="C">
      <input type="radio" name="R" value="x"><input type="radio" name="R" value="y">`);

    expect(setFieldValue(document, FORM, "S", "b")).toBe(true);
    expect(document.querySelector<HTMLSelectElement>('[name="S"]')!.value).toBe("b");

    expect(setFieldValue(document, FORM, "C", "true")).toBe(true);
    expect(document.querySelector<HTMLInputElement>('[name="C"]')!.checked).toBe(true);
    expect(setFieldValue(document, FORM, "C", "false")).toBe(true);
    expect(document.querySelector<HTMLInputElement>('[name="C"]')!.checked).toBe(false);

    expect(setFieldValue(document, FORM, "R", "y")).toBe(true);
    expect(document.querySelector<HTMLInputElement>('[name="R"][value="y"]')!.checked).toBe(true);
  });

  it("refuses read-only and disabled controls, unknown names and a missing form", () => {
    page(`<input name="Ro" readonly value="khóa"><input name="Dis" disabled value="tắt">`);
    expect(setFieldValue(document, FORM, "Ro", "x")).toBe(false);
    expect(setFieldValue(document, FORM, "Dis", "x")).toBe(false);
    expect(document.querySelector<HTMLInputElement>('[name="Ro"]')!.value).toBe("khóa");
    expect(setFieldValue(document, FORM, "Nope", "x")).toBe(false);
    expect(setFieldValue(document, "#absent", "Ro", "x")).toBe(false);
  });

  it("never writes into password fields or the anti-forgery token", () => {
    page(`<input name="Password" type="password" value=""><input type="hidden" name="__RequestVerificationToken" value="t">`);
    expect(setFieldValue(document, FORM, "Password", "hunter2")).toBe(false);
    expect(setFieldValue(document, FORM, "__RequestVerificationToken", "x")).toBe(false);
    expect(document.querySelector<HTMLInputElement>('[name="Password"]')!.value).toBe("");
  });
});

describe("submitForm presses FAP's own submit button, once", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("clicks the original button a single time, however often it is called", () => {
    page(`<input name="A" value="1">`);
    const form = document.getElementById("f") as HTMLFormElement;
    form.addEventListener("submit", (e) => e.preventDefault());
    const click = vi.fn();
    document.getElementById("go")!.addEventListener("click", click);
    const submitSpy = vi.spyOn(form, "submit");

    expect(submitForm(document, FORM)).toBe(true);
    expect(submitForm(document, FORM)).toBe(false);
    expect(click).toHaveBeenCalledTimes(1);
    expect(submitSpy).not.toHaveBeenCalled(); // never form.submit(): FAP's validation and tokens must run
  });

  it("reports false when there is no form or no submit button", () => {
    document.body.innerHTML = `<form id="f"><input name="A"></form>`;
    expect(submitForm(document, FORM)).toBe(false);
    expect(submitForm(document, "#absent")).toBe(false);
  });
});
