import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React from "react";
import { Calendar } from "lucide-react";
import {
  Button,
  Badge,
  StatusBadge,
  Avatar,
  AvatarFallback,
  IconTile,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  Skeleton,
  Separator,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Switch,
} from "./index";

describe("atoms component suite", () => {
  it("renders Button with proper token classes", () => {
    const { getByRole } = render(
      <>
        <Button variant="primary">Click</Button>
        <Button>Default</Button>
      </>
    );
    const btnPrimary = getByRole("button", { name: "Click" });
    expect(btnPrimary.className).toContain("bg-primary");
    expect(btnPrimary.className).toContain("text-primary-foreground");

    const btnDefault = getByRole("button", { name: "Default" });
    expect(btnDefault.className).toContain("bg-ink");
  });

  it("renders Badge with default token classes", () => {
    const { getByText } = render(<Badge>Status</Badge>);
    const badge = getByText("Status");
    expect(badge.className).toContain("bg-primary");
  });

  it("renders StatusBadge with tone classes and dot indicator", () => {
    const { getByText: getByTextSuccess } = render(
      <StatusBadge tone="success">Attended</StatusBadge>
    );
    const badge = getByTextSuccess("Attended");
    expect(badge.className).toContain("bg-success-soft");
    expect(badge.className).toContain("text-success-strong");

    const { container: containerDot } = render(
      <StatusBadge tone="success" dot>With Dot</StatusBadge>
    );
    const dot = containerDot.querySelector(".rounded-full.bg-success");
    expect(dot).not.toBeNull();
  });

  it("renders IconTile with Lucide SVG icon", () => {
    const { container } = render(
      <IconTile icon={Calendar} tone="lavender" />
    );
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.className).toContain("bg-primary-soft");
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("renders Avatar and AvatarFallback", () => {
    const { getByText } = render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    expect(getByText("JD")).not.toBeNull();
  });

  it("renders Input with form token classes", () => {
    const { container } = render(<Input placeholder="Search..." />);
    const input = container.querySelector("input");
    expect(input).not.toBeNull();
    expect(input?.className).toContain("border-input");
  });

  it("renders Tabs and TabsTrigger", () => {
    const { getByRole } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(getByRole("tab", { name: "Tab 1" })).not.toBeNull();
  });

  it("renders Skeleton with animation classes", () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    const skeleton = container.firstElementChild as HTMLElement;
    expect(skeleton.className).toContain("animate-pulse");
  });

  it("renders Separator with divider classes", () => {
    const { container } = render(<Separator />);
    const sep = container.firstElementChild as HTMLElement;
    expect(sep.className).toContain("bg-border");
  });

  it("renders Tooltip wrapper without crashing", () => {
    const { getByText } = render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger asChild>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(getByText("Hover me")).not.toBeNull();
  });
});


describe("Switch atom", () => {
  it("exposes its state and name to assistive tech and toggles through onCheckedChange", () => {
    const onChange = vi.fn();
    const { getByRole, rerender } = render(<Switch checked label="Bật giao diện" onCheckedChange={onChange} />);

    const sw = getByRole("switch", { name: "Bật giao diện" });
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(sw.className).toContain("bg-primary-strong");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(false);

    rerender(<Switch checked={false} label="Bật giao diện" onCheckedChange={onChange} />);
    expect(getByRole("switch").getAttribute("aria-checked")).toBe("false");
    fireEvent.click(getByRole("switch"));
    expect(onChange).toHaveBeenLastCalledWith(true);
  });
});
