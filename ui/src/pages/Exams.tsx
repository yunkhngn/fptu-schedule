import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/templates/PageHeader";
import { DataTable } from "@/components/organisms/DataTable";
import { EmptyState } from "@/components/molecules/EmptyState";
import { useLang, useT } from "@/i18n";
import type { ExamItem } from "@/data/types";

export interface ExamsPageProps {
  exams: ExamItem[];
}

const EXAM_COLUMNS_VI = [
  "Mã môn",
  "Tên môn",
  "Ngày thi",
  "Phòng",
  "Giờ thi",
  "Hình thức",
  "Loại thi",
];

const EXAM_COLUMNS_EN = [
  "Course Code",
  "Course Name",
  "Exam Date",
  "Room",
  "Time",
  "Format",
  "Type",
];

export function ExamsPage({ exams }: ExamsPageProps) {
  const lang = useLang();
  const t = useT();
  const rows = exams.map((ex) => [
    ex.courseCode,
    ex.courseName || "—",
    ex.date,
    ex.room || "—",
    ex.time,
    ex.form || "—",
    ex.kind || "—",
  ]);

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Academics · Exam Schedule" : "Học tập · Lịch học"}
        title={t("exams.title")}
        description={
          lang === "en"
            ? "Your midterm and final exam schedules."
            : "Lịch thi giữa kỳ và kết thúc học phần của bạn."
        }
      />

      <DataTable
        columns={lang === "en" ? EXAM_COLUMNS_EN : EXAM_COLUMNS_VI}
        rows={rows}
        empty={
          <EmptyState
            icon={CalendarClock}
            title={t("exams.no_exams")}
            description={
              lang === "en"
                ? "Exam schedule will appear here when published by the Examination Department."
                : "Lịch thi sẽ hiển thị tại đây khi phòng Khảo thí công bố."
            }
          />
        }
      />
    </div>
  );
}

