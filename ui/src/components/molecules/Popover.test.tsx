import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Popover } from "./Popover";

describe("Popover component", () => {
  it("renders trigger and expands popover on click", () => {
    render(
      <Popover
        label="Test Menu"
        trigger={({ props, ref }) => (
          <button ref={ref} {...props}>
            Open Menu
          </button>
        )}
      >
        {({ close }) => (
          <div>
            <p>Menu Content</p>
            <button onClick={close}>Action</button>
          </div>
        )}
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(screen.queryByText("Menu Content")).toBeNull();

    // Click to open
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Menu Content")).toBeDefined();

    // Panel uses token classes
    const panel = screen.getByRole("menu");
    expect(panel.className).toContain("bg-popover");
    expect(panel.className).toContain("border-border");
  });

  it("closes on Escape and returns focus to trigger button", () => {
    render(
      <Popover
        label="Test Menu"
        trigger={({ props, ref }) => (
          <button ref={ref} {...props}>
            Open Menu
          </button>
        )}
      >
        {() => <div>Menu Content</div>}
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    fireEvent.click(trigger);
    expect(screen.getByText("Menu Content")).toBeDefined();

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByText("Menu Content")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("closes when clicking outside but stays open when clicking inside", () => {
    render(
      <div>
        <div data-testid="outside">Outside Area</div>
        <Popover
          label="Test Menu"
          trigger={({ props, ref }) => (
            <button ref={ref} {...props}>
              Open Menu
            </button>
          )}
        >
          {() => <div data-testid="inside">Menu Content</div>}
        </Popover>
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    fireEvent.click(trigger);
    expect(screen.getByTestId("inside")).toBeDefined();

    // Click inside
    fireEvent.pointerDown(screen.getByTestId("inside"));
    expect(screen.getByTestId("inside")).toBeDefined();

    // Click outside
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(screen.queryByTestId("inside")).toBeNull();
  });

  it("opening a second popover automatically closes the first", () => {
    render(
      <div>
        <Popover
          label="Menu 1"
          trigger={({ props, ref }) => (
            <button ref={ref} {...props}>
              Open 1
            </button>
          )}
        >
          {() => <div>Content 1</div>}
        </Popover>
        <Popover
          label="Menu 2"
          trigger={({ props, ref }) => (
            <button ref={ref} {...props}>
              Open 2
            </button>
          )}
        >
          {() => <div>Content 2</div>}
        </Popover>
      </div>
    );

    const trigger1 = screen.getByRole("button", { name: "Open 1" });
    const trigger2 = screen.getByRole("button", { name: "Open 2" });

    fireEvent.click(trigger1);
    expect(screen.getByText("Content 1")).toBeDefined();
    expect(screen.queryByText("Content 2")).toBeNull();

    fireEvent.click(trigger2);
    expect(screen.queryByText("Content 1")).toBeNull();
    expect(screen.getByText("Content 2")).toBeDefined();
  });

  it("calls close from children content to dismiss", () => {
    render(
      <Popover
        label="Test Menu"
        trigger={({ props, ref }) => (
          <button ref={ref} {...props}>
            Open Menu
          </button>
        )}
      >
        {({ close }) => (
          <div>
            <button onClick={close}>Select Item</button>
          </div>
        )}
      </Popover>
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Select Item" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));
    expect(screen.queryByRole("button", { name: "Select Item" })).toBeNull();
  });
});
