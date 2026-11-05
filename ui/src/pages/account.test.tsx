import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { Account } from "./Account";

describe("Account page component", () => {
  it("renders all sections and their key-value items", () => {
    render(
      <Account
        data={{
          sections: [
            {
              title: "Định danh",
              items: [
                { label: "Mã sinh viên", value: "HE190183" },
                { label: "Giới tính", value: "Nam" },
              ],
            },
            {
              title: "Học thuật",
              items: [
                { label: "Ngành học", value: "Kỹ thuật phần mềm" },
                { label: "Chuyên ngành hẹp", value: "—" },
              ],
            },
          ],
          editHref: "/StudentProfile",
        }}
        shell={{
          student: { name: "Nguyễn Văn A", initials: "NA", studentId: "HE190183" },
          campus: "HN",
          unreadNotifications: 0,
        }}
      />
    );

    expect(screen.getByText("Định danh")).toBeTruthy();
    expect(screen.getByText("Mã sinh viên")).toBeTruthy();
    expect(screen.getByText("HE190183")).toBeTruthy();
    expect(screen.getByText("Học thuật")).toBeTruthy();
    expect(screen.getByText("Ngành học")).toBeTruthy();
    expect(screen.getByText("Kỹ thuật phần mềm")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();

    const editBtn = screen.getByRole("link", { name: /Cập nhật hồ sơ/i });
    expect(editBtn).toBeTruthy();
    expect(editBtn.getAttribute("href")).toBe("/StudentProfile");
  });

  it("does not render update button when editHref is null", () => {
    render(
      <Account
        data={{
          sections: [
            {
              title: "Định danh",
              items: [{ label: "Họ và tên", value: "Nguyễn Văn A" }],
            },
          ],
          editHref: null,
        }}
        shell={{
          student: { name: "Nguyễn Văn A", initials: "NA", studentId: "HE190183" },
          campus: "HN",
          unreadNotifications: 0,
        }}
      />
    );

    expect(screen.queryByRole("link", { name: /Cập nhật hồ sơ/i })).toBeNull();
  });
});
