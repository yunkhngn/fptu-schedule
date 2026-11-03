# FAP Reskin: các trang còn lại Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trau chuốt toàn bộ các trang FAP còn lại (báo cáo, danh sách, biểu mẫu, chi tiết, hồ sơ, thanh toán) theo cùng giao diện kính đã làm ở `2026-11-04-fap-reskin.md`, và chứng minh bằng test rằng không còn lớp CSS nào của FAP bị bỏ sót.

**Architecture:** Cả 32 trang dùng chung một khung và khoảng 6 mẫu lặp lại (bảng kết quả, báo cáo học tập, biểu mẫu, chi tiết, hồ sơ, giỏ thanh toán) cộng hai widget bên thứ ba (DataTables, Select2). Vì vậy việc chia theo **mẫu** chứ không theo trang: mỗi task thêm quy tắc vào `lib/fap-skin.css` cho một mẫu. Một test "độ phủ" quét mọi fixture đã làm sạch và buộc mỗi lớp của FAP phải có quy tắc trong skin hoặc nằm trong danh sách miễn trừ có lý do.

**Tech Stack:** Vanilla CSS, Python 3 (công cụ làm sạch fixture), Node test runner, jsdom, Chrome headless.

**Spec:** `docs/superpowers/specs/2026-11-04-fap-reskin-design.md` (mục "Giai đoạn 5").

**Prerequisite:** Đã hoàn thành `docs/superpowers/plans/2026-11-04-fap-reskin.md` (Task 1 đến 16): `lib/fap-skin.css` có cổng, token, khung chung, thành phần dùng chung, trang chủ, lịch học, lịch thi, đăng nhập; `scripts/preview-fap-skin.py` chạy được; `tests/fap-skin-css.test.js` có các test hợp đồng.

## Global Constraints

- Toàn bộ ràng buộc của plan trước vẫn áp dụng: mọi selector gắn cổng `html:not([data-fptu-skin="off"])`; skin không đổi, ẩn, xóa hay di chuyển phần tử của FAP; không ghi đè `content:`; `backdrop-filter` chỉ ở thanh, hộp thoại, menu thả xuống; sáng/tối theo `[data-bs-theme]`; không emoji; không build tool hay CDN; không tự nâng phiên bản; `node --test tests/*.test.js` đạt 100%.
- Không tạo kiểu cho lớp của extension khác chèn vào trang (`o-*`, `bootstrapiso`, `#jpenglishdictionary`).
- Màu ngữ nghĩa giữ nguyên nghĩa: đạt/có mặt xanh lá, trượt/vắng đỏ, chờ/chưa vàng hoặc xám; chữ phụ trên nền kính đạt tương phản >= 4.5:1.
- Nội dung do người dùng hoặc nhà trường nhập (nội dung tin tức, tài liệu) chỉ được chỉnh ở vùng chứa và kiểu chữ an toàn; không đổi bố cục bên trong nó.
- `page-fap/` chứa dữ liệu cá nhân và bị `.gitignore`; không commit, không dán nội dung của nó vào repo hay vào tin nhắn commit. Fixture trong `tests/fixtures/pages/` bắt buộc đi qua công cụ làm sạch ở Task 1.

## Review Focus

1. Mã QR thanh toán (`.shopping-cart-qr`) bị nền trong suốt, mờ hay lọc màu thì ngân hàng không quét được: phải giữ nền trắng đặc. (Task 5)
2. Bảng dài và chữ tiếng Việt dài (Khung chương trình, Bảng điểm, Môn học, Giao dịch): bảng phải cuộn ngang bên trong thẻ chứ không làm tràn cả trang; số và nhãn không bị cắt. (Task 3, Task 4)
3. Phần tử do JavaScript thêm sau khi tải (DataTables, Select2, flatpickr, lớp `dtr-control`, hộp thả xuống của Select2 gắn vào `body`): CSS phải bao cả các lớp này dù chúng không có trong HTML ban đầu. (Task 3, Task 5)
4. Trạng thái rỗng và lỗi (`fap-empty-state`, `fap-empty-card`, `.alert`, `.field-validation-*`, `.is-invalid`): vẫn đọc rõ, không biến mất trên nền kính. (Task 3, Task 5)
5. Các hộp thoại chồng lên thanh trên, thông báo "giao diện mới" và menu thả xuống: thứ tự lớp (`z-index`) đúng, hộp thoại luôn ở trên cùng và khóa cuộn như FAP. (Task 5)

---

## File Structure

- Tạo `scripts/sanitize-fap-page.py`: chuyển MHTML thành fixture đã làm sạch.
- Tạo `tests/fixtures/pages/<slug>.html` (một file cho mỗi trang) và `tests/fixtures/pages/index.json` (slug, đường dẫn, mẫu).
- Tạo `tests/helpers/fap-skin-css.js` (dùng chung `css`, `stripComments`, `parseRules`; `tests/fap-skin-css.test.js` chuyển sang dùng nó).
- Tạo `tests/fap-pages-fixtures.test.js` (kiểm tra làm sạch) và `tests/fap-skin-coverage.test.js` (độ phủ lớp CSS).
- Tạo `tests/fixtures/pages/unstyled-ok.json` (lớp miễn trừ kèm lý do).
- Sửa `lib/fap-skin.css`.

### Các mẫu và trang tương ứng (đã khảo sát từ bản lưu thật)

| Mẫu | Trang (đường dẫn) | Lớp đặc trưng |
|---|---|---|
| Danh sách/bảng kết quả | `/Subject`, `/News`, `/Document`, `/Transaction`, `/Curriculum`, `/Application` (Xem đơn), `/Application/Catalog` (Gửi đơn), `/MyCertificates`, `/FyeCheckInLog`, `/FyeMentorFeedback`, `/Wishlist` | `fap-filter-card`, `fap-page-size-select`, `fap-result-card`, `fap-sheet`, `fap-sheet-col-index`, `fap-sheet-scroll`, `fap-sheet-sort`, `fap-table--stack`, `fap-table-card__actions`, `fap-table-card--empty`, DataTables (`dataTables_wrapper`, `dataTables_paginate`, `paginate_button`, `paging_simple_numbers`, `sorting*`, `dtr-control`, `dt-bootstrap5`) |
| Báo cáo học tập | `/Report/Grade`, `/Report/Attendance`, `/Report/Transcript`, `/Report/OjtConditions`, `/Report/ThesisConditions` | `academic-report*`, `attendance-chip*`, `attendance-status*`, `attendance-summary*`, `attendance-session-sheet`, `grade-status*`, `grade-average`, `mark-score`, `student-mark-sheet`, `sheet-group-cell`, `sheet-row-total`, `sheet-grand-total`, `graduate-condition-*`, Select2 |
| Biểu mẫu | `/Application/Create`, `/StudentProfile`, `/StartupGroup/Add`, `/Wishlist/Register`, `/CrossClassChange/Create` | `form-*`, `field-validation-valid`, `fap-form-footer`, `fap-wishlist-register`, `wishlist-register-preview-*`, `fap-back-btn`, `fap-list-page`, modal |
| Chi tiết | `/News/Detail/...`, `/Document/Detail/...` | `fap-news-detail-*`, `fap-news-badge*`, `fap-news-attachment*`, `fap-news-content*`, `fap-detail-*`, `fap-document-*` |
| Hồ sơ | `/Account` | `student-profile*`, `student-parent-card`, `account-page`, `account-tabs` |
| Thanh toán và danh sách rỗng | `/ShoppingCart`, `/CoursePendingPayment`, `/StartupGroup`, `/CrossClassChange` | `shopping-cart-*`, `fap-empty-state`, `fap-empty-card`, `fap-create-btn` |

---

### Task 1: Công cụ làm sạch và fixture cho mọi trang

**Files:**
- Create: `scripts/sanitize-fap-page.py`, `tests/fixtures/pages/*.html`, `tests/fixtures/pages/index.json`
- Test: `tests/fap-pages-fixtures.test.js`

**Interfaces:**
- Produces: lệnh `python3 scripts/sanitize-fap-page.py <file.mhtml> <out.html>`; mỗi fixture là một tài liệu HTML chỉ gồm `<div class="content-page">…</div>` (không có `<script>`, `<style>`, `<link>`, `<iframe>`, `input[type=hidden]`), đã bỏ ảnh dạng `data:` và khối do extension khác chèn vào, mỗi `tbody` giữ tối đa 3 hàng; `index.json` là mảng `{ slug, route, pattern }` với `pattern` thuộc `list|report|form|detail|profile|cart|empty`.
- Quy tắc làm sạch: giữ nguyên chữ trong `th`, `label`, `legend`, `button`, `.btn`, `.badge`, `h1`-`h6`, `.fap-page-title*`, `.card-header`, `.modal-title`, `option`, `.alert`; mọi văn bản khác bị thay theo từng ký tự (chữ thường -> `a`, chữ hoa -> `A`, chữ số -> `0`, giữ khoảng trắng và dấu câu); xóa `value` của input, nội dung textarea, chuỗi truy vấn và định danh trong `href`/`src`.

- [ ] **Step 1: Write the failing test** `tests/fap-pages-fixtures.test.js`:

```js
const dir = path.join(__dirname, "fixtures", "pages");
const index = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));

test("every page in the survey has a fixture", () => {
  assert.ok(index.length >= 31);
  index.forEach((p) => assert.ok(fs.existsSync(path.join(dir, p.slug + ".html")), p.slug));
  assert.ok(new Set(index.map((p) => p.pattern)).size >= 6);
});
test("fixtures are structure-only and free of personal data", () => {
  index.forEach(({ slug }) => {
    const html = fs.readFileSync(path.join(dir, slug + ".html"), "utf8");
    const doc = new JSDOM(html).window.document;
    assert.ok(doc.querySelector(".content-page"), slug);
    assert.strictEqual(doc.querySelectorAll("script,style,link,iframe,input[type=hidden]").length, 0, slug);
    assert.doesNotMatch(html, /[\w.+-]+@[\w-]+(\.[\w-]+)+/, slug + ": email");
    assert.doesNotMatch(html, /\b[A-Z]{2}\d{5,}\b/, slug + ": student id");
    assert.doesNotMatch(html, /(?:\+84|\b0)\d{8,10}\b|\b\d{9,}\b/, slug + ": phone or long number");
    doc.querySelectorAll("tbody").forEach((tb) => assert.ok(tb.querySelectorAll(":scope > tr").length <= 3, slug));
    doc.querySelectorAll("input:not([type=checkbox]):not([type=radio]), textarea").forEach((el) =>
      assert.ok(!(el.getAttribute("value") || el.textContent), slug + ": field value"));
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `node --test tests/fap-pages-fixtures.test.js`. Expected: FAIL (không có `index.json`).
- [ ] **Step 3: Implement `scripts/sanitize-fap-page.py`** bằng thư viện chuẩn (`email` để tách MHTML, `html.parser` hoặc `re` cho thao tác, không phụ thuộc ngoài) theo các quy tắc ở trên, rồi chạy cho mọi file trong `page-fap/` (đặt `slug` theo đường dẫn, ví dụ `/Report/Attendance` -> `report-attendance`, trang chủ -> `home`) và ghi `index.json`. Trang chủ, lịch học, lịch thi, đăng nhập đã có fixture riêng ở plan trước; vẫn tạo bản mới ở đây để dùng cho test độ phủ (không xóa bản cũ).
- [ ] **Step 4: Run to verify it passes.** Run: `node --test tests/fap-pages-fixtures.test.js`. Expected: PASS. Mở ngẫu nhiên hai fixture để chắc không còn tên người, số điện thoại, địa chỉ; nếu còn, sửa quy tắc rồi chạy lại.
- [ ] **Step 5: Commit** `git add scripts/sanitize-fap-page.py tests/fixtures/pages tests/fap-pages-fixtures.test.js && git commit -m "test: add a sanitizer and fixtures for every FAP page"`.

---

### Task 2: Test độ phủ lớp CSS

**Files:**
- Create: `tests/helpers/fap-skin-css.js`, `tests/fap-skin-coverage.test.js`, `tests/fixtures/pages/unstyled-ok.json`
- Modify: `tests/fap-skin-css.test.js` (dùng helper)

**Interfaces:**
- Produces: `tests/helpers/fap-skin-css.js` xuất `{ css, stripComments(css: string): string, parseRules(css: string): { selector: string, body: string, at: string | null }[], rules }` (chuyển từ định nghĩa nội bộ của `tests/fap-skin-css.test.js`); `unstyled-ok.json` là đối tượng `{ "<class>": "<lý do>" }`.
- Test độ phủ: gom mọi lớp trong `.content-page` của mọi fixture, bỏ qua tiện ích Bootstrap (`m*-`, `p*-`, `d-`, `col*`, `row`, `g-`, `gap-`, `text-`, `fw-`, `fs-`, `flex*`, `align*`, `justify*`, `w-`, `h-`, `border*`, `rounded*`, `bg-*` (nền ngữ nghĩa được tính là thành phần ở Task 8 plan trước), `ri-*`, `js-*`, `o-*`, `bootstrapiso`), và buộc mỗi lớp còn lại **xuất hiện trong `lib/fap-skin.css`** (trong selector) hoặc là khóa trong `unstyled-ok.json`.

- [ ] **Step 1: Write the test**:

```js
test("every FAP class on every page is styled or explicitly excused", () => {
  const used = classesInFixtures({ ignore: BOOTSTRAP_UTILITY_AND_THIRD_PARTY });
  const selectors = rules.map((r) => r.selector).join(" ");
  const excused = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/pages/unstyled-ok.json"), "utf8"));
  const missing = used.filter((c) => !selectors.includes("." + c) && !(c in excused));
  assert.deepStrictEqual(missing, [], "style these or add them to unstyled-ok.json with a reason");
});
test("every excuse still applies to a class that exists", () => {
  Object.keys(excused).forEach((c) => assert.ok(used.includes(c), c + " is excused but unused"));
  Object.values(excused).forEach((why) => assert.ok(why.length >= 10));
});
```

- [ ] **Step 2: Run to verify it fails.** Expected: FAIL, liệt kê các lớp chưa có kiểu (danh sách này chính là phạm vi của Task 3 đến 7).
- [ ] **Step 3: Seed `unstyled-ok.json`** chỉ với các lớp thuần bố cục không cần kiểu, mỗi lớp kèm lý do (`content`, `content-page`, `nowrap`, `all`, `even`, `odd`, `input`, `selection`, `notranslate`, `list-unstyled`, `header-title`, `select2-hidden-accessible`, `dataTable`, `dtr-inline`...). Không đưa vào đây bất kỳ lớp nào có ý nghĩa thị giác.
- [ ] **Step 4: Commit** (test còn đỏ có chủ ý nên **không** chạy cả bộ test): `git add tests && git commit -m "test: add a CSS coverage check for every FAP page class (failing by design)"`. Từ Task 3 đến 7 mỗi task làm cho phần của mình hết đỏ; Task 8 yêu cầu toàn bộ xanh.

---

### Task 3: Mẫu danh sách và bảng kết quả (kèm DataTables, Select2)

**Files:**
- Modify: `lib/fap-skin.css`

**Interfaces:**
- Consumes: thành phần Task 8 và thẻ `.fap-result-card` của plan trước.
- Produces: kiểu cho `.fap-filter-card`, `.fap-filter-actions(--end)`, `.fap-page-size-select`, `.fap-result-card` (`__title`, `__code`, `__meta`), `.fap-sheet`, `.fap-sheet-col-index`, `.fap-sheet-scroll`, `.fap-sheet-sort`, `.fap-table--stack` (cả chế độ thẻ), `.fap-table-card--empty`, `.fap-table-card__actions`, `.sheet-group-cell`, `.sheet-row-total`, `.sheet-grand-total`, `.fap-empty-state`, `.fap-empty-card`, `.fap-create-btn`, `.fap-back-btn`, `.fap-list-page`, `.fap-status(--ok)`; DataTables: `.dataTables_wrapper`, `.dataTables_length`, `.dataTables_filter`, `.dataTables_info`, `.dataTables_paginate`, `.paginate_button` (và trạng thái `.current`, `.disabled`), `.paging_simple_numbers`, `.sorting`, `.sorting_asc`, `.sorting_desc`, `.sorting_disabled`, `.dtr-control`, `.dt-bootstrap5`; Select2: `.select2-container`, `.select2-selection`, `.select2-selection__rendered`, `.select2-selection__arrow`, `.select2-dropdown`, `.select2-results__option` (và `--highlighted`, `[aria-selected=true]`), `.select2-search__field`.

- [ ] **Step 1: Run the coverage test** và ghi lại phần thuộc mẫu này còn đỏ. Expected: các lớp trong danh sách trên nằm trong "missing".
- [ ] **Step 2: Write the rules.** Bảng nằm trong thẻ kính; vùng `.fap-sheet-scroll` và `.table-responsive` cuộn ngang bên trong thẻ (không làm tràn trang); đầu bảng chữ nhỏ màu phụ, hàng sọc nhẹ trong suốt, hàng tổng (`sheet-*-total`) nổi bằng nền accent nhạt; mũi tên sắp xếp của `sorting*` chỉ đổi màu và độ mờ (không ghi đè `content`); phân trang dạng viên thuốc, trang hiện tại dùng accent; `.dropdown` của Select2 là kính có `backdrop-filter` (nằm trong danh sách được phép), ô đang chọn dùng accent; chế độ thẻ xếp chồng mỗi hàng là thẻ bo `18px` và nhãn cột vẫn hiện.
- [ ] **Step 3: Add contract assertions** vào `tests/fap-skin-css.test.js`: `.select2-dropdown` và `.dataTables_paginate` có quy tắc; mọi selector của mẫu này chỉ dùng lớp hoặc `id`, không `:nth-child`.
- [ ] **Step 4: Run** `node --test tests/fap-skin-css.test.js`. Expected: PASS.
- [ ] **Step 5: Verify visually** với `preview-fap-skin.py` trên `Quản lý môn học`, `Tin tức`, `Giao dịch`, `Khung chương trình của tôi`, `Xem đơn` ở 1440 và 390, sáng/tối: bảng cuộn ngang trong thẻ, phân trang và ô lọc đọc rõ, thẻ xếp chồng ở 390 đúng.
- [ ] **Step 6: Commit** `git commit -am "feat(fap-skin): style list pages, tables, DataTables and Select2"`.

---

### Task 4: Báo cáo học tập

**Files:**
- Modify: `lib/fap-skin.css`

**Interfaces:**
- Produces: kiểu cho `.academic-report`, `.academic-report-content`, `.academic-report-loading`, `.academic-report-select-hint`, `.academic-report-term-select`, `.academic-report-course-select`, `.attendance-chip` (`--date`, `--slot`), `.attendance-status` (`--present` xanh lá, `--absent` đỏ, `--pending` vàng/xám, `--exempt` xanh dương nhạt), `.attendance-summary` (`--ok`, `--danger`, `__badge`, `__main`), `.attendance-session-sheet`, `.attendance-col-index`, `.grade-status` (`--passed`, `--failed`, `--studying`, `--neutral`), `.grade-average`, `.mark-score`, `.student-mark-sheet`, `.student-mark-col-score`, `.is-passed`, `.is-failed`, `.graduate-condition-*`.

- [ ] **Step 1: Run the coverage test** và ghi các lớp còn đỏ thuộc mẫu này.
- [ ] **Step 2: Write the rules.** Trạng thái là viên thuốc có **chữ** (không chỉ màu): xanh lá/đỏ/vàng/xám đạt tương phản chữ >= 4.5:1 trên nền kính ở cả sáng và tối; thẻ tóm tắt điểm danh (`attendance-summary`) bo lớn, `--danger` dùng đỏ cảnh báo; bảng điểm (`student-mark-sheet`) cuộn ngang bên trong thẻ, cột điểm căn phải và dùng số có chiều rộng đều (`font-variant-numeric: tabular-nums`).
- [ ] **Step 3: Add contract assertion**: mỗi biến thể trạng thái (`present`, `absent`, `pending`, `passed`, `failed`) có quy tắc riêng và không dùng accent làm màu ngữ nghĩa.
- [ ] **Step 4: Run** `node --test tests/*.test.js`. Expected: các test mẫu này PASS (test độ phủ còn đỏ ở các mẫu khác là chủ ý).
- [ ] **Step 5: Verify visually** trên `Báo cáo điểm danh`, `Báo cáo điểm`, `Báo cáo bảng điểm transcript`, `Thông báo điều kiện OJT`: chip trạng thái phân biệt được, không tràn ngang, sáng/tối đạt tương phản (lấy mẫu pixel như đã làm với popup).
- [ ] **Step 6: Commit** `git commit -am "feat(fap-skin): style the academic report pages"`.

---

### Task 5: Biểu mẫu, hộp thoại và thanh toán

**Files:**
- Modify: `lib/fap-skin.css`

**Interfaces:**
- Produces: kiểu cho `.form-label`, `.form-control`, `.form-select`, `.form-check`, `textarea`, trạng thái `:disabled`, `[readonly]`, `.is-invalid`/`.is-valid`, `.invalid-feedback`, `.field-validation-valid`, `.field-validation-error`, `.alert-*`, `.fap-form-footer`, `.fap-wishlist-register`, `.wishlist-register-preview-grid`, `.wishlist-register-preview-stat` (`--emphasis`, `__label`, `__value`, `__value--accent`, `__value--danger`), `.shopping-cart-summary-card`, `.shopping-cart-summary__row`, `.shopping-cart-summary__value(--accent)`, `.shopping-cart-amount`, `.shopping-cart-payment-card`, `.shopping-cart-payment-label`, **`.shopping-cart-qr`**, `.modal-header`, `.modal-body`, `.modal-footer`, `.modal-backdrop`, `.note-modal-body`, và kiểu chọn ngày của flatpickr (`.flatpickr-calendar`, `.flatpickr-day.selected`).

- [ ] **Step 1: Write the failing tests** trong `tests/fap-skin-css.test.js`:

```js
test("the payment QR keeps an opaque white background so banks can scan it", () => {
  const qr = rules.filter((r) => /shopping-cart-qr/.test(r.selector));
  assert.ok(qr.length > 0);
  qr.forEach((r) => {
    assert.match(r.body, /background(-color)?:\s*(#fff(fff)?|white)\b/i);
    assert.doesNotMatch(r.body, /opacity:\s*0?\.|filter:|mix-blend-mode|backdrop-filter/);
  });
});
test("dialogs stack above the topbar and the skin notice", () => {
  const z = (sel) => Number((rules.find((r) => sel.test(r.selector) && /z-index/.test(r.body)) || { body: "" }).body.match(/z-index:\s*(\d+)/)?.[1] || 0);
  assert.ok(z(/modal-backdrop/) >= 1040 && z(/\.modal(?![-\w])/) >= 1050);
});
test("form validation and disabled states are visibly styled", () => {
  ["\\.is-invalid", "field-validation-error|invalid-feedback", "\\.form-control:disabled|\\.form-control\\[readonly\\]", "\\.form-control:focus"]
    .forEach((p) => assert.match(css, new RegExp(p)));
});
```

- [ ] **Step 2: Run to verify they fail.** Expected: FAIL.
- [ ] **Step 3: Write the rules.** Ô nhập kính nhẹ với viền focus accent rõ ràng (không bỏ đường viền focus); `:disabled`/`[readonly]` nhìn khác ô thường; lỗi kiểm tra dữ liệu dùng đỏ có chữ; hộp thoại là kính có blur và `z-index` đúng (mặc định Bootstrap 1050/1040 hoặc cao hơn, và cao hơn thanh trên của skin); khối `.shopping-cart-qr` nền trắng đặc, bo nhẹ, đệm trắng quanh mã, không phủ gradient; số tiền (`.shopping-cart-amount`) cỡ chữ lớn, tương phản cao.
- [ ] **Step 4: Run the full suite.** Expected: các test mẫu này PASS.
- [ ] **Step 5: Verify visually** trên `Cập nhật hồ sơ sinh viên`, `Các loại đơn khác`, `Đăng ký chờ lớp`, `Thanh toán các khoản phải nộp`, `Tạo yêu cầu đổi lớp` (kể cả mở một hộp thoại bằng cách đặt `display:block` trong bản xem trước): ô nhập, lỗi, nút gửi, QR còn nền trắng đặc, hộp thoại ở trên thanh trên.
- [ ] **Step 6: Commit** `git commit -am "feat(fap-skin): style forms, dialogs and the payment page"`.

---

### Task 6: Trang chi tiết (tin tức, tài liệu)

**Files:**
- Modify: `lib/fap-skin.css`

**Interfaces:**
- Produces: kiểu cho `.fap-news-detail-card`, `.fap-news-detail-header` (`__badges`), `.fap-news-detail-title`, `.fap-news-detail-meta` (`__item`, `__item--expiry`), `.fap-news-badge` (`--type`, `--pinned`), `.fap-news-content-wrapper`, `.fap-news-content`, `.fap-news-attachment` (`__body`, `__btn`, `__hint`, `__icon`, `__label`), `.fap-news-detail-actions`, `.fap-detail-grid`, `.fap-detail-field` (`__label`, `__value`, `__value--muted`), `.fap-detail-flags`, `.fap-document-detail`, `.fap-document-body` (`__head`, `__title`), `.fap-document-content` (`--empty`), `.fap-document-file-btn`. (`news-detail.css` của FAP có luật `data-bs-theme="dark"` riêng; skin phải thắng nó bằng độ ưu tiên của cổng.)

- [ ] **Step 1: Run the coverage test** và ghi các lớp còn đỏ thuộc mẫu này.
- [ ] **Step 2: Write the rules.** Thẻ chi tiết kính; tiêu đề lớn, hàng meta và badge dạng viên thuốc; vùng nội dung (`.fap-news-content`, `.fap-document-content`) chỉ có nền, đệm và kiểu chữ an toàn: `img, video, iframe, table` bên trong có `max-width: 100%` (bảng bọc cuộn ngang), liên kết dùng accent; **không** đổi bố cục hay `display` bên trong nội dung do người dùng nhập.
- [ ] **Step 3: Add contract assertion**: không có selector nào của skin nhắm `.fap-news-content` kèm tổ hợp con trừ `img|video|iframe|table|a|pre|code|blockquote`.
- [ ] **Step 4: Run** `node --test tests/*.test.js`. Expected: các test mẫu này PASS.
- [ ] **Step 5: Verify visually** trên `Chi tiết tin tức` và `Chi tiết tài liệu`, 1440 và 390, sáng/tối: tiêu đề và meta gọn, nội dung dài đọc dễ, ảnh không tràn.
- [ ] **Step 6: Commit** `git commit -am "feat(fap-skin): style the news and document detail pages"`.

---

### Task 7: Hồ sơ cá nhân

**Files:**
- Modify: `lib/fap-skin.css`

**Interfaces:**
- Produces: kiểu cho `.student-profile` (`-hero`, `-hero__main`, `-hero__identity`, `-hero__content`, `-avatar`, `-name`, `-badges`, `-meta`, `-contact`, `-contact__item`, `-grid`, `-grid--single-lg`, `-field`, `-field__label`, `-field__value`, `-stack`), `.student-parent-card`, `.account-page`, `.account-tabs` (tab Bootstrap dạng viên thuốc như trang đăng nhập).

- [ ] **Step 1: Run the coverage test** và ghi các lớp còn đỏ.
- [ ] **Step 2: Write the rules.** Phần hero là thẻ gradient accent như thẻ sinh viên ở trang chủ (chữ trắng, tương phản đạt); lưới trường thông tin hai cột trên desktop và một cột trên di động, nhãn nhỏ màu phụ, giá trị đậm; tab dạng viên thuốc, tab đang chọn dùng accent; thẻ phụ huynh kính.
- [ ] **Step 3: Run** `node --test tests/*.test.js`. Expected: các test mẫu này PASS.
- [ ] **Step 4: Verify visually** trên `Thông tin cá nhân` (bản MHTML thật, chỉ xem cục bộ) ở 1440 và 390: không vỡ lưới, chữ trên hero đọc rõ. Không chụp ảnh nào chứa dữ liệu thật ra ngoài thư mục tạm.
- [ ] **Step 5: Commit** `git commit -am "feat(fap-skin): style the account and profile pages"`.

---

### Task 8: Quét toàn bộ, chốt độ phủ

**Files:**
- Modify: `lib/fap-skin.css` (nếu còn lớp sót), `tests/fixtures/pages/unstyled-ok.json`

- [ ] **Step 1: Run the full suite.** Run: `node --test tests/*.test.js`. Expected: 100% pass, trong đó test độ phủ xanh. Lớp nào còn thiếu thì tạo kiểu (ưu tiên) hoặc thêm vào `unstyled-ok.json` kèm lý do cụ thể; không được thêm lớp có ý nghĩa thị giác chỉ để làm test xanh.
- [ ] **Step 2: Visual sweep.** Chạy `preview-fap-skin.py` cho **cả 32 trang** ở 1440 và 390, sáng/tối (trang đăng nhập chỉ sáng), lưu ảnh vào thư mục tạm ngoài repo; ghép mỗi trang thành một bảng thu nhỏ để xem lướt. Tìm: chữ không đọc được, tràn ngang, phần tử chồng nhau, nút biến mất, biểu mẫu mất viền. Sửa từng lỗi tìm được kèm một assertion hợp đồng nếu có thể.
- [ ] **Step 3: Throwaway package check** như Task 16 của plan trước: gói thử bằng lệnh đóng gói chuẩn vào thư mục tạm, xác nhận `lib/fap-skin.css` có mặt, không commit gói.
- [ ] **Step 4: Report.** Nêu rõ: số trang đã quét, lớp nào được miễn trừ và vì sao, và nhắc người dùng **thử thủ công trên FAP thật**: đặc biệt gửi một đơn (biểu mẫu), mở một hộp thoại, trang thanh toán với mã QR (quét thử bằng ứng dụng ngân hàng), phân trang và sắp xếp bảng, chọn bộ lọc Select2 trên báo cáo. Liệt kê việc ngoài plan: nâng phiên bản, CHANGELOG, STORE_LISTING, `docs/privacy.html`.
- [ ] **Step 5: Commit** `git add -A lib tests && git commit -m "test: complete FAP page class coverage"` (chỉ khi có thay đổi).
