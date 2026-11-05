# FAP React UI (4 trang cơ sở) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay nội dung 4 trang chỉ đọc của FAP (Tổng quan, Thời khóa biểu, Lịch thi, Tin tức) bằng giao diện React khớp y thiết kế Lovable, tại đúng URL gốc, có lối quay về FAP gốc.

**Architecture:** Mã React nằm trong `ui/` (Vite + React 19 + TypeScript + Tailwind 4), build thành một file IIFE `dist/fap-ui.js` chạy như content script, mount vào Shadow DOM. Dữ liệu đọc từ DOM FAP bằng các hàm thuần trong `lib/` (UMD, test bằng `node --test`) rồi đưa cho trang React qua một hợp đồng dữ liệu cố định. Component chia atoms, molecules, organisms, templates.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vite, Vitest + Testing Library + JSDOM, Radix UI (chỉ phần Lovable đang dùng), lucide-react, `@fontsource-variable/inter`, Chrome MV3.

**Spec:** `docs/superpowers/specs/2026-11-05-fap-react-ui-design.md`. Nguồn thiết kế: `https://github.com/yunkhngn/pixel-perfect-pagecraft-99` (clone ra thư mục ngoài repo, ví dụ `~/tmp/lovable-ref`; xem bản chạy ở `https://pixel-perfect-pagecraft-99.lovable.app`).

**Lệch so với spec (người xây phải nêu trong báo cáo):** spec mục 5 định chuyển parser thời khóa biểu/lịch thi từ `content.js` sang `lib/`. Plan này **không chuyển**: hai hàm `extractWeeklyScheduleFromTable(doc)` và `extractExamScheduleFromPage(doc)` được khai báo ở cấp cao nhất của `content.js` (nên là hàm toàn cục trong cùng isolated world với bundle React, miễn là `content.js` được nạp trước) và đã được xuất cho test (`module.exports`). Người xây xác nhận điều này bằng một test JSDOM nạp `content.js` bằng `vm` rồi kiểm tra `typeof extractExamScheduleFromPage === "function"` ở phạm vi toàn cục (Task 9). Mã mới (đọc khung trang, Tổng quan, Tin tức, chuyển đổi sang hợp đồng dữ liệu) đặt trong `lib/fap-page-data.js`.

## Global Constraints

- Chrome Extension MV3; không tải mã từ xa (không CDN, kể cả font). Mọi thứ nằm trong gói.
- Ngoại lệ build tool/thư viện chỉ áp dụng cho `ui/`; popup, background, `lib/` giữ vanilla JS không build (AGENTS.md mục 1).
- `lib/*.js` dùng wrapper UMD để chạy cả trong content script lẫn Node.
- Không emoji trong UI; icon dùng lucide-react (SVG). Không tự động submit form. Giao diện React không ghi dữ liệu lên FAP.
- Test: `node --test tests/*.test.js` và `npm test` trong `ui/` phải pass 100%. Mỗi tính năng/parser có test.
- Không phát hành, không tạo tag, không build zip, không đổi số phiên bản khi chưa có lệnh của người dùng.
- Build **không minify** (`build.minify: false`).
- Giao diện chỉ tiếng Việt, chỉ chế độ sáng. Mọi chữ lấy từ DOM FAP phải được hiển thị như văn bản thuần (không dùng `dangerouslySetInnerHTML`).
- Token màu, bán kính, bóng, font phải bằng token của repo Lovable (`src/styles.css`).
- URL được dựng lại: `/` (chính xác), `/WeeklyTimetable`, `/ExamSchedule`, `/News` (không gồm `/News/Detail`). Không bao giờ mount trên `/Auth/*`.

## Review Focus

1. Vùng dữ liệu Tổng quan của FAP nạp chậm hoặc không bao giờ nạp: người dùng không được thấy trang trống, phải quay về FAP gốc sau timeout (Task 9, 10).
2. Parser trả về rỗng trong khi trang gốc có dòng dữ liệu (FAP đổi HTML): không được hiện "Chưa có lịch" sai sự thật; phải quay về FAP gốc (Task 8, 10).
3. Tiêu đề tin hoặc tên môn chứa ký tự HTML (`<img onerror=...>`): hiển thị như chữ, không chạy mã (Task 8).
4. Content script chạy hai lần (bfcache, quay lại trang): chỉ có một giao diện, không lồng nhau (Task 9).
5. Trường thiếu (không có link Meet, không có phòng, không có số dư): không lỗi, không hiện "undefined" (Task 5, 8).
6. Đang ở `/Auth/Login` hoặc đã bị đăng xuất giữa chừng: không mount, không ẩn trang (Task 9).

---

### Task 1: Khung dự án `ui/`

**Files:**
- Create: `ui/package.json`, `ui/tsconfig.json`, `ui/vite.config.ts`, `ui/vitest.config.ts`, `ui/src/main.tsx`, `ui/src/test/setup.ts`
- Modify: `.gitignore` (thêm `ui/node_modules/`, `dist/`)
- Test: `ui/src/test/build.test.ts`

**Interfaces:**
- Produces: lệnh `npm run build` (trong `ui/`) tạo `dist/fap-ui.js` (IIFE, không minify) ở thư mục gốc repo; `npm test` chạy Vitest. Entry `ui/src/main.tsx` gọi `boot()` (Task 9, tạm là hàm rỗng).

- [ ] **Step 1: Viết test thất bại** `build.test.ts`: chạy `vite build` bằng API (`build()` của Vite) vào thư mục tạm, assert có `fap-ui.js`, nội dung chứa `fap-ui` marker `window.__fptuUi`, và không chứa `"use strict";var a=` kiểu minify (kiểm tra có ít nhất 50 ký tự xuống dòng).
- [ ] **Step 2:** Chạy `cd ui && npm test`; mong đợi FAIL (chưa có cấu hình).
- [ ] **Step 3:** Tạo cấu hình: Vite `build.lib` format `iife`, `build.minify: false`, `build.outDir: "../dist"`, `emptyOutDir: false`, plugin `@vitejs/plugin-react` và `@tailwindcss/vite`; Vitest môi trường `jsdom`. Cài dependency theo bảng Tech Stack (phiên bản lấy từ `package.json` của repo Lovable cho React, Tailwind, Radix, lucide).
- [ ] **Step 4:** Chạy `cd ui && npm test` và `npm run build`; mong đợi PASS và `dist/fap-ui.js` tồn tại.
- [ ] **Step 5: Commit**
```bash
git add ui .gitignore && git commit -m "build(ui): scaffold the React UI project"
```

---

### Task 2: Token thiết kế, DESIGN.md và kiểm tra khớp

**Files:**
- Create: `ui/reference/lovable-styles.css` (bản sao nguyên văn `src/styles.css` của repo Lovable), `ui/src/design/tokens.css`, `ui/scripts/gen-design-md.mjs`, `DESIGN.md`
- Test: `ui/src/design/tokens.test.ts`

**Interfaces:**
- Produces: `tokens.css` chứa mọi biến `--color-*`, `--radius*`, `--shadow-*`, `--font-sans`, `--ease-natural` giống Lovable nhưng selector `:root` đổi thành `:host` (xem Task 3); `DESIGN.md` được sinh bởi `node ui/scripts/gen-design-md.mjs`.

- [ ] **Step 1: Viết test thất bại** `tokens.test.ts`: (a) `parseTokens(reference)` và `parseTokens(tokens)` trả về cùng tập `{tên: giá trị}` cho mọi biến custom property trong khối `:root` / `:host`; (b) `DESIGN.md` chứa mọi tên biến màu và đúng giá trị (chạy script vào chuỗi rồi so với file); (c) không có giá trị `#000` hoặc `#fff` thuần ở token màu.
- [ ] **Step 2:** Chạy; mong đợi FAIL.
- [ ] **Step 3:** Sao chép `styles.css` vào `reference/`, tạo `tokens.css`, viết `gen-design-md.mjs`. `DESIGN.md` gồm các mục: nguyên tắc ("Pillio-inspired", sáng, lavender), bảng màu (tên, oklch, vai trò, ví dụ dùng), kiểu chữ (Inter, cỡ dùng trong component: lấy bằng cách quét `ui/src/components`), bán kính, bóng, khoảng cách, chuyển động (`page-enter`), danh sách component theo atomic level và quy tắc dùng. Giá trị lấy từ token, không tự nghĩ thêm.
- [ ] **Step 4:** Chạy `npm test`; mong đợi PASS.
- [ ] **Step 5: Commit** `git add ui DESIGN.md && git commit -m "feat(ui): design tokens, DESIGN.md and parity test"`

---

### Task 3: Đường ống CSS cho Shadow DOM

**Files:**
- Create: `ui/src/shadow/mount.tsx`, `ui/src/shadow/css.ts`, `ui/scripts/postcss-rem-to-px.mjs`
- Modify: `ui/vite.config.ts` (thêm plugin chuyển rem sang px và chèn CSS vào bundle dạng chuỗi)
- Test: `ui/src/shadow/css.test.ts`, `ui/src/shadow/mount.test.tsx`

**Interfaces:**
- Produces:
  - `remToPx(css: string, base = 16): string` đổi mọi giá trị `Nrem` thành `N*base px`.
  - `splitDocumentCss(css: string): { shadowCss: string; documentCss: string }` tách các khối `@property` và `@font-face` (phải nằm ở tài liệu chính) khỏi phần còn lại.
  - `mountShadow(opts: { css: string; documentCss: string; fontBaseUrl?: string }): { host: HTMLElement; root: ShadowRoot; unmount(): void }`; host có `id="fptu-ui-host"`; gọi hai lần trả về cùng host, không tạo thêm.

- [ ] **Step 1: Viết test thất bại**:
  - `remToPx("a{padding:0.5rem 1.25rem}")` bằng `"a{padding:8px 20px}"`; số âm và `calc(var(--radius) - 8px)` không bị đổi.
  - `splitDocumentCss` đưa `@property --tw-x{...}` vào `documentCss`, giữ `.btn{}` trong `shadowCss`.
  - `mountShadow` hai lần liên tiếp: `document.querySelectorAll("#fptu-ui-host").length === 1`; `root.adoptedStyleSheets.length === 1` (hoặc một thẻ style nếu JSDOM không hỗ trợ adoptedStyleSheets).
  - `unmount()` gỡ host.
- [ ] **Step 2:** Chạy; mong đợi FAIL.
- [ ] **Step 3:** Cài đặt ba hàm ở trên. Tailwind sinh biến trên `:root`: build phải đổi `:root` thành `:host` cho phần shadow. Font Inter lấy từ `@fontsource-variable/inter`, copy woff2 vào `dist/fonts/` khi build; `@font-face` chèn vào tài liệu chính với `url(chrome.runtime.getURL("dist/fonts/..."))`. Nếu FAP chặn font, giao diện rơi về font hệ thống (ghi trong DESIGN.md).
- [ ] **Step 4:** Chạy test; PASS. **Kiểm tra bằng mắt (spike):** build, tải extension từ thư mục gốc, mở một trang FAP, chạy `mountShadow` với một nút dùng token; xác nhận màu `#9695EE` và cỡ chữ đúng (không bị ảnh hưởng bởi cỡ chữ gốc của FAP). Ghi kết quả vào mô tả commit.
- [ ] **Step 5: Commit** `git commit -m "feat(ui): shadow DOM mounting with token, rem and @property handling"`

---

### Task 4: Atoms

**Files:**
- Create: `ui/src/components/atoms/` gồm `Button.tsx`, `Badge.tsx`, `StatusBadge.tsx`, `Avatar.tsx`, `IconTile.tsx`, `Input.tsx`, `Tabs.tsx`, `Skeleton.tsx`, `Separator.tsx`, `Tooltip.tsx`, `index.ts`
- Test: `ui/src/components/atoms/atoms.test.tsx`

**Interfaces:**
- Produces: mỗi atom xuất cùng tên và props như bản Lovable (`ui/button`, `ui/badge`, `ui/avatar`, `ui/input`, `ui/tabs`, `ui/skeleton`, `ui/separator`, `ui/tooltip` và `IconTile`, `StatusBadge` trong `portal/primitives.tsx`); `cn()` trong `ui/src/lib/utils.ts`.

- [ ] **Step 1: Viết test thất bại**: với từng atom, render với props mặc định và assert (a) `className` chứa các lớp token chính của Lovable (ví dụ `Button` mặc định có `bg-primary`, `StatusBadge tone="success"` có `bg-success-soft`), (b) `IconTile` nhận `icon` và render một `svg`, (c) `StatusBadge dot` render chấm; không dùng snapshot.
- [ ] **Step 2:** Chạy; FAIL.
- [ ] **Step 3:** Port từ Lovable, giữ nguyên lớp Tailwind. Chỉ port atom mà một molecule/organism/trang thực sự dùng (YAGNI).
- [ ] **Step 4:** PASS. **Step 5: Commit** `feat(ui): atoms ported from the Lovable design`

---

### Task 5: Molecules

**Files:**
- Create: `ui/src/components/molecules/` gồm `DashboardCard.tsx`, `StatCard.tsx`, `NewsItem.tsx`, `CategoryFilter.tsx`, `NavItem.tsx`, `SearchField.tsx`, `EmptyState.tsx`, `SkeletonRows.tsx`, `index.ts`
- Test: `ui/src/components/molecules/molecules.test.tsx`

**Interfaces:**
- Consumes: atoms của Task 4.
- Produces: `StatCard({ label: string; value?: string | null; icon: LucideIcon; tone?: "success"|"warning"|"primary"|"neutral"; hint?: ReactNode })`; `NewsItem({ item: NewsItemData; read: boolean; onToggle?(): void })` (kiểu `NewsItemData` ở Task 7); `CategoryFilter({ value: string; onChange(v: string): void; categories: readonly string[] })`; `EmptyState`, `DashboardCard`, `SkeletonRows` giữ props như Lovable.

- [ ] **Step 1: Viết test thất bại**: `StatCard` với `value` rỗng/undefined hiển thị "—" (không hiện "undefined" hay "null"); `CategoryFilter` gọi `onChange` với đúng nhãn khi bấm tab; `NewsItem` render tiêu đề dạng văn bản (truyền `title: '<img src=x onerror=alert(1)>'` và assert `container.querySelector("img") === null`); `NavItem` là thẻ `a` có `href` được truyền vào.
- [ ] **Step 2:** FAIL. **Step 3:** Port. **Step 4:** PASS. **Step 5: Commit** `feat(ui): molecules`

---

### Task 6: Organisms và templates

**Files:**
- Create: `ui/src/components/organisms/` gồm `AppSidebar.tsx`, `TopNavigation.tsx`, `ScheduleCalendar.tsx`, `MiniCalendar.tsx`, `DataTable.tsx`, `AnnouncementList.tsx`; `ui/src/components/templates/AppShell.tsx`, `PageHeader.tsx`; `ui/src/data/nav.ts`
- Test: `ui/src/components/organisms/organisms.test.tsx`, `ui/src/data/nav.test.ts`

**Interfaces:**
- Consumes: atoms, molecules, kiểu ở Task 7.
- Produces:
  - `NAV_GROUPS: NavGroup[]` (cấu trúc nhóm giống `navGroups` của Lovable) và `FAP_URLS: Record<string, string>`: ánh xạ route Lovable sang đường dẫn FAP, tối thiểu `"/"→"/"`, `"/thoi-khoa-bieu"→"/WeeklyTimetable"`, `"/lich-thi"→"/ExamSchedule"`, `"/tin-tuc"→"/News"`; các route khác ánh xạ sang trang FAP tương ứng (dựa vào danh sách link sidebar trong `tests/fixtures/fap-home.html`), và `navHref(route: string): string` trả về đường dẫn FAP.
  - `AppShell({ shell: ShellData; activePath: string; children: ReactNode; onShowOriginal(): void })`.
  - `ScheduleCalendar({ sessions: ClassSession[]; initialWeekStart: string })`, `DataTable({ columns: string[]; rows: ReactNode[][]; empty?: ReactNode })`, `AnnouncementList({ items: NewsItemData[] })`, `MiniCalendar({ today: Date })` (nhận ngày hiện tại qua prop để test được).
  - `PageHeader({ eyebrow?, title, description?, actions? })`.

- [ ] **Step 1: Viết test thất bại**: (a) `navHref("/thoi-khoa-bieu") === "/WeeklyTimetable"` và mọi mục trong `NAV_GROUPS` có `navHref` khác rỗng; (b) `AppShell` với `activePath="/WeeklyTimetable"` đánh dấu đúng mục Thời khóa biểu là hiện hành (`aria-current="page"`); (c) `AppShell` có nút "Xem bản FAP gốc" gọi `onShowOriginal`; (d) `ScheduleCalendar` với 3 buổi trong một tuần hiển thị đủ 3 thẻ ở đúng cột ngày; (e) `ScheduleCalendar` với danh sách rỗng hiển thị khung lịch trống, không lỗi; (f) `TopNavigation` hiển thị tên cơ sở nhưng ô chọn cơ sở/ngôn ngữ không đổi giá trị khi bấm (chỉ hiển thị, đúng spec mục 9).
- [ ] **Step 2:** FAIL. **Step 3:** Port từ Lovable, bỏ phụ thuộc `@tanstack/react-router` (thay `Link` bằng thẻ `a`), bỏ import dữ liệu mẫu (nhận qua props). **Step 4:** PASS. **Step 5: Commit** `feat(ui): organisms, templates and FAP URL mapping`

---

### Task 7: Hợp đồng dữ liệu

**Files:**
- Create: `ui/src/data/types.ts`, `ui/src/data/mock.ts`
- Test: `ui/src/data/types.test.ts`

**Interfaces:**
- Produces (TypeScript):
```ts
export type ShellData = { student: { name: string; initials: string; studentId: string };
  campus: string; unreadNotifications: number };
export type HomeData = { metrics: { status?: string; program?: string; email?: string; cohort?: string; balance?: string };
  news: NewsItemData[]; categories: string[] };
export type NewsItemData = { id: string; title: string; category: string; publishedAt: string; href: string };
export type ClassSession = { id: string; date: string /* yyyy-MM-dd */; slot: number; time: string;
  courseCode: string; classCode?: string; mode: "online" | "offline"; room?: string; lecturer?: string;
  attendance: "attended" | "absent" | "not-yet"; meetUrl?: string };
export type ExamItem = { courseCode: string; courseName?: string; date: string; time: string;
  room?: string; form?: string; kind?: string };
export type PageData = { shell: ShellData } & (
  | { page: "overview"; home: HomeData }
  | { page: "timetable"; sessions: ClassSession[]; weekStart: string }
  | { page: "exams"; exams: ExamItem[] }
  | { page: "news"; news: NewsItemData[]; categories: string[] });
```
`mock.ts` chứa dữ liệu mẫu lấy từ Lovable (`portal-data.ts`, `academic-data.ts`) dùng cho test và harness đối chiếu.

- [ ] **Step 1: Viết test thất bại**: `mockPageData("overview")` thỏa kiểu (kiểm tra runtime các khóa bắt buộc), tổng buổi học mẫu của `timetable` là 10 và `weekStart` đúng định dạng `yyyy-MM-dd`.
- [ ] **Step 2:** FAIL. **Step 3:** Viết file. **Step 4:** PASS. **Step 5: Commit** `feat(ui): data contract and mock data`

---

### Task 8: Đọc dữ liệu từ DOM FAP

**Files:**
- Create: `lib/fap-page-data.js` (UMD; xuất cả lên `window.FapPageData`)
- Test: `tests/fap-page-data.test.js`

**Interfaces:**
- Consumes: `extractWeeklyScheduleFromTable(doc)` → `{ schedule, skipped }` (mỗi phần tử có `title`, `date` dạng `d/M/yyyy`, `slot` dạng `"Slot 1"`, `location`, `attendanceStatus` (`"attended"|"absent"|"not yet"`), `isOnline`, `meetUrl`, `description`, `rawDate.timeRange`); `extractExamScheduleFromPage(doc)` → mảng `{ title, location, description, start: Date, end: Date, tag }`.
- Produces:
  - `readShell(doc): ShellData | null` — tên và mã SV từ `.fap-topbar-user h5` / `h6`, chữ viết tắt từ `.fap-topbar-avatar`, cơ sở từ `.jidox-campus-topbar__static` (thuộc tính `title`), số thông báo chưa đọc từ `.jidox-notification-bell__badge`; trả `null` nếu không có khung FAP.
  - `readHome(doc): HomeData | null` — thẻ sinh viên `.fap-home-student-card__metric` (nhãn `__label`, giá trị `__value`; thứ tự: trạng thái, chương trình, email, khóa, số dư), tin `.fap-home-news-item` (tiêu đề `__title`, danh mục và ngày trong `__meta span`, `href`); trả `null` nếu cả thẻ sinh viên lẫn danh sách tin chưa có.
  - `readNews(doc): { news: NewsItemData[]; categories: string[] } | null` — cấu trúc trang `/News` xem `tests/fixtures/pages/news.html`.
  - `toTimetable(schedule, now): { sessions: ClassSession[]; weekStart: string }` và `toExams(events): ExamItem[]`.
  - `hasOriginalRows(doc, page): boolean` — trang gốc có dòng dữ liệu hay không (dùng cho quyết định quay về FAP gốc).

- [ ] **Step 1: Viết test thất bại** (JSDOM, dùng `tests/fixtures/fap-home.html`, `pages/home.html`, `pages/news.html`, `week.html`, `exam.html`; text trong fixture đã bị làm mờ nên chỉ assert cấu trúc và số lượng):
  - `readShell` với `fap-home.html` trả `studentId` là `"SE000000"`, `campus` là `"Cơ sở Hà Nội (HN)"`; `readShell(emptyDoc)` trả `null`.
  - `readHome` trên `home.html` trả 5 `metrics` theo thứ tự trạng thái, chương trình, email, khóa, số dư và `news.length` bằng số `.fap-home-news-item`; `readHome` khi vùng `[data-home-slot]` rỗng trả `null`.
  - `toTimetable` từ `week.html` trả 10 buổi, buổi "27/9/2026 Slot 1" có `date: "2026-09-27"`, `slot: 1`, `mode: "online"`, `attendance: "not-yet"`; buổi "23/9/2026 Slot 4" có `attendance: "absent"`; buổi có Meet có `meetUrl`.
  - `toExams` từ `exam.html` trả 2 mục cùng `courseCode: "WDP301"`, `date: "2026-11-15"`, `time: "12:50-17:..."` đúng với `start`/`end`.
  - Tiêu đề tin chứa `<img onerror>`: giá trị trả về là chuỗi chữ giống hệt (không bị phân tích thành thẻ).
  - Trường thiếu: sự kiện không có `meetUrl`/`location` cho ra `undefined`, không chuỗi `"undefined"`.
  - `hasOriginalRows(week.html, "timetable") === true`; `hasOriginalRows(emptyDoc, "timetable") === false`.
- [ ] **Step 2:** `node --test tests/fap-page-data.test.js`; FAIL.
- [ ] **Step 3:** Cài đặt, chỉ dùng `textContent` (không `innerHTML`). **Step 4:** PASS và `node --test tests/*.test.js` toàn bộ PASS. **Step 5: Commit** `feat(lib): read FAP shell, home and news data for the React UI`

---

### Task 9: Khởi động và quay về FAP gốc

**Files:**
- Create: `ui/src/boot.tsx`, `ui/src/routes.ts`, `ui/src/storage.ts`, `lib/fap-ui-early.js` (chạy ở `document_start`), `lib/fap-ui-early.css`
- Modify: `ui/src/main.tsx` (gọi `boot()`)
- Test: `ui/src/boot.test.tsx`, `tests/fap-ui-early.test.js`

**Interfaces:**
- Produces:
  - `matchPage(pathname: string): "overview" | "timetable" | "exams" | "news" | null` — `/` và `` → overview; `/WeeklyTimetable`, `/ExamSchedule`, `/News` (không khớp `/News/Detail`, không khớp `/Auth/*`).
  - `boot(deps?: { win?: Window; chromeApi?: typeof chrome; timeoutMs?: number }): Promise<void>` — idempotent (đặt cờ `window.__fptuUi`); mount khi dữ liệu sẵn sàng; chờ vùng `[data-home-slot]` bằng `MutationObserver` tối đa `timeoutMs` (mặc định 8000); khi lỗi hoặc `hasOriginalRows` đúng mà parser rỗng thì quay về FAP gốc.
  - `readOriginalPreference(page): Promise<boolean>` / `saveOriginalPreference(page, value)` — khóa `chrome.storage.local` là `fapUiOriginal:<page>`.
  - `lib/fap-ui-early.js`: ở `document_start` đặt `data-fptu-ui="pending"` trên `<html>` nếu `matchPage` khớp và `fapUiEnabled !== false`; CSS `html[data-fptu-ui="pending"] .wrapper { visibility: hidden }`; đặt `setTimeout` an toàn 10 giây gỡ thuộc tính nếu giao diện chưa mount. Khi mount thành công đặt `data-fptu-ui="active"` (CSS ẩn `.wrapper` và `.footer`, không xóa DOM); khi quay về gốc xóa thuộc tính.

- [ ] **Step 1: Viết test thất bại**:
  - `matchPage("/")==="overview"`, `matchPage("/News/Detail/abc")===null`, `matchPage("/Auth/Login")===null`, `matchPage("/WeeklyTimetable")==="timetable"`.
  - `boot` gọi hai lần trên cùng `window`: `document.querySelectorAll("#fptu-ui-host").length === 1`.
  - Trang Tổng quan mà `[data-home-slot]` không bao giờ có nội dung: sau `timeoutMs` (đặt 50ms trong test), `<html>` không còn `data-fptu-ui` và không có host.
  - Trang Thời khóa biểu mà `hasOriginalRows` đúng nhưng parser trả rỗng: quay về FAP gốc (không host, không thuộc tính).
  - Đang ở `/Auth/Login`: `boot` không làm gì (không đổi `<html>`).
  - Bấm "Xem bản FAP gốc": gỡ giao diện, gọi `saveOriginalPreference`; lần `boot` sau đọc được tùy chọn và không mount.
  - Nạp `content.js` bằng `vm` trong một context có `document`/`window` giả: `typeof extractExamScheduleFromPage === "function"` và `typeof extractWeeklyScheduleFromTable === "function"` ở phạm vi toàn cục của context.
  - `tests/fap-ui-early.test.js`: với `fapUiEnabled=false` thì `fap-ui-early.js` không đặt thuộc tính; sau 10 giây giả lập (fake timers) thuộc tính bị gỡ nếu chưa `active`.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS cả hai bộ test. **Step 5: Commit** `feat(ui): boot, fallback to the original FAP and early hide script`

---

### Task 10: Bốn trang

**Files:**
- Create: `ui/src/pages/Overview.tsx`, `Timetable.tsx`, `Exams.tsx`, `News.tsx`, `ui/src/pages/index.ts`, `ui/src/hooks/useReadNews.ts`
- Modify: `ui/src/boot.tsx` (chọn trang theo `matchPage` và đọc dữ liệu bằng `lib/fap-page-data.js`)
- Test: `ui/src/pages/pages.test.tsx`

**Interfaces:**
- Consumes: `PageData` (Task 7), organisms (Task 6), `window.FapPageData` (Task 8), `window.extractWeeklyScheduleFromTable`, `window.extractExamScheduleFromPage`.
- Produces: `renderPage(data: PageData): JSX.Element`; `useReadNews(chromeApi): { isRead(id): boolean; markAllRead(ids: string[]): void; unreadCount(ids: string[]): number }` lưu trong `chrome.storage.local` khóa `fapUiReadNews`.

- [ ] **Step 1: Viết test thất bại** (dữ liệu mẫu Task 7):
  - Overview: có lời chào "Chào" kèm tên, 5 thẻ thông tin theo đúng nhãn của Lovable (Trạng thái, Mã chương trình, Email, Số dư, Khóa), danh sách tin đúng số lượng, bộ lọc danh mục lọc đúng.
  - Timetable: tiêu đề "Thời khóa biểu tuần", có lịch tuần với đủ buổi, và hai thẻ "Chú thích", "Ký hiệu phòng học" như Lovable.
  - Exams: có bảng 7 cột đúng tên (Mã môn, Tên môn, Ngày thi, Phòng, Giờ thi, Hình thức, Loại thi); khi `exams=[]` hiển thị `EmptyState` "Chưa có lịch thi".
  - News: ô tìm kiếm lọc theo tiêu đề không phân biệt hoa thường; "Đánh dấu đã đọc tất cả" đặt `unreadCount` về 0 và lưu qua `chromeApi.storage.local.set`.
- [ ] **Step 2:** FAIL. **Step 3:** Port từ `routes/*.tsx` của Lovable thành component thuần nhận `PageData`. **Step 4:** PASS. **Step 5: Commit** `feat(ui): overview, timetable, exams and news pages`

---

### Task 11: Kiểm tra khớp thiết kế bằng ảnh chụp

**Files:**
- Create: `ui/scripts/capture-reference.mjs`, `ui/scripts/parity.mjs`, `ui/reference/*.png`, `ui/parity/harness.html`
- Modify: `ui/package.json` (script `parity`)

**Interfaces:**
- Produces: `npm run parity` chụp từng trang bằng Chrome headless từ harness dùng dữ liệu mẫu (Task 7), so với `ui/reference/<page>.png` (chụp từ bản chạy Lovable, cùng cỡ cửa sổ 1440x900) bằng `pixelmatch` và in tỷ lệ pixel khác biệt; thoát mã lỗi nếu quá **2%**.

- [ ] **Step 1:** Viết `capture-reference.mjs` (chụp 4 trang của `https://pixel-perfect-pagecraft-99.lovable.app`: `/`, `/thoi-khoa-bieu`, `/lich-thi`, `/tin-tuc`) và chạy một lần để tạo ảnh chuẩn; commit ảnh.
- [ ] **Step 2:** Viết `parity.mjs` và `harness.html` (mount từng trang bằng `mountShadow` với dữ liệu mẫu).
- [ ] **Step 3:** Chạy `npm run parity`; sửa component cho tới khi cả 4 trang dưới 2% (nếu một trang vượt vì dữ liệu mẫu thay đổi theo ngày, cố định ngày hiện tại trong harness). Báo cáo tỷ lệ từng trang.
- [ ] **Step 4: Commit** `test(ui): screenshot parity check against the Lovable design`

---

### Task 12: Gắn vào extension

**Files:**
- Modify: `manifest.json`, `popup.html`, `popup.js`
- Create: `tests/fap-ui-manifest.test.js`
- Test: `tests/fap-ui-manifest.test.js`, `tests/popup-boot.test.js` (thêm ca)

**Interfaces:**
- Produces: hai khối content script mới. Khối `document_start`: `matches` là bốn mẫu URL (`*://fap.fpt.edu.vn/`, `*://fap.fpt.edu.vn/WeeklyTimetable*`, `*://fap.fpt.edu.vn/ExamSchedule*`, `*://fap.fpt.edu.vn/News`), `css: ["lib/fap-ui-early.css"]`, `js: ["lib/fap-ui-early.js"]`. Khối `document_idle`: cùng `matches`, `js: ["lib/fap-page-data.js", "dist/fap-ui.js"]` đặt **sau** khối `content.js` hiện có để các hàm parser đã có trên `window`. `web_accessible_resources` cho `dist/fonts/*` với `matches` `*://fap.fpt.edu.vn/*`. Công tắc popup `#fapUiToggle` (mặc định bật) lưu `fapUiEnabled` vào `chrome.storage.local`.

- [ ] **Step 1: Viết test thất bại**: mọi đường dẫn `css`/`js` trong `manifest.json` tồn tại, **trừ** các đường dẫn dưới `dist/` (chỉ kiểm tra tồn tại khi thư mục `dist/` có mặt; nếu không, ghi chú trong thông báo test); khối `document_idle` chứa `content.js` trước `dist/fap-ui.js`; không mẫu `matches` nào khớp `/Auth/Login` hay `/News/Detail/x`; popup có `#fapUiToggle`, mặc định `checked`, và `change` ghi `{ fapUiEnabled: <boolean> }`.
- [ ] **Step 2:** FAIL. **Step 3:** Sửa. **Step 4:** `node --test tests/*.test.js` PASS. **Step 5: Commit** `feat: load the React UI on the four rebuilt FAP pages`

---

### Task 13: Đóng gói và tài liệu

**Files:**
- Modify: `AGENTS.md` (mục 5: lệnh đóng gói thêm `dist/`, bước `cd ui && npm ci && npm run build` trước khi zip), `README.md` (hướng dẫn build)
- Create: `ui/README.md`

- [ ] **Step 1:** Cập nhật lệnh đóng gói thành `zip -FS -r fptu-schedule.zip manifest.json *.png popup.html popup.js popup.css background.js content.js lib/ dist/` và ghi rõ phải build trước. Không chạy lệnh zip.
- [ ] **Step 2:** `ui/README.md`: cách cài, build, test, chạy `parity`, cách thêm trang mới (token → atoms → molecules → organism → trang → parser → thêm URL vào `matches`), và nhắc `DESIGN.md`.
- [ ] **Step 3:** Chạy toàn bộ: `node --test tests/*.test.js`, `cd ui && npm test && npm run build && npm run parity`; mong đợi tất cả PASS.
- [ ] **Step 4: Commit** `docs: build and packaging notes for the React UI`

---

### Task 14: Kiểm tra thủ công trên FAP thật (người dùng thực hiện)

Người xây không tự đánh dấu hoàn thành task này. Gửi người dùng danh sách sau và ghi lại kết quả:

- [ ] Nạp extension từ thư mục gốc (đã `npm run build`), mở `https://fap.fpt.edu.vn/`: Tổng quan hiện đúng tên, mã SV, số dư, tin tức; không nhấp nháy giao diện cũ quá một lần.
- [ ] Mở Thời khóa biểu: các buổi học đúng ngày/slot/phòng; so với bản gốc bằng "Xem bản FAP gốc".
- [ ] Mở Lịch thi và Tin tức: dữ liệu đúng; tìm kiếm tin chạy.
- [ ] Bấm "Xem bản FAP gốc", tải lại trang: vẫn ở bản gốc cho trang đó, các trang khác vẫn là giao diện mới.
- [ ] Tắt công tắc "Giao diện FAP mới" trong popup: mọi trang trở về FAP gốc sau khi tải lại.
- [ ] Mạng chậm (Chrome DevTools, Slow 3G): không có trang trống kéo dài; sau tối đa 10 giây hiện FAP gốc hoặc giao diện mới.
- [ ] Các tính năng cũ vẫn chạy: xuất ICS từ popup, thông báo, badge, tự bắt lịch tuần.
- [ ] Trang ghi (Gửi đơn, Thanh toán) vẫn là FAP gốc và gửi đơn được.
