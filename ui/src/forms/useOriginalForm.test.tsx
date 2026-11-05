import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOriginalForm } from "./useOriginalForm";

const FORM = "#f";

function page() {
  document.body.innerHTML = `
    <form id="f" method="post" action="/x">
      <label for="p">Tỉnh</label>
      <select id="p" name="Form.ProvinceId"><option value="">--</option><option value="hn">Hà Nội</option><option value="hcm">TP.HCM</option></select>
      <label for="w">Phường</label>
      <select id="w" name="Form.WardId"><option value="">--</option><option value="w1">Phường 1</option></select>
      <label for="a">Địa chỉ</label>
      <input id="a" name="Form.Address" type="text" value="">
      <span data-valmsg-for="Form.Address"></span>
      <button type="submit">Lưu</button>
    </form>`;
  return document.getElementById("f") as HTMLFormElement;
}

describe("useOriginalForm", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the form and writes edits into the original controls", () => {
    page();
    const { result } = renderHook(() => useOriginalForm(document, FORM));

    expect(result.current.form?.fields.map((f) => f.name)).toEqual(["Form.ProvinceId", "Form.WardId", "Form.Address"]);

    act(() => result.current.setValue("Form.Address", "12 Phố Huế"));
    expect(result.current.values["Form.Address"]).toBe("12 Phố Huế");
    expect((document.getElementById("a") as HTMLInputElement).value).toBe("12 Phố Huế");
  });

  it("follows options that FAP's own script loads after a choice (province then ward) and drops a stale draft", async () => {
    const form = page();
    // FAP's script: when the province changes, the ward list is replaced.
    document.getElementById("p")!.addEventListener("change", () => {
      document.getElementById("w")!.innerHTML = `<option value="">--</option><option value="x9">Phường 9</option>`;
    });
    const { result } = renderHook(() => useOriginalForm(document, FORM));

    act(() => result.current.setValue("Form.WardId", "w1"));
    expect(result.current.values["Form.WardId"]).toBe("w1");

    act(() => result.current.setValue("Form.ProvinceId", "hcm"));
    await waitFor(() => {
      const ward = result.current.form!.fields.find((f) => f.name === "Form.WardId")!;
      expect(ward.options!.map((o) => o.value)).toEqual(["", "x9"]);
    });
    // The ward the student had picked no longer exists in the new list.
    expect(result.current.values["Form.WardId"]).toBeUndefined();
    expect(form).toBeTruthy();
  });

  it("shows a validation message that FAP's script writes next to a field", async () => {
    page();
    const { result } = renderHook(() => useOriginalForm(document, FORM));
    act(() => {
      document.querySelector('[data-valmsg-for="Form.Address"]')!.textContent = "Địa chỉ quá dài";
    });
    await waitFor(() => {
      expect(result.current.form!.fields.find((f) => f.name === "Form.Address")!.error).toBe("Địa chỉ quá dài");
    });
  });

  it("submits through the original button once, and lets the student try again when FAP's validation stops it", () => {
    vi.useFakeTimers();
    const form = page();
    form.addEventListener("submit", (e) => e.preventDefault());
    const clicks = vi.fn();
    form.querySelector("button")!.addEventListener("click", clicks);
    const { result } = renderHook(() => useOriginalForm(document, FORM));

    act(() => result.current.submit());
    act(() => result.current.submit()); // a double click
    expect(clicks).toHaveBeenCalledTimes(1);
    expect(result.current.submitting).toBe(true);

    // The page did not navigate away: FAP's own validation refused the form.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.submitting).toBe(false);

    act(() => result.current.submit());
    expect(clicks).toHaveBeenCalledTimes(2);
  });

  it("gives null when the form is not on the page", () => {
    document.body.innerHTML = "<p>nothing</p>";
    const { result } = renderHook(() => useOriginalForm(document, FORM));
    expect(result.current.form).toBeNull();
  });
});
