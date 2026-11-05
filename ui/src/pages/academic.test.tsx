import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Subjects } from "./Subjects";
import { Curriculum } from "./Curriculum";
import { Certificates } from "./Certificates";

describe("Academic Pages", () => {
  const dummyShell = {
    student: { name: "Nguyễn Văn A", initials: "NA", studentId: "SE123456" },
    campus: "Hà Nội",
    unreadNotifications: 0,
  };

  describe("Subjects", () => {
    it("renders page header, search input, and subject list with filter", () => {
      const data = {
        rows: [
          { code: "PRJ301", name: "Java Web Application", credit: "3", status: "Active" },
          { code: "MAS291", name: "Statistics", credit: "3", status: "Active" },
        ],
      };

      render(<Subjects data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Quản lý môn học")).toBeTruthy();
      expect(screen.getByText("PRJ301")).toBeTruthy();
      expect(screen.getByText("Java Web Application")).toBeTruthy();

      const searchInput = screen.getByPlaceholderText(/tìm kiếm|search/i);
      fireEvent.change(searchInput, { target: { value: "Statistics" } });
      expect(screen.queryByText("PRJ301")).toBeNull();
      expect(screen.getByText("MAS291")).toBeTruthy();
    });
  });

  describe("Curriculum", () => {
    it("renders curriculum groups, courses, and total credits", () => {
      const data = {
        groups: [
          {
            title: "Học kỳ 1",
            rows: [
              { code: "PRF192", name: "Programming Fundamentals", credit: "3", prerequisite: "None" },
            ],
          },
        ],
        totalCredits: "140",
      };

      render(<Curriculum data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Khung chương trình")).toBeTruthy();
      expect(screen.getByText("Học kỳ 1")).toBeTruthy();
      expect(screen.getByText("PRF192")).toBeTruthy();
    });
  });

  describe("Certificates", () => {
    it("renders certificate cards with download link", () => {
      const data = {
        items: [
          {
            name: "Chứng chỉ Giáo dục Quốc phòng",
            issuer: "GDQP-001",
            date: "10/10/2025",
            href: "https://fap.fpt.edu.vn/download",
          },
        ],
      };

      render(<Certificates data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Chứng chỉ của tôi")).toBeTruthy();
      expect(screen.getByText("Chứng chỉ Giáo dục Quốc phòng")).toBeTruthy();
      expect(screen.getByText(/10\/10\/2025/)).toBeTruthy();
    });
  });
});
