import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/templates/PageHeader";
import { DataTable } from "@/components/organisms/DataTable";
import { EmptyState } from "@/components/molecules/EmptyState";
import type { ExamItem } from "@/data/types";

export interface ExamsPageProps {
  exams: ExamItem[];
}

const EXAM_COLUMNS = [
  "Mã môn",
  "Tên môn",
  "Ngày thi",
  "Phòng",
  "Giờ thi",
  "Hình thức",
  "Loại thi",
];

export function ExamsPage({ exams }: ExamsPageProps) {
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
        eyebrow="Học tập · Lịch học"
        title="Lịch thi"
        description="Lịch thi giữa kỳ và kết thúc học phần của bạn."
      />

      <DataTable
        columns={EXAM_COLUMNS}
        rows={rows}
        empty={
          <EmptyState
            icon={CalendarClock}
            title="Chưa có lịch thi"
            description="Lịch thi sẽ hiển thị tại đây khi phòng Khảo thí công bố."
          />
        }
      />
    </div>
  );
}
