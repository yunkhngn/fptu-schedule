import { Info, MapPinned } from "lucide-react";
import { PageHeader } from "@/components/templates/PageHeader";
import { ScheduleCalendar } from "@/components/organisms/ScheduleCalendar";
import { DashboardCard } from "@/components/molecules/DashboardCard";
import type { ClassSession } from "@/data/types";

export interface TimetablePageProps {
  sessions: ClassSession[];
  weekStart: string;
}

const ROOM_LEGEND = [
  { code: "BE", place: "Tòa nhà Beta", detail: "Phòng học lý thuyết và hội trường" },
  { code: "DE", place: "Tòa nhà Gamma / Delta", detail: "Phòng học lý thuyết và lab thực hành" },
  { code: "AL", place: "Giảng đường Alpha", detail: "Khu vực sảnh đón và giảng đường lớn" },
  { code: "LA", place: "Phòng Lab chuyên dụng", detail: "Phòng máy tính và thực hành kỹ thuật" },
];

export function TimetablePage({ sessions, weekStart }: TimetablePageProps) {
  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow="Học tập · Lịch học"
        title="Thời khóa biểu tuần"
        description="Xem lịch học, phòng học và tình trạng điểm danh theo từng tuần."
      />

      <ScheduleCalendar sessions={sessions} initialWeekStart={weekStart} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <DashboardCard
          className="xl:col-span-4"
          icon={Info}
          title="Chú thích"
          bodyClassName="pt-4"
        >
          <p className="text-[13.5px] leading-relaxed">
            ( - ) Chưa tới giờ học | (*) Điểm danh có mặt | (v) Điểm danh vắng | (p) Điểm danh có phép
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground italic">
            Các buổi học trực tuyến có biểu tượng wifi và liên kết Google Meet đính kèm.
          </p>
        </DashboardCard>

        <DashboardCard
          className="xl:col-span-8"
          icon={MapPinned}
          title="Ký hiệu phòng học"
          description="Tiền tố mã phòng cho biết tòa nhà hoặc khu vực"
          bodyClassName="pt-4"
        >
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ROOM_LEGEND.map((r) => (
              <li
                key={r.code}
                className="flex items-start gap-3 rounded-2xl bg-surface-2/70 p-3"
              >
                <span className="grid h-9 min-w-12 shrink-0 place-items-center rounded-xl bg-surface px-2 text-xs font-semibold text-primary-strong shadow-soft">
                  {r.code}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{r.place}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{r.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>
    </div>
  );
}
