import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { FyeLogData, ShellData } from "@/data/types";

export interface FyeMentorFeedbackProps {
  data: FyeLogData;
  shell: ShellData;
  lang?: Lang;
}

export function FyeMentorFeedback({
  data,
  shell: _shell,
  lang: propLang,
}: FyeMentorFeedbackProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const _t = useT();

  const columns: RichTableColumn[] = [
    { key: "col_0", header: lang === "en" ? "Date" : "Ngày" },
    { key: "col_1", header: lang === "en" ? "Mentor" : "Mentor" },
    { key: "col_2", header: lang === "en" ? "Feedback" : "Phản hồi" },
    { key: "col_3", header: lang === "en" ? "Evaluation" : "Đánh giá" },
  ];

  const rows = data.rows || [];

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow="FYE · First Year Experience"
        title="FYE Mentor Feedback"
        description={
          lang === "en"
            ? "Feedback and guidance provided by your academic mentors."
            : "Nhận xét và hướng dẫn từ các mentor dành cho bạn."
        }
      />

      <Section title={lang === "en" ? "Mentor Feedback Records" : "Danh sách phản hồi mentor"}>
        <RichTable
          columns={columns}
          rows={rows}
          empty={lang === "en" ? "No feedback records found" : "Chưa có phản hồi nào"}
        />
      </Section>
    </div>
  );
}
