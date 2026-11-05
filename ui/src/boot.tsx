import React from "react";
import { createRoot } from "react-dom/client";
import { matchPage, type PageId } from "./routes";
import { readOriginalPreference, saveOriginalPreference, isFapUiEnabled } from "./storage";
import { mountShadow } from "./shadow/mount";
import { AppShell } from "./components/templates/AppShell";
import type { ShellData, PageData } from "./data/types";

export interface BootOptions {
  win?: Window;
  chromeApi?: typeof chrome;
  timeoutMs?: number;
  renderContent?: (pageData: PageData) => React.ReactNode;
}

function getExtractor(win: Window) {
  // @ts-expect-error global extractor check
  return win.FapPageData || (typeof window !== "undefined" && (window as any).FapPageData);
}

function cleanupFallback(doc: Document, win: Window) {
  doc.documentElement.removeAttribute("data-fptu-ui");
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

export async function boot(options?: BootOptions): Promise<void> {
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
    cleanupFallback(win.document, win);
    return;
  }

  const originalPref = await readOriginalPreference(page, chromeApi);
  if (originalPref) {
    cleanupFallback(win.document, win);
    return;
  }

  const timeoutMs = options?.timeoutMs !== undefined ? options.timeoutMs : 8000;
  const dataReady = await waitForData(win.document, page, timeoutMs);
  if (!dataReady) {
    cleanupFallback(win.document, win);
    return;
  }

  const extractor = getExtractor(win);
  if (!extractor) {
    cleanupFallback(win.document, win);
    return;
  }

  const hasRows = extractor.hasOriginalRows(win.document, page);

  // Parse page specific data and check for parser fallback condition
  if (page === "timetable") {
    // @ts-expect-error parser on window
    const getWeekly = win.extractWeeklyScheduleFromTable || (typeof window !== "undefined" ? (window as any).extractWeeklyScheduleFromTable : undefined);
    const raw = getWeekly ? getWeekly(win.document) : { schedule: [] };
    const tt = extractor.toTimetable(raw.schedule);
    if (hasRows && tt.sessions.length === 0) {
      cleanupFallback(win.document, win);
      return;
    }
  } else if (page === "exams") {
    // @ts-expect-error parser on window
    const getExams = win.extractExamScheduleFromPage || (typeof window !== "undefined" ? (window as any).extractExamScheduleFromPage : undefined);
    const raw = getExams ? getExams(win.document) : [];
    const ex = extractor.toExams(raw);
    if (hasRows && ex.length === 0) {
      cleanupFallback(win.document, win);
      return;
    }
  }

  const shell = extractor.readShell(win.document);
  if (!shell) {
    cleanupFallback(win.document, win);
    return;
  }

  // Set flag so duplicate calls bail early
  // @ts-expect-error flag assign
  win.__fptuUi = true;

  const fontBaseUrl = chromeApi?.runtime?.getURL ? chromeApi.runtime.getURL("dist/fonts/") : undefined;

  const { host, root, unmount: unmountShadow } = mountShadow({
    css: "",
    documentCss: "",
    fontBaseUrl,
  });

  const reactRoot = createRoot(root as unknown as HTMLElement);

  const handleShowOriginal = async () => {
    await saveOriginalPreference(page, true, chromeApi);
    reactRoot.unmount();
    unmountShadow();
    cleanupFallback(win.document, win);
  };

  reactRoot.render(
    <AppShell
      shell={shell}
      activePath={pathname}
      onShowOriginal={handleShowOriginal}
    >
      <div data-testid="page-container" className="p-4">
        {/* Page content rendered here; full page integration in Task 10 */}
      </div>
    </AppShell>
  );

  win.document.documentElement.setAttribute("data-fptu-ui", "active");
}
