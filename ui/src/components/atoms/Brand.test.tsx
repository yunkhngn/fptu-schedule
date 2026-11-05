import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { Mascot, BrandLogo } from "./Brand";

describe("Mascot", () => {
  it("draws the FPTU mascot inline, named for assistive tech, and sized by CSS rather than by the file's 1000px", () => {
    const { container } = render(<Mascot className="size-12" />);

    const wrapper = screen.getByRole("img", { name: "Linh vật FPTU" });
    expect(wrapper.className).toContain("size-12");
    const svg = container.querySelector("svg")!;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute("viewBox")).toBe("0 0 2122 2122");
    expect(svg.getAttribute("width")).toBeNull();
    expect(svg.getAttribute("height")).toBeNull();
    // Decorative inside the labelled wrapper, so it is not announced twice.
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("is our own bundled artwork: no scripts, no event handlers, no remote references", () => {
    const { container } = render(<Mascot />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/<script|\son\w+=|href="https?:|xlink:href="https?:/i);
  });
});

describe("BrandLogo", () => {
  it("shows the FPT logo as an image with a text alternative", () => {
    render(<BrandLogo className="h-12" />);
    const img = screen.getByRole("img", { name: /FPT/ }) as HTMLImageElement;
    expect(img.tagName).toBe("IMG");
    // Bundled into the script as a data URI, so the page's own image rules cannot block it.
    expect(img.getAttribute("src")).toMatch(/^data:image\/webp;base64,/);
    expect(img.className).toContain("h-12");
  });

  it("disappears and tells the caller when the image cannot be shown, so the text beside it stays the brand", () => {
    const onFail = vi.fn();
    const { container } = render(<BrandLogo onFail={onFail} />);
    fireEvent.error(screen.getByRole("img", { name: /FPT/ }));
    expect(container.querySelector("img")).toBeNull();
    expect(onFail).toHaveBeenCalledTimes(1);
  });
});
