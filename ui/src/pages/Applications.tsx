import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { ApplicationsData, ShellData } from "@/data/types";

export interface ApplicationsProps {
  data: ApplicationsData;
  shell: ShellData;
  lang?: Lang;
}

export function Applications({
  data,
  shell: _shell,
  lang: propLang,
}: ApplicationsProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const columns: RichTableColumn[] = [
    { key: "type", header: lang === "en" ? "Application Type" : "Loại đơn" },
    { key: "created", header: lang === "en" ? "Submitted Date" : "Ngày gửi", align: "center" },
    {
      key: "status",
      header: lang === "en" ? "Status" : "Trạng thái",
      align: "center",
      tone: (val) => {
        if (/duyệt|approved|completed/i.test(val) && !/không|chưa/i.test(val)) return "success";
        if (/từ chối|rejected|hủy/i.test(val)) return "danger";
        return "neutral";
      },
    },
  ];

  const rows: Array<Record<string, string>> = (data.rows || []).map((r) => ({
    type: r.type || "",
    created: r.created || "—",
    status: r.status || (lang === "en" ? "Pending" : "Đang xử lý"),
  }));

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Student Affairs · Applications" : "Công tác sinh viên · Đơn từ"}
        title={t("nav.view_applications")}
        description={t("nav.view_applications_desc")}
      />

      <Section title={lang === "en" ? "Submitted Applications" : "Đơn đã gửi"}>
        <RichTable
          columns={columns}
          rows={rows}
          empty={lang === "en" ? "No applications submitted" : "Bạn chưa gửi đơn nào"}
        />
      </Section>
    </div>
  );
}
