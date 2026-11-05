import React from "react";
import type { ShellData } from "@/data/types";
import type { Lang } from "@/i18n";
import { OverviewPage } from "./Overview";
import { TimetablePage } from "./Timetable";
import { ExamsPage } from "./Exams";
import { NewsPage } from "./News";
import { AttendanceReport } from "./AttendanceReport";
import { GradeReport } from "./GradeReport";
import { Transcript } from "./Transcript";
import { OjtConditions } from "./OjtConditions";
import { ThesisConditions } from "./ThesisConditions";

export type PageDefinition<T = any> = {
  id: string;
  ready?: (doc: Document) => boolean;
  read: (doc: Document, win: Window) => T | null;
  Component: (props: { data: T; shell: ShellData; lang: Lang }) => React.JSX.Element;
};

export const registry: Record<string, PageDefinition<any>> = {
  overview: {
    id: "overview",
    ready: (doc: Document) => {
      const student = doc.querySelector(".fap-home-student-card");
      const news = doc.querySelectorAll(".fap-home-news-item");
      const slots = doc.querySelectorAll("[data-home-slot]");
      if (slots.length > 0) {
        return Boolean(student || news.length > 0);
      }
      return Boolean(student || news.length > 0);
    },
    read: (doc: Document, win: Window) => {
      // @ts-expect-error global extractor check
      const extractor = win.FapPageData || (typeof window !== "undefined" && (window as any).FapPageData);
      if (!extractor) return null;
      return extractor.readHome(doc);
    },
    Component: ({ data, shell }) => React.createElement(OverviewPage, { home: data, shell }),
  },
  timetable: {
    id: "timetable",
    ready: (doc: Document) => {
      return Boolean(doc.querySelector("#weekly-timetable-container table, .weekly-timetable-grid table"));
    },
    read: (doc: Document, win: Window) => {
      // @ts-expect-error global extractor check
      const extractor = win.FapPageData || (typeof window !== "undefined" && (window as any).FapPageData);
      if (!extractor) return null;
      // @ts-expect-error parser on window
      const getWeekly = win.extractWeeklyScheduleFromTable || (typeof window !== "undefined" ? (window as any).extractWeeklyScheduleFromTable : undefined);
      const raw = getWeekly ? getWeekly(doc) : { schedule: [] };
      const tt = extractor.toTimetable(raw.schedule);
      const hasRows = extractor.hasOriginalRows(doc, "timetable");
      if (hasRows && tt.sessions.length === 0) return null;
      return tt;
    },
    Component: ({ data, shell }) =>
      React.createElement(TimetablePage, { sessions: data.sessions, weekStart: data.weekStart, shell }),
  },
  exams: {
    id: "exams",
    read: (doc: Document, win: Window) => {
      // @ts-expect-error global extractor check
      const extractor = win.FapPageData || (typeof window !== "undefined" && (window as any).FapPageData);
      if (!extractor) return null;
      // @ts-expect-error parser on window
      const getExams = win.extractExamScheduleFromPage || (typeof window !== "undefined" ? (window as any).extractExamScheduleFromPage : undefined);
      const raw = getExams ? getExams(doc) : [];
      const ex = extractor.toExams(raw);
      const hasRows = extractor.hasOriginalRows(doc, "exams");
      if (hasRows && ex.length === 0) return null;
      return ex;
    },
    Component: ({ data }) => React.createElement(ExamsPage, { exams: data }),
  },
  news: {
    id: "news",
    read: (doc: Document, win: Window) => {
      // @ts-expect-error global extractor check
      const extractor = win.FapPageData || (typeof window !== "undefined" && (window as any).FapPageData);
      if (!extractor) return null;
      return extractor.readNews(doc);
    },
    Component: ({ data }) => React.createElement(NewsPage, { news: data.news, categories: data.categories }),
  },
  "report-attendance": {
    id: "report-attendance",
    ready: (doc: Document) => Boolean(doc.querySelector("#attendance-report, .attendance-session-sheet")),
    read: (doc: Document, win: Window) => {
      // @ts-expect-error global reader check
      const reader = win.FapReadersReports || (win.FapPageData && win.FapPageData.reports) || (typeof window !== "undefined" && ((window as any).FapReadersReports || (window as any).FapPageData?.reports));
      if (!reader || typeof reader.readAttendanceReport !== "function") return null;
      return reader.readAttendanceReport(doc);
    },
    Component: ({ data, shell, lang }) =>
      React.createElement(AttendanceReport, { data, shell, lang }),
  },
  "report-grade": {
    id: "report-grade",
    ready: (doc: Document) => Boolean(doc.querySelector("#grade-report, .student-mark-sheet")),
    read: (doc: Document, win: Window) => {
      // @ts-expect-error global reader check
      const reader = win.FapReadersReports || (win.FapPageData && win.FapPageData.reports) || (typeof window !== "undefined" && ((window as any).FapReadersReports || (window as any).FapPageData?.reports));
      if (!reader || typeof reader.readGradeReport !== "function") return null;
      return reader.readGradeReport(doc);
    },
    Component: ({ data, shell, lang }) =>
      React.createElement(GradeReport, { data, shell, lang }),
  },
  "report-transcript": {
    id: "report-transcript",
    ready: (doc: Document) => Boolean(doc.querySelector("#gpa-helper, .fap-sheet, table")),
    read: (doc: Document, win: Window) => {
      // @ts-expect-error global reader check
      const reader = win.FapReadersReports || (win.FapPageData && win.FapPageData.reports) || (typeof window !== "undefined" && ((window as any).FapReadersReports || (window as any).FapPageData?.reports));
      if (!reader || typeof reader.readTranscript !== "function") return null;
      return reader.readTranscript(doc);
    },
    Component: ({ data, shell, lang }) =>
      React.createElement(Transcript, { data, shell, lang }),
  },
  "report-ojt-conditions": {
    id: "report-ojt-conditions",
    ready: (doc: Document) => Boolean(doc.querySelector(".fap-empty-card, table, .fap-page-title__crumb-current")),
    read: (doc: Document, win: Window) => {
      // @ts-expect-error global reader check
      const reader = win.FapReadersConditions || (win.FapPageData && win.FapPageData.conditions) || (typeof window !== "undefined" && ((window as any).FapReadersConditions || (window as any).FapPageData?.conditions));
      if (!reader || typeof reader.readConditions !== "function") return null;
      return reader.readConditions(doc);
    },
    Component: ({ data, shell, lang }) =>
      React.createElement(OjtConditions, { data, shell, lang }),
  },
  "report-thesis-conditions": {
    id: "report-thesis-conditions",
    ready: (doc: Document) => Boolean(doc.querySelector(".fap-empty-card, table, .fap-page-title__crumb-current")),
    read: (doc: Document, win: Window) => {
      // @ts-expect-error global reader check
      const reader = win.FapReadersConditions || (win.FapPageData && win.FapPageData.conditions) || (typeof window !== "undefined" && ((window as any).FapReadersConditions || (window as any).FapPageData?.conditions));
      if (!reader || typeof reader.readConditions !== "function") return null;
      return reader.readConditions(doc);
    },
    Component: ({ data, shell, lang }) =>
      React.createElement(ThesisConditions, { data, shell, lang }),
  },
};
