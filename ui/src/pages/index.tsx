import React from "react";
import type { PageData } from "@/data/types";
import { OverviewPage } from "./Overview";
import { TimetablePage } from "./Timetable";
import { ExamsPage } from "./Exams";
import { NewsPage } from "./News";
import { WrappedPage } from "./Wrapped";
import { AttendanceReport } from "./AttendanceReport";
import { GradeReport } from "./GradeReport";
import { Transcript } from "./Transcript";
import { OjtConditions } from "./OjtConditions";
import { ThesisConditions } from "./ThesisConditions";
import { Subjects } from "./Subjects";
import { Curriculum } from "./Curriculum";
import { Certificates } from "./Certificates";
import { Transactions } from "./Transactions";
import { Documents } from "./Documents";
import { Wishlist } from "./Wishlist";
import { FyeCheckIn } from "./FyeCheckIn";
import { FyeMentorFeedback } from "./FyeMentorFeedback";
import { Applications } from "./Applications";
import { ApplicationCatalog } from "./ApplicationCatalog";
import { StartupGroupEmpty } from "./StartupGroupEmpty";
import { CrossClassChangeEmpty } from "./CrossClassChangeEmpty";
import { registry, type PageDefinition } from "./registry";

export {
  OverviewPage,
  TimetablePage,
  ExamsPage,
  NewsPage,
  WrappedPage,
  AttendanceReport,
  GradeReport,
  Transcript,
  OjtConditions,
  ThesisConditions,
  Subjects,
  Curriculum,
  Certificates,
  Transactions,
  Documents,
  Wishlist,
  FyeCheckIn,
  FyeMentorFeedback,
  Applications,
  ApplicationCatalog,
  StartupGroupEmpty,
  CrossClassChangeEmpty,
  registry,
  type PageDefinition,
};

export function renderPage(
  data: PageData,
  chromeApi?: typeof chrome
): React.ReactNode {
  switch (data.page) {
    case "overview":
      return <OverviewPage home={data.home} shell={data.shell} />;
    case "timetable":
      return (
        <TimetablePage
          sessions={data.sessions}
          weekStart={data.weekStart}
        />
      );
    case "exams":
      return <ExamsPage exams={data.exams} />;
    case "news":
      return (
        <NewsPage
          news={data.news}
          categories={data.categories}
          chromeApi={chromeApi}
        />
      );
    case "report-attendance":
      return <AttendanceReport data={data.attendance} shell={data.shell} />;
    case "report-grade":
      return <GradeReport data={data.grade} shell={data.shell} />;
    case "report-transcript":
      return <Transcript data={data.transcript} shell={data.shell} />;
    case "report-ojt-conditions":
      return <OjtConditions data={data.conditions} shell={data.shell} />;
    case "report-thesis-conditions":
      return <ThesisConditions data={data.conditions} shell={data.shell} />;
    case "subject":
      return <Subjects data={data.subjects} shell={data.shell} />;
    case "curriculum":
      return <Curriculum data={data.curriculum} shell={data.shell} />;
    case "my-certificates":
      return <Certificates data={data.certificates} shell={data.shell} />;
    case "transaction":
      return <Transactions data={data.transactions} shell={data.shell} />;
    case "document":
      return <Documents data={data.documents} shell={data.shell} />;
    case "wishlist":
      return <Wishlist data={data.wishlist} shell={data.shell} />;
    case "fye-check-in-log":
      return <FyeCheckIn data={data.fye} shell={data.shell} />;
    case "fye-mentor-feedback":
      return <FyeMentorFeedback data={data.fye} shell={data.shell} />;
    case "application":
      return <Applications data={data.applications} shell={data.shell} />;
    case "application-catalog":
      return <ApplicationCatalog data={data.catalog} shell={data.shell} />;
    case "startup-group":
      return <StartupGroupEmpty data={data.startup} shell={data.shell} />;
    case "cross-class-change":
      return <CrossClassChangeEmpty data={data.crossClass} shell={data.shell} />;
    default:
      return null;
  }
}
