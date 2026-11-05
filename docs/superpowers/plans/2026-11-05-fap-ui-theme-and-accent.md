# FAP UI: chế độ tối và màu nhấn (plan gộp) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giao diện FAP React theo lựa chọn Tự động/Sáng/Tối và màu nhấn của extension, đổi ngay trên mọi tab, kể cả tổ hợp tối với màu nhấn; chế độ sáng mặc định (lavender) không đổi một pixel.

**Architecture:** Một bộ điều khiển chung `ui/src/appearance/` đọc hai khóa `theme` và `accentColor` bằng **một** lần đọc `chrome.storage.local`, nghe **một** listener (cộng `prefers-color-scheme`), rồi tính và đặt lên host Shadow DOM thuộc tính `data-theme` cùng các biến màu nhấn suy ra từ chế độ hiện tại. Token tối nằm trong `:host([data-theme="dark"])` của `tokens.css`.

**Tech Stack:** TypeScript/React, Tailwind 4, Vitest; `lib/accent.js` và `lib/theme.js` (vanilla UMD).

**Spec:** `docs/superpowers/specs/2026-11-05-fap-ui-accent-sync-design.md` và `docs/superpowers/specs/2026-11-05-fap-ui-dark-mode-design.md`. **Plan này thay thế** `2026-11-05-fap-ui-accent-sync.md` và `2026-11-05-fap-ui-dark-mode.md` (không chạy hai plan đó riêng nữa).

**Chạy sau khi plan chính (`2026-11-05-fap-react-ui.md`) xong** (đã xong).

## Global Constraints

- Mặc định (chưa chọn màu nhấn hoặc chọn `lavender`) ở chế độ sáng: không đặt biến màu nhấn nào, giao diện giữ token Lovable; ảnh chụp đối chiếu sáng (`npm run parity`) không xấu đi quá 0.5 điểm phần trăm mỗi trang so với: Tổng quan 1.55%, Thời khóa biểu 3.02%, Lịch thi 0.99%, Tin tức 1.06%.
- Giá trị lạ hoặc thiếu của `theme` được coi là `"auto"`; của `accentColor` được coi là mặc định (lavender).
- Khối token sáng giữ nguyên giá trị so với `ui/reference/lovable-styles.css`.
- `lib/accent.js` và `lib/theme.js` giữ UMD; popup vanilla JS. Một nguồn duy nhất cho danh sách preset và logic chế độ (không chép lại trong `ui/`).
- Đổi màu chỉ qua biến CSS và thuộc tính trên host; không viết lại component (trừ nút đổi chế độ).
- Không emoji trong UI. Không phát hành, không đổi phiên bản khi chưa có lệnh của người dùng.
- `node --test tests/*.test.js` và `cd ui && npm test` pass 100%.

## Review Focus

1. Nhấp nháy (sáng rồi tối, hoặc lavender rồi màu đã chọn) khi mở trang: chỉ một lần đọc storage, chờ tối đa 300 ms (Task 4).
2. Giá trị `theme` hoặc `accentColor` hỏng không làm lỗi (Task 1, 4).
3. Đổi chế độ khi đang chọn màu nhấn: màu nhấn được tính lại theo chế độ mới (Task 4).
4. Chữ không đạt tương phản ở chế độ tối, kể cả với màu nhấn ít bão hòa (xám than) và rất bão hòa (cam, hồng) (Task 2, 4).
5. Bật tắt giao diện mới nhiều lần không nhân đôi listener (Task 4).
6. Chế độ sáng mặc định không đổi (Task 3, 5, 6).

---

### Task 0: Đưa phần màu nhấn đã làm vào main

Nhánh `fap-ui-accent-sync` đã có phần màu nhấn hoàn chỉnh và có test: preset lavender trong `lib/accent.js`, popup chép `accentColor` sang `chrome.storage`, `ui/src/accent/palette.ts` (`accentVarsFor`, `hexToOklch`, `oklchToRgb`, `contrastRatio`), `ui/src/accent/apply.ts` (`readAccent`, `applyAccent`, `watchAccent`), tài liệu và `?accent=` của harness.

- [ ] **Step 1:** Trên `main`, chạy `git merge fap-ui-accent-sync` (commit tài liệu chế độ tối nằm ở cả hai nhánh với nội dung giống hệt nên không xung đột). Nếu có xung đột ngoài ý muốn, dừng và báo.
- [ ] **Step 2:** `node --test tests/*.test.js` và `cd ui && npm test && npm run parity`; mong đợi PASS và đối chiếu sáng như Global Constraints.
- [ ] **Step 3:** Không cần commit thêm (merge đã tạo commit).

---

### Task 1: Quyết định chế độ

**Files:**
- Create: `ui/src/theme/theme.ts`
- Test: `ui/src/theme/theme.test.ts`

**Interfaces:**
- Consumes: `resolveEffectiveTheme`, `THEME_VALUES` từ `lib/theme.js` (nhập qua alias `@lib` đã có trong `vite.config.ts` từ Task 0).
- Produces:
```ts
export type ThemePreference = "auto" | "light" | "dark";
export type EffectiveTheme = "light" | "dark";
export function normalizePreference(value: unknown): ThemePreference; // lạ thì "auto"
export function resolveTheme(pref: ThemePreference, win: Window): EffectiveTheme; // auto theo matchMedia
```

- [ ] **Step 1: Viết test thất bại:** `normalizePreference("dark") === "dark"`; `(undefined)`, `("nope")`, `(42)`, `(null)` đều `"auto"`. `resolveTheme("auto", win)` trả `"dark"` khi `matchMedia("(prefers-color-scheme: dark)").matches` là `true`, `"light"` khi `false`; `resolveTheme("light", winDark)` luôn `"light"`; `resolveTheme("dark", winLight)` luôn `"dark"`; `win` không có `matchMedia` thì `"auto"` ra `"light"`.
- [ ] **Step 2:** `cd ui && npx vitest run src/theme/theme.test.ts`; FAIL. **Step 3:** Cài đặt. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(ui): resolve the extension theme preference`

---

### Task 2: Màu dùng chung, bảng màu tối và kiểm tra tương phản

**Files:**
- Create: `ui/src/design/color.ts`, `ui/src/design/dark-tokens.test.ts`
- Modify: `ui/src/accent/palette.ts` (nhập các hàm màu từ `color.ts` và xuất lại tên cũ để test hiện có không đổi), `ui/src/design/tokens.css`

**Interfaces:**
- Produces: `ui/src/design/color.ts` xuất `OklchColor`, `hexToOklch`, `oklchToRgb`, `relativeLuminance`, `contrastRatio` (chuyển nguyên từ `palette.ts`, giữ chữ ký hiện tại) và `parseOklch(css: string): OklchColor`; khối `:host([data-theme="dark"])` trong `tokens.css` theo bảng đề xuất của spec chế độ tối mục 4 (giá trị khởi đầu).

- [ ] **Step 1: Viết test thất bại** (`dark-tokens.test.ts`, đọc `tokens.css`, gom biến của khối `:host { ... }` sáng và khối tối):
  - Tập tên biến **màu, bóng, gradient** của khối tối bằng tập tên của khối sáng (mọi `--background`, `--foreground`, `--surface*`, `--card*`, `--popover*`, `--primary*`, `--secondary*`, `--muted*`, `--accent*`, `--destructive*`, `--success*`, `--warning*`, `--danger*`, `--border`, `--input`, `--ring`, `--chart-*`, `--sidebar*`, `--ink*`, `--gradient-*`, `--shadow-*`); `--radius` và font không cần lặp.
  - Tương phản WCAG của khối tối (giá trị oklch đổi sang sRGB bằng `color.ts`): `foreground` trên `background` và trên `surface` ≥ 7; `muted-foreground` trên `surface` ≥ 4.5; `primary-strong` trên `surface` và trên `primary-soft` ≥ 4.5; `ink-foreground` trên `ink` ≥ 4.5; với mỗi bộ `success`, `warning`, `danger`: `*-strong` trên `*-soft` ≥ 4.5; `border` trên `background` ≥ 1.15.
  - Khối sáng không đổi so với `ui/reference/lovable-styles.css` (test token hiện có vẫn pass).
  - `contrastRatio` và các hàm màu vẫn xuất được từ `ui/src/accent/palette.ts` (test cũ của palette không phải sửa).
- [ ] **Step 2:** `cd ui && npx vitest run src/design src/accent`; FAIL.
- [ ] **Step 3:** Tách `color.ts`, thêm khối tối (kèm `color-scheme: dark`), chỉnh giá trị cho tới khi mọi kiểm tra đạt.
- [ ] **Step 4:** `cd ui && npm test`; PASS. **Step 5: Commit** `feat(ui): dark colour tokens with contrast checks`

---

### Task 3: Bỏ màu cứng trong tokens.css

**Files:**
- Modify: `ui/src/design/tokens.css`
- Test: `ui/src/design/dark-tokens.test.ts` (thêm ca)

**Interfaces:**
- Produces: token `--glass` và `--scrollbar` ở cả khối sáng (bằng hằng số hiện tại: `oklch(1 0 0 / 0.72)` và `oklch(0.88 0.015 280)`) và khối tối; tiện ích `glass` và `scrollbar-thin` dùng token.

- [ ] **Step 1: Viết test thất bại:** khối `@utility glass` và `@utility scrollbar-thin` không chứa chuỗi `oklch(` mà dùng `var(--glass)` và `var(--scrollbar)`; cả hai khối `:host` định nghĩa hai token; giá trị sáng bằng hằng số trên.
- [ ] **Step 2:** FAIL. **Step 3:** Sửa. **Step 4:** `cd ui && npm test && npm run parity`; PASS, sáng không xấu đi quá 0.5 điểm.
- [ ] **Step 5: Commit** `refactor(ui): move the hard-coded glass and scrollbar colours into tokens`

---

### Task 4: Bộ điều khiển giao diện chung (chế độ + màu nhấn)

**Files:**
- Create: `ui/src/appearance/appearance.ts`
- Modify: `ui/src/accent/palette.ts` (`accentVarsFor` nhận chế độ), `ui/src/boot.tsx`; xóa `readAccent`, `applyAccent`, `watchAccent` trong `ui/src/accent/apply.ts` (giữ `applyAccent` nếu harness còn dùng, chuyển sang gọi bộ chung) và các test của chúng chuyển thành test của bộ chung
- Test: `ui/src/appearance/appearance.test.ts`, `ui/src/accent/palette.test.ts` (thêm ca), `ui/src/boot.test.tsx` (sửa và thêm ca; dùng `makeChrome` đã có, tách ra `ui/src/test/chrome.ts` nếu cần dùng lại)

**Interfaces:**
- Consumes: `normalizePreference`, `resolveTheme` (Task 1); `accentVarsFor`, `ACCENT_VARS` (palette); token tối (Task 2).
- Produces:
```ts
export type Appearance = { theme: ThemePreference; accent: string | null };
export function readAppearance(chromeApi: typeof chrome | undefined, timeoutMs?: number): Promise<Appearance>; // một get(["theme","accentColor"]), mặc định 300 ms; lỗi hoặc quá hạn thì { theme: "auto", accent: null }
export function applyAppearance(host: HTMLElement, appearance: Appearance, win: Window): void; // đặt data-theme và các biến ACCENT_VARS
export function watchAppearance(host: HTMLElement, chromeApi: typeof chrome | undefined, win: Window, initial: Appearance): { stop(): void };
// palette.ts
export function accentVarsFor(id: string | null | undefined, theme?: "light" | "dark"): Record<string, string>; // mặc định "light", hành vi cũ không đổi
```
`accentVarsFor(id, "dark")`: giữ độ sáng L và chroma gốc của token **tối**, hue và chroma theo màu `dark` của preset, vẫn kiểm tương phản `--primary-strong` ≥ 4.5 trên `surface` tối và trên `primary-soft` tối (giảm L từng bước 0.02 đến sàn 0.40 giống bản sáng; ở chế độ tối thì tăng L đến trần 0.95).

- [ ] **Step 1: Viết test thất bại:**
  - `palette`: `accentVarsFor(undefined, "dark")` và `("lavender", "dark")` bằng `{}`; `accentVarsFor("orange", "dark")["--primary"]` có hue trong ±3 độ quanh hue của `hexToOklch(preset.dark)` và độ sáng bằng độ sáng `--primary` của khối tối; với mọi preset khác lavender, `--primary-strong` đạt ≥ 4.5 trên `surface` tối và trên `primary-soft` tối; `accentVarsFor("orange")` (không truyền chế độ) bằng kết quả cũ.
  - `readAppearance`: storage có `{ theme: "dark", accentColor: "orange" }` thì trả đúng; thiếu khóa, `chromeApi` là `undefined`, `get` không bao giờ gọi lại (fake timers quá 300 ms) đều trả `{ theme: "auto", accent: null }`; giá trị hỏng (`theme: 42`, `accentColor: {}`) cũng vậy; chỉ gọi `get` đúng một lần.
  - `applyAppearance`: `{ theme: "dark", accent: null }` đặt `data-theme="dark"` và không đặt biến màu nhấn; `{ theme: "dark", accent: "orange" }` đặt `--primary` suy ra từ màu `dark` của cam; `{ theme: "auto", accent: "orange" }` với `matchMedia` báo sáng đặt `data-theme="light"` và `--primary` suy ra từ màu `light`; gọi lại với `accent: null` gỡ mọi biến trong `ACCENT_VARS`.
  - `watchAppearance` (chrome giả có `onChanged`, `matchMedia` giả có `change`): phát `{ theme: { newValue: "light" } }` ở vùng `"local"` thì host đổi `data-theme` và **tính lại** biến màu nhấn theo chế độ mới; phát `{ accentColor: { newValue: "teal" } }` thì đổi biến mà giữ `data-theme`; `change` của `matchMedia` chỉ có tác dụng khi `theme` đang là `"auto"`; vùng `"sync"` hoặc khóa khác thì không đổi; `stop()` gỡ cả listener storage và `matchMedia` (chịu được `removeListener` không tồn tại); chỉ đăng ký **một** listener storage cho cả hai khóa.
  - `boot`: storage `{ theme: "dark", accentColor: "pink" }` thì host có `data-theme="dark"` và `--primary` ngay sau khi mount; storage không trả kịp thì vẫn mount bằng sáng + lavender, không treo; bật tắt `fapUiEnabled` ba lần rồi phát đổi `theme` một lần thì `data-theme` đổi đúng một lần và số listener storage đang hoạt động bằng 1; `chromeApi` là `undefined` vẫn mount với `data-theme` theo `matchMedia`.
- [ ] **Step 2:** `cd ui && npx vitest run src/appearance src/accent src/boot.test.tsx`; FAIL.
- [ ] **Step 3:** Cài đặt. Trong `bootInner`, thay `readAccent`/`applyAccent`/`watchAccent` bằng: `const appearance = await readAppearance(chromeApi)` (sau khi có `pageData`, trước `mountShadow`); `applyAppearance(host, appearance, win)` ngay sau `mountShadow`; `const appearanceWatcher = watchAppearance(host, chromeApi, win, appearance)` và gọi `appearanceWatcher.stop()` trong `giveBack`.
- [ ] **Step 4:** `cd ui && npm test && npm run parity`; PASS, đối chiếu sáng không xấu đi quá 0.5 điểm.
- [ ] **Step 5: Commit** `feat(ui): one appearance controller for the theme and the accent colour`

---

### Task 5: Nút đổi chế độ trên thanh trên

**Files:**
- Create: `ui/src/components/molecules/ThemeToggle.tsx`
- Modify: `ui/src/components/molecules/index.ts`, `ui/src/components/organisms/TopNavigation.tsx`, `ui/src/components/templates/AppShell.tsx`, `ui/src/boot.tsx`
- Test: `ui/src/components/molecules/molecules.test.tsx`, `ui/src/components/organisms/organisms.test.tsx`, `ui/src/boot.test.tsx`

**Interfaces:**
- Produces: `ThemeToggle({ preference: ThemePreference; onChange(next: ThemePreference): void })` hiển thị icon Sun, Moon hoặc Monitor (lucide) theo `preference`, `aria-label` bằng `getThemeLabel(preference)` của `lib/theme.js`, bấm gọi `onChange(getNextTheme(preference))`. `AppShell` nhận thêm `themePreference?: ThemePreference` và `onThemeChange?: (next: ThemePreference) => void`; không truyền thì không hiện nút. `boot.tsx` truyền `appearance.theme` hiện tại và `onThemeChange` ghi `chrome.storage.local.set({ theme: next })` (cùng khóa popup dùng); khi storage đổi, `watchAppearance` cập nhật `data-theme` và `boot` cập nhật `themePreference` để nút hiện đúng icon.

- [ ] **Step 1: Viết test thất bại:** `ThemeToggle` với `"auto"` có `aria-label` "Giao diện: Tự động (theo hệ thống)" và icon Monitor, bấm gọi `onChange("light")`; `"light"` bấm gọi `onChange("dark")`; `"dark"` bấm gọi `onChange("auto")`. `AppShell` không có `onThemeChange` thì không có nút; có thì nút nằm trong thanh trên. `boot.test.tsx`: bấm nút ghi `{ theme: "light" }` vào storage giả và icon đổi theo.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** `cd ui && npm test && npm run parity`; PASS (harness không truyền `onThemeChange` nên đối chiếu sáng không đổi).
- [ ] **Step 5: Commit** `feat(ui): theme toggle in the top bar`

---

### Task 6: Tài liệu thiết kế và ảnh chụp để người dùng duyệt

**Files:**
- Modify: `ui/scripts/gen-design-md.mjs`, `DESIGN.md`, `ui/parity/harness.html`, `ui/scripts/parity.mjs`
- Test: `ui/src/design/tokens.test.ts` (thêm ca)

- [ ] **Step 1: Viết test thất bại:** `DESIGN.md` (sinh lại từ script) có mục "Chế độ tối" (bảng màu tối: tên token, giá trị oklch, tỷ lệ tương phản chính đã tính; nguồn lựa chọn là khóa `theme`; quy tắc "Tự động theo hệ thống") và mục màu nhấn nêu quy tắc suy ra cho cả hai chế độ.
- [ ] **Step 2:** FAIL. **Step 3:** Thêm vào script rồi chạy lại để cập nhật `DESIGN.md`. Thêm tham số `?theme=dark` cho `harness.html` (cùng `?accent=` đã có) và `npm run parity -- --theme=dark [--accent=<id>]`: chụp 4 trang vào `ui/parity/out/` (không so với ảnh chuẩn).
- [ ] **Step 4:** `cd ui && npm test && npm run parity`; PASS (sáng không đổi). Chạy `npm run parity -- --theme=dark` (lavender), rồi `--theme=dark --accent=orange` và `--theme=dark --accent=graphite`, và `--theme=light --accent=orange` (chỉ Tổng quan cho hai tổ hợp sau cũng được).
- [ ] **Step 5: Commit** `docs(ui): document the dark palette and the accent rules for both themes`
- [ ] **Step 6: Dừng và gửi ảnh chế độ tối (4 trang, lavender) cùng ảnh Tổng quan ở tổ hợp tối + cam, tối + xám than, sáng + cam cho người dùng duyệt** (cổng duyệt của spec chế độ tối mục 6). Ghi phản hồi; nếu muốn chỉnh màu, quay lại Task 2 (chỉ đổi giá trị token, chạy lại kiểm tra tương phản).

---

### Task 7: Kiểm tra thủ công (người dùng thực hiện)

- [ ] Popup đặt Tối: mở Tổng quan, Thời khóa biểu, Lịch thi, Tin tức; tối ngay, không nhấp nháy sáng.
- [ ] Popup đặt Tự động: đổi chế độ hệ thống; tab FAP đang mở đổi theo không cần tải lại.
- [ ] Chọn lần lượt Cam, Hồng, Xanh ngọc, Xám than ở cả chế độ Sáng và Tối: tab FAP đang mở đổi ngay, chữ vẫn rõ.
- [ ] Chọn Tím lavender (hoặc chưa chọn gì) ở chế độ Sáng: giống thiết kế Lovable.
- [ ] Nút đổi chế độ ở thanh trên quay vòng Tự động, Sáng, Tối và popup cho thấy giá trị mới.
- [ ] Đóng mở lại tab FAP: lựa chọn giữ nguyên, không nhấp nháy.
- [ ] Tắt giao diện mới rồi bật lại ở chế độ Tối với một màu nhấn: vẫn đúng, không nhân đôi nút nổi hay listener.
- [ ] Điểm lệch đã biết: khi chưa chọn màu, popup tô sáng xanh dương còn FAP là lavender (xem spec màu nhấn mục 7).
