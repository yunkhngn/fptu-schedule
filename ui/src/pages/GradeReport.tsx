import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { FilterBar } from "@/components/molecules/FilterBar";
import { StatTile } from "@/components/molecules/StatTile";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { GradeReportData, ShellData } from "@/data/types";

export interface GradeReportProps {
  data: GradeReportData;
  shell: ShellData;
  lang?: Lang;
  onTermChange?: (value: string) => void;
  onCourseChange?: (value: string) => void;
}

export function GradeReport({
  data,
  shell: _shell,
  lang: propLang,
  onTermChange,
  onCourseChange,
}: GradeReportProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const handleTermChange = (val: string) => {
    if (onTermChange) {
      onTermChange(val);
      return;
    }
    if (typeof document !== "undefined") {
      const sel = document.querySelector("#grade-report-term") as HTMLSelectElement | null;
      if (sel) {
        sel.value = val;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        const opt = sel.querySelector(`option[value="${val}"]`) as HTMLElement | null;
        const href = opt?.getAttribute("data-fallback-href");
        if (href) window.location.href = href;
      }
    }
  };

  const handleCourseChange = (val: string) => {
    if (onCourseChange) {
      onCourseChange(val);
      return;
    }
    if (typeof document !== "undefined") {
      const sel = document.querySelector("#grade-report-course") as HTMLSelectElement | null;
      if (sel) {
        sel.value = val;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        const opt = sel.querySelector(`option[value="${val}"]`) as HTMLElement | null;
        const href = opt?.getAttribute("data-fallback-href");
        if (href) window.location.href = href;
      }
    }
  };

  const currentCourse = data.courses?.[0];

  const columns: RichTableColumn[] = [
    { key: "name", header: lang === "en" ? "Component Name" : "Tên cột điểm" },
    { key: "weight", header: lang === "en" ? "Weight (%)" : "Trọng số (%)", align: "center" },
    {
      key: "value",
      header: lang === "en" ? "Score" : "Điểm",
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
  ];

  const rows: Array<Record<string, string>> = (currentCourse?.components || []).map((c) => ({
    name: c.name || "",
    weight: c.weight || "",
    value: c.value || "—",
  }));

  const courseOptions = (data.courses || [])
    .filter((c) => c.code || c.name)
    .map((c) => ({
      value: c.code,
      label: c.name ? `${c.code} - ${c.name}` : c.code,
    }));

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Academics · Reports" : "Học tập · Báo cáo"}
        title={t("reports.grade_title")}
        description={
          currentCourse?.name
            ? `${currentCourse.code} · ${currentCourse.name}`
            : t("reports.grade_desc")
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        {data.term && data.term.options && data.term.options.length > 0 && (
          <FilterBar
            label={t("reports.term")}
            value={data.term.value}
            options={data.term.options}
            onChange={handleTermChange}
          />
        )}
        {courseOptions.length > 1 && (
          <FilterBar
            label={t("reports.course")}
            value={currentCourse?.code || ""}
            options={courseOptions}
            onChange={handleCourseChange}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label={lang === "en" ? "Course Code" : "Mã môn"}
          value={currentCourse?.code || "—"}
        />
        <StatTile
          label={t("reports.final_score")}
          value={currentCourse?.total || "—"}
          tone="success"
        />
        <StatTile
          label={t("reports.status")}
          value={currentCourse?.status || "—"}
          tone={currentCourse?.status === "Passed" || currentCourse?.status === "Đạt" ? "success" : "default"}
        />
      </div>

      <Section title={t("reports.components")}>
        <RichTable
          columns={columns}
          rows={rows}
          empty={t("reports.no_data")}
        />
      </Section>
    </div>
  );
}
