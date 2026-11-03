# FAP Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phủ lên toàn bộ trang FAP một giao diện thẻ nổi pha kính mờ (theo màu nhấn của extension, có thêm màu cam), bật sẵn, tắt được, kèm thông báo một lần; trau chuốt riêng trang chủ, lịch học, lịch thi và đăng nhập.

**Architecture:** Một content script chạy ở `document_start` nạp `lib/fap-skin.css` (mọi quy tắc gắn với `html:not([data-fptu-skin="off"])`, ghi đè biến `--ct-*` của Jidox và tạo kiểu cho lớp `fap-*`) cùng `lib/fap-skin.js` (đọc cài đặt từ `chrome.storage.local`, đặt thuộc tính tắt và biến màu nhấn lên `<html>`, theo dõi thay đổi). `lib/fap-skin-ui.js` chạy ở `document_idle`, dựng trong Shadow DOM một nút chuyển nhanh luôn có mặt và thông báo "giao diện mới" hiện một lần. Skin không đổi DOM của FAP.

**Tech Stack:** Vanilla CSS/JS, Manifest V3, Node test runner (`node --test tests/*.test.js`), jsdom (đã có), Chrome headless để chụp ảnh kiểm tra.

**Spec:** `docs/superpowers/specs/2026-11-04-fap-reskin-design.md`. Plan phủ cả bốn giai đoạn. Đã có bản lưu MHTML đầy đủ của bốn trang trong `page-fap/` (không commit); mỗi trang cần một fixture đã làm sạch trong `tests/fixtures/`.

## Global Constraints

- Manifest V3; Vanilla CSS và JS; không build tool, thư viện, CDN, phông chữ hay mã tải từ ngoài.
- Mã dùng chung nằm trong `lib/` theo mẫu UMD (chạy được trong content script và Node). Đặt CSS skin ở `lib/` để lệnh đóng gói hiện tại (`zip -FS -r fptu-schedule.zip manifest.json *.png popup.html popup.js popup.css background.js content.js lib/`) tự bao gồm; không đổi lệnh đóng gói.
- `node --test tests/*.test.js` đạt 100% sau mỗi task; tính năng mới có test.
- Không emoji trong giao diện; icon dùng SVG hoặc Remix mà FAP đã nạp.
- Skin không tạo lại, đổi tên, di chuyển, ẩn hay xóa phần tử của FAP; không đổi `id`, `name`, `type`, `href`, `action`; không đọc dữ liệu trang; không thêm request tới FAP.
- Màu nhấn lấy theo preset trong extension; mọi preset phải cho chữ trắng tương phản >= 3.5:1 ở cả hai biến thể sáng/tối. Màu mặc định của extension vẫn là xanh dương.
- Sáng/tối theo `html[data-bs-theme]` của FAP, không dùng `prefers-color-scheme`. `backdrop-filter` chỉ dùng cho thanh trên, menu trái, hộp thoại, menu thả xuống và thanh dính; thẻ trong danh sách chỉ trong suốt.
- Không tự nâng số phiên bản, không build zip để phát hành, không sửa CHANGELOG/STORE_LISTING/privacy trong plan này.
- `page-fap/` chứa dữ liệu cá nhân và bị `.gitignore`; không commit. Fixture đưa vào `tests/fixtures/` phải được làm sạch.

## Review Focus

Năm tình huống spec chưa nêu, dễ làm hỏng trải nghiệm nhất (mỗi dòng có test ở task chủ):

1. Extension vừa được tải lại hoặc `chrome.storage` không dùng được (lỗi "context invalidated"): skin giữ mặc định bật, không ném lỗi ra trang FAP. (Task 4, Task 11)
2. Script bị nạp hai lần trong cùng một trang (popup inject lại `content.js`; đổi trang kiểu SPA): không nhân đôi watcher, nút chuyển hay thông báo. (Task 4, Task 11)
3. Nhiều tab FAP mở cùng lúc: đóng thông báo hoặc tắt skin ở một tab thì các tab khác cập nhật ngay, không cần tải lại. (Task 4, Task 11)
4. Người dùng bấm nút sáng/tối của FAP lúc đang xem: màu nhấn và skin đổi theo ngay, vì luật gắn với `[data-bs-theme]` chứ không phải media query. (Task 4, Task 5)
5. Trang đăng nhập có ô nhập đang được focus: thông báo và nút chuyển không được cướp focus, không che ô nhập, không dùng lớp phủ chặn chuột. (Task 11)

---

## File Structure

- Tạo `lib/fap-skin.js`: logic cài đặt -> DOM (thuộc tính tắt, CSS màu nhấn, theo dõi storage).
- Tạo `lib/fap-skin.css`: toàn bộ kiểu dáng skin, mọi selector gắn cổng `html:not([data-fptu-skin="off"])`.
- Tạo `lib/fap-skin-ui.js`: nút chuyển nhanh và thông báo một lần (Shadow DOM).
- Sửa `lib/accent.js` (thêm cam), `popup.js` và `popup.html` (sao chép màu nhấn sang `chrome.storage.local`, công tắc skin), `manifest.json` (hai khối content script).
- Tạo `scripts/preview-fap-skin.py`: công cụ dev chụp ảnh trang FAP đã lưu với skin.
- Tạo `tests/fixtures/fap-home.html`, `fap-timetable.html`, `fap-exam.html`, `fap-login.html` (đã làm sạch), `tests/fap-fixture.test.js`, `tests/fap-skin.test.js`, `tests/fap-skin-css.test.js`, `tests/fap-skin-ui.test.js`; sửa `tests/accent.test.js`, `tests/popup-boot.test.js`.

---

### Task 1: Fixture trang chủ đã làm sạch

**Files:**
- Create: `tests/fixtures/fap-home.html`
- Test: `tests/fap-fixture.test.js`

**Interfaces:**
- Produces: `tests/fixtures/fap-home.html`, một tài liệu HTML của trang chủ sinh viên (khung đầy đủ: `div.wrapper`, `.fap-topbar`, `aside.fap-sidebar`, `.content-page`, thẻ sinh viên, tin tức, Menu nhanh) dùng cho test hợp đồng CSS ở các task sau.

- [ ] **Step 1: Write the failing test** `tests/fap-fixture.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "fixtures", "fap-home.html"), "utf8");
const doc = new JSDOM(html).window.document;

test("fap-home fixture has the shell and dashboard blocks the skin targets", () => {
  ["div.wrapper", ".navbar-custom .fap-topbar", "aside.leftside-menu.fap-sidebar", ".content-page .container-fluid",
   ".fap-home-student-card", ".fap-home-news-card", ".fap-home-news-item", ".fap-home-quick-menu__link", "footer.footer"]
    .forEach((sel) => assert.ok(doc.querySelector(sel), sel));
});

test("fap-home fixture is sanitized", () => {
  assert.strictEqual(doc.querySelector(".fap-home-student-card__name").textContent.trim(), "Nguyễn Văn A");
  assert.strictEqual(doc.querySelector(".fap-home-student-card__roll").textContent.trim(), "SE000000");
  assert.doesNotMatch(html, /[\w.+-]+@(?!example\.com)[\w-]+(\.[\w-]+)+/, "only example.com emails");
  assert.doesNotMatch(html, /\b(?!SE000000\b)[A-Z]{2}\d{5,}\b/, "no student ids");
  assert.strictEqual(doc.querySelectorAll("script").length, 0, "no scripts");
  assert.strictEqual(doc.querySelectorAll('input[type="hidden"]').length, 0, "no hidden tokens");
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `node --test tests/fap-fixture.test.js`. Expected: FAIL, file not found.
- [ ] **Step 3: Create the fixture** from `page-fap/*.mhtml` (not committed): extract the main `text/html` part with Python `email.message_from_bytes(..., policy=email.policy.default)`, then, with a one-off script kept outside the repo: remove every `<script>…</script>` and `<input type="hidden" …>`; replace the student name with `Nguyễn Văn A`, the student id with `SE000000`, every email with `student@example.com`; drop `<link>` stylesheets (tests do not need FAP's CSS). Keep the news items and quick menu as they are.
- [ ] **Step 4: Run to verify it passes.** Run: `node --test tests/fap-fixture.test.js`. Expected: PASS.
- [ ] **Step 5: Commit** `git add tests/fixtures/fap-home.html tests/fap-fixture.test.js && git commit -m "test: add a sanitized FAP home fixture"`.

---

### Task 2: Thêm preset màu cam

**Files:**
- Modify: `lib/accent.js` (mảng `ACCENT_PRESETS`)
- Test: `tests/accent.test.js`

**Interfaces:**
- Produces: preset `{ id: "orange", label: "Cam", light: "#e0510a", dark: "#ea580c" }`, đặt ngay sau `pink`. `DEFAULT_ACCENT_ID` vẫn là `"blue"`.

- [ ] **Step 1: Write the failing test** (thêm vào `tests/accent.test.js`):

```js
test("orange is available as a preset and blue stays the default", () => {
  const orange = ACCENT_PRESETS.find((p) => p.id === "orange");
  assert.ok(orange);
  assert.strictEqual(orange.label, "Cam");
  assert.strictEqual(DEFAULT_ACCENT_ID, "blue");
  assert.ok(ACCENT_PRESETS.findIndex((p) => p.id === "orange") === ACCENT_PRESETS.findIndex((p) => p.id === "pink") + 1);
  assert.ok(contrastRatio("#ffffff", orange.light) >= 3.5 && contrastRatio("#ffffff", orange.dark) >= 3.5);
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `node --test tests/accent.test.js`. Expected: FAIL (`orange` undefined).
- [ ] **Step 3: Add the preset** to `ACCENT_PRESETS` in `lib/accent.js`; the existing contrast and popup-boot swatch-count tests then cover it.
- [ ] **Step 4: Run the full suite.** Run: `node --test tests/*.test.js`. Expected: all pass.
- [ ] **Step 5: Commit** `git commit -am "feat(ui): add an orange accent preset"`.

---

### Task 3: Sao chép màu nhấn sang `chrome.storage.local`

**Files:**
- Modify: `popup.js` (trong `renderAccentPicker` và ngay sau lần gọi `renderAccentPicker()`)
- Test: `tests/popup-boot.test.js`

**Interfaces:**
- Produces: khóa `chrome.storage.local.accentColor` (id preset) luôn khớp với `localStorage.accentColor` của popup. Task 4 đọc khóa này.

- [ ] **Step 1: Write the failing test** (thêm vào `tests/popup-boot.test.js`, dùng `boot()` và `calls.storageSet` sẵn có):

```js
test("the accent choice is mirrored to chrome.storage so FAP pages can read it", async () => {
  const { window, calls } = await boot();
  window.document.querySelector('.accent-swatch[data-accent="orange"]').dispatchEvent(new window.Event("click"));
  assert.ok(calls.storageSet.some((o) => o.accentColor === "orange"));
});

test("an accent chosen before the mirror existed is copied over on boot", async () => {
  const { calls } = await boot({ localStorage: { accentColor: "violet" } });
  assert.ok(calls.storageSet.some((o) => o.accentColor === "violet"));
});
```

(`boot` hiện chưa nhận tham số: thêm tham số tùy chọn `{ localStorage }` để gieo `localStorage` trong `beforeParse`.)

- [ ] **Step 2: Run to verify it fails.** Run: `node --test tests/popup-boot.test.js`. Expected: FAIL.
- [ ] **Step 3: In `popup.js`** thêm `mirrorAccentToStorage(id: string): void` (dùng `getChromeStorageLocal()` có sẵn, bọc try/catch), gọi trong click handler của swatch và một lần ngay sau `renderAccentPicker()` với `currentAccentId()`.
- [ ] **Step 4: Run the full suite.** Expected: all pass.
- [ ] **Step 5: Commit** `git commit -am "feat(ui): mirror the accent choice to chrome.storage"`.

---

### Task 4: Logic skin (`lib/fap-skin.js`)

**Files:**
- Create: `lib/fap-skin.js`
- Test: `tests/fap-skin.test.js`

**Interfaces:**
- Consumes: `ACCENT_PRESETS`, `normalizeAccentId`, `mixHex` từ `lib/accent.js` (global trong content script; `require` trong test).
- Produces (UMD, global `FapSkin` đồng thời expose từng hàm lên `globalThis`):
  - `FAP_SKIN_KEYS = { enabled: "fapSkinEnabled", accent: "accentColor", noticeSeen: "fapSkinNoticeSeen" }`
  - `SKIN_ATTR = "data-fptu-skin"` (giá trị `"off"` khi tắt), `ACCENT_STYLE_ID = "fptu-skin-accent"`
  - `buildFapAccentCss(id: string): string`: `""` cho `blue`; ngược lại hai khối: `html:not([data-fptu-skin="off"]){--fptu-accent:<light>;--fptu-accent-hover:<mix 15% đen>;--fptu-accent-soft:<mix 92% trắng>}` và `html:not([data-fptu-skin="off"])[data-bs-theme="dark"]{--fptu-accent:<dark>;--fptu-accent-hover:<mix 25% trắng>;--fptu-accent-soft:rgba(r,g,b,0.2)}` (cùng công thức với `buildAccentCss` của popup).
  - `applyFapSkin(doc: Document, settings: { enabled?: boolean, accentColor?: string }): void`: `enabled === false` đặt `SKIN_ATTR="off"` lên `documentElement`, ngược lại gỡ thuộc tính; tạo/cập nhật/gỡ `<style id=ACCENT_STYLE_ID>` trong `head` (hoặc `documentElement` nếu chưa có `head`).
  - `startFapSkin(win: Window, chromeApi?: typeof chrome): { stop(): void }`: đọc `fapSkinEnabled`, `accentColor` từ `chromeApi.storage.local`, gọi `applyFapSkin`, và theo dõi `chromeApi.storage.onChanged` (chỉ `areaName === "local"`, chỉ hai khóa trên) để áp lại; lưu thể hiện vào `win.__fptuFapSkin` và trả lại thể hiện đó nếu đã có.

- [ ] **Step 1: Write the failing tests** `tests/fap-skin.test.js` (dùng `JSDOM` cho `document`; `fakeChrome({ store, throwOnGet })` ghi nhận listener `onChanged`):

```js
test("buildFapAccentCss is empty for blue and keyed on data-bs-theme for other presets", () => {
  assert.strictEqual(buildFapAccentCss("blue"), "");
  assert.strictEqual(buildFapAccentCss("nope"), "");
  const css = buildFapAccentCss("orange");
  assert.ok(css.includes('html:not([data-fptu-skin="off"])[data-bs-theme="dark"]'));
  assert.ok(css.includes("--fptu-accent:#e0510a") && css.includes("--fptu-accent:#ea580c"));
  assert.doesNotMatch(css, /prefers-color-scheme/);
});

test("applyFapSkin toggles the off attribute and manages one accent style element", () => {
  const doc = new JSDOM("<html><head></head><body></body></html>").window.document;
  applyFapSkin(doc, { enabled: false, accentColor: "orange" });
  assert.strictEqual(doc.documentElement.getAttribute("data-fptu-skin"), "off");
  assert.strictEqual(doc.querySelectorAll("#fptu-skin-accent").length, 1);
  applyFapSkin(doc, { enabled: true, accentColor: "blue" });
  assert.strictEqual(doc.documentElement.hasAttribute("data-fptu-skin"), false);
  assert.strictEqual(doc.getElementById("fptu-skin-accent"), null);
});

test("startFapSkin applies stored settings and follows changes from other tabs", async () => {
  const win = new JSDOM("<html><head></head></html>").window;
  const chrome = fakeChrome({ store: { fapSkinEnabled: false, accentColor: "violet" } });
  startFapSkin(win, chrome);
  await tick();
  assert.strictEqual(win.document.documentElement.getAttribute("data-fptu-skin"), "off");
  chrome.fire({ fapSkinEnabled: { newValue: true } }, "local");
  assert.strictEqual(win.document.documentElement.hasAttribute("data-fptu-skin"), false);
  chrome.fire({ accentColor: { newValue: "pink" } }, "sync"); // other areas are ignored
  assert.ok(win.document.getElementById("fptu-skin-accent").textContent.includes("violet") === false);
});

test("startFapSkin keeps the defaults and does not throw when storage is unusable", async () => {
  const win = new JSDOM("<html><head></head></html>").window;
  assert.doesNotThrow(() => startFapSkin(win, undefined));
  assert.doesNotThrow(() => startFapSkin(new JSDOM("<html></html>").window, fakeChrome({ throwOnGet: true })));
  await tick();
  assert.strictEqual(win.document.documentElement.hasAttribute("data-fptu-skin"), false);
});

test("startFapSkin is idempotent per window", () => {
  const win = new JSDOM("<html><head></head></html>").window;
  const chrome = fakeChrome({ store: {} });
  assert.strictEqual(startFapSkin(win, chrome), startFapSkin(win, chrome));
  assert.strictEqual(chrome.listenerCount(), 1);
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `node --test tests/fap-skin.test.js`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `lib/fap-skin.js` với các chữ ký và giá trị ở trên. Đường khởi động tự động ở cuối file chỉ chạy khi `typeof window !== "undefined" && typeof chrome !== "undefined" && location.hostname === "fap.fpt.edu.vn"`: gọi `startFapSkin(window, chrome)`. Mọi truy cập `chrome.storage` bọc `try/catch`.
- [ ] **Step 4: Run to verify it passes.** Run: `node --test tests/fap-skin.test.js`. Expected: PASS.
- [ ] **Step 5: Commit** `git add lib/fap-skin.js tests/fap-skin.test.js && git commit -m "feat(fap-skin): add the skin settings controller"`.

---

### Task 5: CSS khung xương, nối vào manifest và test hợp đồng

**Files:**
- Create: `lib/fap-skin.css`, `tests/fap-skin-css.test.js`
- Modify: `manifest.json` (thêm khối content script thứ hai)

**Interfaces:**
- Consumes: `tests/fixtures/fap-home.html` (Task 1); `buildFapAccentCss`, `ACCENT_PRESETS` (Task 2, 4).
- Produces: `lib/fap-skin.css` với hằng cổng `html:not([data-fptu-skin="off"])` ở đầu mọi selector, các biến mặc định `--fptu-accent: #2563eb`, `--fptu-accent-hover`, `--fptu-accent-soft` (sáng) và biến thể tối dưới `[data-bs-theme="dark"]` (giá trị của preset `blue`); manifest có khối `{ matches: ["*://fap.fpt.edu.vn/*"], css: ["lib/fap-skin.css"], js: ["lib/accent.js", "lib/fap-skin.js"], run_at: "document_start" }`. Các task 7-9 chỉ thêm quy tắc vào file này.

- [ ] **Step 1: Write the failing tests** `tests/fap-skin-css.test.js`. Có hàm trợ giúp `parseRules(css): { selector: string, body: string, at: string | null }[]` (bỏ chú thích, hỗ trợ một cấp `@media`/`@supports`). Các test:

```js
test("every skin selector is gated so the skin can be switched off instantly", () => {
  rules.forEach((r) => r.selector.split(",").forEach((s) =>
    assert.ok(s.trim().startsWith('html:not([data-fptu-skin="off"])'), `ungated: ${s.trim()}`)));
});
test("the skin never hides FAP content", () => {
  rules.forEach((r) => assert.doesNotMatch(r.body, /display:\s*none|visibility:\s*hidden|opacity:\s*0(?![.\d])|content:\s*["']/));
});
test("light and dark follow FAP's data-bs-theme, not the OS", () => {
  assert.doesNotMatch(css, /prefers-color-scheme/);
});
test("accent defaults match the blue preset and nothing else hard-codes a color accent", () => {
  const blue = ACCENT_PRESETS[0];
  assert.ok(css.includes(`--fptu-accent: ${blue.light}`) && css.includes(`--fptu-accent: ${blue.dark}`));
  assert.doesNotMatch(css.replace(/--fptu-accent[\w-]*:[^;]+;/g, ""), /#(2563eb|3b82f6|4254ba)\b/i);
});
test("backdrop-filter is limited to bars, dialogs and menus", () => {
  const allowed = /(navbar-custom|fap-topbar|leftside-menu|fap-sidebar|modal-content|dropdown-menu|fap-sticky)/;
  rules.filter((r) => /backdrop-filter/.test(r.body)).forEach((r) => assert.match(r.selector, allowed));
});
test("transparency can be turned off", () => {
  assert.match(css, /@media \(prefers-reduced-transparency: reduce\)/);
});
test("the fap-* classes the skin targets exist in the home fixture", () => {
  const KNOWN_ABSENT = ["fap-home-fee", "fap-home-fee-card", "fap-home-fee-warning"]; // in home.css, but the fixture student has no fee notice
  const used = [...new Set(css.match(/\.fap-[\w-]+/g) || [])].map((c) => c.slice(1));
  used.filter((c) => !KNOWN_ABSENT.some((k) => c.startsWith(k)))
      .forEach((c) => assert.ok(doc.querySelector("." + c) || html.includes(c), c));
});
test("manifest loads the skin early, on FAP only", () => {
  const block = manifest.content_scripts.find((b) => (b.css || []).includes("lib/fap-skin.css"));
  assert.deepStrictEqual(block.matches, ["*://fap.fpt.edu.vn/*"]);
  assert.strictEqual(block.run_at, "document_start");
  assert.deepStrictEqual(block.js, ["lib/accent.js", "lib/fap-skin.js"]);
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `node --test tests/fap-skin-css.test.js`. Expected: FAIL.
- [ ] **Step 3: Create `lib/fap-skin.css`** với chú thích đầu file giải thích cổng, biến mặc định và khối `@media (prefers-reduced-transparency: reduce)` (đặt `backdrop-filter: none` và nền đặc cho các thanh); thêm khối content script vào `manifest.json`.
- [ ] **Step 4: Run to verify it passes.** Run: `node --test tests/*.test.js`. Expected: all pass.
- [ ] **Step 5: Commit** `git add lib/fap-skin.css manifest.json tests/fap-skin-css.test.js && git commit -m "feat(fap-skin): load a gated skin stylesheet early on FAP"`.

---

### Task 6: Công cụ chụp ảnh xem trước

**Files:**
- Create: `scripts/preview-fap-skin.py`

**Interfaces:**
- Produces: lệnh `python3 scripts/preview-fap-skin.py <file.mhtml> --out <dir> [--skin on|off] [--accent <id>] [--theme light|dark] [--width <px>] [--sidenav default|condensed|sm-hover]` ghi `<dir>/preview.html` và `<dir>/preview.png`, in hai đường dẫn. `--out` là bắt buộc và phải nằm ngoài repo (ảnh chứa dữ liệu cá nhân từ MHTML).

- [ ] **Step 1: Implement** bằng Python chuẩn: tách các phần `text/css` và `text/html` của MHTML bằng `email`; ghi CSS ra `<dir>/css/`; dựng `preview.html` từ HTML gốc, thay `<link rel="stylesheet">` bằng đường dẫn cục bộ, bỏ mọi `<script>`, thêm `<link>` tới `lib/fap-skin.css`, nối thêm `buildFapAccentCss` (chạy `node -e` gọi `lib/fap-skin.js`) vào một thẻ `<style>`, đặt `data-bs-theme`, `data-sidenav-size` và (nếu `--skin off`) `data-fptu-skin="off"` lên `<html>`; chụp bằng Chrome headless (`--screenshot`, `--window-size=<width>,1000`, `--virtual-time-budget=3000`).
- [ ] **Step 2: Verify the baseline.** Run: `python3 scripts/preview-fap-skin.py page-fap/*.mhtml --out <scratch> --skin off --width 1440`. Expected: ảnh `preview.png` trông giống trang FAP gốc (khung Jidox, chưa có hiệu ứng skin).
- [ ] **Step 3: Commit** `git add scripts/preview-fap-skin.py && git commit -m "chore: add a preview tool for the FAP skin"`.

---

### Task 7: Token và khung chung

**Files:**
- Modify: `lib/fap-skin.css`
- Test: `tests/fap-skin-css.test.js` (các test hợp đồng ở Task 5 tự bao phủ)

**Interfaces:**
- Consumes: biến `--fptu-accent*` (Task 5), biến Jidox `--ct-primary`, `--ct-body-bg`, `--ct-secondary-bg`, `--ct-tertiary-bg`, `--ct-card-bg`, `--ct-border-color`, `--ct-border-radius`, `--ct-body-color`, `--ct-font-sans-serif`, `--ct-topbar-bg`, `--ct-menu-bg`, `--ct-topbar-height`, `--ct-leftbar-width` (đọc giá trị gốc trong `app.min.css` của MHTML trước khi ghi đè).
- Produces: nền ambient ba mảng màu (theo `--fptu-accent`), thanh trên nổi dạng viên thuốc, menu trái dạng thẻ kính riêng, chân trang, giá trị mới của các biến `--ct-*` cho sáng và tối.

- [ ] **Step 1: Write the rules** theo bảng giá trị: `--ct-primary: var(--fptu-accent)`, `--ct-link-color` cùng màu; `--ct-border-radius: 0.9rem`; nền trang `--ct-body-bg` xám nhạt (`#eceef3` sáng, `#0b1020` tối) kèm ba `radial-gradient` ở `.wrapper` dùng `color-mix(in srgb, var(--fptu-accent) 30%, transparent)` và hai màu phụ pha từ accent (như popup). `.navbar-custom` và `.topbar.fap-topbar`: bo `26px`, trong suốt, `backdrop-filter: blur(18px) saturate(165%)`, viền sáng `1px`, nổi cách mép `12px`. `aside.leftside-menu.fap-sidebar`: thẻ kính bo `26px`; `.side-nav-link.active` và mục đang mở là viên thuốc gradient `--fptu-accent` -> `--fptu-accent-hover`, chữ trắng. `footer.footer` trong suốt. Giữ đúng hành vi thu gọn: kiểm tra `html[data-sidenav-size="condensed"]`, `sm-hover` và màn hình < 992px (nút `.button-toggle-menu`, `.navbar-toggle`) không bị che hoặc lệch.
- [ ] **Step 2: Run the contract tests.** Run: `node --test tests/fap-skin-css.test.js`. Expected: PASS (cổng, không ẩn nội dung, backdrop-filter đúng nơi, lớp `fap-*` tồn tại).
- [ ] **Step 3: Verify visually.** Chạy `preview-fap-skin.py` với `--skin on` ở `--width` 1440, 1100, 768, 390; `--theme` light và dark; `--sidenav` condensed và sm-hover (1440). Expected: thanh trên nổi, menu trái là thẻ kính, mục đang chọn là viên thuốc màu nhấn; không phần tử nào bị che, tràn ngang hoặc chồng lên nhau; chữ đọc rõ ở cả hai chế độ. So với `--skin off` cùng độ rộng: mọi phần tử vẫn còn mặt (không biến mất).
- [ ] **Step 4: Commit** `git commit -am "feat(fap-skin): floating glass shell, tokens and ambient background"`.

---

### Task 8: Thành phần dùng chung

**Files:**
- Modify: `lib/fap-skin.css`
- Test: `tests/fap-skin-css.test.js`

**Interfaces:**
- Consumes: token và khung từ Task 7.
- Produces: kiểu cho `.card`, `.card-header`, `.btn` (`.btn-primary`, `.btn-soft-primary`, `.btn-outline-*`), `.form-control`/`.form-select`/`.form-check-input`, `.table` (`.table-striped`, `.table-hover`), `.badge`, `.dropdown-menu`, `.modal-content`, `.pagination`, `.page-title-box.fap-page-title`, `.fap-filter-card`, `.fap-chip`, `.fap-empty-state` (xem danh sách đầy đủ trong `style.css` của MHTML).

- [ ] **Step 1: Add the failing assertion** vào `tests/fap-skin-css.test.js`:

```js
test("core components are covered by the skin", () => {
  ["\\.card", "\\.btn-primary", "\\.form-control", "\\.table", "\\.badge", "\\.dropdown-menu", "\\.modal-content", "\\.pagination"]
    .forEach((sel) => assert.match(css, new RegExp(sel)));
});
```

- [ ] **Step 2: Run to verify it fails.** Expected: FAIL.
- [ ] **Step 3: Write the rules.** Thẻ: nền `color-mix` trong suốt (sáng `rgba(255,255,255,.62)`, tối `rgba(30,41,59,.6)`), viền sáng mảnh, bo `22px`, vệt sáng cạnh trên, **không** `backdrop-filter`. Nút chính: gradient accent, quầng sáng nhẹ; `.dropdown-menu` và `.modal-content`: kính có blur. Bảng: hàng trong suốt, đường kẻ mảnh, rê chuột nổi nhẹ. Badge/chip dạng viên thuốc. Ô nhập: nền trong suốt nhẹ, viền focus theo accent (không bỏ đường viền focus nhìn thấy được). Giữ nguyên màu ngữ nghĩa thành công/cảnh báo/nguy hiểm của FAP (xanh lá/vàng/đỏ), chỉ chỉnh độ bão hòa cho hợp nền kính.
- [ ] **Step 4: Run the full suite.** Expected: all pass.
- [ ] **Step 5: Verify visually** ở 1440 và 390, sáng/tối, accent `blue` và `orange`: thẻ, nút, bảng, hộp thoại đọc rõ (chữ phụ >= 4.5:1 trên nền kính; lấy mẫu pixel như đã làm với popup), phần tử focus nhìn thấy được.
- [ ] **Step 6: Commit** `git commit -am "feat(fap-skin): glass cards, buttons, forms, tables and dialogs"`.

---

### Task 9: Trang chủ (dashboard)

**Files:**
- Modify: `lib/fap-skin.css`
- Test: `tests/fap-skin-css.test.js`

**Interfaces:**
- Consumes: thành phần từ Task 8; fixture trang chủ.
- Produces: kiểu cho `.fap-home-student-card` (và `__left`, `__avatar`, `__name`, `__roll`, `__metric`, `__label` với `--primary|--info|--warning|--secondary|--success`, `__value`, `__wallet-amount`, `__metric--wallet`), `.fap-home-news-card` (`__header-title`, `__filter`, `__filter-btn`, `__filter-label`), `.fap-home-news-list`, `.fap-home-news-item` (`__icon`, `__icon--pinned`, `__body`, `__title`, `__meta`, `__arrow`), `.fap-home-quick-menu` (`__accent`, `__header`, `__icon`, `__title`, `__subtitle`, `__nav`, `__group`, `__group-label`, `__link`, `__link-icon`, `__link-text`, `__chevron`), và khối học phí `.fap-home-fee*` (định nghĩa theo `home.css`, không có trong fixture).

- [ ] **Step 1: Add the failing assertion**:

```js
test("the dashboard blocks are styled", () => {
  ["fap-home-student-card", "fap-home-news-card", "fap-home-news-item", "fap-home-quick-menu__link", "fap-home-fee"]
    .forEach((c) => assert.ok(css.includes("." + c), c));
});
```

- [ ] **Step 2: Run to verify it fails.** Expected: FAIL.
- [ ] **Step 3: Write the rules** theo mockup A đã duyệt: thẻ sinh viên là gradient `--fptu-accent` -> `--fptu-accent-hover` (chữ trắng, các ô số liệu bo `16px` trong suốt trắng 18%), danh sách tin có icon trong ô bo màu accent nhạt và đường kẻ mảnh, chip lọc dạng viên thuốc (chip đang chọn nền accent), Menu nhanh là thẻ kính với liên kết bo `12px` rê chuột sáng lên. Không đổi bố cục lưới của FAP (`col-lg-8`/`col-lg-4`).
- [ ] **Step 4: Run the full suite.** Expected: all pass.
- [ ] **Step 5: Verify visually** trên bản MHTML: so ảnh `--skin on` ở 1440 (sáng và tối, accent `blue` và `orange`) với mockup A đã duyệt (`docs/superpowers/specs/assets/2026-11-04-fap-reskin-mockup.html`, phần A); phần tin tức (tải sau) và thẻ sinh viên đều được tạo kiểu; ở 390px các cột xếp dọc, không tràn ngang.
- [ ] **Step 6: Commit** `git commit -am "feat(fap-skin): style the dashboard blocks"`.

---

### Task 10: Công tắc trong popup

**Files:**
- Modify: `popup.html` (hộp thoại cài đặt), `popup.js`
- Test: `tests/popup-boot.test.js`

**Interfaces:**
- Consumes: `FAP_SKIN_KEYS.enabled` = `"fapSkinEnabled"` (Task 4).
- Produces: checkbox `#fapSkinToggle` ("Giao diện FAP mới", mặc định bật) ngay sau khối `fapKeepSessionToggle`; ghi `chrome.storage.local.fapSkinEnabled` ngay khi đổi (giống `fapKeepSessionToggle`) và khi bấm "Lưu & Áp dụng".

- [ ] **Step 1: Write the failing test**:

```js
test("the FAP skin switch reflects storage and writes changes straight away", async () => {
  const { window, calls } = await boot({ storage: { fapSkinEnabled: false } });
  const box = window.document.getElementById("fapSkinToggle");
  window.document.getElementById("notificationBtn").dispatchEvent(new window.Event("click"));
  assert.strictEqual(box.checked, false);
  box.checked = true;
  box.dispatchEvent(new window.Event("change"));
  assert.ok(calls.storageSet.some((o) => o.fapSkinEnabled === true));
});
test("the FAP skin switch defaults to on", async () => {
  const { window } = await boot();
  window.document.getElementById("notificationBtn").dispatchEvent(new window.Event("click"));
  assert.strictEqual(window.document.getElementById("fapSkinToggle").checked, true);
});
```

(Mở rộng `boot` để `chrome.storage.local.get` trả về các khóa từ tham số `storage`.)

- [ ] **Step 2: Run to verify it fails.** Expected: FAIL.
- [ ] **Step 3: Implement** theo mẫu của `fapKeepSessionToggle` (đọc `res.fapSkinEnabled !== false`, ghi ở sự kiện `change` và trong handler lưu).
- [ ] **Step 4: Run the full suite.** Expected: all pass.
- [ ] **Step 5: Commit** `git commit -am "feat(ui): add a FAP skin switch to settings"`.

---

### Task 11: Nút chuyển nhanh và thông báo một lần (`lib/fap-skin-ui.js`)

**Files:**
- Create: `lib/fap-skin-ui.js`
- Modify: `manifest.json` (thêm `lib/fap-skin-ui.js` vào danh sách `js` của khối `document_idle` hiện có, trước `content.js`)
- Test: `tests/fap-skin-ui.test.js`

**Interfaces:**
- Consumes: `FAP_SKIN_KEYS` (Task 4).
- Produces: `mountSkinUi(win: Window, chromeApi?: typeof chrome): { unmount(): void }`. Phần tử chủ `#fptu-skin-ui` gắn vào `documentElement` (không phụ thuộc `body`), nội dung trong Shadow DOM (`mode: "open"` để test). Gồm: (a) nút chuyển nhanh luôn có mặt, nhãn truy cập "Dùng giao diện FAP gốc" khi skin bật và "Dùng giao diện FAP mới" khi tắt, bấm để đảo `fapSkinEnabled`; (b) thẻ thông báo khi `fapSkinEnabled !== false && fapSkinNoticeSeen !== true`, `role="region"`, nội dung nêu rõ: giao diện FAP đã được FPTU Schedule làm mới, chỉ đổi diện mạo, chức năng giữ nguyên, tắt được bất cứ lúc nào; hai nút đúng nhãn **"Đã hiểu"** (ghi `fapSkinNoticeSeen: true`) và **"Dùng giao diện gốc"** (ghi `fapSkinEnabled: false` và `fapSkinNoticeSeen: true`). Không bộ đếm giờ, không `autofocus`, không gọi `focus()`, vùng chủ có `pointer-events: none` còn nút và thẻ có `pointer-events: auto`. Lưu thể hiện vào `win.__fptuSkinUi`. Tự gọi khi file nạp trên `fap.fpt.edu.vn`.

- [ ] **Step 1: Write the failing tests** `tests/fap-skin-ui.test.js` (JSDOM + `fakeChrome` như Task 4):

```js
test("the notice shows once, stays until dismissed, and never again after", async () => {
  const win = new JSDOM("<html><body></body></html>").window;
  const chrome = fakeChrome({ store: {} });
  mountSkinUi(win, chrome); await tick();
  const root = win.document.getElementById("fptu-skin-ui").shadowRoot;
  assert.ok(root.querySelector('[role="region"]'));
  await sleepPastAnyTimer();                                   // no auto-dismiss
  assert.ok(root.querySelector('[role="region"]'));
  [...root.querySelectorAll("button")].find((b) => b.textContent.trim() === "Đã hiểu").click();
  assert.strictEqual(chrome.store.fapSkinNoticeSeen, true);
  const win2 = new JSDOM("<html><body></body></html>").window;
  mountSkinUi(win2, chrome); await tick();
  assert.strictEqual(win2.document.getElementById("fptu-skin-ui").shadowRoot.querySelector('[role="region"]'), null);
});

test("'Dùng giao diện gốc' turns the skin off and marks the notice seen", async () => { /* clicks it; expects fapSkinEnabled false and fapSkinNoticeSeen true */ });
test("no notice while the skin is off, but the switch is still there", async () => { /* store { fapSkinEnabled: false } -> no region, switch label "Dùng giao diện FAP mới" */ });
test("the switch flips the setting and its label", async () => { /* click -> fapSkinEnabled false; label changes */ });
test("dismissing in one tab removes the notice in another", async () => { /* chrome.fire({ fapSkinNoticeSeen: { newValue: true } }, "local") */ });
test("mounting twice leaves a single host and a single listener", () => { /* same instance; one #fptu-skin-ui; chrome.listenerCount() === 1 */ });
test("mounting does not steal focus or cover inputs", async () => {
  const win = new JSDOM('<html><body><input id="pw" type="password"></body></html>').window;
  win.document.getElementById("pw").focus();
  mountSkinUi(win, fakeChrome({ store: {} })); await tick();
  assert.strictEqual(win.document.activeElement.id, "pw");
  const host = win.document.getElementById("fptu-skin-ui");
  assert.match(host.getAttribute("style") || "", /pointer-events:\s*none/);
  assert.strictEqual(host.shadowRoot.querySelectorAll("[autofocus]").length, 0);
});
test("mounting survives missing or throwing storage", () => {
  const win = new JSDOM("<html></html>").window;
  assert.doesNotThrow(() => mountSkinUi(win, undefined));
  assert.doesNotThrow(() => mountSkinUi(new JSDOM("<html></html>").window, fakeChrome({ throwOnGet: true })));
});
```

- [ ] **Step 2: Run to verify it fails.** Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `mountSkinUi` theo mô tả; kiểu của thẻ và nút nằm trong Shadow DOM (dùng biến `--fptu-accent` không khả dụng bên trong nên truyền màu bằng thuộc tính tùy chỉnh đặt lên host từ `getComputedStyle(documentElement)`; nếu không đọc được thì dùng màu `blue`). Thẻ ở góc dưới phải, nút chuyển nhỏ ở góc dưới trái hoặc cạnh thẻ, đều không che ô nhập (test ở trên). Nội dung văn bản tiếng Việt, không emoji. Thêm vào `manifest.json`.
- [ ] **Step 4: Run the full suite.** Run: `node --test tests/*.test.js`. Expected: all pass.
- [ ] **Step 5: Commit** `git add lib/fap-skin-ui.js manifest.json tests/fap-skin-ui.test.js && git commit -m "feat(fap-skin): add a quick switch and a one-time notice"`.

---

### Task 12: Lịch học (`/WeeklyTimetable`)

**Files:**
- Create: `tests/fixtures/fap-timetable.html`
- Modify: `lib/fap-skin.css`, `tests/fap-fixture.test.js`, `tests/fap-skin-css.test.js`

**Interfaces:**
- Consumes: thành phần từ Task 8; cách làm sạch fixture ở Task 1.
- Produces: kiểu cho `.fap-page-title__*` (breadcrumb), `.fap-filter-card` và `#weekly-timetable-week-actions` (ô `input[type=week]`, ba nút `.weekly-timetable-week-actions__button`, `--current` là nút chính), `.fap-result-card`, `.weekly-timetable-grid` (đầu bảng, ô, `.weekly-timetable-cell-title`, `.weekly-timetable-attendance-status`, badge `.bg-secondary-subtle`), thẻ di động `.weekly-timetable-mobile-card` (`__slot`, `__content`) và `.weekly-timetable-mobile-anchor`.

- [ ] **Step 1: Write the failing tests.** Fixture test: `fap-timetable.html` có `.weekly-timetable-grid`, `#weekly-timetable-prev`, `.weekly-timetable-mobile-card`, không có email, mã số sinh viên, `<script>` hay input ẩn. Contract test: CSS có `weekly-timetable-grid`, `weekly-timetable-week-actions__button`, `weekly-timetable-mobile-card`, `fap-filter-card`; và mọi selector của skin cho lịch học chỉ dùng lớp hoặc `id`, không dùng `:nth-child` hay vị trí cột (để không phụ thuộc thứ tự cột của FAP).
- [ ] **Step 2: Run to verify they fail.** Expected: FAIL.
- [ ] **Step 3: Create the fixture** từ `Thời khóa biểu tuần ... .mhtml` (như Task 1) và **write the rules**: thẻ lọc kính, nút "Tuần hiện tại" là nút chính, ô lưới là các ô kính bo nhỏ, ô có buổi học nổi nhẹ theo accent, trạng thái điểm danh giữ màu ngữ nghĩa (có mặt xanh lá, vắng đỏ, chưa điểm danh xám) và đọc rõ trên nền kính, thẻ di động bo `18px`. Không đổi DOM nên parser, bộ bắt lịch tự động và toolbar của extension vẫn chạy.
- [ ] **Step 4: Run the full suite.** Expected: all pass.
- [ ] **Step 5: Verify visually** bằng `preview-fap-skin.py` trên MHTML lịch tuần: 1440 và 390, sáng/tối, accent `blue`/`orange`: lưới không tràn ngang, ô trống và ô có buổi phân biệt được, trạng thái điểm danh đọc rõ, thẻ di động xếp dọc gọn.
- [ ] **Step 6: Commit** `git add tests/fixtures/fap-timetable.html lib/fap-skin.css tests && git commit -m "feat(fap-skin): style the weekly timetable"`.

---

### Task 13: Lịch thi (`/ExamSchedule`)

**Files:**
- Create: `tests/fixtures/fap-exam.html`
- Modify: `lib/fap-skin.css`, `tests/fap-fixture.test.js`, `tests/fap-skin-css.test.js`

**Interfaces:**
- Consumes: thành phần từ Task 8 và `.fap-result-card` từ Task 12.
- Produces: kiểu cho `table.fap-sheet.fap-table--stack` (đầu bảng, hàng, ô, hàng khi rê chuột) và chế độ thẻ xếp chồng do `fap-table-cards.js` dựng trên màn hình nhỏ.

- [ ] **Step 1: Write the failing tests.** Fixture test: `fap-exam.html` có `table.fap-sheet.fap-table--stack` với các ô `data-label`, đã làm sạch. Contract test: CSS có `fap-sheet` và `fap-table--stack`, và không ghi đè `content` (để `content: attr(data-label)` của FAP vẫn hoạt động ở chế độ thẻ).
- [ ] **Step 2: Run to verify they fail.** Expected: FAIL.
- [ ] **Step 3: Create the fixture** từ `Lịch thi của tôi ... .mhtml` và **write the rules**: bảng trong thẻ kính, đầu bảng chữ nhỏ màu phụ, hàng sọc nhẹ trong suốt; ở chế độ thẻ mỗi hàng là một thẻ kính bo `18px`. Không tạo kiểu theo vị trí cột.
- [ ] **Step 4: Run the full suite.** Expected: all pass.
- [ ] **Step 5: Verify visually** (1440 và 390, sáng/tối): bảng đọc rõ, không tràn ngang, thẻ xếp chồng trên di động vẫn hiện nhãn cột.
- [ ] **Step 6: Commit** `git add tests/fixtures/fap-exam.html lib/fap-skin.css tests && git commit -m "feat(fap-skin): style the exam schedule"`.

---

### Task 14: Đăng nhập (`/Auth/Login`)

**Files:**
- Create: `tests/fixtures/fap-login.html`
- Modify: `lib/fap-skin.css`, `tests/fap-fixture.test.js`, `tests/fap-skin-css.test.js`

**Interfaces:**
- Consumes: token và thành phần từ Task 7-8.
- Produces: kiểu cho `body.authentication-bg`, `.login-auth-backdrop` (thay gradient xanh của FAP bằng nền ambient theo accent), `.account-pages .card` (thẻ kính bo lớn), `.auth-brand`, `.login-role-tabs` và `.nav-pills .nav-link` (viên thuốc, tab đang chọn dùng accent), `#login-google-link` (nút phụ viền kính), `#login-feid-link` (nút chính accent), `form#frm-parent-login` (nhãn, ô nhập, nút gửi), thông báo lỗi `.text-danger`.

- [ ] **Step 1: Write the failing tests.** Fixture test: `fap-login.html` có `#login-google-link`, `#login-feid-link`, `#frm-parent-login`, không có `<script>`, không có giá trị trong ô nhập, không có site key reCAPTCHA. Contract tests:

```js
test("the login skin only restyles: it never targets inputs by type, value or name", () => {
  assert.doesNotMatch(stripComments(css), /password|\[value|\[autocomplete|\[name=/i); // comments are ignored
});
test("login styles are gated and use the accent variables", () => {
  const login = rules.filter((r) => /authentication-bg|account-pages|login-role-tabs|login-auth-backdrop/.test(r.selector));
  assert.ok(login.length > 0);
  login.forEach((r) => assert.match(r.selector, /^html:not\(\[data-fptu-skin="off"\]\)/));
  assert.ok(login.some((r) => /var\(--fptu-accent/.test(r.body)));
});
```

- [ ] **Step 2: Run to verify they fail.** Expected: FAIL.
- [ ] **Step 3: Create the fixture** từ `Log In _ Fap Fpt Education.mhtml` (bỏ `<script>`, giá trị ô nhập, site key reCAPTCHA và các khối do extension khác chèn vào như `#jpenglishdictionary`) và **write the rules**. Trang không có `data-bs-theme`: dùng giá trị sáng. Giữ nguyên thứ tự và vị trí các nút; không ẩn tab "Phụ huynh" hay thông báo lỗi.
- [ ] **Step 4: Run the full suite.** Expected: all pass.
- [ ] **Step 5: Verify visually** (1440 và 390, accent `blue`/`orange`): thẻ đăng nhập kính, nền ambient thay gradient xanh, hai tab chuyển được và nút đủ lớn để bấm, ô nhập có viền focus nhìn thấy; thông báo giao diện mới (Task 11) ở góc không che thẻ đăng nhập.
- [ ] **Step 6: Commit** `git add tests/fixtures/fap-login.html lib/fap-skin.css tests && git commit -m "feat(fap-skin): style the login page"`.

---

### Task 15: Bộ giữ phiên không chạy trên trang đăng nhập mới

**Files:**
- Modify: `lib/fap-keepalive.js` (`isFapSessionCandidate`)
- Test: `tests/fap-keepalive.test.js`

**Interfaces:**
- Produces: `isFapSessionCandidate(urlPath: string): boolean` trả về `false` cho `/Auth/Login`, `/Auth/GoogleLogin`, `/Auth/FeidLogin`, `/Auth/LoginParent` (không phân biệt hoa thường, kể cả kèm query) và vẫn `true` cho `/WeeklyTimetable`, `/ExamSchedule`, `/`.

- [ ] **Step 1: Write the failing test**:

```js
test("isFapSessionCandidate ignores the new login routes", () => {
  ["/Auth/Login", "/auth/login", "/Auth/GoogleLogin", "/Auth/FeidLogin", "/Auth/LoginParent"].forEach((p) =>
    assert.strictEqual(isFapSessionCandidate(p), false, p));
  ["/WeeklyTimetable", "/ExamSchedule", "/"].forEach((p) => assert.strictEqual(isFapSessionCandidate(p), true, p));
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `node --test tests/fap-keepalive.test.js`. Expected: FAIL.
- [ ] **Step 3: Add** vào phần loại trừ của `isFapSessionCandidate` mọi đường dẫn bắt đầu bằng `/auth/` (so sánh sau `toLowerCase()`).
- [ ] **Step 4: Run the full suite.** Expected: all pass.
- [ ] **Step 5: Commit** `git commit -am "fix(keepalive): do not ping on the new login routes"`.

---

### Task 16: Kiểm tra cuối và đóng gói thử

**Files:** không tạo file mới.

- [ ] **Step 1: Run the full suite.** Run: `node --test tests/*.test.js`. Expected: 100% pass.
- [ ] **Step 2: Build a throwaway package** (không commit, không phát hành): `zip -FS -r <scratch>/check.zip manifest.json *.png popup.html popup.js popup.css background.js content.js lib/ && unzip -l <scratch>/check.zip | grep "lib/fap-skin"`. Expected: có `lib/fap-skin.js`, `lib/fap-skin.css`, `lib/fap-skin-ui.js`; mọi file mà `manifest.json` (kể cả khối mới) tham chiếu đều có trong gói.
- [ ] **Step 3: Visual pass.** Chụp bản xem trước cuối cho cả bốn trang (trang chủ, lịch học, lịch thi, đăng nhập) ở 1440/768/390, sáng/tối, accent `blue` và `orange`, `--skin on` và `--skin off`; ghi nhận trong phản hồi cho người dùng rằng cần **thử thủ công trên FAP thật** (đăng nhập, đổi sáng/tối, thu gọn menu, điện thoại, thanh toán hiển thị, thông báo giao diện mới) vì người dựng không đăng nhập được.
- [ ] **Step 4: Report.** Liệt kê việc còn lại ngoài plan: nâng phiên bản, CHANGELOG, STORE_LISTING, `docs/privacy.html` (do người dùng quyết số phiên bản).
