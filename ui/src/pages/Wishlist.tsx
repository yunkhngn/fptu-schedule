import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { WishlistData, ShellData } from "@/data/types";

export interface WishlistProps {
  data: WishlistData;
  shell: ShellData;
  lang?: Lang;
}

export function Wishlist({
  data,
  shell: _shell,
  lang: propLang,
}: WishlistProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const _t = useT();

  const columns: RichTableColumn[] = [
    { key: "code", header: lang === "en" ? "Course Code" : "Mã môn" },
    { key: "name", header: lang === "en" ? "Course Name" : "Tên môn" },
    { key: "status", header: lang === "en" ? "Status" : "Trạng thái", align: "center" },
  ];

  const rows: Array<Record<string, string>> = (data.rows || []).map((r) => ({
    code: r.code || "",
    name: r.name || "",
    status: r.status || (lang === "en" ? "Pending" : "Chờ lớp"),
  }));

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow={lang === "en" ? "Academics · Wishlist" : "Học tập · Chờ lớp"}
          title={lang === "en" ? "Course Wishlist" : "Danh sách chờ lớp"}
          description={
            lang === "en"
              ? "Track your waitlist registrations for full courses."
              : "Theo dõi các môn học bạn đã đăng ký chờ xếp lớp."
          }
        />
        {data.registerHref && (
          <a
            href={data.registerHref}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-hidden"
          >
            {lang === "en" ? "Register Wishlist" : "Đăng ký chờ lớp"}
          </a>
        )}
      </div>

      <Section title={lang === "en" ? "Registered Courses" : "Môn đã đăng ký chờ"}>
        <RichTable
          columns={columns}
          rows={rows}
          empty={
            lang === "en"
              ? "You have no courses on the wishlist."
              : "Hiện tại bạn chưa có môn học nào trong danh sách chờ."
          }
        />
      </Section>
    </div>
  );
}
