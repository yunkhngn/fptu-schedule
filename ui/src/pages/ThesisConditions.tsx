import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import { cn } from "@/lib/utils";
import type { ConditionsData, ShellData } from "@/data/types";

export interface ThesisConditionsProps {
  data: ConditionsData;
  shell: ShellData;
  lang?: Lang;
}

export function ThesisConditions({
  data,
  shell: _shell,
  lang: propLang,
}: ThesisConditionsProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const isEligible = data.summary?.eligible;
  const bannerTone =
    isEligible === true
      ? "border-success/30 bg-success-soft/30 text-success"
      : isEligible === false
      ? "border-danger/30 bg-danger-soft/30 text-danger"
      : "border-border bg-surface-muted/50 text-foreground";

  const columns: RichTableColumn[] = [
    { key: "label", header: lang === "en" ? "Condition" : "Điều kiện" },
    { key: "required", header: lang === "en" ? "Required" : "Yêu cầu", align: "center" },
    { key: "actual", header: lang === "en" ? "Actual" : "Thực tế", align: "center" },
    {
      key: "status",
      header: lang === "en" ? "Status" : "Trạng thái",
      align: "center",
      tone: (val) => {
        if (/đạt|passed/i.test(val) && !/không đạt|failed/i.test(val)) return "success";
        if (/không đạt|failed/i.test(val)) return "danger";
        return "neutral";
      },
    },
  ];

  const rows: Array<Record<string, string>> = (data.checks || []).map((c) => ({
    label: c.label || "",
    required: c.required || "—",
    actual: c.actual || "—",
    status:
      c.passed === true
        ? lang === "en"
          ? "Passed"
          : "Đạt"
        : c.passed === false
        ? lang === "en"
          ? "Not Eligible"
          : "Không đạt"
        : lang === "en"
        ? "Indeterminate"
        : "Chưa xác định",
  }));

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Academics · Conditions" : "Học tập · Điều kiện"}
        title={t("nav.thesis_conditions")}
        description={t("nav.thesis_conditions_desc")}
      />

      <div className={cn("surface-card rounded-xl border p-5 sm:p-6", bannerTone)}>
        <p className="text-xs font-medium tracking-wide uppercase">
          {lang === "en" ? "Status Summary" : "Kết luận xét điều kiện"}
        </p>
        <p className="mt-2 text-xl font-semibold tracking-tight">
          {data.summary?.message || (lang === "en" ? "Indeterminate" : "Chưa xác định")}
        </p>
      </div>

      {data.checks && data.checks.length > 0 && (
        <Section title={lang === "en" ? "Evaluation Criteria" : "Tiêu chí xét duyệt"}>
          <RichTable
            columns={columns}
            rows={rows}
            empty={lang === "en" ? "No criteria available" : "Chưa có tiêu chí"}
          />
        </Section>
      )}
    </div>
  );
}
