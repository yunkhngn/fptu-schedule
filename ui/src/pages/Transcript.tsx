import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { StatTile } from "@/components/molecules/StatTile";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { TranscriptData, ShellData } from "@/data/types";

export interface TranscriptProps {
  data: TranscriptData;
  shell: ShellData;
  lang?: Lang;
}

export function Transcript({
  data,
  shell: _shell,
  lang: propLang,
}: TranscriptProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const primaryProgram = data.programs?.[0];
  const rows = primaryProgram?.rows || [];

  const columns: RichTableColumn[] = [
    { key: "code", header: lang === "en" ? "Course Code" : "Mã môn" },
    { key: "name", header: lang === "en" ? "Course Name" : "Tên môn" },
    { key: "credit", header: lang === "en" ? "Credits" : "Tín chỉ", align: "center" },
    {
      key: "grade",
      header: lang === "en" ? "Grade" : "Điểm",
      align: "center",
      tone: (val) => {
        const num = parseFloat(val.replace(",", "."));
        if (!isNaN(num)) {
          if (num >= 5) return "success";
          if (num > 0) return "danger";
        }
        return undefined;
      },
    },
    {
      key: "status",
      header: lang === "en" ? "Status" : "Trạng thái",
      align: "center",
      tone: (val) => {
        if (/passed|đạt/i.test(val)) return "success";
        if (/failed|không đạt|trượt/i.test(val)) return "danger";
        return "neutral";
      },
    },
  ];

  const tableRows: Array<Record<string, string>> = rows.map((r) => ({
    code: r.code || "",
    name: r.name || "",
    credit: r.credit || "—",
    grade: r.grade || "—",
    status: r.status || "—",
  }));

  const passedCount = rows.filter((r) => /passed|đạt/i.test(r.status)).length;

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Academics · Reports" : "Học tập · Báo cáo"}
        title={t("reports.transcript_title")}
        description={primaryProgram?.title || t("reports.transcript_desc")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label={t("reports.gpa")}
          value={primaryProgram?.gpa || "—"}
          tone="success"
        />
        <StatTile
          label={t("reports.earned_credits")}
          value={primaryProgram?.credits || String(passedCount * 3)}
        />
        <StatTile
          label={lang === "en" ? "Completed Courses" : "Môn đã hoàn thành"}
          value={`${passedCount} / ${rows.length}`}
          tone="default"
        />
      </div>

      <Section title={primaryProgram?.title || t("reports.transcript_title")}>
        <RichTable
          columns={columns}
          rows={tableRows}
          empty={t("reports.no_data")}
        />
      </Section>
    </div>
  );
}
