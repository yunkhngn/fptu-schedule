import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { matchPage } from "./routes";
import { isFapUiEnabled, setFapUiEnabled } from "./storage";
import { boot } from "./boot";
import { makeChrome } from "./test/chrome";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

describe("matchPage router", () => {
  it("matches root path to overview", () => {
    expect(matchPage("/")).toBe("overview");
    expect(matchPage("")).toBe("overview");
  });

  it("matches timetable, exams and news pages", () => {
    expect(matchPage("/WeeklyTimetable")).toBe("timetable");
    expect(matchPage("/WeeklyTimetable/")).toBe("timetable");
    expect(matchPage("/ExamSchedule")).toBe("exams");
    expect(matchPage("/News")).toBe("news");
    expect(matchPage("/News/Index")).toBe("news");
  });

  it("returns null for detail, auth and unsupported routes", () => {
    expect(matchPage("/News/Detail/abc")).toBe(null);
    expect(matchPage("/News/Detail")).toBe(null);
    expect(matchPage("/Auth/Login")).toBe(null);
    expect(matchPage("/Application/Create")).toBe(null);
  });
});

describe("storage preferences", () => {
  it("reads and writes fapUiEnabled master toggle (default true)", async () => {
    const store: Record<string, unknown> = {};
    const mockChrome = {
      storage: {
        local: {
          get: vi.fn(async (keys: string[]) => {
            const res: Record<string, unknown> = {};
            keys.forEach((k) => { res[k] = store[k]; });
            return res;
          }),
          set: vi.fn(async (items: Record<string, unknown>) => {
            Object.assign(store, items);
          }),
        },
      },
    } as unknown as typeof chrome;

    expect(await isFapUiEnabled(mockChrome)).toBe(true);
    await setFapUiEnabled(false, mockChrome);
    expect(await isFapUiEnabled(mockChrome)).toBe(false);
    expect(store["fapUiEnabled"]).toBe(false);
  });
});

describe("boot lifecycle and fallback", () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.documentElement.removeAttribute("data-fptu-ui");
    const oldHost = document.getElementById("fptu-ui-host");
    if (oldHost) oldHost.remove();
    // @ts-expect-error test flag cleanup
    delete window.__fptuUi;
  });

  afterEach(() => {
    document.getElementById("fptu-ui-return")?.remove();
    document.documentElement.removeAttribute("data-fptu-ui");
    const oldHost = document.getElementById("fptu-ui-host");
    if (oldHost) oldHost.remove();
    // @ts-expect-error test flag cleanup
    delete window.__fptuUi;
  });

  it("does nothing on /Auth/Login", async () => {
    const mockWin = {
      location: { pathname: "/Auth/Login" },
      document: window.document,
    } as unknown as Window;

    await boot({ win: mockWin });
    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
    expect(document.getElementById("fptu-ui-host")).toBe(null);
  });

  it("is idempotent when called twice on the same window", async () => {
    const fixtureHtml = `
      <div class="fap-topbar">
        <div class="fap-topbar-user">
          <h5>Nguyễn Văn A</h5>
          <h6>SE000000</h6>
        </div>
      </div>
      <div class="fap-home-student-card">
        <div class="fap-home-student-card__metric"><div class="fap-home-student-card__value">HD</div></div>
      </div>
      <div class="fap-home-news-item">
        <span class="fap-home-news-item__title">Title 1</span>
        <span class="fap-home-news-item__meta"><span>Category</span><span>Date</span></span>
      </div>
    `;
    document.body.innerHTML = fixtureHtml;

    const mockWin = {
      location: { pathname: "/" },
      document: window.document,
      customElements: window.customElements,
    } as unknown as Window;

    await boot({ win: mockWin });
    await boot({ win: mockWin });

    expect(document.querySelectorAll("#fptu-ui-host").length).toBe(1);
    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe("active");
  });

  it("applies the stylesheet to the shadow root, so the interface is not rendered unstyled", async () => {
    document.body.innerHTML = `
      <div class="fap-topbar-user"><h5>Nguyễn Văn A</h5><h6>SE000000</h6></div>
      <div class="fap-home-student-card">
        <div class="fap-home-student-card__metric"><div class="fap-home-student-card__value">HD</div></div>
      </div>
      <div class="fap-home-news-item">
        <span class="fap-home-news-item__title">Title 1</span>
        <span class="fap-home-news-item__meta"><span>Category</span><span>Date</span></span>
      </div>
    `;
    const mockWin = {
      location: { pathname: "/" },
      document: window.document,
      customElements: window.customElements,
    } as unknown as Window;

    await boot({ win: mockWin, css: ".fptu-style-marker{color:rgb(1,2,3)}" });

    const root = document.getElementById("fptu-ui-host")!.shadowRoot!;
    const sheets = (root as ShadowRoot & { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets || [];
    const styleEl = root.querySelector("style");
    const hasAdopted = sheets.some((s) => Array.from(s.cssRules).some((r) => r.cssText.includes("fptu-style-marker")));
    const hasStyleEl = !!styleEl && (styleEl.textContent || "").includes("fptu-style-marker");
    expect(hasAdopted || hasStyleEl).toBe(true);
  });

  it("falls back to original FAP if overview [data-home-slot] never populates within timeoutMs", async () => {
    document.body.innerHTML = `
      <div class="fap-topbar">
        <div class="fap-topbar-user">
          <h5>Nguyễn Văn A</h5>
          <h6>SE000000</h6>
        </div>
      </div>
      <div data-home-slot="student"></div>
      <div data-home-slot="news"></div>
    `;
    document.documentElement.setAttribute("data-fptu-ui", "pending");

    const mockWin = {
      location: { pathname: "/" },
      document: window.document,
      MutationObserver: window.MutationObserver,
    } as unknown as Window;

    await boot({ win: mockWin, timeoutMs: 50 });

    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
    expect(document.getElementById("fptu-ui-host")).toBe(null);
  });

  it("falls back to original FAP if timetable hasOriginalRows is true but parser yields empty", async () => {
    // Has table rows with text, but parser returns empty
    document.body.innerHTML = `
      <div class="fap-topbar">
        <div class="fap-topbar-user">
          <h5>Nguyễn Văn A</h5>
          <h6>SE000000</h6>
        </div>
      </div>
      <div class="weekly-timetable-grid">
        <table>
          <tbody>
            <tr><td><span class="weekly-timetable-cell-title">Some Course</span></td></tr>
          </tbody>
        </table>
      </div>
    `;
    document.documentElement.setAttribute("data-fptu-ui", "pending");

    // Stub window.extractWeeklyScheduleFromTable to return empty
    // @ts-expect-error test stub
    window.extractWeeklyScheduleFromTable = () => ({ schedule: [], skipped: 0 });

    const mockWin = {
      location: { pathname: "/WeeklyTimetable" },
      document: window.document,
      extractWeeklyScheduleFromTable: () => ({ schedule: [], skipped: 0 }),
    } as unknown as Window;

    await boot({ win: mockWin });

    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
    expect(document.getElementById("fptu-ui-host")).toBe(null);
  });

  const timetableShellHtml = `
    <div class="fap-topbar-user"><h5>Nguyễn Văn A</h5><h6>SE000000</h6></div>
    <div id="weekly-timetable-container" data-fetch-url="/WeeklyTimetable/WeekPartial">
      <div class="text-muted">Đang tải thời khóa biểu tuần...</div>
    </div>
  `;
  const timetableRow = {
    title: "PRM393",
    date: "3/11/2026",
    slot: "Slot 3",
    location: "DE-338",
    attendanceStatus: "attended",
    isOnline: false,
    description: "SE1938 - NJ - duongtb",
    rawDate: { timeRange: "12:50-15:10" },
  };
  // Stand-in for FAP's table, which arrives after the page is idle (the real one is fetched from /WeeklyTimetable/WeekPartial).
  const parseLoadedTable = (doc: Document) => () => ({
    schedule: doc.querySelector("#weekly-timetable-container table") ? [timetableRow] : [],
    skipped: 0,
  });

  it("waits for the timetable that FAP loads after the page is idle", async () => {
    document.body.innerHTML = timetableShellHtml;
    document.documentElement.setAttribute("data-fptu-ui", "pending");
    const mockWin = {
      location: { pathname: "/WeeklyTimetable" },
      document: window.document,
      extractWeeklyScheduleFromTable: parseLoadedTable(window.document),
    } as unknown as Window;

    setTimeout(() => {
      document.getElementById("weekly-timetable-container")!.innerHTML =
        '<div class="weekly-timetable-grid"><table><tbody><tr><td>x</td></tr></tbody></table></div>';
    }, 40);

    await boot({ win: mockWin, timeoutMs: 1000 });

    expect(document.getElementById("fptu-ui-host")).not.toBe(null);
    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe("active");
  });

  it("falls back to the original FAP when the timetable never loads", async () => {
    document.body.innerHTML = timetableShellHtml;
    document.documentElement.setAttribute("data-fptu-ui", "pending");
    const mockWin = {
      location: { pathname: "/WeeklyTimetable" },
      document: window.document,
      extractWeeklyScheduleFromTable: parseLoadedTable(window.document),
    } as unknown as Window;

    await boot({ win: mockWin, timeoutMs: 60 });

    expect(document.getElementById("fptu-ui-host")).toBe(null);
    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
  });

  it("records why it fell back, so a student can report it", async () => {
    document.body.innerHTML = timetableShellHtml;
    document.documentElement.setAttribute("data-fptu-ui", "pending");
    const mockWin = {
      location: { pathname: "/WeeklyTimetable" },
      document: window.document,
      extractWeeklyScheduleFromTable: parseLoadedTable(window.document),
    } as unknown as Window;

    await boot({ win: mockWin, timeoutMs: 40 });

    expect(document.documentElement.getAttribute("data-fptu-ui-reason")).toBe("data-timeout");
  });

  it("falls back to the original FAP instead of leaving the page hidden when rendering throws", async () => {
    document.body.innerHTML = `
      <div class="fap-topbar-user"><h5>Nguyễn Văn A</h5><h6>SE000000</h6></div>
      <div class="fap-home-student-card">
        <div class="fap-home-student-card__metric"><div class="fap-home-student-card__value">HD</div></div>
      </div>
      <div class="fap-home-news-item">
        <span class="fap-home-news-item__title">Title 1</span>
        <span class="fap-home-news-item__meta"><span>Category</span><span>Date</span></span>
      </div>
    `;
    document.documentElement.setAttribute("data-fptu-ui", "pending");
    const mockWin = {
      location: { pathname: "/" },
      document: window.document,
      customElements: window.customElements,
    } as unknown as Window;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await boot({
      win: mockWin,
      renderContent: () => {
        throw new Error("boom");
      },
    });
    await waitFor(() => expect(document.getElementById("fptu-ui-host")).toBe(null));

    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
    expect(document.documentElement.getAttribute("data-fptu-ui-reason")).toMatch(/^render-error: boom/);
    errorSpy.mockRestore();
  });

  it("falls back to the original FAP when a component throws while React renders", async () => {
    document.body.innerHTML = `
      <div class="fap-topbar-user"><h5>Nguyễn Văn A</h5><h6>SE000000</h6></div>
      <div class="fap-home-student-card">
        <div class="fap-home-student-card__metric"><div class="fap-home-student-card__value">HD</div></div>
      </div>
      <div class="fap-home-news-item">
        <span class="fap-home-news-item__title">Title 1</span>
        <span class="fap-home-news-item__meta"><span>Category</span><span>Date</span></span>
      </div>
    `;
    document.documentElement.setAttribute("data-fptu-ui", "pending");
    const mockWin = {
      location: { pathname: "/" },
      document: window.document,
      customElements: window.customElements,
    } as unknown as Window;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Boom = () => {
      throw new Error("component boom");
    };

    await boot({ win: mockWin, renderContent: () => <Boom /> });
    await waitFor(() => expect(document.getElementById("fptu-ui-host")).toBe(null));

    expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
    expect(document.documentElement.getAttribute("data-fptu-ui-reason")).toMatch(/^render-error: component boom/);
    errorSpy.mockRestore();
  });

  const overviewHtml = `
    <div class="fap-topbar-user"><h5>Nguyễn Văn A</h5><h6>SE000000</h6></div>
    <div class="fap-home-student-card">
      <div class="fap-home-student-card__metric"><div class="fap-home-student-card__value">HD</div></div>
    </div>
    <div class="fap-home-news-item">
      <span class="fap-home-news-item__title">Title 1</span>
      <span class="fap-home-news-item__meta"><span>Category</span><span>Date</span></span>
    </div>
  `;

  it("offers a floating switch on pages while the new interface is switched off", async () => {
    document.body.innerHTML = `<div class="wrapper">original FAP page</div>`;
    const store: Record<string, unknown> = { fapUiEnabled: false };
    const mockChrome = makeChrome(store);
    const mockWin = { location: { pathname: "/", reload: vi.fn() }, document: window.document } as unknown as Window;

    // Short timeout: switching on starts a boot that waits for data this bare page never gets.
    await boot({ win: mockWin, chromeApi: mockChrome, timeoutMs: 30 });

    expect(document.getElementById("fptu-ui-host")).toBe(null);
    const button = document.getElementById("fptu-ui-return")!.shadowRoot!.querySelector("button")!;
    expect(button.textContent).toContain("Dùng giao diện mới");

    button.click();
    await waitFor(() => expect(store.fapUiEnabled).toBe(true));
    // The listener removes the switch; on this bare page the data never arrives, so no interface appears.
    await waitFor(() => expect(document.getElementById("fptu-ui-return")).toBe(null));
    await waitFor(() => expect(document.documentElement.getAttribute("data-fptu-ui-reason")).toBe("data-timeout"));
  });

  it("the sidebar switch turns the interface off for every page with one master switch", async () => {
    const store: Record<string, unknown> = {};
    const mockChrome = makeChrome(store);
    document.body.innerHTML = overviewHtml;
    const mockWin = { location: { pathname: "/" }, document: window.document, chrome: mockChrome } as unknown as Window;

    await boot({ win: mockWin, chromeApi: mockChrome });
    expect(document.getElementById("fptu-ui-host")).not.toBe(null);

    const shadowRoot = document.getElementById("fptu-ui-host")!.shadowRoot!;
    let button: HTMLButtonElement | undefined;
    await waitFor(() => {
      button = shadowRoot.querySelector('button[role="switch"]') as HTMLButtonElement | null ?? undefined;
      expect(button).toBeTruthy();
    });
    await act(async () => {
      button!.click();
    });

    await waitFor(() => {
      expect(document.getElementById("fptu-ui-host")).toBe(null);
      expect(document.documentElement.getAttribute("data-fptu-ui")).toBe(null);
      expect(store.fapUiEnabled).toBe(false);
      expect(document.getElementById("fptu-ui-return")).not.toBe(null);
    });
    expect(Object.keys(store).some((k) => k.startsWith("fapUiOriginal"))).toBe(false);
  });

  it("follows the master switch live: off hands the page back, on builds the interface again", async () => {
    const store: Record<string, unknown> = {};
    const mockChrome = makeChrome(store);
    document.body.innerHTML = overviewHtml;
    const mockWin = { location: { pathname: "/" }, document: window.document, chrome: mockChrome } as unknown as Window;

    await boot({ win: mockWin, chromeApi: mockChrome });
    expect(document.getElementById("fptu-ui-host")).not.toBe(null);

    // e.g. the popup switch, or the floating button in another tab
    await act(async () => {
      await mockChrome.storage.local.set({ fapUiEnabled: false });
    });
    await waitFor(() => {
      expect(document.getElementById("fptu-ui-host")).toBe(null);
      expect(document.getElementById("fptu-ui-return")).not.toBe(null);
    });

    await act(async () => {
      await mockChrome.storage.local.set({ fapUiEnabled: true });
    });
    await waitFor(() => {
      expect(document.getElementById("fptu-ui-host")).not.toBe(null);
      expect(document.getElementById("fptu-ui-return")).toBe(null);
      expect(document.documentElement.getAttribute("data-fptu-ui")).toBe("active");
    });
  });

  it("applies stored appearance ({ theme: 'dark', accentColor: 'pink' }) to host on mount", async () => {
    const store: Record<string, unknown> = { theme: "dark", accentColor: "pink" };
    const mockChrome = makeChrome(store);
    document.body.innerHTML = overviewHtml;
    const mockWin = { location: { pathname: "/" }, document: window.document, chrome: mockChrome } as unknown as Window;

    await boot({ win: mockWin, chromeApi: mockChrome });
    const host = document.getElementById("fptu-ui-host");
    expect(host).not.toBe(null);
    expect(host!.getAttribute("data-theme")).toBe("dark");
    expect(host!.style.getPropertyValue("--primary")).not.toBe("");
  });

  it("proceeds with default light + lavender when appearance storage read times out", async () => {
    vi.useFakeTimers();
    const mockChrome = {
      storage: {
        local: {
          get: vi.fn(async (keys: string[]) => {
            if (keys.includes("accentColor") || keys.includes("theme")) {
              return new Promise(() => {});
            }
            return { fapUiEnabled: true };
          }),
          set: vi.fn(async () => {}),
          remove: vi.fn(async () => {}),
        },
        onChanged: { addListener: vi.fn() },
      },
    } as unknown as typeof chrome;

    document.body.innerHTML = overviewHtml;
    const mockWin = { location: { pathname: "/" }, document: window.document, chrome: mockChrome } as unknown as Window;

    const bootPromise = boot({ win: mockWin, chromeApi: mockChrome });
    await vi.advanceTimersByTimeAsync(350);
    await bootPromise;
    vi.useRealTimers();

    const host = document.getElementById("fptu-ui-host");
    expect(host).not.toBe(null);
    expect(host!.getAttribute("data-theme")).toBe("light");
    expect(host!.style.getPropertyValue("--primary")).toBe("");
  });

  it("keeps exactly 1 active appearance listener across fapUiEnabled toggles", async () => {
    const store: Record<string, unknown> = {};
    const mockChrome = makeChrome(store);
    document.body.innerHTML = overviewHtml;
    const mockWin = { location: { pathname: "/" }, document: window.document, chrome: mockChrome } as unknown as Window;

    await boot({ win: mockWin, chromeApi: mockChrome });
    expect(document.getElementById("fptu-ui-host")).not.toBe(null);

    // Toggle off/on 3 times
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        await mockChrome.storage.local.set({ fapUiEnabled: false });
      });
      await waitFor(() => expect(document.getElementById("fptu-ui-host")).toBe(null));

      await act(async () => {
        await mockChrome.storage.local.set({ fapUiEnabled: true });
      });
      await waitFor(() => expect(document.getElementById("fptu-ui-host")).not.toBe(null));
    }

    // Emit theme change
    await act(async () => {
      await mockChrome.storage.local.set({ theme: "dark" });
    });

    const host = document.getElementById("fptu-ui-host");
    expect(host).not.toBe(null);
    expect(host!.getAttribute("data-theme")).toBe("dark");

    // Active listeners: 1 for watchMasterSwitch + 1 for watchAppearance = 2 total
    expect(mockChrome._listeners.length).toBe(2);
  });

  it("mounts with data-theme according to matchMedia when chromeApi is undefined", async () => {
    document.body.innerHTML = overviewHtml;
    const mockWin = {
      location: { pathname: "/" },
      document: window.document,
      matchMedia: vi.fn((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })),
    } as unknown as Window;

    await boot({ win: mockWin, chromeApi: undefined });
    const host = document.getElementById("fptu-ui-host");
    expect(host).not.toBe(null);
    expect(host!.getAttribute("data-theme")).toBe("dark");
  });

  it("handles accentColor changes gracefully when fapUiEnabled is false", async () => {
    const store: Record<string, unknown> = { fapUiEnabled: false };
    const mockChrome = makeChrome(store);
    document.body.innerHTML = overviewHtml;
    const mockWin = { location: { pathname: "/" }, document: window.document, chrome: mockChrome } as unknown as Window;

    await boot({ win: mockWin, chromeApi: mockChrome, timeoutMs: 30 });
    expect(document.getElementById("fptu-ui-host")).toBe(null);

    // Firing accentColor change when disabled should not throw or create host
    await expect(
      act(async () => {
        await mockChrome.storage.local.set({ accentColor: "teal" });
      })
    ).resolves.not.toThrow();

    expect(document.getElementById("fptu-ui-host")).toBe(null);
  });

  it("renders ThemeToggle in top bar and writes next theme to storage when clicked, updating icon", async () => {
    const store: Record<string, unknown> = { theme: "auto" };
    const mockChrome = makeChrome(store);
    document.body.innerHTML = overviewHtml;
    const mockWin = { location: { pathname: "/" }, document: window.document, chrome: mockChrome } as unknown as Window;

    await boot({ win: mockWin, chromeApi: mockChrome });
    const host = document.getElementById("fptu-ui-host");
    expect(host).not.toBe(null);

    const shadowRoot = host!.shadowRoot!;
    let button: HTMLButtonElement | undefined;
    await waitFor(() => {
      button = (shadowRoot.querySelector(
        'button[aria-label="Giao diện: Tự động (theo hệ thống)"]'
      ) as HTMLButtonElement | null) ?? undefined;
      expect(button).toBeTruthy();
    });

    expect(button!.querySelector("svg.lucide-monitor")).not.toBeNull();

    await act(async () => {
      button!.click();
    });

    expect(store.theme).toBe("light");

    await waitFor(() => {
      const updatedButton = shadowRoot.querySelector(
        'button[aria-label="Giao diện: Sáng"]'
      );
      expect(updatedButton).not.toBeNull();
      expect(updatedButton!.querySelector("svg.lucide-sun")).not.toBeNull();
    });
  });

  it("passes topbar read from DOM into the interface, handling profile and logout", async () => {
    const store: Record<string, unknown> = {};
    const mockChrome = makeChrome(store);
    document.body.innerHTML = `
      ${overviewHtml}
      <form action="/Auth/Logout" method="post">
        <button type="submit">Sign out</button>
      </form>
    `;
    const mockWin = {
      location: { pathname: "/" },
      document: window.document,
      chrome: mockChrome,
      FapPageData: {
        ...(window as any).FapPageData,
        readTopbar: vi.fn(() => ({
          campus: { name: "Cơ sở Hà Nội (HN)", code: "HN", isMain: true },
          language: {
            current: "vi",
            options: [
              { culture: "vi", label: "Tiếng Việt" },
              { culture: "en", label: "English" },
            ],
          },
          notifications: { unread: 3 },
          profile: {
            name: "Lê Văn B",
            studentId: "HE999999",
            accountHref: "/Account/Manage",
            canLogout: true,
          },
        })),
      },
    } as unknown as Window;

    await boot({ win: mockWin, chromeApi: mockChrome });
    const host = document.getElementById("fptu-ui-host");
    expect(host).not.toBe(null);

    const shadowRoot = host!.shadowRoot!;
    await waitFor(() => {
      expect(shadowRoot.textContent).toContain("Lê Văn B");
      expect(shadowRoot.textContent).toContain("HE999999");
    });
  });

  it("mounts without errors when readTopbar returns null for all fields", async () => {
    const store: Record<string, unknown> = {};
    const mockChrome = makeChrome(store);
    document.body.innerHTML = overviewHtml;
    const mockWin = {
      location: { pathname: "/" },
      document: window.document,
      chrome: mockChrome,
      FapPageData: {
        ...(window as any).FapPageData,
        readTopbar: vi.fn(() => ({
          campus: null,
          language: null,
          notifications: null,
          profile: null,
        })),
      },
    } as unknown as Window;

    await boot({ win: mockWin, chromeApi: mockChrome });
    const host = document.getElementById("fptu-ui-host");
    expect(host).not.toBe(null);
  });
});

describe("content.js parser globals in VM", () => {
  it("exposes extractWeeklyScheduleFromTable and extractExamScheduleFromPage on context", () => {
    const contentScriptPath = path.resolve(__dirname, "../../content.js");
    const code = fs.readFileSync(contentScriptPath, "utf8");

    const context = vm.createContext({
      document: { querySelector: () => null, querySelectorAll: () => [] },
      window: { location: { pathname: "/" } },
      location: { pathname: "/" },
      console: { log: () => {}, warn: () => {}, error: () => {} },
      setTimeout: () => {},
      clearTimeout: () => {},
      setInterval: () => {},
      clearInterval: () => {},
    });

    vm.runInContext(code, context);

    expect(typeof context.extractWeeklyScheduleFromTable).toBe("function");
    expect(typeof context.extractExamScheduleFromPage).toBe("function");
  });
});
