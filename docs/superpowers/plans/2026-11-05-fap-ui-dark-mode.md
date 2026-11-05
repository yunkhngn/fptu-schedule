# FAP UI: chế độ tối Implementation Plan

> **Đã được thay thế** bởi `docs/superpowers/plans/2026-11-05-fap-ui-theme-and-accent.md` (plan gộp chế độ tối và màu nhấn). Không chạy plan này riêng nữa.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giao diện FAP React có chế độ tối theo lựa chọn Tự động/Sáng/Tối của extension, đổi ngay trên mọi tab, chế độ sáng không đổi.

**Architecture:** Token tối nằm trong `:host([data-theme="dark"])` của `tokens.css`. Một module `ui/src/theme/` đọc khóa `theme` trong `chrome.storage.local`, quyết định chế độ bằng `resolveEffectiveTheme` của `lib/theme.js`, đặt `data-theme` lên host trước khi mount và theo dõi thay đổi (storage và `prefers-color-scheme`).

**Tech Stack:** TypeScript/React, Tailwind 4, Vitest; `lib/theme.js` (vanilla UMD).

**Spec:** `docs/superpowers/specs/2026-11-05-fap-ui-dark-mode-design.md`.

**Chạy sau khi plan chính (`2026-11-05-fap-react-ui.md`) xong.** Plan màu nhấn (`2026-11-05-fap-ui-accent-sync.md`) có thể chạy trước hoặc sau; Task 6 chỉ làm khi plan đó đã chạy. Không sửa file plan khác.

## Global Constraints

- Khối token sáng (`:host { ... }`) giữ nguyên giá trị so với `ui/reference/lovable-styles.css`; ảnh chụp đối chiếu chế độ sáng (`npm run parity`) vẫn đạt: Tổng quan 1.55%, Thời khóa biểu 3.02%, Lịch thi 0.99%, Tin tức 1.06% (không được xấu đi quá 0.5 điểm phần trăm mỗi trang).
- Giá trị lạ hoặc thiếu của khóa `theme` được coi là `"auto"`.
- `lib/theme.js` giữ UMD (không sửa trừ khi test chứng minh cần); popup vanilla JS.
- Không emoji trong UI; icon dùng lucide-react.
- `node --test tests/*.test.js` và `cd ui && npm test` pass 100%.
- Không phát hành, không đổi phiên bản khi chưa có lệnh của người dùng.

## Review Focus

1. Nhấp nháy sáng rồi tối khi mở trang ở chế độ tối (Task 4).
2. "Tự động" đổi theo hệ thống ngay khi hệ thống đổi, không cần tải lại (Task 1, 4).
3. Giá trị `theme` hỏng (`null`, số, chuỗi lạ) cho ra chế độ theo hệ thống, không lỗi (Task 1).
4. Chữ không đạt tương phản ở chế độ tối: `muted-foreground`, `primary-strong`, chữ trên nền `success/warning/danger` nhạt (Task 2).
5. Vùng nào vẫn sáng ở chế độ tối vì màu cứng (`glass`, thanh cuộn) (Task 3).
6. Bật tắt giao diện mới nhiều lần không nhân đôi listener chế độ tối (Task 4).
7. Chế độ sáng không đổi so với hiện nay (Task 2, 7).

---

### Task 1: Quyết định và theo dõi chế độ

**Files:**
- Create: `ui/src/theme/theme.ts`
- Modify: `ui/vite.config.ts` (alias `@lib` trỏ tới `../lib` nếu không nhập trực tiếp được UMD)
- Test: `ui/src/theme/theme.test.ts`

**Interfaces:**
- Consumes: `resolveEffectiveTheme(saved, systemPrefersDark)` và `THEME_VALUES` từ `lib/theme.js`.
- Produces:
```ts
export type ThemePreference = "auto" | "light" | "dark";
export type EffectiveTheme = "light" | "dark";
export function normalizePreference(value: unknown): ThemePreference; // lạ thì "auto"
export function readThemePreference(chromeApi: typeof chrome | undefined, timeoutMs?: number): Promise<ThemePreference>; // mặc định 300
export function resolveTheme(pref: ThemePreference, win: Window): EffectiveTheme;
export function applyTheme(host: HTMLElement, theme: EffectiveTheme): void; // đặt data-theme
export function watchTheme(host: HTMLElement, chromeApi: typeof chrome | undefined, win: Window, initial: ThemePreference): { stop(): void };
```

- [ ] **Step 1: Viết test thất bại** (`theme.test.ts`, chrome giả có `storage.local.get` và `storage.onChanged`; `matchMedia` giả có `matches` và `addEventListener("change")`):
  - `normalizePreference("dark") === "dark"`; `normalizePreference(undefined)`, `("nope")`, `(42)`, `(null)` đều bằng `"auto"`.
  - `readThemePreference` trả `"dark"` khi storage có `{ theme: "dark" }`; trả `"auto"` khi thiếu khóa, khi `chromeApi` là `undefined`, hoặc khi `get` không bao giờ gọi lại (fake timers quá 300 ms).
  - `resolveTheme("auto", win)` trả `"dark"` khi `matchMedia(...).matches` là `true`, `"light"` khi `false`; `resolveTheme("light", winDark)` luôn `"light"`; `resolveTheme("dark", winLight)` luôn `"dark"`.
  - `applyTheme(host, "dark")` đặt `data-theme="dark"`; gọi lại với `"light"` đổi thành `"light"`.
  - `watchTheme` với `initial = "auto"`: phát `change` của `matchMedia` (matches chuyển sang `true`) thì host đổi sang `"dark"`; sau khi `onChanged` báo `{ theme: { newValue: "light" } }` ở vùng `"local"` thì host thành `"light"` và `change` của `matchMedia` không còn làm host đổi; vùng `"sync"` hoặc khóa khác thì không đổi; `stop()` gỡ cả hai listener (chịu được `removeListener` không tồn tại).
- [ ] **Step 2:** `cd ui && npx vitest run src/theme/theme.test.ts`; FAIL.
- [ ] **Step 3:** Cài đặt các hàm trên; `resolveTheme` dùng `resolveEffectiveTheme` của `lib/theme.js`.
- [ ] **Step 4:** PASS. **Step 5: Commit** `feat(ui): resolve and follow the extension theme preference`

---

### Task 2: Bảng màu tối và kiểm tra tương phản

**Files:**
- Create: `ui/src/design/color.ts` (nếu chưa có do plan màu nhấn: dùng lại), `ui/src/design/dark-tokens.test.ts`
- Modify: `ui/src/design/tokens.css`

**Interfaces:**
- Produces: `oklchToSrgb(l: number, c: number, h: number): [number, number, number]` (0 đến 255), `contrastRatio(a: [number,number,number], b: [number,number,number]): number`, `parseOklch(css: string): { l: number; c: number; h: number }`; khối `:host([data-theme="dark"])` trong `tokens.css`.

- [ ] **Step 1: Viết test thất bại** (`dark-tokens.test.ts`, đọc `tokens.css`, gom biến custom property của khối `:host { ... }` sáng và của khối tối):
  - Tập tên biến **màu, bóng, gradient** của khối tối bằng tập tên của khối sáng (mọi `--background`, `--foreground`, `--surface*`, `--card*`, `--popover*`, `--primary*`, `--secondary*`, `--muted*`, `--accent*`, `--destructive*`, `--success*`, `--warning*`, `--danger*`, `--border`, `--input`, `--ring`, `--chart-*`, `--sidebar*`, `--ink*`, `--gradient-*`, `--shadow-*`). Biến hình học (`--radius`) và font không cần lặp.
  - Tương phản (WCAG) của khối tối, tính trên giá trị oklch đã đổi sang sRGB: `foreground` trên `background` và trên `surface` ≥ 7; `muted-foreground` trên `surface` ≥ 4.5; `primary-strong` trên `surface` và trên `primary-soft` ≥ 4.5; `ink-foreground` trên `ink` ≥ 4.5; với mỗi bộ `success`, `warning`, `danger`: `*-strong` trên `*-soft` ≥ 4.5; `border` trên `background` ≥ 1.15 (nhìn thấy được).
  - Khối sáng không đổi: các giá trị của khối `:host { ... }` bằng `ui/reference/lovable-styles.css` (test so khớp token hiện có vẫn pass).
  - `oklchToSrgb(1, 0, 0)` gần `[255,255,255]` và `oklchToSrgb(0, 0, 0)` gần `[0,0,0]`; `contrastRatio([0,0,0],[255,255,255])` bằng 21 (sai số 0.01).
- [ ] **Step 2:** `cd ui && npx vitest run src/design`; FAIL.
- [ ] **Step 3:** Viết `color.ts`; thêm khối tối vào `tokens.css` theo bảng đề xuất của spec mục 4 (giá trị khởi đầu), thêm `color-scheme: dark`; chỉnh giá trị cho tới khi mọi kiểm tra tương phản đạt.
- [ ] **Step 4:** `cd ui && npm test`; PASS. **Step 5: Commit** `feat(ui): dark colour tokens with contrast checks`

---

### Task 3: Bỏ màu cứng trong tokens.css

**Files:**
- Modify: `ui/src/design/tokens.css`
- Test: `ui/src/design/dark-tokens.test.ts` (thêm ca)

**Interfaces:**
- Produces: token `--glass` và `--scrollbar` trong cả khối sáng (giá trị bằng giá trị cứng hiện tại: `oklch(1 0 0 / 0.72)` và `oklch(0.88 0.015 280)`) và khối tối; tiện ích `glass` và `scrollbar-thin` dùng token.

- [ ] **Step 1: Viết test thất bại:** trong `tokens.css`, các khối `@utility glass` và `@utility scrollbar-thin` không chứa chuỗi `oklch(` mà dùng `var(--glass)` và `var(--scrollbar)`; cả hai khối `:host` định nghĩa `--glass` và `--scrollbar`; giá trị sáng của hai token bằng hằng số ghi ở trên.
- [ ] **Step 2:** FAIL. **Step 3:** Sửa `tokens.css`.
- [ ] **Step 4:** `cd ui && npm test && npm run parity`; PASS và tỷ lệ lệch từng trang không xấu đi quá 0.5 điểm phần trăm so với các giá trị trong Global Constraints.
- [ ] **Step 5: Commit** `refactor(ui): move the hard-coded glass and scrollbar colours into tokens`

---

### Task 4: Áp dụng khi chạy

**Files:**
- Modify: `ui/src/boot.tsx`
- Test: `ui/src/boot.test.tsx` (thêm ca; dùng bộ giả `makeChrome` đã có, tách ra `ui/src/test/chrome.ts` nếu cần dùng lại)

**Interfaces:**
- Consumes: `readThemePreference`, `resolveTheme`, `applyTheme`, `watchTheme` (Task 1); `giveBack` trong `bootInner`.
- Produces: trong `bootInner`, sau khi có `pageData` và trước `mountShadow`: `const pref = await readThemePreference(chromeApi)`; ngay sau `mountShadow`: `applyTheme(host, resolveTheme(pref, win))` và `const stopTheme = watchTheme(host, chromeApi, win, pref).stop`, gọi `stopTheme()` trong `giveBack` (mỗi lần dựng lại giao diện phải gỡ listener của lần trước).

- [ ] **Step 1: Viết test thất bại:**
  - Storage có `{ theme: "dark" }`: sau `boot`, host có `data-theme="dark"` ngay (trước mọi cập nhật sau đó).
  - Storage không có `theme` và `matchMedia` giả báo tối: host có `data-theme="dark"`; báo sáng: `"light"`.
  - Sau mount, `makeChrome` phát `{ theme: { newValue: "light" } }`: host đổi thành `"light"` mà không dựng lại giao diện.
  - Bật tắt công tắc `fapUiEnabled` ba lần rồi phát đổi `theme` một lần: `data-theme` đổi đúng một lần và số listener `theme` đang hoạt động bằng 1.
  - `chromeApi` là `undefined`: vẫn mount, `data-theme` theo `matchMedia`.
- [ ] **Step 2:** `cd ui && npx vitest run src/boot.test.tsx`; FAIL. **Step 3:** Cài đặt. **Step 4:** `cd ui && npm test`; PASS.
- [ ] **Step 5: Commit** `feat(ui): apply and follow the dark theme in the FAP interface`

---

### Task 5: Nút đổi chế độ trên thanh trên

**Files:**
- Create: `ui/src/components/molecules/ThemeToggle.tsx`
- Modify: `ui/src/components/molecules/index.ts`, `ui/src/components/organisms/TopNavigation.tsx`, `ui/src/components/templates/AppShell.tsx`, `ui/src/boot.tsx`
- Test: `ui/src/components/molecules/molecules.test.tsx`, `ui/src/components/organisms/organisms.test.tsx`

**Interfaces:**
- Produces: `ThemeToggle({ preference: ThemePreference; onChange(next: ThemePreference): void })` hiển thị icon Sun, Moon hoặc Monitor (lucide) theo `preference`, `aria-label` bằng `getThemeLabel(preference)` của `lib/theme.js`, bấm thì gọi `onChange(getNextTheme(preference))`. `AppShell` nhận thêm `themePreference?: ThemePreference` và `onThemeChange?: (next: ThemePreference) => void`; không truyền thì không hiện nút. `boot.tsx` truyền giá trị `pref` hiện tại và `onThemeChange` ghi `chrome.storage.local.set({ theme: next })` (cùng khóa popup dùng).

- [ ] **Step 1: Viết test thất bại:** `ThemeToggle` với `preference="auto"` có `aria-label` "Giao diện: Tự động (theo hệ thống)" và icon Monitor; bấm gọi `onChange("light")`; `preference="light"` bấm gọi `onChange("dark")`; `"dark"` bấm gọi `onChange("auto")`. `AppShell` không có `onThemeChange` thì không có nút này; có thì nút nằm trong thanh trên. Trong `boot.test.tsx`: bấm nút ghi `{ theme: "light" }` vào storage giả.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** `cd ui && npm test && npm run parity`; PASS (đối chiếu sáng không xấu đi quá 0.5 điểm vì harness không truyền `onThemeChange`).
- [ ] **Step 5: Commit** `feat(ui): theme toggle in the top bar`

---

### Task 6: Màu nhấn ở chế độ tối (chỉ khi plan màu nhấn đã chạy)

**Files:**
- Modify: `ui/src/accent/palette.ts`, `ui/src/accent/apply.ts`, `ui/src/boot.tsx`
- Test: `ui/src/accent/palette.test.ts`

**Interfaces:**
- Produces: `accentVarsFor(id: string | null | undefined, theme?: "light" | "dark"): Record<string, string>` (mặc định `"light"`, hành vi cũ không đổi). Ở `"dark"`: lấy giá trị L, chroma gốc từ khối token **tối**, hue và chroma theo màu `dark` của preset. `watchAccent` áp lại bảng màu khi chế độ đổi.

- [ ] **Step 1: Viết test thất bại:** `accentVarsFor("orange", "dark")["--primary"]` có hue trong ±3 độ quanh hue của `hexToOklch(preset.dark)` và độ sáng L bằng L của `--primary` trong khối tối; `accentVarsFor(undefined, "dark")` vẫn là `{}`; với mọi preset, `--primary-strong` đạt ≥ 4.5 trên `surface` tối và trên `primary-soft` tối; khi `data-theme` đổi từ sáng sang tối thì `--primary` trên host đổi theo.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** `cd ui && npm test`; PASS. **Step 5: Commit** `feat(ui): accent colours for the dark theme`

*(Nếu plan màu nhấn chưa chạy, bỏ qua task này và ghi vào mô tả commit cuối: "accent in dark pending". Khi plan màu nhấn chạy sau, người xây nó phải làm bước này.)*

---

### Task 7: Tài liệu thiết kế và ảnh chụp để người dùng duyệt

**Files:**
- Modify: `ui/scripts/gen-design-md.mjs`, `DESIGN.md`, `ui/parity/harness.html`, `ui/scripts/parity.mjs`
- Test: `ui/src/design/tokens.test.ts` (thêm ca)

- [ ] **Step 1: Viết test thất bại:** `DESIGN.md` (sinh lại từ script) có mục "Chế độ tối" liệt kê bảng màu tối (tên token, giá trị oklch, tỷ lệ tương phản chính đã tính), nguồn lựa chọn (`theme` trong `chrome.storage.local`), và quy tắc "Tự động theo hệ thống".
- [ ] **Step 2:** FAIL. **Step 3:** Thêm mục vào script rồi chạy lại để cập nhật `DESIGN.md`. Thêm tham số `?theme=dark` cho `harness.html` (gọi `applyTheme` trên host) và `npm run parity -- --theme=dark`: chỉ chụp 4 trang vào `ui/parity/out/dark-<trang>.png` (không so với ảnh chuẩn).
- [ ] **Step 4:** `cd ui && npm test && npm run parity`; PASS (sáng không đổi). Chạy `npm run parity -- --theme=dark`.
- [ ] **Step 5: Commit** `docs(ui): document the dark palette and add dark screenshots`
- [ ] **Step 6: Dừng và gửi 4 ảnh `dark-*.png` cho người dùng duyệt** (cổng duyệt của spec mục 6). Ghi lại phản hồi; nếu người dùng muốn chỉnh màu, quay lại Task 2 (chỉ đổi giá trị token, chạy lại kiểm tra tương phản).

---

### Task 8: Kiểm tra thủ công (người dùng thực hiện)

- [ ] Popup đặt Tối: mở Tổng quan, Thời khóa biểu, Lịch thi, Tin tức; giao diện tối ngay, không nhấp nháy sáng.
- [ ] Popup đặt Tự động: đổi chế độ hệ thống (macOS: Cài đặt, Giao diện); tab FAP đang mở đổi theo không cần tải lại.
- [ ] Bấm nút đổi chế độ ở thanh trên: quay vòng Tự động, Sáng, Tối; popup cũng cho thấy giá trị mới.
- [ ] Đọc thử các vùng nhiều chữ (tin tức, bảng lịch, thẻ thông tin): chữ nhạt vẫn đọc được; thẻ phân biệt với nền.
- [ ] Chế độ Sáng trông như trước.
- [ ] Tắt giao diện mới rồi bật lại ở chế độ Tối: vẫn đúng chế độ, không nhân đôi nút nổi hay listener.
