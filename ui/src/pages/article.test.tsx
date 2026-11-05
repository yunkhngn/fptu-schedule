import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ArticleFrame } from "@/components/organisms/ArticleFrame";
import { Article } from "@/pages/Article";
import { adoptArticleBody } from "@/shadow/wrapped";

describe("Article detail pages", () => {
  it("renders ArticleFrame with title, meta items, attachments, and back link", () => {
    render(
      <ArticleFrame
        title="Thông báo lịch thi Block 1-4"
        meta={[
          { label: "Chuyên mục", value: "Khảo thí" },
          { label: "Ngày đăng", value: "02/11/2026" },
        ]}
        attachments={[
          { name: "LichThi.pdf", href: "https://fap.fpt.edu.vn/LichThi.pdf" },
        ]}
        backHref="/tin-tuc"
        backLabel="Về danh sách"
      />
    );

    expect(screen.getByText("Thông báo lịch thi Block 1-4")).toBeTruthy();
    expect(screen.getByText("Khảo thí")).toBeTruthy();
    expect(screen.getByText("02/11/2026")).toBeTruthy();
    expect(screen.getByText("LichThi.pdf")).toBeTruthy();
    const link = screen.getByRole("link", { name: /Về danh sách/i });
    expect(link.getAttribute("href")).toBe("/tin-tuc");
  });

  it("adoptArticleBody adopts node into slot and restores it with exact reference", () => {
    const parent = document.createElement("div");
    parent.id = "original-parent";
    const bodyNode = document.createElement("div");
    bodyNode.className = "fap-news-content";
    bodyNode.textContent = "Original news content";
    const nextSibling = document.createElement("div");
    nextSibling.id = "sibling";

    parent.appendChild(bodyNode);
    parent.appendChild(nextSibling);
    document.body.appendChild(parent);

    const host = document.createElement("div");
    host.id = "fptu-ui-host";
    document.body.appendChild(host);

    const handle = adoptArticleBody(document, host, ".fap-news-content");
    expect(handle).not.toBeNull();
    expect(bodyNode.parentNode).toBe(host);
    expect(bodyNode.getAttribute("slot")).toBe("fap-article-body");

    // Restore
    handle!.restore();
    expect(bodyNode.parentNode).toBe(parent);
    expect(bodyNode.nextSibling).toBe(nextSibling);
    expect(bodyNode.getAttribute("slot")).toBeNull();

    // Clean up
    parent.remove();
    host.remove();
  });

  it("renders Article page component with data", () => {
    render(
      <Article
        data={{
          title: "View syllabus",
          meta: [{ label: "Học kỳ", value: "Fall 2026" }],
          attachments: [],
          bodySelector: ".fap-document-body",
          backHref: "/tai-lieu",
        }}
        shell={{
          student: { name: "Test Student", initials: "TS", studentId: "HE123" },
          campus: "HN",
          unreadNotifications: 0,
        }}
      />
    );

    expect(screen.getByText("View syllabus")).toBeTruthy();
    expect(screen.getByText("Fall 2026")).toBeTruthy();
  });
});
