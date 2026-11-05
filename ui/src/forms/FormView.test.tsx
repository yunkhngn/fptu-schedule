import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { I18nProvider } from "@/i18n";
import { FormView, type FormModel } from "./FormView";

const model = (over: Partial<FormModel> = {}): FormModel => ({
  fields: [
    { name: "", label: "Ngày sinh", type: "date", value: "2002-01-01", readOnly: true, required: false, group: "Cá nhân" },
    { name: "Form.Address", label: "Địa chỉ", type: "text", value: "", readOnly: false, required: true, maxLength: 20, group: "Liên hệ" },
    {
      name: "Form.Ethnic",
      label: "Dân tộc",
      type: "select",
      value: "",
      readOnly: false,
      required: false,
      options: [{ value: "", label: "-- Chọn --" }, { value: "k", label: "Kinh" }],
      group: "Liên hệ",
    },
  ],
  action: "/x",
  method: "post",
  submitLabel: "Lưu thông tin",
  unsupported: false,
  unsupportedReasons: [],
  ...over,
});

function setup(m: FormModel, props: Partial<React.ComponentProps<typeof FormView>> = {}) {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  render(
    <I18nProvider lang="vi">
      <FormView form={m} values={{}} onChange={onChange} onSubmit={onSubmit} {...props} />
    </I18nProvider>
  );
  return { onChange, onSubmit };
}

describe("FormView", () => {
  it("groups fields under their headings, shows read-only data locked and labels every control", () => {
    setup(model());
    expect(screen.getByText("Cá nhân")).not.toBeNull();
    expect(screen.getByText("Liên hệ")).not.toBeNull();
    // read-only: shown as text, not as an editable control
    expect(screen.getByText("2002-01-01")).not.toBeNull();
    expect(screen.queryByDisplayValue("2002-01-01")).toBeNull();
    // editable controls are reachable by their label
    expect(screen.getByLabelText(/Địa chỉ/)).not.toBeNull();
    expect(screen.getByLabelText(/Dân tộc/)).not.toBeNull();
  });

  it("reports edits by field name and limits the length FAP allows", () => {
    const { onChange } = setup(model());
    const address = screen.getByLabelText(/Địa chỉ/) as HTMLInputElement;
    expect(address.maxLength).toBe(20);
    fireEvent.change(address, { target: { value: "12 Phố Huế" } });
    expect(onChange).toHaveBeenCalledWith("Form.Address", "12 Phố Huế");

    fireEvent.change(screen.getByLabelText(/Dân tộc/), { target: { value: "k" } });
    expect(onChange).toHaveBeenLastCalledWith("Form.Ethnic", "k");
  });

  it("shows a typed value over the one read from the page", () => {
    setup(model(), { values: { "Form.Address": "đã gõ" } });
    expect((screen.getByLabelText(/Địa chỉ/) as HTMLInputElement).value).toBe("đã gõ");
  });

  it("keeps the submit button off until every required editable field has a value", () => {
    const { onSubmit } = setup(model());
    const submit = screen.getByRole("button", { name: "Lưu thông tin" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits once the required fields are filled", () => {
    const { onSubmit } = setup(model(), { values: { "Form.Address": "12 Phố Huế" } });
    const submit = screen.getByRole("button", { name: "Lưu thông tin" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables the button and says so while a submission is in progress", () => {
    const { onSubmit } = setup(model(), { values: { "Form.Address": "x" }, submitting: true });
    const submit = screen.getByRole("button", { name: /Đang gửi|Lưu thông tin/ }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows FAP's validation message under the field, and marks the field invalid", () => {
    const m = model();
    m.fields[1].error = "Địa chỉ quá dài";
    setup(m);
    const address = screen.getByLabelText(/Địa chỉ/);
    expect(address.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("Địa chỉ quá dài");
  });

  it("shows text that looks like HTML as text", () => {
    const m = model();
    m.fields[1].label = "<img src=x onerror=alert(1)>";
    const { container } = render(
      <I18nProvider lang="vi">
        <FormView form={m} values={{}} onChange={() => {}} onSubmit={() => {}} />
      </I18nProvider>
    );
    expect(container.querySelector("img")).toBeNull();
    expect(within(container).getByText(/<img src=x onerror=alert\(1\)>/)).not.toBeNull();
  });

  it("handles checkboxes and radio groups", () => {
    const m = model({
      fields: [
        { name: "Agree", label: "Đồng ý", type: "checkbox", value: "false", readOnly: false, required: false },
        {
          name: "Mode", label: "Hình thức", type: "radio", value: "a", readOnly: false, required: false,
          options: [{ value: "a", label: "Trực tiếp" }, { value: "b", label: "Trực tuyến" }],
        },
      ],
    });
    const { onChange } = setup(m);
    fireEvent.click(screen.getByLabelText("Đồng ý"));
    expect(onChange).toHaveBeenLastCalledWith("Agree", "true");
    fireEvent.click(screen.getByLabelText("Trực tuyến"));
    expect(onChange).toHaveBeenLastCalledWith("Mode", "b");
  });
});
