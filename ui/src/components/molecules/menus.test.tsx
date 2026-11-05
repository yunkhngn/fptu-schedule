import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CampusMenu } from "./CampusMenu";
import { LanguageMenu } from "./LanguageMenu";
import { TopNavigation } from "@/components/organisms/TopNavigation";

describe("CampusMenu and LanguageMenu components", () => {
  it("CampusMenu displays name, code, 'Chính' and has no switch button", () => {
    const campus = {
      name: "Cơ sở Hà Nội (HN)",
      code: "HN",
      isMain: true,
    };

    const { container } = render(<CampusMenu campus={campus} />);
    const trigger = screen.getByRole("button", { name: /Cơ sở Hà Nội/i });
    expect(trigger).toBeDefined();

    // Open menu
    fireEvent.click(trigger);
    expect(screen.getAllByText("Cơ sở Hà Nội (HN)").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("HN")).toBeDefined();
    expect(screen.getByText(/Chính/i)).toBeDefined();

    // Must NOT have a switch button
    expect(screen.queryByRole("button", { name: /Đổi cơ sở/i })).toBeNull();
  });

  it("CampusMenu returns null when campus is null", () => {
    const { container } = render(<CampusMenu campus={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("LanguageMenu lists language options with aria-checked and triggers onSelect", () => {
    const language = {
      current: "vi",
      options: [
        { culture: "vi", label: "Tiếng Việt" },
        { culture: "en", label: "English" },
      ],
    };
    const handleSelect = vi.fn();

    render(<LanguageMenu language={language} onSelect={handleSelect} />);
    const trigger = screen.getByRole("button", { name: /Tiếng Việt/i });
    fireEvent.click(trigger);

    const viOption = screen.getByRole("menuitemradio", { name: /Tiếng Việt/i });
    expect(viOption.getAttribute("aria-checked")).toBe("true");

    const enOption = screen.getByRole("menuitemradio", { name: /English/i });
    expect(enOption.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(enOption);
    expect(handleSelect).toHaveBeenCalledWith("en");
  });

  it("LanguageMenu returns null when language is null", () => {
    const { container } = render(<LanguageMenu language={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("TopNavigation hides campus and language buttons when topbar data is null or omitted", () => {
    const shell = {
      student: { name: "Nguyễn Văn A", initials: "NA", studentId: "SE000000" },
      campus: "",
      unreadNotifications: 0,
    };

    render(
      <TopNavigation
        shell={shell}
        topbar={{
          campus: null,
          language: null,
          notifications: null,
          profile: null,
        }}
      />
    );

    expect(screen.queryByRole("button", { name: /Cơ sở/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Ngôn ngữ/i })).toBeNull();
  });
});
