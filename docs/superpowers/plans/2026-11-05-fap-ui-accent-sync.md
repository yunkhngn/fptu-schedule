# FAP UI: đồng bộ màu nhấn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Màu nhấn chọn trong popup đổi bảng màu `primary-*` của giao diện FAP React ngay lập tức, mặc định vẫn là lavender gốc của Lovable.

**Architecture:** Popup chép lựa chọn sang `chrome.storage.local`. Giao diện React đọc giá trị đó trước khi mount, suy ra bảng màu OKLCH từ preset (giữ độ sáng, đổi hue và chroma), đặt biến CSS lên host Shadow DOM và nghe `storage.onChanged`.

**Tech Stack:** Vanilla JS (`lib/accent.js`, `popup.js`), TypeScript/React trong `ui/`, Vitest, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-05-fap-ui-accent-sync-design.md`.

**Chạy sau khi plan chính (`2026-11-05-fap-react-ui.md`) hoàn tất**, vì Task 4 sửa `ui/src/boot.tsx` và dùng `mountShadow` của plan đó. Không sửa file plan chính.

## Global Constraints

- Giao diện chỉ chế độ sáng: dùng màu `light` của preset, bỏ qua `dark`.
- Mặc định (chưa chọn, rỗng, id lạ, hoặc `lavender`): không đặt biến nào, giao diện giữ token Lovable.
- `lib/accent.js` UMD, popup vanilla JS; ngoại lệ build chỉ cho `ui/`.
- Không emoji trong UI. Không phát hành, không đổi phiên bản khi chưa có lệnh của người dùng.
- `node --test tests/*.test.js` và `cd ui && npm test` phải pass 100%; `npm run parity` vẫn dưới 2% ở trạng thái mặc định.

## Review Focus

1. Giá trị `accentColor` hỏng (số, chuỗi lạ, `null`): giao diện lavender, không lỗi (Task 3, 4).
2. `chrome.storage` chậm hoặc không có: sau 300 ms dùng lavender, khi có dữ liệu thì cập nhật, không treo mount (Task 4).
3. Đổi màu trong popup khi tab FAP đang mở: tab đổi ngay không cần tải lại (Task 4).
4. Preset ít bão hòa (xám than) và rất bão hòa (cam, hồng): chữ `--primary-strong` vẫn đạt 4.5:1 trên trắng và trên nền nhạt (Task 3).
5. Chọn `lavender` cho ra giống hệt mặc định (Task 3, 5).
6. Người dùng cũ đã chọn màu trước khi cập nhật: popup chép sang `chrome.storage` khi mở lần đầu (Task 2).

---

### Task 1: Preset `lavender`

**Files:**
- Modify: `lib/accent.js`
- Test: `tests/accent.test.js`

**Interfaces:**
- Produces: `ACCENT_PRESETS` có thêm `{ id: "lavender", label: "Tím lavender", light: "#6d5fd6", dark: "#7c6fe0" }`, đặt sau `violet` (vị trí đầu vẫn là `blue`; `DEFAULT_ACCENT_ID` vẫn là `"blue"`).

- [ ] **Step 1: Viết test thất bại** trong `tests/accent.test.js`: `ACCENT_PRESETS.find(p => p.id === "lavender")` tồn tại với đúng hai màu trên; `ACCENT_PRESETS[0].id === "blue"`; `normalizeAccentId("lavender") === "lavender"`; `contrastRatio("#ffffff", "#6d5fd6") >= 4.5` và `contrastRatio("#ffffff", "#7c6fe0") >= 3.5`. (Các test hiện có về hex hợp lệ và id duy nhất đã bao phủ phần còn lại.)
- [ ] **Step 2:** `node --test tests/accent.test.js`; mong đợi FAIL.
- [ ] **Step 3:** Thêm preset vào `ACCENT_PRESETS`.
- [ ] **Step 4:** `node --test tests/*.test.js`; PASS (nếu một test popup đếm số swatch cứng thì cập nhật cho khớp danh sách).
- [ ] **Step 5: Commit** `git add lib/accent.js tests && git commit -m "feat(accent): add a lavender preset"`

---

### Task 2: Popup chép màu nhấn sang chrome.storage

**Files:**
- Modify: `popup.js` (vùng "Accent colour picker", quanh dòng 168-205)
- Test: `tests/popup-boot.test.js`

**Interfaces:**
- Produces: khóa `chrome.storage.local.accentColor` luôn bằng id preset đang chọn; không đổi cách popup đọc `localStorage`.

- [ ] **Step 1: Viết test thất bại** (cùng khuôn với các test popup hiện có, dùng `locStorage` giả): (a) bấm một swatch thì gọi `chrome.storage.local.set({ accentColor: "<id>" })`; (b) mở popup khi `localStorage.accentColor === "orange"` và `chrome.storage.local` chưa có khóa thì gọi `set({ accentColor: "orange" })`; (c) mở popup khi `chrome.storage.local.accentColor` đã có thì không ghi đè bằng giá trị `localStorage`.
- [ ] **Step 2:** `node --test tests/popup-boot.test.js`; FAIL.
- [ ] **Step 3:** Trong click handler gọi thêm `locStorage.set({ accentColor: preset.id })` (bọc try/catch như phần `localStorage`); sau `renderAccentPicker()` thêm bước đọc `locStorage.get(["accentColor"], ...)` rồi chép nếu thiếu.
- [ ] **Step 4:** `node --test tests/*.test.js`; PASS.
- [ ] **Step 5: Commit** `git add popup.js tests && git commit -m "feat(ui): mirror the accent choice to chrome.storage"`

---

### Task 3: Suy ra bảng màu OKLCH

**Files:**
- Create: `ui/src/accent/palette.ts`
- Test: `ui/src/accent/palette.test.ts`

**Interfaces:**
- Consumes: `ACCENT_PRESETS` từ `lib/accent.js` (nhập một nguồn duy nhất; nếu bundler không đọc được UMD thì tạo alias Vite `@lib` trỏ tới `../lib`).
- Produces:
```ts
export const ACCENT_VARS: readonly string[]; // 10 biến màu + 2 gradient theo spec mục 4
export type OklchColor = { l: number; c: number; h: number };
export function hexToOklch(hex: string): OklchColor;
export function accentVarsFor(id: string | null | undefined): Record<string, string>; // {} cho mặc định
```

- [ ] **Step 1: Viết test thất bại**: 
  - `accentVarsFor(undefined)`, `accentVarsFor(null)`, `accentVarsFor("")`, `accentVarsFor("nope")`, `accentVarsFor(42 as any)` và `accentVarsFor("lavender")` đều bằng `{}`.
  - Với mọi preset khác lavender: kết quả có đủ mọi khóa trong `ACCENT_VARS`; mọi giá trị là chuỗi hợp lệ bắt đầu bằng `oklch(` hoặc `linear-gradient(`/`radial-gradient(`.
  - Hue của `--primary` suy ra từ `orange` nằm trong ±3 độ quanh hue của `hexToOklch("#e0510a").h`; độ sáng `L` của `--primary` luôn bằng `0.707`.
  - Tương phản: với mọi preset, `--primary-strong` đạt ≥ 4.5 trên `#ffffff` và trên `--primary-soft` (đổi oklch sang sRGB trong test bằng hàm có sẵn của file hoặc viết helper trong test).
  - Preset `graphite` cho `--primary` có chroma nhỏ hơn chroma của `--primary` suy ra từ `orange`.
  - `hexToOklch("#ffffff").l` gần 1 và `hexToOklch("#000000").l` gần 0.
- [ ] **Step 2:** `cd ui && npx vitest run src/accent/palette.test.ts`; FAIL.
- [ ] **Step 3:** Cài đặt: chuyển hex sang OKLCH (viết bằng toán, không thêm dependency); lấy giá trị token lavender gốc từ `ui/src/design/tokens.css` hoặc hằng số trùng khớp được test với file đó; áp dụng quy tắc spec mục 4 (hue lệch, chroma nhân `k`, giữ L, kiểm tương phản và hạ L của `--primary-strong`).
- [ ] **Step 4:** PASS. **Step 5: Commit** `feat(ui): derive an accent palette from a preset`

---

### Task 4: Đọc, áp dụng và theo dõi màu nhấn khi chạy

**Files:**
- Create: `ui/src/accent/apply.ts`
- Modify: `ui/src/boot.tsx`
- Test: `ui/src/accent/apply.test.ts`, `ui/src/boot.test.tsx` (thêm ca)

**Interfaces:**
- Consumes: `accentVarsFor` (Task 3); `mountShadow` trả `{ host, root, unmount }` (plan chính, Task 3).
- Produces:
```ts
export function readAccent(chromeApi: typeof chrome | undefined, timeoutMs?: number): Promise<string | null>; // mặc định 300
export function applyAccent(host: HTMLElement, id: string | null | undefined): void;
export function watchAccent(host: HTMLElement, chromeApi: typeof chrome | undefined): { stop(): void };
```

- [ ] **Step 1: Viết test thất bại** (chrome giả có `storage.local.get` và `storage.onChanged`):
  - `readAccent` trả `"orange"` khi storage có `{ accentColor: "orange" }`; trả `null` khi storage không có khóa; trả `null` khi `chromeApi` là `undefined`; trả `null` khi `get` không bao giờ gọi callback (dùng fake timers, quá 300 ms).
  - `applyAccent(host, "orange")` đặt `--primary` trên `host.style`; sau đó `applyAccent(host, null)` gỡ mọi biến trong `ACCENT_VARS` (không để sót).
  - `watchAccent`: phát `onChanged` với `{ accentColor: { newValue: "teal" } }` ở vùng `"local"` thì host đổi `--primary`; vùng `"sync"` hoặc khóa khác thì không đổi; `stop()` gỡ listener.
  - `boot`: với storage trả `"pink"`, host có `--primary` ngay sau khi mount (trước khi ẩn FAP gốc); với storage không trả kịp, vẫn mount bằng lavender và không treo.
- [ ] **Step 2:** `cd ui && npx vitest run src/accent src/boot.test.tsx`; FAIL.
- [ ] **Step 3:** Cài đặt ba hàm; trong `boot`, `await readAccent(...)` trước `mountShadow`, gọi `applyAccent` ngay sau mount, gọi `watchAccent` và `stop()` trong `unmount`.
- [ ] **Step 4:** `cd ui && npm test`; PASS. **Step 5: Commit** `feat(ui): follow the extension accent colour in the FAP interface`

---

### Task 5: Tài liệu thiết kế và đối chiếu

**Files:**
- Modify: `ui/scripts/gen-design-md.mjs`, `DESIGN.md`, `ui/parity/harness.html`, `ui/scripts/parity.mjs`
- Test: `ui/src/design/tokens.test.ts` (thêm ca)

- [ ] **Step 1: Viết test thất bại**: `DESIGN.md` (sinh lại từ script) có mục "Màu nhấn", liệt kê mọi `id` trong `ACCENT_PRESETS`, nêu quy tắc mặc định (chưa chọn, `lavender`) và công thức suy ra (giữ L, đổi hue, nhân chroma).
- [ ] **Step 2:** `cd ui && npx vitest run src/design`; FAIL.
- [ ] **Step 3:** Thêm mục vào script sinh `DESIGN.md` và chạy lại để cập nhật file. Thêm tham số `?accent=<id>` cho `harness.html` (gọi `applyAccent` trên host) và chế độ `npm run parity -- --accent=orange` chỉ chụp ảnh vào `ui/parity/out/` (không so với ảnh chuẩn, để người dùng xem bằng mắt).
- [ ] **Step 4:** `cd ui && npm test && npm run parity`; PASS và mỗi trang dưới 2% ở trạng thái mặc định; chạy thêm `--accent=lavender` và xác nhận dưới 2% (giống mặc định).
- [ ] **Step 5: Commit** `docs(ui): document the accent colour rules`

---

### Task 6: Kiểm tra thủ công (người dùng thực hiện)

- [ ] Nạp lại extension, mở popup, chọn lần lượt Cam, Hồng, Xanh ngọc, Xám than: tab FAP đang mở đổi màu ngay, không cần tải lại; chữ vẫn rõ ở mọi màu.
- [ ] Chọn Tím lavender: giao diện giống bản mặc định (và giống thiết kế Lovable).
- [ ] Đóng và mở lại tab FAP: màu giữ nguyên, không nhấp nháy từ lavender sang màu đã chọn.
- [ ] Người dùng đã chọn màu từ trước khi cập nhật: mở popup một lần, rồi tải lại FAP; màu được áp dụng.
- [ ] Quan sát điểm lệch đã biết: khi chưa chọn gì, popup tô sáng xanh dương còn FAP là lavender (xem mục 7 của spec).
