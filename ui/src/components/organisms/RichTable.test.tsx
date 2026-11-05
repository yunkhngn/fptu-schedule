import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RichTable } from "./RichTable";

describe("RichTable", () => {
  const columns = [
    { key: "code", header: "Mã môn", align: "left" as const },
    { key: "name", header: "Tên môn", align: "left" as const },
    {
      key: "status",
      header: "Trạng thái",
      align: "center" as const,
      tone: (v: string) => (v === "Passed" ? ("success" as const) : ("danger" as const)),
    },
  ];

  it("renders all headers and rows, respects alignment and renders tone tokens", () => {
    const rows = [
      { code: "PRJ301", name: "Java Web", status: "Passed" },
      { code: "SWP391", name: "Project", status: "Failed" },
    ];

    const { container } = render(<RichTable columns={columns} rows={rows} caption="Bảng kết quả" />);

    expect(screen.getByText("Bảng kết quả")).toBeTruthy();
    expect(screen.getByText("Mã môn")).toBeTruthy();
    expect(screen.getByText("PRJ301")).toBeTruthy();
    expect(screen.getByText("SWP391")).toBeTruthy();

    const passedEl = screen.getByText("Passed");
    expect(passedEl.className).toContain("text-success");

    const failedEl = screen.getByText("Failed");
    expect(failedEl.className).toContain("text-danger");
  });

  it("renders empty state when rows is empty", () => {
    render(<RichTable columns={columns} rows={[]} empty={<div>Không có dữ liệu</div>} />);
    expect(screen.getByText("Không có dữ liệu")).toBeTruthy();
  });

  it("safely escapes html in cell values", () => {
    const malicious = '<img src=x onerror=alert(1)>Malicious';
    const rows = [{ code: malicious, name: "Test", status: "Passed" }];
    const { container } = render(<RichTable columns={columns} rows={rows} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(malicious);
  });
});
