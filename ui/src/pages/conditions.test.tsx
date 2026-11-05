import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OjtConditions } from "./OjtConditions";
import { ThesisConditions } from "./ThesisConditions";

describe("Condition Pages", () => {
  const dummyShell = {
    student: { name: "Nguyễn Văn A", initials: "NA", studentId: "SE123456" },
    campus: "Hà Nội",
    unreadNotifications: 0,
  };

  describe("OjtConditions", () => {
    it("renders page header and eligible summary banner", () => {
      const data = {
        summary: { eligible: true, message: "Đủ điều kiện tham gia OJT" },
        checks: [
          { label: "Số tín chỉ tích lũy", required: ">= 90", actual: "105", passed: true },
          { label: "Tiếng Anh", required: "Level 6", actual: "Level 6", passed: true },
        ],
      };

      render(<OjtConditions data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Điều kiện xét OJT")).toBeTruthy();
      expect(screen.getByText("Đủ điều kiện tham gia OJT")).toBeTruthy();
      expect(screen.getByText("Số tín chỉ tích lũy")).toBeTruthy();
    });

    it("renders empty state or indeterminate banner when checks are empty", () => {
      const data = {
        summary: { eligible: null, message: "Chưa có thông báo điều kiện" },
        checks: [],
      };

      render(<OjtConditions data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Điều kiện xét OJT")).toBeTruthy();
      expect(screen.getByText("Chưa có thông báo điều kiện")).toBeTruthy();
    });
  });

  describe("ThesisConditions", () => {
    it("renders page header, status badges, and checks", () => {
      const data = {
        summary: { eligible: false, message: "Chưa đủ điều kiện xét khóa luận" },
        checks: [
          { label: "Tín chỉ chuyên ngành", required: ">= 120", actual: "115", passed: false },
        ],
      };

      render(<ThesisConditions data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Điều kiện xét KLTN")).toBeTruthy();
      expect(screen.getByText("Chưa đủ điều kiện xét khóa luận")).toBeTruthy();
      expect(screen.getByText("Tín chỉ chuyên ngành")).toBeTruthy();
    });
  });
});
