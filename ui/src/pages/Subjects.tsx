import { useState, useMemo, type JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { SubjectsData, ShellData } from "@/data/types";

export interface SubjectsProps {
  data: SubjectsData;
  shell: ShellData;
  lang?: Lang;
}

function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function Subjects({
  data,
  shell: _shell,
  lang: propLang,
}: SubjectsProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const q = removeAccents(query.trim());
    if (!q) return data.rows || [];
    return (data.rows || []).filter((r) => {
      const code = removeAccents(r.code);
      const name = removeAccents(r.name);
      return code.includes(q) || name.includes(q);
    });
  }, [data.rows, query]);

  const columns: RichTableColumn[] = [
    { key: "code", header: lang === "en" ? "Course Code" : "Mã môn học" },
    { key: "name", header: lang === "en" ? "Course Name" : "Tên môn học" },
    { key: "credit", header: lang === "en" ? "Credits" : "Tín chỉ", align: "center" },
    {
      key: "status",
      header: lang === "en" ? "Status" : "Trạng thái",
      align: "center",
      tone: (val) => (/active|hoạt động|đang mở/i.test(val) ? "success" : undefined),
    },
  ];

  const tableRows: Array<Record<string, string>> = filteredRows.map((r) => ({
    code: r.code || "",
    name: r.name || "",
    credit: r.credit || "—",
    status: r.status || "Active",
  }));

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Academics · Courses" : "Học tập · Môn học"}
        title={t("nav.courses")}
        description={t("nav.courses_desc")}
      />

      <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === "en" ? "Search course code or name…" : "Tìm kiếm mã môn hoặc tên môn…"}
            className="h-10 w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {lang === "en"
            ? `Showing ${filteredRows.length} of ${data.rows?.length || 0} courses`
            : `Hiển thị ${filteredRows.length} / ${data.rows?.length || 0} môn học`}
        </p>
      </div>

      <Section title={lang === "en" ? "Course Catalog" : "Danh mục môn học"}>
        <RichTable
          columns={columns}
          rows={tableRows}
          empty={lang === "en" ? "No courses found" : "Không tìm thấy môn học nào"}
        />
      </Section>
    </div>
  );
}
