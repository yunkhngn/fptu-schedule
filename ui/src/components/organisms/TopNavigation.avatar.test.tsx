import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopNavigation } from "./TopNavigation";

const shell = {
  student: { name: "Nguyễn Văn A", initials: "NA", studentId: "SE000000" },
  campus: "Cơ sở Hà Nội (HN)",
  unreadNotifications: 0,
};

describe("TopNavigation profile avatar", () => {
  it("shows the FPTU mascot in the avatar circle instead of the student's initials", () => {
    const { container } = render(<TopNavigation shell={shell} />);

    const mascot = screen.getByRole("img", { name: "Linh vật FPTU" });
    expect(container.querySelector("header")!.contains(mascot)).toBe(true);
    // The circle that holds it is the avatar next to the name.
    expect(mascot.parentElement!.className).toContain("rounded-full");
    expect(screen.queryByText("NA")).toBeNull();
  });

  it("still shows the student's name and id beside the avatar", () => {
    render(<TopNavigation shell={shell} />);
    expect(screen.getByText("Nguyễn Văn A")).not.toBeNull();
    expect(screen.getByText("SE000000")).not.toBeNull();
  });
});
