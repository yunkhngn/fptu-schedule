import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileMenu } from "./ProfileMenu";

describe("ProfileMenu component", () => {
  const profile = {
    name: "Nguyen Van A",
    studentId: "HE123456",
    accountHref: "/Account/Manage",
    canLogout: true,
  };

  it("renders student name and student ID in trigger button", () => {
    render(<ProfileMenu profile={profile} />);
    expect(screen.getByText("Nguyen Van A")).toBeDefined();
    expect(screen.getByText("HE123456")).toBeDefined();
  });

  it("opens menu on click and displays account link and logout button", () => {
    const handleLogout = vi.fn();
    render(<ProfileMenu profile={profile} onLogout={handleLogout} />);

    const trigger = screen.getByRole("button", { name: /Nguyen Van A/i });
    fireEvent.click(trigger);

    const accountLink = screen.getByRole("menuitem", { name: /Tài khoản của tôi/i });
    expect(accountLink.getAttribute("href")).toBe("/Account/Manage");

    const logoutBtn = screen.getByRole("menuitem", { name: /Đăng xuất/i });
    expect(logoutBtn).toBeDefined();

    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("hides logout button when canLogout is false", () => {
    const profileNoLogout = {
      ...profile,
      canLogout: false,
    };
    render(<ProfileMenu profile={profileNoLogout} />);

    fireEvent.click(screen.getByRole("button", { name: /Nguyen Van A/i }));

    expect(screen.queryByRole("menuitem", { name: /Đăng xuất/i })).toBeNull();
  });

  it("handles null profile gracefully", () => {
    render(<ProfileMenu profile={null} fallbackName="Student" fallbackStudentId="ID000" />);
    expect(screen.getByText("Student")).toBeDefined();
    expect(screen.getByText("ID000")).toBeDefined();
  });
});

