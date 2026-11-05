import { useState, useMemo } from "react";
import {
  CalendarDays,
  FilePlus2,
  Hash,
  Mail,
  ShieldCheck,
  Wallet,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { StatCard } from "@/components/molecules/StatCard";
import { CategoryFilter } from "@/components/molecules/CategoryFilter";
import { AnnouncementList } from "@/components/organisms/AnnouncementList";
import { FAP_URLS } from "@/data/nav";
import type { HomeData, ShellData } from "@/data/types";

export interface OverviewPageProps {
  home: HomeData;
  shell: ShellData;
}

export function OverviewPage({ home, shell }: OverviewPageProps) {
  const [category, setCategory] = useState("Tất cả");

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    const timeGreeting =
      h < 11
        ? "Chào buổi sáng"
        : h < 14
        ? "Chào buổi trưa"
        : h < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối";
    return `${timeGreeting}, ${shell.student.name}`;
  }, [shell.student.name]);

  const filteredNews = useMemo(() => {
    if (category === "Tất cả") return home.news;
    return home.news.filter((item) => item.category === category);
  }, [home.news, category]);

  return (
    <div className="space-y-6">
      {/* Greeting and Quick Actions */}
      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">
            {new Intl.DateTimeFormat("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(new Date())}
          </p>
          <h1 className="mt-1 text-[28px] leading-tight font-semibold tracking-[-0.025em] sm:text-[32px]">
            {greeting}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={FAP_URLS.sendApplication}>
              <FilePlus2 className="size-4" />
              <span>Gửi đơn</span>
            </a>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <a href={FAP_URLS.weeklyTimetable}>
              <CalendarDays className="size-4" />
              <span>Thời khóa biểu</span>
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
              Thông tin sinh viên
            </span>
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-surface text-xl font-semibold text-primary-strong shadow-soft">
                {shell.student.initials || "SV"}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-[22px] font-semibold tracking-tight sm:text-2xl">
                  {shell.student.name}
                </h2>
                <p className="mt-0.5 text-sm text-foreground/65">{shell.campus || "Trường Đại học FPT"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface/70 p-3.5 backdrop-blur-sm">
                <p className="text-xs text-foreground/55">Mã sinh viên</p>
                <p className="mt-1 truncate text-sm font-semibold">{shell.student.studentId}</p>
              </div>
              <div className="rounded-2xl bg-surface/70 p-3.5 backdrop-blur-sm">
                <p className="text-xs text-foreground/55">Khóa</p>
                <p className="mt-1 text-sm font-semibold">{home.metrics.cohort || "—"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Stat Cards */}
        <StatCard
          icon={ShieldCheck}
          label="Trạng thái"
          value={home.metrics.status}
          tone="success"
          className="xl:col-span-3"
        />
        <StatCard
          icon={Hash}
          label="Mã chương trình"
          value={home.metrics.program}
          tone="neutral"
          className="xl:col-span-4"
        />
        <StatCard
          icon={Mail}
          label="Email"
          value={home.metrics.email}
          tone="lavender"
          className="col-span-2 md:col-span-1 xl:col-span-4"
        />
        <StatCard
          icon={Wallet}
          label="Số dư"
          value={home.metrics.balance}
          tone="warning"
          className="col-span-2 md:col-span-1 xl:col-span-3"
        />
      </div>

      {/* Announcements Section */}
      <section className="surface-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Tin tức mới nhất</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cập nhật thông báo học vụ, đào tạo và hoạt động sinh viên
            </p>
          </div>
          <CategoryFilter
            categories={home.categories}
            value={category}
            onChange={setCategory}
          />
        </div>

        <div className="mt-5">
          <AnnouncementList items={filteredNews} />
        </div>
      </section>
    </div>
  );
}
