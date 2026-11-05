import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/i18n";
import { LoginPage } from "./Login";

const info = {
  title: "Hệ thống quản lý đào tạo",
  subtitle: "Chọn cách đăng nhập",
  tabs: [{ id: "staff" as const, label: "Cán bộ & Sinh viên" }, { id: "parent" as const, label: "Phụ huynh" }],
  hasStaffLogin: true,
  hasParentForm: true,
  messages: [] as Array<{ tone: "success" | "danger" | "warning" | "info"; text: string }>,
};

const show = (over: Partial<typeof info> = {}) =>
  render(
    <I18nProvider lang="vi">
      <LoginPage info={{ ...info, ...over }} />
    </I18nProvider>
  );

describe("LoginPage", () => {
  it("shows the logo, the title and subtitle FAP gives, and a slot for FAP's own sign-in block", () => {
    const { container } = show();
    expect(screen.getByRole("img", { name: /FPT/ })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Hệ thống quản lý đào tạo" })).not.toBeNull();
    expect(screen.getByText("Chọn cách đăng nhập")).not.toBeNull();
    expect(container.querySelector('slot[name="fap-login"]')).not.toBeNull();
  });

  it("does not render any input of its own: the credentials stay in FAP's block", () => {
    const { container } = show();
    expect(container.querySelector("input, textarea")).toBeNull();
  });

  it("shows FAP's error and expiry messages, announcing errors", () => {
    show({ messages: [{ tone: "danger", text: "Sai tên đăng nhập hoặc mật khẩu" }, { tone: "info", text: "Phiên đã hết hạn" }] });
    expect(screen.getByRole("alert").textContent).toBe("Sai tên đăng nhập hoặc mật khẩu");
    expect(screen.getByText("Phiên đã hết hạn")).not.toBeNull();
  });

  it("shows text that looks like HTML as text", () => {
    const { container } = show({ title: "<img src=x onerror=alert(1)>" });
    expect(container.querySelector("img[src='x']")).toBeNull();
    expect(screen.getByRole("heading").textContent).toBe("<img src=x onerror=alert(1)>");
  });
});
