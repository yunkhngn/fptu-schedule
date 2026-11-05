import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { matchRoute } from "./routes";
import { isFapUiEnabled, setFapUiEnabled, clearLegacyOriginalPreferences } from "./storage";
import { mountShadow } from "./shadow/mount";
import { splitDocumentCss } from "./shadow/css";
import { mountReturnPill, removeReturnPill } from "./shadow/returnPill";
import { bootLogin } from "./login/bootLogin";
import appCss from "./design/tokens.css?inline";
import { AppShell } from "./components/templates/AppShell";
import { renderPage, registry, WrappedPage } from "./pages";
import { adoptContent, resolveWrappedTitle, type AdoptResult } from "./shadow/wrapped";
import { I18nProvider, normalizeLang } from "./i18n";
import { logout, submitLanguage } from "./topbar/actions";
import {
  readAppearance,
  applyAppearance,
  watchAppearance,
  type ThemePreference,
} from "./appearance/appearance";
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
  if (reason !== "user-choice" && reason !== "disabled") {
    try {
      console.warn("[FPTU UI] showing the original FAP page:", reason);
    } catch (_) {}
  }
  const host = doc.getElementById("fptu-ui-host");
  if (host) host.remove();
  // @ts-expect-error flag cleanup
  delete win.__fptuUi;
  // @ts-expect-error handle cleanup
  delete win.__fptuUiGiveBack;
}

/** Floating switch on pages that show the original FAP because the student turned the new interface off. */
function showReturnPill(win: Window, chromeApi: typeof chrome | undefined) {
  mountReturnPill(win.document, async () => {
    await setFapUiEnabled(true, chromeApi);
    // The storage listener turns the interface on in every open tab; without it, reload this tab.
    if (!chromeApi?.storage?.onChanged?.addListener) win.location.reload();
  });
}

async function waitForReady(
  doc: Document,
  isReady: (doc: Document) => boolean,
  timeoutMs: number
): Promise<boolean> {
  if (isReady(doc)) return true;

  const Observer =
    doc.defaultView?.MutationObserver ||
    (typeof MutationObserver !== "undefined" ? MutationObserver : null);
  if (!Observer) return isReady(doc);

  return new Promise((resolve) => {
    let resolved = false;
    const observer = new Observer(() => {
      if (isReady(doc)) {
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
        resolve(isReady(doc));
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
  const matched = matchRoute(pathname);
  if (!matched) return;

  const chromeApi = options?.chromeApi || (win as any).chrome;

  // The sign-in page has no sidebar and nothing to wait for: it shows FAP's sign-in block in the new design.
  if (matched.kind === "auth") {
    await bootLogin(win, { chromeApi, css: options?.css }, {
      cleanup: (reason) => cleanupFallback(win.document, win, reason),
      showPill: () => showReturnPill(win, chromeApi),
    });
    return;
  }

  const enabled = await isFapUiEnabled(chromeApi);
  if (!enabled) {
    cleanupFallback(win.document, win, "disabled");
    showReturnPill(win, chromeApi);
    return;
  }

  const timeoutMs = options?.timeoutMs !== undefined ? options.timeoutMs : 8000;
  const extractor = getExtractor(win);
  const readShellData: ShellData | null = extractor ? extractor.readShell(win.document) : null;
  if (extractor && !readShellData) {
    // No FAP top bar or sidebar: the student is signed out, or this is an error page. There is nothing to wrap and
    // no data to wait for, so give the page back now instead of keeping it behind the splash.
    cleanupFallback(win.document, win, "no-shell");
    return;
  }
  const shell: ShellData = readShellData || {
    student: { name: "", initials: "", studentId: "" },
    campus: "",
    unreadNotifications: 0,
  };

  const topbar = typeof extractor?.readTopbar === "function" ? extractor.readTopbar(win.document) : null;
  const lang = normalizeLang(topbar?.language?.current);

  const pageDef = registry[matched.id];
  let content: React.ReactNode = null;
  let adopted: AdoptResult | null = null;
  let useWrapped = false;
  let pageData: PageData | null = null;

  if (pageDef) {
    let ready = true;
    if (pageDef.ready) {
      ready = await waitForReady(win.document, pageDef.ready, timeoutMs);
    }
    if (ready) {
      const data = pageDef.read(win.document, win);
      if (data !== null) {
        if (matched.id === "overview") pageData = { shell, page: "overview", home: data };
        else if (matched.id === "timetable") pageData = { shell, page: "timetable", sessions: data.sessions, weekStart: data.weekStart };
        else if (matched.id === "exams") pageData = { shell, page: "exams", exams: data };
        else if (matched.id === "news") pageData = { shell, page: "news", news: data.news, categories: data.categories };

        content = pageDef.Component({ data, shell, lang });
      } else {
        useWrapped = true;
      }
    } else {
      useWrapped = true;
    }
  } else {
    useWrapped = true;
  }

  win.__fptuUi = true;

  const fontBaseUrl = chromeApi?.runtime?.getURL ? chromeApi.runtime.getURL("dist/fonts/") : undefined;
  const { shadowCss, documentCss } = splitDocumentCss(options?.css ?? appCss);
  const appearance = await readAppearance(chromeApi);

  const { host, root, unmount: unmountShadow } = mountShadow({
    css: shadowCss,
    documentCss,
    fontBaseUrl,
  });

  const reactRoot: Root = createRoot(root as unknown as HTMLElement);
  removeReturnPill(win.document);

  let appearanceWatcher: { stop(): void } | null = null;
  let givenBack = false;

  const giveBack = (reason: string) => {
    if (givenBack) return;
    givenBack = true;
    appearanceWatcher?.stop();
    if (adopted) {
      adopted.restore();
      adopted = null;
    }
    try {
      reactRoot.unmount();
    } catch (_) {}
    unmountShadow();
    cleanupFallback(win.document, win, reason);
    if (reason === "user-choice" || reason === "disabled") showReturnPill(win, chromeApi);
  };

  // @ts-expect-error handle for the storage listener
  win.__fptuUiGiveBack = giveBack;

  if (useWrapped) {
    adopted = adoptContent(win.document, host);
    if (!adopted) {
      giveBack(pageDef ? "data-timeout" : "no-content-page");
      return;
    }
    const title = resolveWrappedTitle(win.document);
    content = <WrappedPage title={title} />;
  }

  if (options?.renderContent) {
    try {
      content = options.renderContent(pageData!);
    } catch (error) {
      console.error("[FPTU UI] render failed", error);
      giveBack(`render-error: ${errorMessage(error)}`);
      return;
    }
  }

  const handleShowOriginal = async () => {
    await setFapUiEnabled(false, chromeApi);
    giveBack("user-choice");
  };

  const handleThemeChange = (next: ThemePreference) => {
    try {
      chromeApi?.storage?.local?.set?.({ theme: next });
    } catch (_) {}
  };

  const handleLogout = () => {
    logout(win.document);
  };

  const handleSelectLanguage = (culture: string) => {
    submitLanguage(win.document, culture);
  };

  const renderTree = (themePref: ThemePreference) => {
    reactRoot.render(
      <RenderBoundary
        onError={(error) => {
          console.error("[FPTU UI] render failed", error);
          setTimeout(() => giveBack(`render-error: ${errorMessage(error)}`), 0);
        }}
      >
        <I18nProvider lang={lang}>
          <AppShell
            shell={shell}
            topbar={topbar}
            activePath={pathname}
            onShowOriginal={handleShowOriginal}
            onLogout={handleLogout}
            onSelectLanguage={handleSelectLanguage}
            themePreference={themePref}
            onThemeChange={handleThemeChange}
          >
            {content}
          </AppShell>
        </I18nProvider>
      </RenderBoundary>
    );
  };

  applyAppearance(host, appearance, win);
  appearanceWatcher = watchAppearance(
    host,
    chromeApi,
    win,
    appearance,
    (next) => {
      renderTree(next.theme);
    }
  );

  renderTree(appearance.theme);
  win.document.documentElement.setAttribute("data-fptu-ui", "active");
}

/**
 * Follows the master switch (popup or floating button) in every open tab without a reload:
 * off hands the page back to the original FAP, on builds the new interface again.
 */
function watchMasterSwitch(win: Window, chromeApi: typeof chrome | undefined, options?: BootOptions) {
  // @ts-expect-error watcher flag
  if (win.__fptuUiWatching) return;
  const onChanged = chromeApi?.storage?.onChanged;
  if (!onChanged?.addListener) return;
  // @ts-expect-error watcher flag
  win.__fptuUiWatching = true;

  onChanged.addListener((changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area !== "local" || !changes || !("fapUiEnabled" in changes)) return;
    const enabled = changes.fapUiEnabled.newValue !== false;
    if (!enabled) {
      // @ts-expect-error handle set by bootInner
      const giveBack = win.__fptuUiGiveBack as ((reason: string) => void) | undefined;
      if (giveBack) {
        giveBack("disabled");
      } else if (!win.document.getElementById("fptu-ui-return")) {
        showReturnPill(win, chromeApi);
      }
    } else {
      removeReturnPill(win.document);
      void boot(options);
    }
  });
}

/** Never leave the page hidden: any unexpected error gives the original FAP page back. */
export async function boot(options?: BootOptions): Promise<void> {
  try {
    const win = options?.win || (typeof window !== "undefined" ? window : null);
    if (win && win.document) {
      const pathname = win.location ? win.location.pathname : "";
      const matched = matchRoute(pathname);
      if (matched) {
        const chromeApi = options?.chromeApi || (win as any).chrome;
        void clearLegacyOriginalPreferences(chromeApi);
        watchMasterSwitch(win, chromeApi, options);
      }
    }
    await bootInner(options);
  } catch (error) {
    const win = options?.win || (typeof window !== "undefined" ? window : null);
    if (win && win.document) {
      console.error("[FPTU UI] boot failed", error);
      cleanupFallback(win.document, win, `error: ${errorMessage(error)}`);
    }
  }
}
