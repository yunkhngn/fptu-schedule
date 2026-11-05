import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AttendanceReport } from "./AttendanceReport";
import { GradeReport } from "./GradeReport";
import { Transcript } from "./Transcript";

describe("Report Pages", () => {
  const dummyShell = {
    student: { name: "Nguyễn Văn A", initials: "NA", studentId: "SE123456" },
    campus: "Hà Nội",
    unreadNotifications: 0,
  };

  describe("AttendanceReport", () => {
    it("renders page header, stat tile, filter and sessions table", () => {
      const data = {
        courses: [{ code: "MLN122", name: "Kinh tế chính trị", attended: 10, absent: 2, total: 12, rate: 10 / 12 }],
        selectedCourse: "MLN122 - Kinh tế chính trị",
        filter: {
          value: "term1",
          options: [
            { value: "term1", label: "Fall2026" },
            { value: "term2", label: "Summer2026" },
          ],
        },
        sessions: [
          { index: "1", date: "01/09/2026", slot: "07:30 - 09:50", room: "AL-101", status: "Có mặt", note: "-" },
        ],
      };

      const onFilterChange = vi.fn();
      render(<AttendanceReport data={data} shell={dummyShell} lang="vi" onFilterChange={onFilterChange} />);

      expect(screen.getByText("Báo cáo điểm danh")).toBeTruthy();
      expect(screen.getByText("07:30 - 09:50")).toBeTruthy();
      expect(screen.getByText("AL-101")).toBeTruthy();
    });
  });

  describe("GradeReport", () => {
    it("renders grade components, course code and term filter", () => {
      const data = {
        term: {
          value: "term1",
          options: [{ value: "term1", label: "Fall2025" }],
        },
        courses: [
          {
            code: "PRJ301",
            name: "Java Web Application",
            components: [
              { name: "Progress Test 1", weight: "10%", value: "8.5" },
              { name: "Final Exam", weight: "40%", value: "7.0" },
            ],
            total: "7.8",
            status: "Passed",
          },
        ],
      };

      render(<GradeReport data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Báo cáo điểm")).toBeTruthy();
      expect(screen.getByText("PRJ301")).toBeTruthy();
      expect(screen.getByText("Progress Test 1")).toBeTruthy();
      expect(screen.getByText("8.5")).toBeTruthy();
    });
  });

  describe("Transcript", () => {
    it("renders transcript programs, subjects, and gpa stats", () => {
      const data = {
        programs: [
          {
            title: "Chương trình Kỹ thuật phần mềm",
            rows: [
              { code: "PRF192", name: "C Programming", credit: "3", grade: "8.0", status: "Passed" },
            ],
            gpa: "8.0",
            credits: "3",
          },
        ],
      };

      render(<Transcript data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Bảng điểm")).toBeTruthy();
      expect(screen.getByText("PRF192")).toBeTruthy();
      expect(screen.getByText("C Programming")).toBeTruthy();
      expect(screen.getAllByText("8.0").length).toBeGreaterThanOrEqual(1);
    });
  });
});
