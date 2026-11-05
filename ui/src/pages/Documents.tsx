import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { DocumentsData, ShellData } from "@/data/types";

export interface DocumentsProps {
  data: DocumentsData;
  shell: ShellData;
  lang?: Lang;
}

export function Documents({
  data,
  shell: _shell,
  lang: propLang,
}: DocumentsProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const columns: RichTableColumn[] = [
    {
      key: "title",
      header: lang === "en" ? "Document Title" : "Tên tài liệu",
      render: (val, row) =>
        row.href ? (
          <a
            href={row.href}
            className="text-primary-strong hover:text-primary transition-colors hover:underline font-medium"
          >
            {val}
          </a>
        ) : (
          val
        ),
    },
    { key: "category", header: lang === "en" ? "Category" : "Loại tài liệu" },
    { key: "date", header: lang === "en" ? "Date" : "Ngày ban hành", align: "center" },
  ];

  const rows: Array<Record<string, string>> = (data.rows || []).map((r) => ({
    title: r.title || "",
    category: r.category || "—",
    date: r.date || "—",
    href: r.href || "",
  }));

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Academics · Documents" : "Học tập · Tài liệu"}
        title={t("nav.documents")}
        description={t("nav.documents_desc")}
      />

      <Section title={lang === "en" ? "Document List" : "Danh mục tài liệu"}>
        <RichTable
          columns={columns}
          rows={rows}
          empty={lang === "en" ? "No documents available" : "Chưa có tài liệu nào"}
        />
      </Section>
    </div>
  );
}
