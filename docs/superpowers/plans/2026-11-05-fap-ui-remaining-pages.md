# FAP UI: các trang còn lại và đăng nhập Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mọi trang FAP hiển thị trong giao diện mới: các trang chỉ đọc dựng lại bằng React, trang biểu mẫu và đăng nhập có giao diện mới nhưng vẫn gửi bằng điều khiển gốc của FAP, mọi trang còn lại nằm trong khung mới bao quanh nội dung FAP.

**Architecture:** Một bảng route duy nhất (`lib/fap-routes.js`) phân mỗi đường dẫn vào một trong ba loại: *wrapped* (khung mới bao nội dung FAP gốc qua `<slot>`), *native* (React dựng từ dữ liệu đọc ở DOM) và *form* (React dựng, ghi vào ô gốc, chỉ bấm nút gửi gốc khi người dùng bấm). Mỗi trang native là một `PageDefinition` trong một registry: `read(doc)` trả dữ liệu hoặc `null` (khi đó rơi về *wrapped*, không bao giờ về giao diện cũ hoàn toàn).

**Tech Stack:** TypeScript/React, Tailwind 4, Vitest; bộ đọc vanilla UMD trong `lib/`, test bằng `node --test` với fixture ở `tests/fixtures/pages/`.

**Spec:** `docs/superpowers/specs/2026-11-05-fap-ui-remaining-pages-design.md`.

**Chạy sau** `2026-11-05-fap-ui-topbar.md` (cần `t()`, `ProfileMenu`, giao diện hai ngôn ngữ) và `2026-11-05-fap-ui-theme-and-accent.md`.

## Global Constraints

- Không bao giờ gửi biểu mẫu khi người dùng chưa bấm; không gọi `form.submit()` hay `fetch` tới điểm cuối ghi của FAP; chỉ bấm nút gửi gốc đúng một lần (cờ chống bấm đúp). Luật AGENTS.md mục 4 (không tự gửi khảo sát) giữ nguyên.
- Extension không đọc, lưu hay ghi log mật khẩu hoặc mã xác thực; ô nhập của đăng nhập là **ô gốc của FAP**.
- Thanh toán (`/ShoppingCart`, `/CoursePendingPayment`) là *wrapped*, không dựng lại; mã QR và nút thanh toán không bị đụng tới.
- Mọi chuỗi chữ qua `t()`; chữ lấy từ FAP hiển thị như văn bản thuần (không `dangerouslySetInnerHTML` với dữ liệu từ FAP).
- Thành phần mới đặt đúng tầng atoms, molecules, organisms, templates và có test; cập nhật `DESIGN.md` bằng script sinh.
- Chỉ dùng token màu (sáng, tối, màu nhấn đều đúng); đối chiếu thiết kế 4 trang cũ (`npm run parity`) không xấu đi quá 0.5 điểm phần trăm.
- Fixture mới qua `scripts/sanitize-fap-page.py`; `tests/fixtures-secrets.test.js` phải pass.
- `node --test tests/*.test.js` và `cd ui && npm test` pass 100%. Không phát hành, không đổi phiên bản.

## Review Focus

1. Bộ đọc trả `null` hoặc rỗng khi FAP đổi HTML: rơi về *wrapped*, không trang trắng, không giao diện cũ hoàn toàn (Task 2, 3, 5 đến 9).
2. Khung *wrapped* làm hỏng script của FAP (DataTables, Select2, hộp thoại, biểu mẫu): các trang fixture phải còn chạy được các điều khiển của chúng (Task 2).
3. Tắt giao diện mới hoặc quay về FAP gốc không để lại node nằm sai chỗ trong DOM (Task 2).
4. Gửi hai lần, hoặc gửi khi chưa bấm; ô bắt buộc trống nhưng vẫn gửi (Task 12, 13, 14).
5. Đăng nhập: trình quản lý mật khẩu điền được, reCAPTCHA và token chống giả mạo còn nguyên, lỗi của FAP hiện lên (Task 15).
6. Thanh toán: QR vẫn nền trắng đục, nút thanh toán gốc còn bấm được (Task 3, 16).
7. Chữ của FAP chứa HTML hoặc ký tự lạ hiển thị như chữ (Task 4 đến 10).
8. Bundle nạp trên mọi trang FAP làm chậm trang: đo thời gian nạp và ghi vào mô tả commit Task 3.

---

### Task 1: Bảng route duy nhất

**Files:**
- Create: `lib/fap-routes.js`
- Test: `tests/fap-routes.test.js`

**Interfaces:**
- Produces (UMD, cũng gán `window.FapRoutes`):
```js
ROUTES: Array<{ id: string; patterns: string[]; kind: "native" | "form" | "auth" | "wrapped"; nav: string | null }>
// patterns: đường dẫn chính xác hoặc có đuôi "/*"; nav: khóa mục điều hướng để tô sáng (route Lovable, ví dụ "/bao-cao-diem")
matchRoute(pathname: string): { id: string; kind: "native" | "form" | "auth" | "wrapped"; nav: string | null } | null
// null: đường dẫn không bao giờ được mount (đăng xuất, chuyển hướng OAuth, trang lỗi, /Default.aspx)
```
Bốn route đang có (`/`, `/WeeklyTimetable`, `/ExamSchedule`, `/News`) giữ id `overview`, `timetable`, `exams`, `news`. `/Auth/Login` là `auth` (id `login`). `/ShoppingCart` và `/CoursePendingPayment` là `wrapped` (ghi rõ lý do trong chú thích). Mọi đường dẫn khác không nằm trong danh sách loại trừ là `wrapped` (id `wrapped`).

- [ ] **Step 1: Viết test thất bại:** `matchRoute("/")` ra `overview` native; `("/WeeklyTimetable")` ra `timetable`; `("/News/Detail/abc")` ra route chi tiết tin (id `news-detail`) chứ không phải `news`; `("/Auth/Login")` ra `login` kind `auth`; `("/Auth/Logout")`, `("/Auth/GoogleLogin")`, `("/Auth/LoginParent")`, `("/Default.aspx")` ra `null`; `("/ShoppingCart")` và `("/CoursePendingPayment")` ra `wrapped`; `("/Subject")` chưa có reader nên ra `wrapped` ở task này (sẽ đổi khi dựng); đường dẫn lạ `("/Whatever/Page")` ra `wrapped`; chuỗi rỗng và không phải chuỗi ra `/` hoặc `null` hợp lý (rỗng bằng `/`, không phải chuỗi là `null`). Với mỗi mục trong `tests/fixtures/pages/index.json`, `matchRoute(route)` không `null`.
- [ ] **Step 2:** `node --test tests/fap-routes.test.js`; FAIL. **Step 3:** Cài đặt. **Step 4:** `node --test tests/*.test.js`; PASS.
- [ ] **Step 5: Commit** `feat(lib): a single route table for the FAP pages`

---

### Task 2: Khung bao (wrapped)

**Files:**
- Create: `ui/src/shadow/wrapped.tsx`, `ui/src/pages/Wrapped.tsx`
- Test: `ui/src/shadow/wrapped.test.tsx`

**Interfaces:**
- Consumes: `AppShell`, `PageHeader`, `ShellData`, `TopbarData`.
- Produces:
```ts
export function adoptContent(doc: Document, host: HTMLElement): { restore(): void } | null;
// tìm `.content-page` trong tài liệu; ghi nhớ cha và node kế tiếp; gắn slot="fap-content"; đặt làm con của host (DOM thường, nằm ngoài Shadow DOM nên CSS và script của FAP vẫn áp dụng); trả null nếu không có `.content-page`
export function WrappedPage(props: { title: string }): JSX.Element; // <PageHeader title/> + <div class="surface-card"><slot name="fap-content" /></div>
```
Tiêu đề lấy từ `.fap-page-title__crumb-current`, nếu thiếu thì `document.title` bỏ hậu tố " - FAP - FPT Education".

- [ ] **Step 1: Viết test thất bại** (JSDOM với `tests/fixtures/pages/subject.html` dán vào `body` kèm khung `.wrapper`): `adoptContent` đưa `.content-page` thành con của host với `slot="fap-content"`; các nút, bảng và biểu mẫu bên trong vẫn là **cùng node** (tham chiếu bằng nhau trước và sau); bộ lắng nghe `click` gắn trước đó trên một nút bên trong vẫn chạy sau khi chuyển; `restore()` trả node về đúng cha, đúng vị trí (anh em kế tiếp) và gỡ thuộc tính `slot`; gọi `restore()` hai lần không lỗi; không có `.content-page` trả `null`; `WrappedPage` có `<slot name="fap-content">` và tiêu đề từ breadcrumb; tiêu đề chứa `<img onerror>` hiển thị như chữ.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(ui): wrap the original FAP content in the new shell`

---

### Task 3: Registry trang, nối khung bao vào boot và mở rộng phạm vi nạp

**Files:**
- Create: `ui/src/pages/registry.ts`
- Modify: `ui/src/boot.tsx`, `ui/src/routes.ts` (nay chỉ gọi `FapRoutes.matchRoute`), `lib/fap-ui-early.js`, `lib/fap-ui-early.css`, `manifest.json`, `tests/fap-ui-manifest.test.js`, `ui/src/pages/index.tsx`
- Test: `ui/src/boot.test.tsx` (thêm ca), `ui/src/pages/registry.test.ts`, `tests/fap-ui-early.test.js`, `tests/fap-ui-manifest.test.js`

**Interfaces:**
- Produces:
```ts
export type PageDefinition<T = unknown> = {
  id: string;                                          // id route trong lib/fap-routes.js
  ready?: (doc: Document) => boolean;                  // dữ liệu đã có chưa (trang nạp động)
  read: (doc: Document, win: Window) => T | null;     // null: rơi về khung bao
  Component: (props: { data: T; shell: ShellData; lang: Lang }) => JSX.Element;
};
export const registry: Record<string, PageDefinition<any>>;   // bốn trang hiện có chuyển vào đây; trang khác thêm ở các task sau
```
`boot` quyết định theo `matchRoute`: `native` hoặc `form` có trong registry thì chờ `ready`, `read`, dựng `Component`; thiếu registry hoặc `read` trả `null` hoặc quá hạn thì dựng `WrappedPage` bằng `adoptContent`; `auth` đi theo Task 15; `null` thì không làm gì. `giveBack` gọi `restore()` của khung bao. `manifest.json`: khối `document_start` và `document_idle` của giao diện đổi `matches` thành `*://fap.fpt.edu.vn/*` (route chọn ở thời gian chạy); `lib/fap-ui-early.js` dùng `FapRoutes.matchRoute` và chỉ đặt `data-fptu-ui="pending"` khi kết quả không `null`; `lib/fap-routes.js` thêm vào danh sách script `document_start`.

- [ ] **Step 1: Viết test thất bại:** `registry` có đúng bốn id `overview`, `timetable`, `exams`, `news` và các test trang hiện có vẫn pass; trang `/Subject` (fixture `subject.html`, chưa có reader) hiển thị `WrappedPage` với nội dung FAP là con của host và `data-fptu-ui="active"`; reader trả `null` thì dựng khung bao; hết `timeoutMs` thì khung bao thay vì giao diện cũ (khác hành vi cũ chỉ cho trang đã đăng ký); `/Auth/Logout` không mount; tắt công tắc chung thì node nội dung trở về chỗ cũ (so với DOM ban đầu bằng `isEqualNode` và vị trí); `/ShoppingCart` hiển thị khung bao và nút "Thanh toán" gốc vẫn là cùng node, QR (`img` hoặc `canvas` hoặc `svg` bên trong) không bị bọc thêm hay đổi thuộc tính; manifest: các khối giao diện có `matches` là `*://fap.fpt.edu.vn/*`, danh sách `document_start` có `lib/fap-routes.js` trước `lib/fap-ui-early.js`; mọi đường dẫn trong `manifest.json` tồn tại.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** `node --test tests/*.test.js` và `cd ui && npm test && npm run parity`; PASS và đối chiếu như Global Constraints.
- [ ] **Step 5:** Đo (trong Chrome headless với trang fixture) thời gian từ nạp trang đến khi giao diện hiện cho `/` và một trang khung bao, ghi vào mô tả commit. **Step 6: Commit** `feat(ui): a page registry and the wrapped fallback on every FAP page`

---

### Task 4: Thành phần dùng chung cho các trang dữ liệu

**Files:**
- Create: `ui/src/components/molecules/{FilterBar,StatTile,KeyValueList,Section}.tsx`, `ui/src/components/organisms/RichTable.tsx`, `lib/fap-table-reader.js`
- Modify: `ui/src/components/molecules/index.ts`, `ui/scripts/gen-design-md.mjs`, `DESIGN.md`
- Test: `ui/src/components/molecules/data-molecules.test.tsx`, `ui/src/components/organisms/RichTable.test.tsx`, `tests/fap-table-reader.test.js`

**Interfaces:**
- Produces:
```js
// lib/fap-table-reader.js (UMD, gán lên FapPageData.tables)
readTables(root: ParentNode): Array<{ caption?: string; headers: string[]; rows: string[][]; links: Array<Array<string | null>> }>
readSelect(root: ParentNode, selector: string): { value: string; options: Array<{ value: string; label: string }> } | null
```
```ts
RichTable({ columns: Array<{ key: string; header: string; align?: "left"|"right"|"center"; tone?: (value: string) => "success"|"warning"|"danger"|"neutral"|undefined }>; rows: Array<Record<string,string>>; empty?: ReactNode; caption?: string })
FilterBar({ label: string; value: string; options: Array<{ value: string; label: string }>; onChange(v: string): void })
StatTile({ label: string; value: string; tone?: ...; hint?: string }); KeyValueList({ items: Array<{ label: string; value: ReactNode }> }); Section({ title: string; description?: string; action?: ReactNode; children })
```
`readTables` chỉ dùng `textContent` đã gọn khoảng trắng; hàng tiêu đề lấy từ `thead` hoặc hàng `th`.

- [ ] **Step 1: Viết test thất bại:** `readTables` trên `report-grade.html`, `transaction.html`, `subject.html` trả số hàng bằng số `tbody tr`, tiêu đề đúng thứ tự cột; ô có `<img onerror>` trả nguyên chữ; ô trống trả `""`; bảng rỗng trả `rows: []`; `readSelect` trả giá trị đang chọn và đủ lựa chọn của `select` đầu tiên khớp. Thành phần: `RichTable` hiển thị đủ cột và hàng, căn lề theo `align`, `empty` khi `rows` rỗng, dữ liệu `<img onerror>` hiển thị như chữ, tone dùng lớp token (`bg-success-soft`...); `FilterBar` gọi `onChange` với đúng giá trị; `StatTile` hiển thị "—" khi `value` rỗng; `Section` hiển thị tiêu đề và hành động.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt, cập nhật script sinh `DESIGN.md` rồi chạy lại. **Step 4:** `node --test tests/*.test.js` và `cd ui && npm test`; PASS. **Step 5: Commit** `feat(ui): shared table and section components for the data pages`

---

### Task 5: Nhóm báo cáo học tập (điểm danh, điểm, bảng điểm)

**Files:**
- Create: `lib/fap-readers-reports.js`, `ui/src/pages/{AttendanceReport,GradeReport,Transcript}.tsx`
- Modify: `ui/src/pages/registry.ts`, `lib/fap-routes.js` (đổi ba route sang `native`), `ui/src/data/types.ts`
- Test: `tests/fap-readers-reports.test.js`, `ui/src/pages/reports.test.tsx`

**Interfaces:**
- Produces:
```js
readAttendanceReport(doc): { courses: Array<{ code: string; name: string; attended: number; absent: number; total: number; rate: number | null }>; selectedCourse?: string; filter: { value: string; options: Array<{value:string;label:string}> } | null; sessions: Array<{ index: string; date: string; slot: string; room: string; status: string; note: string }> } | null
readGradeReport(doc): { term: { value: string; options: ... } | null; courses: Array<{ code: string; name: string; components: Array<{ name: string; weight: string; value: string }>; total: string; status: string }> } | null
readTranscript(doc): { programs: Array<{ title: string; rows: Array<{ code: string; name: string; credit: string; grade: string; status: string }>; gpa?: string; credits?: string }> } | null
```
Các bộ lọc (học kỳ, môn) là liên kết hoặc `select` trên trang FAP: giao diện đổi giá trị bằng cách **đi tới URL tương ứng** khi là liên kết/tham số GET (`?termId=...`), hoặc ghi giá trị vào `select` gốc rồi phát sự kiện `change` khi FAP tự nạp lại; người xây xác định cách đúng từ fixture. Trang nào đọc không ra thì `null` (rơi về khung bao).

- [ ] **Step 1: Viết test thất bại** (fixtures `report-attendance`, `report-grade`, `report-transcript`): mỗi reader trả đủ số môn và số dòng bằng số hàng của bảng gốc; `rate` bằng `attended / total` (hoặc `null` khi `total` bằng 0); tài liệu rỗng trả `null`; chữ chứa HTML hiển thị nguyên chữ. Giao diện: mỗi trang có `PageHeader`, bộ lọc `FilterBar` (khi có), thẻ thống kê (`StatTile`) và `RichTable`; đổi bộ lọc gọi đúng hành động (đi tới URL hoặc ghi vào `select` gốc, kiểm bằng bộ giả); trạng thái rỗng hiển thị `EmptyState`; chế độ tiếng Anh hiển thị nhãn tiếng Anh.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt ba reader, ba trang, đăng ký vào registry, đổi route sang `native`. **Step 4:** `node --test tests/*.test.js` và `cd ui && npm test`; PASS.
- [ ] **Step 5:** Chụp ảnh ba trang (sáng và tối) bằng harness (`?page=<id>` với dữ liệu mẫu rút từ fixture) vào `ui/parity/out/`. **Step 6: Commit** `feat(ui): attendance, grade and transcript pages`

---

### Task 6: Điều kiện OJT và khóa luận

**Files:** Create `lib/fap-readers-conditions.js`, `ui/src/pages/{OjtConditions,ThesisConditions}.tsx`; Modify registry, `lib/fap-routes.js`; Test `tests/fap-readers-conditions.test.js`, `ui/src/pages/conditions.test.tsx`.

**Interfaces:**
```js
readConditions(doc): { summary: { eligible: boolean | null; message: string }; checks: Array<{ label: string; required: string; actual: string; passed: boolean | null }> } | null
```
Dùng một reader cho cả hai route (`report-ojt-conditions`, `report-thesis-conditions`); `passed` suy ra từ lớp hoặc biểu tượng trạng thái của FAP, `null` khi không xác định được (không đoán).

- [ ] **Step 1: Viết test thất bại** (hai fixture): số điều kiện bằng số hàng; `eligible` đúng khi mọi `passed` là `true`; khi không rõ thì `null` và giao diện hiển thị "Chưa xác định" (không hiển thị "Đạt"); HTML thành chữ; tài liệu rỗng `null`. Giao diện: biểu ngữ kết luận (đạt, chưa đạt, chưa xác định) và danh sách điều kiện với `StatusBadge`.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS. **Step 5:** Chụp ảnh. **Step 6: Commit** `feat(ui): OJT and thesis condition pages`

---

### Task 7: Học vụ (môn học, khung chương trình, chứng chỉ)

**Files:** Create `lib/fap-readers-academic.js`, `ui/src/pages/{Subjects,Curriculum,Certificates}.tsx`; Modify registry, routes; Test `tests/fap-readers-academic.test.js`, `ui/src/pages/academic.test.tsx`.

**Interfaces:**
```js
readSubjects(doc): { term?: { value: string; options: ... }; rows: Array<{ code: string; name: string; credit: string; status: string; semester?: string }> } | null
readCurriculum(doc): { groups: Array<{ title: string; rows: Array<{ code: string; name: string; credit: string; prerequisite?: string; status?: string }> }>; totalCredits?: string } | null
readCertificates(doc): { items: Array<{ name: string; issuer?: string; date?: string; status?: string; href?: string | null }> } | null
```

- [ ] **Step 1: Viết test thất bại** (fixtures `subject`, `curriculum`, `my-certificates`): số dòng khớp bảng gốc; nhóm học kỳ trong khung chương trình giữ đúng thứ tự; liên kết chỉ nhận `https://fap.fpt.edu.vn` hoặc đường dẫn tương đối (liên kết `javascript:` bị bỏ); rỗng `null`. Giao diện: bảng có tìm kiếm trong trang (lọc theo mã hoặc tên, bỏ dấu), nhóm có thể thu gọn, chứng chỉ dạng thẻ; trạng thái rỗng.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS. **Step 5:** Chụp ảnh. **Step 6: Commit** `feat(ui): subjects, curriculum and certificates pages`

---

### Task 8: Hồ sơ giao dịch và danh sách (giao dịch, tài liệu, danh sách chờ lớp, FYE, xem đơn, danh mục gửi đơn)

**Files:** Create `lib/fap-readers-records.js`, `ui/src/pages/{Transactions,Documents,Wishlist,FyeCheckIn,FyeMentorFeedback,Applications,ApplicationCatalog}.tsx`, `ui/src/pages/{StartupGroupEmpty,CrossClassChangeEmpty}.tsx`; Modify registry, routes; Test `tests/fap-readers-records.test.js`, `ui/src/pages/records.test.tsx`.

**Interfaces:**
```js
readTransactions(doc): { rows: Array<{ date: string; description: string; amount: string; direction: "in" | "out" | "unknown"; status?: string }>; balance?: string } | null
readDocuments(doc): { rows: Array<{ title: string; category?: string; date?: string; href: string | null }> } | null
readWishlist(doc): { rows: Array<{ code: string; name: string; status: string; registerHref?: string | null }>; registerHref: string | null } | null
readFyeLog(doc): { rows: Array<Record<string, string>> } | null      // dùng cho FyeCheckInLog và FyeMentorFeedback (danh sách)
readApplications(doc): { rows: Array<{ type: string; created: string; status: string; href: string | null }> } | null
readApplicationCatalog(doc): { items: Array<{ title: string; description?: string; href: string }> } | null
readListOrEmpty(doc): { empty: true; createHref: string | null } | { empty: false } | null   // StartupGroup, CrossClassChange
```
`direction` suy ra từ dấu của số tiền (âm là `out`), không xác định được thì `unknown`; số tiền giữ nguyên chuỗi của FAP (không tự đổi định dạng hay tiền tệ). "Gửi đơn" (`ApplicationCatalog`) dùng bố cục của `src/routes/gui-don.tsx` trong repo Lovable (lưới thẻ loại đơn) nhưng dữ liệu từ FAP; nút tới trang tạo đơn là liên kết sang `/Application/Create?...` (trang tạo đơn do Task 13 xử lý).

- [ ] **Step 1: Viết test thất bại** (fixtures tương ứng): số dòng và số thẻ khớp trang gốc; `direction` đúng với số âm và dương; liên kết lạ bị bỏ; rỗng `null`; trang `startup-group` và `cross-class-change` (fixture dạng "empty") cho `{ empty: true, createHref }`. Giao diện: giao dịch có số âm và dương tô khác nhau (token), danh mục đơn dạng lưới thẻ, trạng thái rỗng có nút tạo mới trỏ tới `createHref`.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS. **Step 5:** Chụp ảnh. **Step 6: Commit** `feat(ui): transactions, documents, wishlist, FYE and application lists`

---

### Task 9: Chi tiết tin và tài liệu

**Files:** Create `lib/fap-readers-article.js`, `ui/src/pages/Article.tsx`, `ui/src/components/organisms/ArticleFrame.tsx`; Modify registry, routes (`news-detail`, `document-detail`); Test `tests/fap-readers-article.test.js`, `ui/src/pages/article.test.tsx`.

**Interfaces:**
```js
readArticle(doc): { title: string; meta: Array<{ label: string; value: string }>; attachments: Array<{ name: string; href: string }>; bodySelector: string } | null
```
Phần thân bài là HTML nhiều định dạng do FAP kiểm soát: **không** dựng lại thành React; node thân bài (theo `bodySelector`) được đưa vào khe `fap-article-body` (cùng cơ chế `adoptContent`, có `restore`), nằm trong `ArticleFrame` có tiêu đề, thông tin (ngày, mục), danh sách tệp đính kèm (liên kết lọc như Task 7) và nút "Quay lại" (liên kết về trang danh sách tương ứng).

- [ ] **Step 1: Viết test thất bại** (`news-detail`, `document-detail`): tiêu đề, thông tin và tệp đính kèm đúng; node thân bài giữ nguyên (cùng tham chiếu) và nằm trong khe; `restore()` đưa về chỗ cũ; liên kết tệp `javascript:` bị bỏ; thiếu thân bài thì `null` (rơi về khung bao).
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS. **Step 5:** Chụp ảnh. **Step 6: Commit** `feat(ui): news and document detail pages`

---

### Task 10: Tài khoản (chỉ đọc)

**Files:** Create `lib/fap-readers-account.js`, `ui/src/pages/Account.tsx`; Modify registry, routes (`account`); Test `tests/fap-readers-account.test.js`, `ui/src/pages/account.test.tsx`.

**Interfaces:**
```js
readAccount(doc): { sections: Array<{ title: string; items: Array<{ label: string; value: string }> }>; editHref: string | null } | null
```
Chuỗi như số điện thoại, email, CCCD chỉ hiển thị, không ghi log hay lưu. `editHref` là liên kết tới `/StudentProfile` (trang sửa hồ sơ, Task 14).

- [ ] **Step 1: Viết test thất bại** (`account`): số nhóm và số mục khớp trang gốc, nhãn đúng thứ tự, giá trị rỗng hiển thị "—", rỗng `null`; giao diện có nút "Cập nhật hồ sơ" khi có `editHref`.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS. **Step 5:** Chụp ảnh. **Step 6: Commit** `feat(ui): account page`

---

### Task 11: Cổng duyệt thiết kế (người dùng)

- [ ] **Step 1:** Gom ảnh chụp Task 5 đến 10 (sáng, tối, và một tổ hợp màu nhấn) vào `ui/parity/out/` và gửi người dùng.
- [ ] **Step 2: Dừng.** Người dùng nêu chỗ cần đổi; sửa (chủ yếu bố cục và nhãn) rồi chụp lại cho tới khi duyệt. Ghi quyết định vào mô tả commit. Không bắt đầu Task 12 đến 15 trước khi người dùng duyệt.

---

### Task 12: Khung biểu mẫu (ghi vào ô gốc, gửi bằng nút gốc)

**Files:** Create `lib/fap-form-reader.js`, `ui/src/forms/{formActions.ts,FormView.tsx}`; Test `tests/fap-form-reader.test.js`, `ui/src/forms/formActions.test.ts`, `ui/src/forms/FormView.test.tsx`.

**Interfaces:**
```js
readForm(doc, selector): { fields: FormField[]; action: string; method: string; submitLabel: string; unsupported: boolean } | null
// FormField = { name; label; type: "text"|"textarea"|"select"|"checkbox"|"radio"|"date"|"number"|"email"|"tel"; value: string; options?: Array<{value:string;label:string}>; required: boolean; error?: string; help?: string }
// unsupported = true khi có ô file, ô được điều khiển bằng widget lạ, hoặc ô phụ thuộc script mà ta không mô phỏng được: trang đó rơi về khung bao
```
```ts
setFieldValue(doc: Document, selector: string, name: string, value: string): boolean // ghi vào ô gốc và phát "input" rồi "change" (để Select2, kiểm tra hợp lệ của FAP phản ứng)
submitForm(doc: Document, selector: string): boolean // bấm nút gửi gốc đúng một lần (cờ trên tài liệu); trả false nếu đã bấm hoặc thiếu; KHÔNG gọi form.submit()
FormView({ form, onChange, onSubmit, submitting })  // dựng ô theo `fields`, hiển thị `error` của FAP và chặn nút khi ô bắt buộc trống
```

- [ ] **Step 1: Viết test thất bại** (fixtures `application-create`, `wishlist-register`, `cross-class-change-create`, `startup-group-add`, `student-profile`): `readForm` liệt kê đúng ô (tên, nhãn, bắt buộc, lựa chọn của `select`); trang có `input[type=file]` cho `unsupported: true`; `setFieldValue` đổi giá trị ô gốc và các bộ lắng nghe `input`, `change` gắn trước đó đều chạy; `submitForm` bấm nút gốc đúng một lần dù gọi hai lần và không gọi `form.submit` (kiểm bằng spy); `FormView`: ô bắt buộc trống thì nút gửi vô hiệu; sửa ô gọi `onChange`; thông báo lỗi của FAP (phần tử `[data-valmsg-for]` có chữ) hiển thị ngay dưới ô; bấm "Gửi" khi hợp lệ gọi `onSubmit` một lần.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS. **Step 5: Commit** `feat(ui): drive the original FAP forms from the new interface`

---

### Task 13: Trang tạo mới (gửi đơn, đăng ký chờ lớp, đổi lớp chéo, nhóm khởi nghiệp)

**Files:** Create `ui/src/pages/{ApplicationCreate,WishlistRegister,CrossClassChangeCreate,StartupGroupAdd}.tsx`; Modify registry, routes (kind `form`); Test `ui/src/pages/forms.test.tsx`.

- [ ] **Step 1: Viết test thất bại:** mỗi trang đọc biểu mẫu từ fixture tương ứng và hiển thị đủ ô; `unsupported` thì dựng khung bao; đổi ô ghi vào ô gốc; bấm "Gửi" bấm nút gửi gốc một lần (kiểm bằng bộ lắng nghe trên nút gốc, chặn gửi thật); trước khi gửi hiển thị hộp xác nhận tóm tắt giá trị với trang gửi đơn và đổi lớp (thao tác có hậu quả); người dùng bấm "Hủy" thì không gửi; không có bước nào tự gửi khi chỉ mở trang.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS. **Step 5:** Chụp ảnh. **Step 6: Commit** `feat(ui): create pages for applications, wishlist, class change and startup groups`

---

### Task 14: Sửa hồ sơ sinh viên

**Files:** Create `ui/src/pages/StudentProfileEdit.tsx`; Modify registry, routes (kind `form`); Test `ui/src/pages/profile-edit.test.tsx`.

- [ ] **Step 1: Viết test thất bại** (`student-profile`): hiển thị các ô theo nhóm; ô chỉ đọc của FAP (thuộc tính `readonly` hoặc `disabled`) hiển thị khóa và không ghi được; ô có ảnh đại diện (file) thì cả trang rơi về khung bao; gửi đúng một lần qua nút gốc; giá trị cá nhân không xuất hiện trong `console` (spy `console.log`, `warn`, `error` không nhận giá trị ô nào).
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS. **Step 5: Commit** `feat(ui): student profile editing`

---

### Task 15: Đăng nhập

**Files:**
- Create: `lib/fap-readers-login.js`, `ui/src/pages/Login.tsx`, `ui/src/login/loginActions.ts`
- Modify: `ui/src/boot.tsx` (nhánh `auth`), `lib/fap-ui-early.css`, `lib/fap-routes.js`
- Test: `tests/fap-readers-login.test.js`, `ui/src/login/loginActions.test.ts`, `ui/src/pages/Login.test.tsx`, `tests/fap-ui-early.test.js`

**Interfaces:**
```js
readLogin(doc): { title: string; subtitle: string; tabs: Array<{ id: "staff" | "parent"; label: string }>; staff: { intro: string; google: boolean; feid: boolean } | null; parent: { intro: string; hasForm: boolean; errors: string[] } | null; googleLabel?: string; feidLabel?: string } | null
```
```ts
clickGoogle(doc: Document): boolean;     // kích hoạt liên kết gốc #login-google-link (FAP gán đích thật cho nó)
clickFeid(doc: Document): boolean;       // #login-feid-link
adoptParentFields(doc: Document, host: HTMLElement): { restore(): void } | null; // đưa ô Username và Password GỐC vào khe "login-username", "login-password" của host (DOM thường, giữ thuộc tính form="frm-parent-login" để vẫn gửi cùng biểu mẫu); không đọc giá trị
submitParent(doc: Document): boolean;   // bấm nút gửi gốc của #frm-parent-login một lần
```
Bố cục `Login` (không có sidebar): logo (`BrandLogo`), tiêu đề và mô tả lấy từ FAP, hai tab (Cán bộ và Sinh viên, Phụ huynh) điều khiển tab gốc để FAP vẫn nhớ lựa chọn (khóa `fap.login.activeTab`), nút Google và FeID, biểu mẫu phụ huynh chứa **các khe** cho hai ô gốc và nút "Đăng nhập" gọi `submitParent`; lỗi của FAP hiển thị trong vùng cảnh báo; hiển thị hướng dẫn reCAPTCHA nếu có. Trang đăng nhập không dùng `AppShell`. `lib/fap-ui-early.css` ẩn khối đăng nhập gốc (`.account-pages`, `.login-auth-backdrop`, và phần tử chứa nếu có) khi `data-fptu-ui="pending"` hoặc `"active"` cho route `auth`, **trừ** các ô được đưa vào khe.

- [ ] **Step 1: Viết test thất bại** (`auth-login`, và bản lưu đầy đủ ở `page-fap/` chỉ để người xây tự kiểm, không commit): `readLogin` nhận ra hai tab, liên kết Google và FeID, biểu mẫu phụ huynh và các thông báo lỗi; `adoptParentFields` đưa đúng hai node ô gốc (cùng tham chiếu) vào khe, giữ `form="frm-parent-login"`, `restore()` trả về chỗ cũ, và **không đọc `value`** (spy trên getter của `value` không bị gọi); `clickGoogle` và `clickFeid` bấm liên kết gốc đúng một lần; `submitParent` bấm nút gửi gốc một lần và chặn lần hai; tab đổi thì bấm nút tab gốc; `Login` có các khe `login-username`, `login-password` và không có chuỗi `password` hay giá trị nào trong `console`; thiếu biểu mẫu gốc thì `Login` chỉ hiển thị phần Google và FeID; `readLogin` trả `null` (khung bao đăng nhập: giữ trang FAP gốc) khi không nhận ra cấu trúc; `/Auth/Logout`, `/Auth/GoogleLogin` và các trang nhận chuyển hướng OAuth không bao giờ mount.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** `node --test tests/*.test.js` và `cd ui && npm test`; PASS.
- [ ] **Step 5: Kiểm tra bằng trình duyệt thật (người xây làm nếu có, nếu không ghi vào Task 17):** mở `/Auth/Login`, xác nhận trình quản lý mật khẩu điền được vào hai ô, reCAPTCHA hiện đúng, đăng nhập phụ huynh gửi được, nút Google và FeID đi đúng.
- [ ] **Step 6: Commit** `feat(ui): login page`

---

### Task 16: Nhất quán toàn bộ và tài liệu

**Files:** Modify `ui/src/data/nav.ts`, `ui/src/lib/search.ts` (mục tìm kiếm), `lib/fap-routes.js`, `DESIGN.md` (qua script), `ui/README.md`; Test `tests/fap-routes-coverage.test.js`, `ui/src/pages/coverage.test.ts`.

- [ ] **Step 1: Viết test thất bại:** mỗi mục trong `tests/fixtures/pages/index.json` có kết quả `matchRoute` khác `null`; mỗi route `native` hoặc `form` có reader và có `PageDefinition` trong registry; mỗi `navHref` trong `NAV_GROUPS` ánh xạ tới route có kiểu xác định (không còn route chỉ có tên); mỗi route `native` có ít nhất một test reader dùng fixture của chính nó; bảng route không có hai route trùng mẫu; `/ShoppingCart` và `/CoursePendingPayment` vẫn là `wrapped`.
- [ ] **Step 2:** FAIL. **Step 3:** Sửa những chỗ thiếu; cập nhật `ui/README.md` (cách thêm một trang: fixture, reader, component, registry, route, nav). **Step 4:** `node --test tests/*.test.js` và `cd ui && npm test && npm run parity`; PASS. **Step 5: Commit** `test: every FAP page has a defined route and a handler`

---

### Task 17: Kiểm tra thủ công (người dùng thực hiện)

- [ ] Duyệt từng mục sidebar: không còn trang nào hiện giao diện FAP cũ hoàn toàn; trang chưa dựng hiện trong khung mới.
- [ ] Báo cáo điểm danh, điểm, bảng điểm: số liệu khớp trang gốc (so bằng cách tắt công tắc giao diện mới); đổi học kỳ hoặc môn hoạt động.
- [ ] Môn học, khung chương trình, chứng chỉ, giao dịch, tài liệu, chi tiết tin và tài liệu: đủ dữ liệu, liên kết đúng.
- [ ] Gửi một đơn thật (loại đơn đơn giản): xác nhận hiện đúng giá trị, FAP nhận đơn, không gửi hai lần; thử bỏ trống ô bắt buộc.
- [ ] Đăng ký chờ lớp, đổi lớp chéo, nhóm khởi nghiệp, sửa hồ sơ: tương tự.
- [ ] Thanh toán (Thanh toán các khoản phải nộp): mở được, mã QR quét được bằng ứng dụng ngân hàng, nút thanh toán hoạt động.
- [ ] Khảo sát (feedback): tự điền vẫn chạy và **không** tự gửi; nút gửi gốc bấm được.
- [ ] Đăng nhập: mở trang trong cửa sổ ẩn danh; Google và FeID đi đúng; tài khoản phụ huynh đăng nhập được; trình quản lý mật khẩu của trình duyệt điền được; sai mật khẩu hiện lỗi của FAP.
- [ ] Tắt công tắc giao diện mới (popup hoặc sidebar): mọi trang trở về như cũ, không mất ô nhập hay nút nào; bật lại thì dựng lại.
- [ ] Chế độ tối, màu nhấn và tiếng Anh vẫn đúng ở các trang mới.
- [ ] Báo thời gian mở trang có chậm hơn trước không (vì giao diện nạp trên mọi trang FAP).
