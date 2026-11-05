import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Transactions } from "./Transactions";
import { Documents } from "./Documents";
import { Wishlist } from "./Wishlist";
import { Applications } from "./Applications";
import { ApplicationCatalog } from "./ApplicationCatalog";
import { StartupGroupEmpty } from "./StartupGroupEmpty";
import { CrossClassChangeEmpty } from "./CrossClassChangeEmpty";

describe("Record and List Pages", () => {
  const dummyShell = {
    student: { name: "Nguyễn Văn A", initials: "NA", studentId: "SE123456" },
    campus: "Hà Nội",
    unreadNotifications: 0,
  };

  describe("Transactions", () => {
    it("renders transaction table with income and expense tones", () => {
      const data = {
        rows: [
          { date: "01/09/2026", description: "Học phí", amount: "-10.000.000", direction: "out" as const },
          { date: "05/09/2026", description: "Nộp tiền vào ví", amount: "10.000.000", direction: "in" as const },
        ],
      };

      render(<Transactions data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Giao dịch")).toBeTruthy();
      expect(screen.getByText("Học phí")).toBeTruthy();
      expect(screen.getByText("-10.000.000")).toBeTruthy();
    });
  });

  describe("Documents", () => {
    it("renders document list", () => {
      const data = {
        rows: [
          { title: "Quy chế đào tạo 2026", category: "Quy chế", date: "01/01/2026", href: "/Document/1" },
        ],
      };

      render(<Documents data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Tài liệu")).toBeTruthy();
      expect(screen.getByText("Quy chế đào tạo 2026")).toBeTruthy();
    });
  });

  describe("Wishlist", () => {
    it("renders wishlist page", () => {
      const data = {
        rows: [],
        registerHref: "/Wishlist/Register",
      };

      render(<Wishlist data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Danh sách chờ lớp")).toBeTruthy();
    });
  });

  describe("Applications", () => {
    it("renders student applications", () => {
      const data = {
        rows: [
          { type: "Đơn xin nghỉ học tạm thời", created: "10/09/2026", status: "Đã duyệt", href: null },
        ],
      };

      render(<Applications data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Xem đơn")).toBeTruthy();
      expect(screen.getByText("Đơn xin nghỉ học tạm thời")).toBeTruthy();
    });
  });

  describe("ApplicationCatalog", () => {
    it("renders grid of application categories and apply link", () => {
      const data = {
        items: [
          { title: "Đơn chuyển ngành", description: "Thời hạn: 30/09", href: "/Application/Create?type=1" },
        ],
      };

      render(<ApplicationCatalog data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Gửi đơn")).toBeTruthy();
      expect(screen.getByText("Đơn chuyển ngành")).toBeTruthy();
    });
  });

  describe("Empty State Pages", () => {
    it("renders StartupGroupEmpty with create button", () => {
      const data = { empty: true as const, createHref: "/StartupGroup/Add" };
      render(<StartupGroupEmpty data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Đơn khởi nghiệp")).toBeTruthy();
      expect(screen.getByText(/gửi đơn|tạo/i)).toBeTruthy();
    });

    it("renders CrossClassChangeEmpty with create button", () => {
      const data = { empty: true as const, createHref: "/CrossClassChange/Create" };
      render(<CrossClassChangeEmpty data={data} shell={dummyShell} lang="vi" />);

      expect(screen.getByText("Đơn đổi lớp chéo")).toBeTruthy();
      expect(screen.getByText(/tạo yêu cầu|gửi đơn/i)).toBeTruthy();
    });
  });
});
