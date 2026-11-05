import { createRoot } from "react-dom/client";
import { mountShadow } from "@/shadow/mount";
import { splitDocumentCss } from "@/shadow/css";
import { removeReturnPill } from "@/shadow/returnPill";
import appCss from "@/design/tokens.css?inline";
import { I18nProvider, normalizeLang } from "@/i18n";
import { isFapUiEnabled } from "@/storage";
import { readAppearance, applyAppearance, watchAppearance } from "@/appearance/appearance";
import { LoginPage, type LoginInfo } from "@/pages/Login";
import { adoptLoginCard } from "./adoptLogin";

export interface LoginBootHelpers {
  /** Gives the original page back (removes the splash and the hiding), recording the reason. */
  cleanup: (reason: string) => void;
  /** Shows the floating switch for turning the new interface back on. */
  showPill: () => void;
}

type LoginReader = { readLogin: (doc: Document) => LoginInfo | null };

type ReaderHost = { FapPageData?: { login?: LoginReader }; FapReadersLogin?: LoginReader };

function readerOf(win: Window): LoginReader | null {
  // On a real page `win` is the window itself; the global covers callers that pass a lighter stand-in.
  const candidates = [win as unknown as ReaderHost, (typeof window !== "undefined" ? window : undefined) as unknown as ReaderHost];
  for (const c of candidates) {
    const reader = c?.FapPageData?.login || c?.FapReadersLogin;
    if (reader) return reader;
  }
  return null;
}

/**
 * The sign-in page. It has no sidebar and no data to wait for: it is FAP's sign-in block shown inside the new
 * design. Anything unexpected gives the original page back, so signing in is never blocked by the new interface.
 */
export async function bootLogin(
  win: Window,
  options: { chromeApi?: typeof chrome; css?: string } | undefined,
  helpers: LoginBootHelpers
): Promise<void> {
  const chromeApi = options?.chromeApi || (win as any).chrome;

  if (!(await isFapUiEnabled(chromeApi))) {
    helpers.cleanup("disabled");
    helpers.showPill();
    return;
  }

  const info = readerOf(win)?.readLogin(win.document) ?? null;
  if (!info) {
    helpers.cleanup("login-structure");
    return;
  }

  (win as any).__fptuUi = true;

  const fontBaseUrl = chromeApi?.runtime?.getURL ? chromeApi.runtime.getURL("dist/fonts/") : undefined;
  const { shadowCss, documentCss } = splitDocumentCss(options?.css ?? appCss);
  const appearance = await readAppearance(chromeApi);
  const { host, root, unmount: unmountShadow } = mountShadow({ css: shadowCss, documentCss, fontBaseUrl });
  removeReturnPill(win.document);

  const adopted = adoptLoginCard(win.document, host);
  if (!adopted) {
    unmountShadow();
    helpers.cleanup("login-structure");
    return;
  }

  const reactRoot = createRoot(root as unknown as HTMLElement);
  let appearanceWatcher: { stop(): void } | null = null;
  let givenBack = false;

  const giveBack = (reason: string) => {
    if (givenBack) return;
    givenBack = true;
    appearanceWatcher?.stop();
    adopted.restore();
    try {
      reactRoot.unmount();
    } catch (_) {}
    unmountShadow();
    helpers.cleanup(reason);
    if (reason === "user-choice" || reason === "disabled") helpers.showPill();
  };
  (win as any).__fptuUiGiveBack = giveBack;

  applyAppearance(host, appearance, win);
  appearanceWatcher = watchAppearance(host, chromeApi, win, appearance);

  const lang = normalizeLang(win.document.documentElement.getAttribute("lang"));
  try {
    reactRoot.render(
      <I18nProvider lang={lang}>
        <LoginPage info={info} />
      </I18nProvider>
    );
  } catch (error) {
    giveBack(`render-error: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  win.document.documentElement.setAttribute("data-fptu-ui", "active");
}
