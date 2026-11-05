import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { FyeLogData, ShellData } from "@/data/types";

export interface FyeCheckInProps {
  data: FyeLogData;
  shell: ShellData;
  lang?: Lang;
}

export function FyeCheckIn({
  data,
  shell: _shell,
  lang: propLang,
}: FyeCheckInProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const _t = useT();

  const columns: RichTableColumn[] = [
    { key: "col_0", header: lang === "en" ? "Date" : "Ngày gặp" },
    { key: "col_1", header: lang === "en" ? "Format" : "Hình thức" },
    { key: "col_2", header: lang === "en" ? "Connection Point" : "Điểm kết nối" },
    { key: "col_3", header: lang === "en" ? "Support Needed" : "Cần hỗ trợ" },
    { key: "col_4", header: lang === "en" ? "Student" : "Sinh viên" },
  ];

  const rows = data.rows || [];

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow="FYE · First Year Experience"
        title="FYE Check-in Log"
        description={
          lang === "en"
            ? "Your recorded check-in interactions and support logs."
            : "Nhật ký các buổi check-in và hỗ trợ sinh viên năm nhất."
        }
      />

      <Section title={lang === "en" ? "Check-in History" : "Lịch sử Check-in"}>
        <RichTable
          columns={columns}
          rows={rows}
          empty={lang === "en" ? "No check-in logs found" : "Chưa có log check-in nào"}
        />
      </Section>
    </div>
  );
}
