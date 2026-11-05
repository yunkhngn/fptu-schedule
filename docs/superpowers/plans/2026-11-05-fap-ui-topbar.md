# FAP UI: thanh trên hoạt động được và hai ngôn ngữ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ô tìm kiếm, cơ sở, ngôn ngữ, thông báo và hồ sơ trên thanh trên của giao diện FAP React hoạt động như trên FAP gốc.

**Architecture:** Dữ liệu thanh trên được đọc từ DOM FAP bằng `readTopbar` (vanilla, `lib/fap-page-data.js`). Các thao tác ghi (đổi ngôn ngữ, đăng xuất, đánh dấu đã đọc) **không gọi lại API của FAP**: ta kích hoạt chính các điều khiển gốc của FAP còn nằm (ẩn) trong trang (`ui/src/topbar/actions.ts`). Menu và hộp tìm kiếm dựng bằng một thành phần tự viết nằm trong Shadow DOM (không dùng cổng nổi của Radix).

**Tech Stack:** TypeScript/React, Tailwind 4, Vitest, `node --test`; lucide-react.

**Spec:** `docs/superpowers/specs/2026-11-05-fap-ui-topbar-design.md`.

**Chạy sau plan `2026-11-05-fap-ui-theme-and-accent.md`** (cùng sửa `TopNavigation.tsx`, `AppShell.tsx`, `boot.tsx`, `molecules/index.ts`).

## Global Constraints

- Không gọi trực tiếp điểm cuối ghi của FAP (`/Language/SetLanguage`, `/Auth/Logout`, `/Notification/MarkRead*`); chỉ kích hoạt điều khiển gốc, và chỉ sau khi người dùng bấm.
- Chữ lấy từ FAP luôn hiển thị như văn bản thuần (không `dangerouslySetInnerHTML`).
- Mọi chuỗi chữ của giao diện đi qua `t(khóa)` (sau Task 4B); không để chuỗi tiếng Việt hoặc tiếng Anh nằm cứng trong component. Ngôn ngữ của giao diện luôn bằng ngôn ngữ FAP đang dùng.
- Không dùng thư viện gắn vào `document.body` (Radix Popover, Dialog, DropdownMenu, cmdk): mọi bảng nằm trong Shadow DOM.
- Chế độ sáng không đổi khi mọi menu đóng: `npm run parity` mỗi trang không xấu đi quá 0.5 điểm phần trăm so với 1.55% (Tổng quan), 3.02% (Thời khóa biểu), 0.99% (Lịch thi), 1.06% (Tin tức).
- Đọc DOM thanh trên là vanilla UMD trong `lib/`, test bằng `node --test`; giao diện trong `ui/`.
- Không emoji; icon dùng lucide-react. Dùng token màu, không màu cứng (để chế độ tối đúng).
- `node --test tests/*.test.js` và `cd ui && npm test` pass 100%. Không phát hành, không đổi phiên bản.

## Review Focus

1. Menu hoặc hộp tìm kiếm mở ra mà không có kiểu dáng vì nằm ngoài Shadow DOM (Task 2, 3).
2. Danh sách thông báo FAP nạp chậm, không nạp, hoặc có cấu trúc lạ: hiển thị khung chờ rồi liên kết mở trên FAP, không trống im lặng (Task 5).
3. Điều khiển gốc của FAP không có trong DOM (FAP đổi HTML): nút tương ứng vô hiệu hóa hoặc ẩn, không lỗi (Task 1, 4, 6).
4. Đăng xuất hoặc đổi ngôn ngữ bấm hai lần liên tiếp chỉ gửi một lần (Task 4, 6).
5. Tìm kiếm với tiếng Việt có dấu và không dấu ("thoi khoa bieu" tìm ra "Thời khóa biểu"); không có kết quả thì có thông báo (Task 3).
6. Bàn phím: Tab vào nút mở menu, Enter mở, mũi tên di chuyển, Escape đóng và trả tiêu điểm về nút (Task 2, 3).
7. Tiêu đề thông báo chứa HTML được hiển thị như chữ (Task 5).
8. Chuỗi thiếu ở một ngôn ngữ, hoặc chữ tiếng Việt còn sót khi FAP ở tiếng Anh (và ngược lại) (Task 4B).
9. Bộ đọc dữ liệu trả sai hoặc rỗng khi FAP ở tiếng Anh (nhãn cột, tên tháng, định dạng ngày) (Task 4A, 4B).

---

### Task 1: Đọc dữ liệu thanh trên từ FAP

**Files:**
- Modify: `lib/fap-page-data.js`
- Test: `tests/fap-page-data.test.js` (thêm ca; dùng `tests/fixtures/fap-home.html`)

**Interfaces:**
- Produces:
```js
readTopbar(doc): {
  campus: { name: string, code: string, isMain: boolean } | null,                    // .jidox-campus-topbar__menu
  language: { current: string, options: Array<{ culture: string, label: string }> } | null, // form[action$="/Language/SetLanguage"] button[name="culture"]
  notifications: { unread: number, available: boolean } | null,                       // .jidox-notification-bell, badge data-notification-badge
  profile: { name: string, studentId: string, accountHref: string, canLogout: boolean } | null // .fap-topbar-user, .profile-dropdown
}
```
`current` là `value` của nút có lớp `active`; `canLogout` đúng khi có `form[action$="/Auth/Logout"] button`; mỗi trường là `null` khi thiếu khối tương ứng trong DOM.

- [ ] **Step 1: Viết test thất bại** (JSDOM, `fap-home.html`): `campus` có `name` "Cơ sở Hà Nội (HN)", `code` "HN", `isMain` `true`; `language.current` bằng `"vi"` và `options` gồm `{culture:"vi",label:"Tiếng Việt"}` và `{culture:"en",label:"English"}`; `notifications.available` đúng; `profile` có `studentId` "SE000000", `accountHref` kết thúc bằng `/Account`, `canLogout` đúng; trên tài liệu rỗng mọi trường là `null`; tên có `<img onerror>` trả về nguyên chuỗi chữ.
- [ ] **Step 2:** `node --test tests/fap-page-data.test.js`; FAIL. **Step 3:** Cài đặt (chỉ `textContent`/thuộc tính). **Step 4:** `node --test tests/*.test.js`; PASS.
- [ ] **Step 5: Commit** `feat(lib): read the topbar controls from the FAP page`

---

### Task 2: Thành phần menu nổi trong Shadow DOM

**Files:**
- Create: `ui/src/components/molecules/Popover.tsx`
- Modify: `ui/src/components/molecules/index.ts`
- Test: `ui/src/components/molecules/Popover.test.tsx`

**Interfaces:**
- Produces: `Popover({ label: string; trigger: (p: { open: boolean; toggle(): void; ref: Ref<HTMLButtonElement>; props: ButtonHTMLAttributes }) => ReactNode; children: (p: { close(): void }) => ReactNode; align?: "start" | "end"; className?: string })`. Nút mở có `aria-haspopup="menu"` (hoặc `"dialog"`), `aria-expanded`; bảng có `role="menu"` hoặc `"dialog"` và vị trí tuyệt đối dưới nút. Đóng khi Escape, khi bấm ra ngoài (kiểm bằng `event.composedPath()`), khi chọn xong (`close`), và trả tiêu điểm về nút mở.

- [ ] **Step 1: Viết test thất bại:** bấm nút mở thì bảng hiện và `aria-expanded="true"`; Escape đóng và tiêu điểm về nút; bấm ngoài đóng; bấm bên trong bảng không đóng; mở bảng thứ hai đóng bảng thứ nhất; gọi `close` từ nội dung đóng bảng; bảng có lớp token (`bg-popover`, `border-border`).
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt (không dùng Radix). **Step 4:** PASS. **Step 5: Commit** `feat(ui): shadow-safe popover primitive`

---

### Task 3: Tìm chức năng, trang

**Files:**
- Create: `ui/src/components/organisms/SearchDialog.tsx`, `ui/src/lib/search.ts`
- Modify: `ui/src/components/organisms/TopNavigation.tsx`
- Test: `ui/src/lib/search.test.ts`, `ui/src/components/organisms/SearchDialog.test.tsx`

**Interfaces:**
- Consumes: `NAV_GROUPS`, `navHref` (`ui/src/data/nav.ts`), `Popover` hoặc hộp thoại tự viết cùng cơ chế đóng.
- Produces: `searchTargets(): Array<{ title: string; group: string; href: string; description?: string }>` (mọi lá điều hướng và liên kết "Menu nhanh"); `filterTargets(query: string, targets): typeof targets` (bỏ dấu và hoa thường, khớp theo từng từ, xếp theo vị trí khớp); `SearchDialog({ open: boolean; onClose(): void; onSelect?(href: string): void })` (mặc định `onSelect` đặt `location.href`).

- [ ] **Step 1: Viết test thất bại:**
  - `filterTargets("thoi khoa bieu", searchTargets())` có "Thời khóa biểu" ở đầu; `("diem danh")` có "Báo cáo điểm danh"; `("")` trả toàn bộ nhóm; `("zzzz")` trả mảng rỗng.
  - `SearchDialog`: mở thì ô nhập được lấy tiêu điểm; gõ "lich thi" lọc còn "Lịch thi"; mũi tên xuống rồi Enter gọi `onSelect` với `navHref("/lich-thi")`; click kết quả cũng vậy; không kết quả hiển thị "Không tìm thấy"; Escape gọi `onClose`.
  - `TopNavigation`: bấm ô tìm kiếm mở hộp; nhấn Ctrl+K và Cmd+K (kể cả khi tiêu điểm nằm ngoài giao diện) mở hộp.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** `cd ui && npm test`; PASS. **Step 5: Commit** `feat(ui): working search for functions and pages`

---

### Task 4: Cơ sở và ngôn ngữ

**Files:**
- Create: `ui/src/topbar/actions.ts`, `ui/src/components/molecules/CampusMenu.tsx`, `ui/src/components/molecules/LanguageMenu.tsx`
- Modify: `ui/src/components/organisms/TopNavigation.tsx`, `ui/src/data/types.ts` (thêm `TopbarData`)
- Test: `ui/src/topbar/actions.test.ts`, `ui/src/components/molecules/menus.test.tsx`

**Interfaces:**
- Produces: `TopbarData = NonNullable<ReturnType<FapPageData.readTopbar>>` kiểu theo Task 1; `submitLanguage(doc: Document, culture: string): boolean` bấm đúng `button[name="culture"][value="<culture>"]` trong `form[action$="/Language/SetLanguage"]` của DOM gốc và trả `false` nếu không có hoặc đã gửi (chống bấm đúp bằng cờ trên tài liệu); `CampusMenu({ campus })` bảng chỉ hiển thị (tên, mã, nhãn "Chính"); `LanguageMenu({ language, onSelect(culture) })` đánh dấu ngôn ngữ hiện tại bằng `aria-checked`.

- [ ] **Step 1: Viết test thất bại:** `submitLanguage` với biểu mẫu gốc trong DOM bấm đúng nút `en` (kiểm bằng bộ lắng nghe `click` trên nút gốc, chặn gửi thật) và trả `true`; gọi lần hai trả `false`; thiếu biểu mẫu trả `false`; culture lạ trả `false`. Menu: `CampusMenu` hiển thị "Cơ sở Hà Nội (HN)", "HN", "Chính" và **không** có nút đổi cơ sở; `LanguageMenu` liệt kê hai ngôn ngữ, mục hiện tại `aria-checked="true"`, chọn mục khác gọi `onSelect("en")`; khi `campus` hoặc `language` là `null` thì thanh trên không hiển thị nút đó.
- [ ] **Step 2:** FAP. **Step 3:** Cài đặt. **Step 4:** PASS. **Step 5: Commit** `feat(ui): campus info and language switching`

---

### Task 4A: Mẫu trang tiếng Anh (người dùng cung cấp, rồi người xây xử lý)

**Files:**
- Create (người xây): `tests/fixtures/pages/en-home.html`, `en-weekly-timetable.html`, `en-exam-schedule.html`, `en-news.html` (đã lọc bằng `scripts/sanitize-fap-page.py`)
- Test: `tests/fap-page-data-en.test.js`

- [ ] **Step 1 (người dùng):** chuyển FAP sang English, lưu 4 trang (Tổng quan, Thời khóa biểu, Lịch thi, Tin tức) dạng MHTML vào `page-fap/` (thư mục đã bị `.gitignore`, không bao giờ commit). Nếu chưa có mẫu thì bỏ qua task này và ghi vào mô tả commit "English fixtures pending"; Task 4B vẫn làm, và Task 7 kiểm chứng bằng tay.
- [ ] **Step 2: Viết test thất bại:** với mỗi fixture tiếng Anh, bộ đọc tương ứng (`readHome`, `readNews`, `toTimetable` qua `extractWeeklyScheduleFromTable`, `toExams` qua `extractExamScheduleFromPage`) trả **cùng số mục** với fixture tiếng Việt cùng trang (10 tin, 7 buổi học...), ngày đúng định dạng `yyyy-MM-dd`, và không có trường nào bị rỗng ở nơi bản tiếng Việt có dữ liệu.
- [ ] **Step 3:** `node --test tests/fap-page-data-en.test.js`; sửa bộ đọc ở `lib/fap-page-data.js` (và `content.js` nếu hàm lấy tuần/lịch thi dùng nhãn tiếng Việt) cho tới khi PASS, không làm hỏng test tiếng Việt.
- [ ] **Step 4:** `node --test tests/*.test.js`; PASS. **Step 5: Commit** `test: read the FAP pages when the site language is English`

---

### Task 4B: Giao diện hai ngôn ngữ (vi, en)

**Files:**
- Create: `ui/src/i18n/index.tsx`, `ui/src/i18n/vi.ts`, `ui/src/i18n/en.ts`
- Modify: mọi component và trang có chữ cứng (`ui/src/data/nav.ts`, `pages/*.tsx`, `components/**/*.tsx`), `ui/src/boot.tsx`, `ui/src/data/types.ts`
- Test: `ui/src/i18n/i18n.test.ts`, cập nhật các test hiện có (chúng đang tìm chữ tiếng Việt; vẫn chạy với `lang="vi"`)

**Interfaces:**
- Produces:
```ts
export type Lang = "vi" | "en";
export function normalizeLang(value: unknown): Lang; // lạ thì "vi"
export const dictionaries: Record<Lang, Record<string, string>>; // cùng một tập khóa
export function I18nProvider(props: { lang: Lang; children: ReactNode }): JSX.Element;
export function useT(): (key: string, params?: Record<string, string | number>) => string; // {name} thay bằng params.name; khóa thiếu trả chính khóa
export function useLang(): Lang;
export function dateLocale(lang: Lang): Locale; // date-fns vi hoặc enUS
```
`boot` đọc `readTopbar(doc).language.current` (qua `normalizeLang`) và bọc cây giao diện bằng `I18nProvider`; `PageData` giữ nguyên.

- [ ] **Step 1: Viết test thất bại** (`i18n.test.ts`):
  - `Object.keys(dictionaries.vi)` bằng `Object.keys(dictionaries.en)` (sắp xếp); không giá trị rỗng.
  - Không giá trị nào của `en` chứa chữ cái tiếng Việt có dấu (`/[À-ỹ]/`), ngoại trừ danh sách ngoại lệ ghi tên riêng (nếu có).
  - Mọi `{tham_số}` ở `vi` có mặt ở `en` cùng tên.
  - Quét mã nguồn: không tệp `.tsx` hoặc `.ts` (trừ `i18n/vi.ts`, `data/mock.ts` và test) chứa chuỗi chữ có dấu tiếng Việt (`/[À-ỹ]/`) trong chuỗi hay văn bản JSX.
  - `normalizeLang("en") === "en"`; `("fr")`, `(undefined)`, `(null)` bằng `"vi"`; `useT` trả chính khóa khi thiếu và thay tham số.
  - Hiển thị: `AppShell` với `lang="en"` có "Overview" (không có "Tổng quan"), `TimetablePage` có tiêu đề tiếng Anh, tên thứ và ngày theo `enUS`; `lang="vi"` giữ nguyên chữ hiện tại (các test cũ pass).
  - `boot`: DOM có biểu mẫu ngôn ngữ với `active` ở `en` thì giao diện hiển thị tiếng Anh; không có biểu mẫu thì tiếng Việt.
- [ ] **Step 2:** `cd ui && npx vitest run src/i18n`; FAIL. **Step 3:** Cài đặt: gom chuỗi hiện có (khoảng 150, từ `nav.ts`, các trang, lịch, sidebar, thanh trên) thành từ điển `vi`, viết bản `en` tương ứng (văn phong tự nhiên, không dịch máy móc tên riêng như FAP, FPT), thay chữ cứng bằng `t()`.
- [ ] **Step 4:** `cd ui && npm test && npm run parity`; PASS và parity (tiếng Việt) trong ngưỡng Global Constraints. Chạy thêm `npm run parity -- --lang=en` nếu harness có tham số; nếu chưa, thêm `?lang=en` cho `harness.html` và chụp 4 trang vào `ui/parity/out/` (không so với ảnh chuẩn) để người dùng xem.
- [ ] **Step 5: Commit** `feat(ui): interface in Vietnamese or English, following the FAP language`

---

### Task 5: Thông báo

**Files:**
- Modify: `ui/src/topbar/actions.ts`
- Create: `ui/src/components/organisms/NotificationMenu.tsx`
- Modify: `ui/src/components/organisms/TopNavigation.tsx`
- Test: `ui/src/topbar/actions.test.ts` (thêm ca), `ui/src/components/organisms/NotificationMenu.test.tsx`

**Interfaces:**
- Produces:
```ts
export type NotificationItem = { title: string; time?: string; href?: string; unread: boolean };
export function openNotifications(doc: Document): boolean;   // bấm toggle gốc .jidox-notification-bell__toggle để FAP nạp danh sách
export function readNotificationItems(doc: Document): { items: NotificationItem[]; loading: boolean; failed: boolean };
export function watchNotificationList(doc: Document, onChange: () => void): { stop(): void }; // MutationObserver trên [data-notification-list]
export function markAllNotificationsRead(doc: Document): boolean; // bấm [data-notification-mark-all]
```
`readNotificationItems` phân tích **chịu lỗi** các `.dropdown-item` trong `[data-notification-list]`: `title` là dòng chữ đầu, `time` là chữ có dạng thời gian, `href` là `href` của thẻ `a` (hoặc của thẻ `a` bên trong), `unread` khi phần tử hoặc con có lớp chứa `unread`/`active`/`new` hoặc thuộc tính `data-unread`; mục chỉ chứa chữ "Đang tải" là `loading`; mục chứa `data-load-failed` hoặc chữ "Không tải được" là `failed`. `NotificationMenu({ unread, doc?, ... })` mở bảng thì gọi `openNotifications`, theo dõi danh sách và hiển thị: khung chờ, danh sách, trạng thái lỗi (kèm liên kết "Mở thông báo trên FAP"), "Đã đọc tất cả" (gọi `markAllNotificationsRead`), và huy hiệu số chưa đọc cập nhật khi huy hiệu gốc đổi.

- [ ] **Step 1: Viết test thất bại** (DOM giả dựng đúng khung của FAP: `[data-notification-list]` chứa `<div class="dropdown-item text-muted">Đang tải thông báo...</div>`, rồi đổi sang 3 mục `<a class="dropdown-item" href="/News/Detail/1"><span>Tiêu đề</span><small>5 phút trước</small></a>` với mục đầu có lớp `unread`):
  - `readNotificationItems` ở trạng thái chờ trả `loading: true`, `items: []`; sau khi đổi trả 3 mục, mục đầu `unread: true`, `href` đúng; tiêu đề `<img onerror>` trả nguyên chuỗi chữ; trạng thái "Không tải được danh sách thông báo." trả `failed: true`.
  - `openNotifications` bấm toggle gốc và trả `true`; thiếu toggle trả `false`.
  - `markAllNotificationsRead` bấm nút gốc một lần và trả `true`; thiếu nút trả `false`.
  - `NotificationMenu`: bấm chuông gọi `openNotifications` đúng một lần; hiển thị khung chờ rồi danh sách khi DOM gốc đổi (không cần mở lại); bấm "Đã đọc tất cả" gọi nút gốc; trạng thái `failed` hiển thị liên kết mở trên FAP; huy hiệu số chưa đọc hiển thị "9+" khi lớn hơn 9; không có thông báo hiển thị "Không có thông báo mới".
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS. **Step 5: Commit** `feat(ui): notifications driven by FAP's own bell`

---

### Task 6: Hồ sơ, đăng xuất và nối vào thanh trên

**Files:**
- Modify: `ui/src/topbar/actions.ts`, `ui/src/components/organisms/TopNavigation.tsx`, `ui/src/components/organisms/AppSidebar.tsx`, `ui/src/components/templates/AppShell.tsx`, `ui/src/boot.tsx`, `ui/src/data/types.ts`
- Create: `ui/src/components/organisms/ProfileMenu.tsx`
- Test: `ui/src/topbar/actions.test.ts`, `ui/src/components/organisms/ProfileMenu.test.tsx`, `ui/src/components/organisms/organisms.test.tsx`, `ui/src/boot.test.tsx`

**Interfaces:**
- Produces: `logout(doc: Document): boolean` bấm nút gốc trong `form[action$="/Auth/Logout"]`, trả `false` nếu không có hoặc đã bấm (cờ chống bấm đúp); `ProfileMenu({ profile, onLogout })` hiển thị tên, mã, liên kết "Tài khoản của tôi" (`accountHref`) và "Đăng xuất" (ẩn khi `canLogout` là `false`); `PageData` có thêm `topbar?: TopbarData | null`; `AppShell` nhận `topbar` và truyền xuống `TopNavigation` và `AppSidebar`; `boot` đọc `readTopbar(win.document)` cùng lúc với `readShell`; nút "Đăng xuất" ở chân sidebar gọi cùng `logout`, "Cài đặt tài khoản" trỏ tới `accountHref`.

- [ ] **Step 1: Viết test thất bại:** `logout` bấm nút gốc đúng một lần dù gọi hai lần; thiếu biểu mẫu trả `false`; `ProfileMenu` hiển thị tên và mã, liên kết `/Account`, "Đăng xuất" gọi `onLogout`; ẩn "Đăng xuất" khi `canLogout` `false`; `AppShell` với `topbar` đủ: chân sidebar có "Đăng xuất" gọi `logout`; `boot` truyền `topbar` đọc từ DOM vào giao diện (menu hồ sơ hiển thị tên từ DOM, ngôn ngữ hiển thị đúng `current`); khi `readTopbar` trả toàn `null` giao diện vẫn mount và các nút ẩn/vô hiệu, không lỗi.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** `cd ui && npm test && npm run parity`; PASS và parity trong ngưỡng Global Constraints.
- [ ] **Step 5: Commit** `feat(ui): profile menu, logout and wiring of the topbar controls`

---

### Task 7: Kiểm tra thủ công (người dùng thực hiện)

- [ ] Ctrl/Cmd+K và bấm ô tìm: gõ "diem danh" thấy "Báo cáo điểm danh", Enter đi tới trang đó trên FAP.
- [ ] Bấm "Cơ sở": hiển thị đúng cơ sở của bạn (không có nút đổi).
- [ ] Bấm "Ngôn ngữ", chọn English: FAP tải lại bằng tiếng Anh **và giao diện mới cũng hiển thị tiếng Anh** (menu, tiêu đề trang, nút, tên thứ, ngày tháng); dữ liệu bốn trang (lịch học, lịch thi, tin tức, thông tin sinh viên) vẫn đủ và đúng; chọn lại Tiếng Việt thì trở về như cũ. Không còn chữ tiếng Việt nào lẫn trong giao diện tiếng Anh.
- [ ] Bấm chuông: thấy danh sách thông báo (hoặc khung chờ rồi danh sách); "Đã đọc tất cả" làm số chưa đọc về 0; bấm một thông báo mở nội dung của nó. **Nếu danh sách trống hoặc sai, chụp màn hình và gửi để bổ sung mẫu HTML thông báo vào fixture.**
- [ ] Bấm hồ sơ: thấy tên, mã; "Tài khoản của tôi" mở trang `/Account`; "Đăng xuất" đăng xuất khỏi FAP.
- [ ] Menu đóng bằng Escape và bấm ra ngoài; dùng bàn phím được; ở chế độ tối vẫn đúng.
- [ ] Nút "Đăng xuất" ở chân sidebar hoạt động.
