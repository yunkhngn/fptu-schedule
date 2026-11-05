import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "./FilterBar";
import { StatTile } from "./StatTile";
import { KeyValueList } from "./KeyValueList";
import { Section } from "./Section";

describe("data molecules", () => {
  describe("FilterBar", () => {
    it("renders label, options and calls onChange with selected value", () => {
      const onChange = vi.fn();
      const options = [
        { value: "opt1", label: "Option 1" },
        { value: "opt2", label: "Option 2" },
      ];
      render(<FilterBar label="Học kỳ" value="opt1" options={options} onChange={onChange} />);

      expect(screen.getByText("Học kỳ")).toBeTruthy();
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("opt1");

      fireEvent.change(select, { target: { value: "opt2" } });
      expect(onChange).toHaveBeenCalledWith("opt2");
    });
  });

  describe("StatTile", () => {
    it("renders label, value, and hint, showing em dash when value is empty", () => {
      const { rerender } = render(<StatTile label="Điểm trung bình" value="8.5" hint="Tích lũy" tone="success" />);
      expect(screen.getByText("Điểm trung bình")).toBeTruthy();
      expect(screen.getByText("8.5")).toBeTruthy();
      expect(screen.getByText("Tích lũy")).toBeTruthy();

      rerender(<StatTile label="Số dư" value="" />);
      expect(screen.getByText("—")).toBeTruthy();
    });
  });

  describe("KeyValueList", () => {
    it("renders label and value pairs", () => {
      render(
        <KeyValueList
          items={[
            { label: "Mã sinh viên", value: "SE123456" },
            { label: "Khoa", value: "K16" },
          ]}
        />
      );
      expect(screen.getByText("Mã sinh viên")).toBeTruthy();
      expect(screen.getByText("SE123456")).toBeTruthy();
      expect(screen.getByText("Khoa")).toBeTruthy();
      expect(screen.getByText("K16")).toBeTruthy();
    });
  });

  describe("Section", () => {
    it("renders title, description, action and children", () => {
      render(
        <Section
          title="Thông tin chung"
          description="Chi tiết sinh viên"
          action={<button>Chỉnh sửa</button>}
        >
          <div>Nội dung section</div>
        </Section>
      );
      expect(screen.getByText("Thông tin chung")).toBeTruthy();
      expect(screen.getByText("Chi tiết sinh viên")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Chỉnh sửa" })).toBeTruthy();
      expect(screen.getByText("Nội dung section")).toBeTruthy();
    });
  });
});
