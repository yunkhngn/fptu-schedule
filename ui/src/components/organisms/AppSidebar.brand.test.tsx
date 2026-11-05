import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppSidebar } from "./AppSidebar";

const shell = {
  student: { name: "Nguyễn Văn A", initials: "NA", studentId: "SE000000" },
  campus: "Cơ sở Hà Nội (HN)",
  unreadNotifications: 0,
};

describe("AppSidebar brand", () => {
  it("puts the logo on top, above the name, and no longer shows the graduation-cap icon", () => {
    const { container } = render(<AppSidebar shell={shell} activePath="/" />);

    const logo = screen.getByRole("img", { name: /FPT/ });
    const title = screen.getByText("Trường Đại học FPT");
    expect(logo.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector("svg.lucide-graduation-cap")).toBeNull();
  });

  it("collapsed: shows the mascot instead of the wide logo, and no text", () => {
    render(<AppSidebar shell={shell} activePath="/" collapsed />);
    expect(screen.getByRole("img", { name: "Linh vật FPTU" })).not.toBeNull();
    expect(screen.queryByRole("img", { name: /FPT$/ })).toBeNull();
    expect(screen.queryByText("Trường Đại học FPT")).toBeNull();
  });
});
