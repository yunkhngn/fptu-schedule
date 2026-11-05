import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { FilterBar } from "@/components/molecules/FilterBar";
import { StatTile } from "@/components/molecules/StatTile";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { AttendanceReportData, ShellData } from "@/data/types";

export interface AttendanceReportProps {
  data: AttendanceReportData;
  shell: ShellData;
  lang?: Lang;
  onFilterChange?: (value: string) => void;
  onCourseChange?: (value: string) => void;
}

export function AttendanceReport({
  data,
  shell: _shell,
  lang: propLang,
  onFilterChange,
  onCourseChange,
}: AttendanceReportProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const handleFilterChange = (val: string) => {
    if (onFilterChange) {
      onFilterChange(val);
      return;
    }
    if (typeof document !== "undefined") {
      const sel = document.querySelector(
        "#attendance-report-term, select.academic-report-term-select"
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

      if (!targetHref && data.filter?.options) {
        const fOpt = data.filter.options.find(
          (o) => o.value === val || o.label === val
        );
        targetHref = (fOpt as any)?.href;
      }

      if (!targetHref && sel) {
        const container = document.querySelector("#attendance-report, .academic-report");
        const reportUrl = container?.getAttribute("data-report-url") || "/Report/Attendance";
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
        "#attendance-report-course, select.academic-report-course-select"
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
        const container = document.querySelector("#attendance-report, .academic-report");
        const reportUrl = container?.getAttribute("data-report-url") || "/Report/Attendance";
        const termParam = container?.getAttribute("data-report-term-param") || "termId";
        const courseParam = container?.getAttribute("data-report-course-param") || "courseId";
        const termSel = document.querySelector(
          "#attendance-report-term, select.academic-report-term-select"
        ) as HTMLSelectElement | null;
        const termVal = termSel ? termSel.value : (data.filter?.value || "");
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
    data.courses?.find((c) => (c.total ?? 0) > 0) ||
    data.courses?.[0];
  const rateVal = currentCourse?.rate;
  const rateStr = rateVal !== null && rateVal !== undefined ? `${Math.round(rateVal * 100)}%` : "—";
  const rateTone =
    rateVal === null || rateVal === undefined
      ? "default"
      : rateVal >= 0.8
      ? "success"
      : rateVal >= 0.6
      ? "warning"
      : "danger";

  const columns: RichTableColumn[] = [
    { key: "index", header: "#", align: "center" },
    { key: "date", header: lang === "en" ? "Date" : "Ngày học" },
    { key: "slot", header: lang === "en" ? "Slot" : "Slot học" },
    { key: "room", header: lang === "en" ? "Room" : "Phòng" },
    { key: "lecturer", header: lang === "en" ? "Lecturer" : "Giảng viên" },
    { key: "class", header: lang === "en" ? "Class" : "Lớp học" },
    {
      key: "status",
      header: lang === "en" ? "Status" : "Trạng thái",
      tone: (val) => {
        if (/có mặt|present|đúng giờ/i.test(val)) return "success";
        if (/vắng|absent/i.test(val)) return "danger";
        return "neutral";
      },
    },
    { key: "note", header: lang === "en" ? "Note" : "Ghi chú" },
  ];

  const rows: Array<Record<string, string>> = (data.sessions || []).map((s) => ({
    index: s.index || "",
    date: s.date || "",
    slot: s.slot || "",
    room: s.room || "",
    lecturer: s.lecturer || "",
    class: s.class || "",
    status: s.status || "",
    note: s.note || "—",
  }));

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
        title={t("reports.attendance_title")}
        description={data.selectedCourse || t("reports.attendance_desc")}
      />

      <div className="flex flex-wrap items-center gap-4">
        {data.filter && data.filter.options && data.filter.options.length > 0 && (
          <FilterBar
            label={t("reports.term")}
            value={data.filter.value}
            options={data.filter.options}
            onChange={handleFilterChange}
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
          label={t("reports.attendance_rate")}
          value={rateStr}
          tone={rateTone}
        />
        <StatTile
          label={t("reports.attended")}
          value={currentCourse?.attended ?? 0}
          tone="success"
        />
        <StatTile
          label={t("reports.absent")}
          value={currentCourse?.absent ?? 0}
          tone={currentCourse && currentCourse.absent > 0 ? "danger" : "default"}
        />
        <StatTile
          label={t("reports.total_sessions")}
          value={data.sessions?.length ?? currentCourse?.total ?? 0}
        />
      </div>

      <Section title={t("reports.sessions_sheet")}>
        <RichTable
          columns={columns}
          rows={rows}
          empty={t("reports.no_data")}
        />
      </Section>
    </div>
  );
}

