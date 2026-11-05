import React from "react";
import { createRoot } from "react-dom/client";
import { matchPage, type PageId } from "./routes";
import { readOriginalPreference, saveOriginalPreference, isFapUiEnabled } from "./storage";
import { mountShadow } from "./shadow/mount";
import { splitDocumentCss } from "./shadow/css";
import { mountReturnPill, removeReturnPill } from "./shadow/returnPill";
import appCss from "./design/tokens.css?inline";
import { AppShell } from "./components/templates/AppShell";
import { renderPage } from "./pages";
import type { ShellData, PageData } from "./data/types";

export interface BootOptions {
  win?: Window;
  chromeApi?: typeof chrome;
  timeoutMs?: number;
  renderContent?: (pageData: PageData) => React.ReactNode;
  /** Stylesheet for the shadow tree; defaults to the bundled Tailwind build. Mainly for tests. */
  css?: string;
}

function getExtractor(win: Window) {
  // @ts-expect-error global extractor check
  return win.FapPageData || (typeof window !== "undefined" && (window as any).FapPageData);
}

/**
 * Gives the page back to the original FAP. The reason is written to <html data-fptu-ui-reason> and the
 * console so a student can tell us why the new interface did not show.
 */
function cleanupFallback(doc: Document, win: Window, reason: string) {
  doc.documentElement.removeAttribute("data-fptu-ui");
  doc.documentElement.setAttribute("data-fptu-ui-reason", reason);
  if (reason !== "user-choice" && reason !== "disabled" && reason !== "original-preference") {
    try {
      console.warn("[FPTU UI] showing the original FAP page:", reason);
    } catch (_) {}
  }
  const host = doc.getElementById("fptu-ui-host");
  if (host) host.remove();
  // @ts-expect-error flag cleanup
  delete win.__fptuUi;
}

async function waitForData(doc: Document, page: PageId, timeoutMs: number): Promise<boolean> {
  const checkReady = () => {
    if (page === "overview") {
      const student = doc.querySelector(".fap-home-student-card");
      const news = doc.querySelectorAll(".fap-home-news-item");
      const slots = doc.querySelectorAll("[data-home-slot]");
      if (slots.length > 0) {
        return Boolean(student || news.length > 0);
      }
      return Boolean(student || news.length > 0);
    }
    if (page === "timetable") {
      // FAP fetches the week from /WeeklyTimetable/WeekPartial after the page is idle; until then the
      // container only holds a loading message and the parser would see an empty week.
      return Boolean(doc.querySelector("#weekly-timetable-container table, .weekly-timetable-grid table"));
    }
    return true;
  };

  if (checkReady()) return true;

  const Observer = doc.defaultView?.MutationObserver || (typeof MutationObserver !== "undefined" ? MutationObserver : null);
  if (!Observer) return checkReady();

  return new Promise((resolve) => {
    let resolved = false;
    const observer = new Observer(() => {
      if (checkReady()) {
        if (!resolved) {
          resolved = true;
          observer.disconnect();
          resolve(true);
        }
      }
    });

    observer.observe(doc.body || doc.documentElement, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        resolve(checkReady());
      }
    }, timeoutMs);
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

class RenderBoundary extends React.Component<
  { onError: (error: unknown) => void; children?: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }
  render() {
    return this.state.hasError ? null : (this.props.children ?? null);
  }
}

async function bootInner(options?: BootOptions): Promise<void> {
  const win = options?.win || (typeof window !== "undefined" ? window : null);
  if (!win || !win.document) return;

  // Guard against duplicate execution
  // @ts-expect-error global flag check
  if (win.__fptuUi) return;
  if (win.document.getElementById("fptu-ui-host")) return;

  const pathname = win.location ? win.location.pathname : "";
  const page = matchPage(pathname);
  if (!page) return;

  const chromeApi = options?.chromeApi || (win as any).chrome;
  const enabled = await isFapUiEnabled(chromeApi);
  if (!enabled) {
    cleanupFallback(win.document, win, "disabled");
    return;
  }

  const originalPref = await readOriginalPreference(page, chromeApi);
  if (originalPref) {
    cleanupFallback(win.document, win, "original-preference");
    mountReturnPill(win.document, async () => {
      await saveOriginalPreference(page, false, chromeApi);
      win.location.reload();
    });
    return;
  }

  const timeoutMs = options?.timeoutMs !== undefined ? options.timeoutMs : 8000;
  const dataReady = await waitForData(win.document, page, timeoutMs);
  if (!dataReady) {
    cleanupFallback(win.document, win, "data-timeout");
    return;
  }

  const extractor = getExtractor(win);
  if (!extractor) {
    cleanupFallback(win.document, win, "no-extractor");
    return;
  }

  const shell = extractor.readShell(win.document);
  if (!shell) {
    cleanupFallback(win.document, win, "no-shell");
    return;
  }

  const hasRows = extractor.hasOriginalRows(win.document, page);
  let pageData: PageData | null = null;

  if (page === "overview") {
    const home = extractor.readHome(win.document);
    if (!home) {
      cleanupFallback(win.document, win, "no-home-data");
      return;
    }
    pageData = { shell, page: "overview", home };
  } else if (page === "timetable") {
    // @ts-expect-error parser on window
    const getWeekly = win.extractWeeklyScheduleFromTable || (typeof window !== "undefined" ? (window as any).extractWeeklyScheduleFromTable : undefined);
    const raw = getWeekly ? getWeekly(win.document) : { schedule: [] };
    const tt = extractor.toTimetable(raw.schedule);
    if (hasRows && tt.sessions.length === 0) {
      cleanupFallback(win.document, win, "timetable-parser-empty");
      return;
    }
    pageData = { shell, page: "timetable", sessions: tt.sessions, weekStart: tt.weekStart };
  } else if (page === "exams") {
    // @ts-expect-error parser on window
    const getExams = win.extractExamScheduleFromPage || (typeof window !== "undefined" ? (window as any).extractExamScheduleFromPage : undefined);
    const raw = getExams ? getExams(win.document) : [];
    const ex = extractor.toExams(raw);
    if (hasRows && ex.length === 0) {
      cleanupFallback(win.document, win, "exams-parser-empty");
      return;
    }
    pageData = { shell, page: "exams", exams: ex };
  } else if (page === "news") {
    const newsData = extractor.readNews(win.document);
    if (!newsData) {
      cleanupFallback(win.document, win, "no-news-data");
      return;
    }
    pageData = { shell, page: "news", news: newsData.news, categories: newsData.categories };
  }

  if (!pageData) {
    cleanupFallback(win.document, win, "no-page-data");
    return;
  }

  // Set flag so duplicate calls bail early
  // @ts-expect-error flag assign
  win.__fptuUi = true;

  const fontBaseUrl = chromeApi?.runtime?.getURL ? chromeApi.runtime.getURL("dist/fonts/") : undefined;

  // @property and @font-face rules only work in the main document, everything else goes into the shadow root.
  const { shadowCss, documentCss } = splitDocumentCss(options?.css ?? appCss);

  const { host, root, unmount: unmountShadow } = mountShadow({
    css: shadowCss,
    documentCss,
    fontBaseUrl,
  });

  const reactRoot = createRoot(root as unknown as HTMLElement);

  removeReturnPill(win.document);

  const giveBack = (reason: string) => {
    try {
      reactRoot.unmount();
    } catch (_) {}
    unmountShadow();
    cleanupFallback(win.document, win, reason);
  };

  const handleShowOriginal = async () => {
    await saveOriginalPreference(page, true, chromeApi);
    giveBack("user-choice");
  };

  let content: React.ReactNode;
  try {
    content = options?.renderContent ? options.renderContent(pageData) : renderPage(pageData, chromeApi);
  } catch (error) {
    console.error("[FPTU UI] render failed", error);
    giveBack(`render-error: ${errorMessage(error)}`);
    return;
  }

  reactRoot.render(
    <RenderBoundary
      onError={(error) => {
        console.error("[FPTU UI] render failed", error);
        // Unmounting while React is still handling the error is unsafe, so wait a tick.
        setTimeout(() => giveBack(`render-error: ${errorMessage(error)}`), 0);
      }}
    >
      <AppShell shell={shell} activePath={pathname} onShowOriginal={handleShowOriginal}>
        {content}
      </AppShell>
    </RenderBoundary>
  );

  win.document.documentElement.setAttribute("data-fptu-ui", "active");
}

/** Never leave the page hidden: any unexpected error gives the original FAP page back. */
export async function boot(options?: BootOptions): Promise<void> {
  try {
    await bootInner(options);
  } catch (error) {
    const win = options?.win || (typeof window !== "undefined" ? window : null);
    if (win && win.document) {
      console.error("[FPTU UI] boot failed", error);
      cleanupFallback(win.document, win, `error: ${errorMessage(error)}`);
    }
  }
}
