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
      const sel = document.querySelector(
        "#grade-report-term, select.academic-report-term-select"
      ) as HTMLSelectElement | null;

      let targetHref: string | null | undefined = null;

      if (sel) {
        let opt = sel.querySelector(
          `option[value="${val}"]`
        ) as HTMLOptionElement | null;
        if (!opt) {
          opt =
            Array.from(sel.options).find(
              (o) => o.textContent?.trim() === val || o.value === val
            ) || null;
        }
        if (opt) {
          sel.value = opt.value;
          targetHref = opt.getAttribute("data-fallback-href");
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      if (!targetHref && data.term?.options) {
        const fOpt = data.term.options.find(
          (o) => o.value === val || o.label === val
        );
        targetHref = (fOpt as any)?.href;
      }

      if (!targetHref && sel) {
        const container = document.querySelector("#grade-report, .academic-report");
        const reportUrl = container?.getAttribute("data-report-url") || "/Report/Grade";
        const termParam = container?.getAttribute("data-report-term-param") || "termId";
        if (val) {
          targetHref = `${reportUrl}?${termParam}=${encodeURIComponent(val)}`;
        }
      }

      if (targetHref) {
        window.location.href = targetHref;
      }
    }
  };

  const handleCourseChange = (val: string) => {
    if (onCourseChange) {
      onCourseChange(val);
      return;
    }
    if (typeof document !== "undefined") {
      const course = data.courses?.find(
        (c) => (c.id && c.id === val) || c.code === val || c.href === val
      );
      const sel = document.querySelector(
        "#grade-report-course, select.academic-report-course-select"
      ) as HTMLSelectElement | null;

      let targetHref = course?.href;

      if (sel) {
        let targetOpt = sel.querySelector(
          `option[value="${val}"]`
        ) as HTMLOptionElement | null;

        if (!targetOpt && course?.id) {
          targetOpt = sel.querySelector(
            `option[value="${course.id}"]`
          ) as HTMLOptionElement | null;
        }

        if (!targetOpt && course?.code) {
          targetOpt =
            Array.from(sel.options).find(
              (o) =>
                o.value === course.code ||
                o.textContent?.includes(`(${course.code})`) ||
                o.textContent?.includes(course.code)
            ) || null;
        }

        if (targetOpt) {
          sel.value = targetOpt.value;
          targetHref =
            targetOpt.getAttribute("data-fallback-href") || targetHref;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      if (!targetHref && sel) {
        const container = document.querySelector("#grade-report, .academic-report");
        const reportUrl = container?.getAttribute("data-report-url") || "/Report/Grade";
        const termParam = container?.getAttribute("data-report-term-param") || "termId";
        const courseParam = container?.getAttribute("data-report-course-param") || "courseId";
        const termSel = document.querySelector(
          "#grade-report-term, select.academic-report-term-select"
        ) as HTMLSelectElement | null;
        const termVal = termSel ? termSel.value : (data.term?.value || "");
        const courseVal = sel.value || course?.id || val;
        if (termVal && courseVal) {
          targetHref = `${reportUrl}?${termParam}=${encodeURIComponent(termVal)}&${courseParam}=${encodeURIComponent(courseVal)}`;
        } else if (courseVal) {
          targetHref = `${reportUrl}?${courseParam}=${encodeURIComponent(courseVal)}`;
        }
      }

      if (targetHref) {
        window.location.href = targetHref;
      }
    }
  };

  const currentCourse =
    data.courses?.find((c) => c.selected) ||
    (data.courseFilter?.value
      ? data.courses?.find((c) => c.id === data.courseFilter?.value)
      : undefined) ||
    data.courses?.find((c) => c.components && c.components.length > 0) ||
    data.courses?.[0];

  const formatStatus = (st?: string) => {
    if (!st) return "—";
    if (/passed|đạt/i.test(st) && !/not|không/i.test(st)) {
      return lang === "en" ? "Passed" : "Đạt (Passed)";
    }
    if (/not\s*passed|không\s*đạt|failed|trượt/i.test(st)) {
      return lang === "en" ? "Not passed" : "Không đạt (Failed)";
    }
    if (/in\s*progress|đang\s*học/i.test(st)) {
      return lang === "en" ? "In Progress" : "Đang học";
    }
    return st;
  };

  const statusTone: "success" | "danger" | "warning" | "default" =
    /passed|đạt/i.test(currentCourse?.status || "") && !/not|không/i.test(currentCourse?.status || "")
      ? "success"
      : /not\s*passed|không\s*đạt|failed|trượt/i.test(currentCourse?.status || "")
      ? "danger"
      : /in\s*progress|đang\s*học/i.test(currentCourse?.status || "")
      ? "warning"
      : "default";

  const numTotal = currentCourse?.total ? parseFloat(currentCourse.total.replace(",", ".")) : null;
  const finalScoreTone: "success" | "danger" | "default" =
    numTotal !== null && !isNaN(numTotal)
      ? numTotal >= 5.0
        ? "success"
        : "danger"
      : "default";

  const statusLabel = formatStatus(currentCourse?.status);

  const hasGroups = (currentCourse?.components || []).some((c) => Boolean(c.group));
  const columns: RichTableColumn[] = [
    ...(hasGroups
      ? [{ key: "group", header: lang === "en" ? "Category" : "Nhóm điểm" }]
      : []),
    { key: "name", header: lang === "en" ? "Component Name" : "Tên cột điểm" },
    { key: "weight", header: lang === "en" ? "Weight (%)" : "Trọng số (%)", align: "center" as const },
    {
      key: "value",
      header: lang === "en" ? "Score" : "Điểm",
      align: "center" as const,
      tone: (val: string) => {
        const num = parseFloat(val.replace(",", "."));
        if (!isNaN(num)) {
          if (num >= 5) return "success";
          if (num > 0) return "danger";
        }
        return undefined;
      },
    },
    { key: "note", header: lang === "en" ? "Note" : "Ghi chú" },
  ];

  const rows: Array<Record<string, string>> = (currentCourse?.components || []).map((c) => ({
    group: c.group || "—",
    name: c.name || "",
    weight: c.weight ? c.weight.replace("%", "") : "—",
    value: c.value || "—",
    note: c.note || "—",
  }));

  if (currentCourse?.total) {
    rows.push({
      group: "—",
      name: t("reports.course_total"),
      weight: "100",
      value: currentCourse.total,
      note: statusLabel,
    });
  }

  const courseOptions = (data.courses || [])
    .filter((c) => c.code || c.name)
    .map((c) => ({
      value: c.id || c.code,
      label: c.name ? `${c.code} - ${c.name}` : c.code,
    }));

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Academics · Reports" : "Học tập · Báo cáo"}
        title={t("reports.grade_title")}
        description={
          currentCourse?.name
            ? `${currentCourse.code} · ${currentCourse.name}${currentCourse.className ? ` (${currentCourse.className})` : ""}`
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
            value={currentCourse?.id || currentCourse?.code || ""}
            options={courseOptions}
            onChange={handleCourseChange}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label={t("reports.final_score")}
          value={currentCourse?.total || "—"}
          tone={finalScoreTone}
        />
        <StatTile
          label={t("reports.result")}
          value={statusLabel}
          tone={statusTone}
        />
        <StatTile
          label={t("reports.class")}
          value={currentCourse?.className || "—"}
        />
        <StatTile
          label={t("reports.course_code")}
          value={currentCourse?.code || "—"}
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

