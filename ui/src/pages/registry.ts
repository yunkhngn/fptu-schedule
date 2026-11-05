import React from "react";
import type { ShellData } from "@/data/types";
import type { Lang } from "@/i18n";
import { OverviewPage } from "./Overview";
import { TimetablePage } from "./Timetable";
import { ExamsPage } from "./Exams";
import { NewsPage } from "./News";

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
};
