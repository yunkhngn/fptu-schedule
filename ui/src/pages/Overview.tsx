import { useState, useMemo } from "react";
import { Mascot } from "@/components/atoms/Brand";
import {
  CalendarDays,
  CalendarClock,
  FilePlus2,
  Hash,
  Mail,
  ShieldCheck,
  Wallet,
  Newspaper,
  ArrowRight,
  ArrowUpRight,
  LayoutGrid,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Table2,
  Briefcase,
  GraduationCap,
  BookMarked,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { IconTile } from "@/components/atoms/IconTile";
import { StatCard } from "@/components/molecules/StatCard";
import { DashboardCard } from "@/components/molecules/DashboardCard";
import { CategoryFilter } from "@/components/molecules/CategoryFilter";
import { AnnouncementList } from "@/components/organisms/AnnouncementList";
import { MiniCalendar } from "@/components/organisms/MiniCalendar";
import { navHref } from "@/data/nav";
import { useLang, useT } from "@/i18n";
import type { HomeData, ShellData } from "@/data/types";

export interface OverviewPageProps {
  home: HomeData;
  shell: ShellData;
}

const QUICK_MENU = [
  { titleVi: "Thời khóa biểu", titleEn: "Timetable", to: "/thoi-khoa-bieu", icon: CalendarDays },
  { titleVi: "Lịch thi", titleEn: "Exam Schedule", to: "/lich-thi", icon: CalendarClock },
  { titleVi: "Báo cáo điểm danh", titleEn: "Attendance Report", to: "/bao-cao-diem-danh", icon: ClipboardCheck },
  { titleVi: "Báo cáo điểm", titleEn: "Grade Report", to: "/bao-cao-diem", icon: BarChart3 },
  { titleVi: "Bảng điểm", titleEn: "Transcript", to: "/bang-diem", icon: Table2 },
  { titleVi: "Điều kiện OJT", titleEn: "OJT Eligibility", to: "/dieu-kien-ojt", icon: Briefcase },
  { titleVi: "Điều kiện KLTN", titleEn: "Graduation Thesis Eligibility", to: "/dieu-kien-kltn", icon: GraduationCap },
  { titleVi: "Môn học", titleEn: "Courses", to: "/mon-hoc", icon: BookMarked },
  { titleVi: "Khung chương trình", titleEn: "Curriculum Framework", to: "/khung-chuong-trinh", icon: ListOrdered },
];

export function OverviewPage({ home, shell }: OverviewPageProps) {
  const lang = useLang();
  const t = useT();
  const [category, setCategory] = useState("Tất cả");

  const { greeting, dateStr, firstName } = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    let timeGreeting: string;
    if (lang === "en") {
      timeGreeting =
        h < 12
          ? "Good morning"
          : h < 18
          ? "Good afternoon"
          : "Good evening";
    } else {
      timeGreeting =
        h < 11
          ? "Chào buổi sáng"
          : h < 14
          ? "Chào buổi trưa"
          : h < 18
          ? "Chào buổi chiều"
          : "Chào buổi tối";
    }
    const rawDate = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(now);
    const dateFormatted = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
    const fName = shell.student.name.split(" ").pop() || shell.student.name;
    return {
      greeting: timeGreeting,
      dateStr: dateFormatted,
      firstName: fName,
    };
  }, [shell.student.name, lang]);

  const filteredNews = useMemo(() => {
    if (category === "Tất cả") return home.news;
    return home.news.filter((item) => item.category === category);
  }, [home.news, category]);

  return (
    <div className="space-y-6">
      {/* Greeting and Quick Actions */}
      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">{dateStr}</p>
          <h1 className="mt-1 text-[28px] leading-tight font-semibold tracking-[-0.025em] sm:text-[32px]">
            {greeting}, {firstName}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={navHref("/gui-don")}>
              <FilePlus2 className="size-4" />
              <span>{t("nav.submit_application")}</span>
            </a>
          </Button>
          <Button asChild>
            <a href={navHref("/thoi-khoa-bieu")}>
              <CalendarDays className="size-4" />
              <span>{t("nav.timetable")}</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Student Overview Bento */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-12">
        {/* Profile Card Banner */}
        <section className="relative col-span-2 overflow-hidden rounded-3xl bg-lavender p-6 shadow-float xl:col-span-5 xl:row-span-2 xl:p-7">
          <div className="pointer-events-none absolute -right-16 -bottom-20 h-64 w-64 rounded-full border-[28px] border-surface/30" />
          <div className="pointer-events-none absolute -right-4 -bottom-8 h-32 w-32 rounded-full border-[14px] border-surface/25" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <span className="text-xs font-medium tracking-[0.08em] text-foreground/60 uppercase">
              {lang === "en" ? "Student Information" : "Thông tin sinh viên"}
            </span>
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white shadow-soft">
                <Mascot className="size-12" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-[22px] font-semibold tracking-tight sm:text-2xl">
                  {shell.student.name}
                </h2>
                <p className="mt-0.5 text-sm text-foreground/65">
                  {lang === "en" ? "FPT University" : "Trường Đại học FPT"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface/70 p-3.5 backdrop-blur-sm">
                <p className="text-xs text-foreground/55">{t("overview.student_id")}</p>
                <p className="mt-1 truncate text-sm font-semibold">{shell.student.studentId}</p>
              </div>
              <div className="rounded-2xl bg-surface/70 p-3.5 backdrop-blur-sm">
                <p className="text-xs text-foreground/55">{t("overview.cohort")}</p>
                <p className="mt-1 text-sm font-semibold">K{home.metrics.cohort || "19"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Stat Cards */}
        <StatCard
          icon={ShieldCheck}
          label={t("overview.status")}
          value={home.metrics.status}
          tone="success"
          className="xl:col-span-3"
        />
        <StatCard
          icon={Hash}
          label={lang === "en" ? "Program Code" : "Mã chương trình"}
          value={home.metrics.program}
          tone="neutral"
          className="xl:col-span-4"
        />
        <StatCard
          icon={Mail}
          label={t("overview.email")}
          value={<span title={home.metrics.email}>{home.metrics.email}</span>}
          tone="lavender"
          className="col-span-2 md:col-span-1 xl:col-span-4"
        />
        <StatCard
          icon={Wallet}
          label={t("overview.balance")}
          value={
            <span>
              {(home.metrics.balance || "0").replace(/ VNĐ| VND/gi, "")}{" "}
              <span className="text-xs font-medium text-muted-foreground">VND</span>
            </span>
          }
          tone="warning"
          className="col-span-2 md:col-span-1 xl:col-span-3"
        >
          <a
            href={navHref("/thanh-toan")}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-strong hover:underline"
          >
            <span>{lang === "en" ? "Payment" : "Thanh toán"}</span>
            <ArrowUpRight className="size-3" />
          </a>
        </StatCard>
      </div>

      {/* Main Bento */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <DashboardCard
          className="xl:col-span-8"
          icon={Newspaper}
          title={t("overview.latest_news")}
          description={lang === "en" ? "Latest campus announcements" : "6 tin chưa đọc"}
          action={
            <Button variant="soft" size="sm" asChild>
              <a href={navHref("/tin-tuc")}>
                <span>{lang === "en" ? "View all" : "Xem tất cả"}</span>
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
          }
          bodyClassName="pt-4"
        >
          <CategoryFilter
            categories={home.categories}
            value={category}
            onChange={setCategory}
          />
          <div className="mt-3">
            <AnnouncementList items={filteredNews} />
          </div>
        </DashboardCard>

        <div className="flex flex-col gap-4 xl:col-span-4">
          <DashboardCard
            icon={LayoutGrid}
            title={t("sidebar.quick_menu")}
            description={
              lang === "en"
                ? "Quick access to frequently used features"
                : "Truy cập nhanh các chức năng thường dùng"
            }
            bodyClassName="pt-4"
          >
            <div>
              <p className="mb-2.5 flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                <BookOpen className="size-3.5" /> {t("nav.academic")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_MENU.map((item) => (
                  <a
                    key={item.to}
                    href={navHref(item.to)}
                    className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-3 transition-all duration-200 ease-natural hover:border-primary-muted hover:bg-primary-soft/40"
                  >
                    <span className="flex items-center justify-between">
                      <IconTile
                        icon={item.icon}
                        tone="neutral"
                        size="sm"
                        className="transition-colors duration-200 group-hover:bg-surface group-hover:text-primary-strong"
                      />
                      <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    </span>
                    <span className="truncate text-[13px] font-medium">
                      {lang === "en" ? item.titleEn : item.titleVi}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <MiniCalendar />
            <Button variant="secondary" className="mt-4 w-full" asChild>
              <a href={navHref("/thoi-khoa-bieu")}>
                <span>{lang === "en" ? "Open timetable" : "Mở thời khóa biểu"}</span>
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
