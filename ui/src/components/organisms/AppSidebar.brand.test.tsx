import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppSidebar } from "./AppSidebar";

const shell = {
  student: { name: "Nguyễn Văn A", initials: "NA", studentId: "SE000000" },
  campus: "Cơ sở Hà Nội (HN)",
  unreadNotifications: 0,
};

describe("AppSidebar brand", () => {
  it("shows the logo alone and centred, with no graduation-cap icon and no text repeating its name", () => {
    const { container } = render(<AppSidebar shell={shell} activePath="/" />);

    const logo = screen.getByRole("img", { name: /FPT/ });
    expect(screen.queryByText("Trường Đại học FPT")).toBeNull();
    expect(screen.queryByText("FPT Education · FAP")).toBeNull();
    expect(container.querySelector("svg.lucide-graduation-cap")).toBeNull();

    const brand = logo.parentElement!;
    expect(brand.className.split(/\s+/)).toEqual(expect.arrayContaining(["flex", "items-center", "justify-center"]));
  });

  it("falls back to the school's name as text when the logo cannot be shown", () => {
    render(<AppSidebar shell={shell} activePath="/" />);
    fireEvent.error(screen.getByRole("img", { name: /FPT/ }));
    expect(screen.getByText("Trường Đại học FPT")).not.toBeNull();
    expect(screen.queryByRole("img", { name: /FPT/ })).toBeNull();
  });

  it("collapsed: shows the mascot instead of the wide logo, and no text", () => {
    render(<AppSidebar shell={shell} activePath="/" collapsed />);
    expect(screen.getByRole("img", { name: "Linh vật FPTU" })).not.toBeNull();
    expect(screen.queryByRole("img", { name: /FPT Education/ })).toBeNull();
    expect(screen.queryByText("Trường Đại học FPT")).toBeNull();
  });

  it("links the brand logo and collapsed mascot to homepage (/)", () => {
    let navigated = false;
    const { rerender } = render(
      <AppSidebar shell={shell} activePath="/News" onNavigate={() => { navigated = true; }} />
    );

    const link = screen.getByRole("img", { name: /FPT/ }).closest("a");
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe("/");

    fireEvent.click(link!);
    expect(navigated).toBe(true);

    rerender(
      <AppSidebar shell={shell} activePath="/News" collapsed onNavigate={() => { navigated = true; }} />
    );
    const collapsedLink = screen.getByRole("img", { name: "Linh vật FPTU" }).closest("a");
    expect(collapsedLink).not.toBeNull();
    expect(collapsedLink!.getAttribute("href")).toBe("/");
  });
});
