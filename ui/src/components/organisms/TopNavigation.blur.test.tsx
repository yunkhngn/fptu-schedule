import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TopNavigation } from "./TopNavigation";

const shell = {
  student: { name: "Nguyễn Văn A", initials: "NA", studentId: "SE000000" },
  campus: "Cơ sở Hà Nội (HN)",
  unreadNotifications: 0,
};

function backdropLayer(container: HTMLElement) {
  return container.querySelector('header > [data-topbar-backdrop]') as HTMLElement | null;
}

describe("TopNavigation backdrop", () => {
  it("has its own blurred, tinted layer behind the bar, so what scrolls underneath stays out of the way", () => {
    const { container } = render(<TopNavigation shell={shell} />);
    const layer = backdropLayer(container);

    expect(layer).not.toBeNull();
    expect(layer!.getAttribute("aria-hidden")).toBe("true");
    const classes = layer!.className.split(/\s+/);
    expect(classes).toContain("backdrop-blur-xl");
    expect(classes).toContain("bg-background/70");
    expect(classes).toContain("pointer-events-none");
  });

  it("fades the blur out towards the bottom instead of cutting it with a hard edge", () => {
    const { container } = render(<TopNavigation shell={shell} />);
    const layer = backdropLayer(container)!;

    expect(layer.className).toMatch(/mask-image:linear-gradient\(to_bottom,[^\]]*transparent\)/);
    // The fade needs room below the bar; a layer exactly as tall as the bar could not fade.
    expect(layer.className).toMatch(/h-\[calc\(100%\+\d+px\)\]/);
  });

  it("keeps the bar's own controls outside the mask, so they are never faded", () => {
    const { container } = render(<TopNavigation shell={shell} />);
    const header = container.querySelector("header")!;
    expect(header.className).not.toMatch(/backdrop-blur|mask-image/);
    const row = header.querySelector(":scope > div:not([data-topbar-backdrop])") as HTMLElement;
    expect(row.className.split(/\s+/)).toContain("relative");
  });

  it("uses theme tokens only, so the dark theme tints it correctly", () => {
    const { container } = render(<TopNavigation shell={shell} />);
    const header = container.querySelector("header")!;
    const all = header.className + " " + backdropLayer(container)!.className;
    expect(all).not.toMatch(/\bbg-(white|black)\b|#[0-9a-f]{3,8}|rgba?\(/i);
  });
});
