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
    default:
      return null;
  }
}
