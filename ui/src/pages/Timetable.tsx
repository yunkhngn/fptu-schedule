import { useState } from "react";
import { Info, MapPinned } from "lucide-react";
import { PageHeader } from "@/components/templates/PageHeader";
import { ScheduleCalendar } from "@/components/organisms/ScheduleCalendar";
import { DashboardCard } from "@/components/molecules/DashboardCard";
import type { ClassSession } from "@/data/types";
import { createFapWeekLoader, type WeekLoader } from "@/data/weekLoader";
import { useWeekSessions } from "@/hooks/useWeekSessions";
import { useT } from "@/i18n";

export interface TimetablePageProps {
  sessions: ClassSession[];
  weekStart: string;
  /** Loads another week from FAP. Defaults to the extension's own fetcher on the real page. */
  loadWeek?: WeekLoader;
}

const ROOM_LEGEND = [
  { code: "AL", place: "Tòa nhà Alpha" },
  { code: "BE", place: "Tòa nhà Beta" },
  { code: "GA", place: "Tòa nhà Gamma", detail: "VD: G201" },
  { code: "DE", place: "Tòa nhà Delta" },
  { code: "LUK", place: "Little UK", detail: "Tầng 5 tòa nhà Delta" },
  { code: "R", place: "Khu vực sân tập Vovinam" },
  { code: "VOV1", place: "Nhà võ số 1", detail: "Cuối tòa nhà Alpha · 6 sân tập R01-VOV1 đến R06-VOV1" },
  { code: "VOV2", place: "Nhà võ số 2", detail: "Cạnh cổng trường · 8 sân tập R01-VOV2 đến R08-VOV2" },
  { code: "VOV3", place: "Nhà võ số 3", detail: "Cạnh hồ Delta · 4 sân tập R01-VOV3 đến R04-VOV3" },
];

export function TimetablePage({ sessions, weekStart, loadWeek }: TimetablePageProps) {
  const t = useT();
  const [loader] = useState<WeekLoader | undefined>(() => loadWeek ?? createFapWeekLoader());
  const week = useWeekSessions(sessions, weekStart, loader);

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow="Học tập · Lịch học"
        title={t("timetable.title")}
        description="Xem lịch học, phòng học và tình trạng điểm danh theo từng tuần."
      />

      <ScheduleCalendar
        sessions={week.sessions}
        initialWeekStart={weekStart}
        onWeekChange={loader ? week.requestWeek : undefined}
        status={week.status}
        onRetry={week.retry}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <DashboardCard
          className="xl:col-span-4"
          icon={Info}
          title="Chú thích"
          bodyClassName="pt-4"
        >
          <p className="text-[13.5px] leading-relaxed">
            Các hoạt động trong bảng dưới không bao gồm hoạt động ngoại khóa, ví dụ như hoạt động câu lạc bộ.
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground italic">
            These activities do not include extra-curriculum activities, such as club activities.
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
                  {r.detail && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{r.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>
    </div>
  );
}

