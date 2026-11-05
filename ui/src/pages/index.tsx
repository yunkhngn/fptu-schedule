import React from "react";
import type { PageData } from "@/data/types";
import { OverviewPage } from "./Overview";
import { TimetablePage } from "./Timetable";
import { ExamsPage } from "./Exams";
import { NewsPage } from "./News";
import { WrappedPage } from "./Wrapped";
import { registry, type PageDefinition } from "./registry";

export { OverviewPage, TimetablePage, ExamsPage, NewsPage, WrappedPage, registry, type PageDefinition };

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
    default:
      return null;
  }
}
