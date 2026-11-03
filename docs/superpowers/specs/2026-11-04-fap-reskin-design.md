# Design: Giao diện FAP mới (FAP Reskin)

**Ngày:** 2026-11-04
**Phạm vi:** Trang web FAP (`https://fap.fpt.edu.vn/*`), thông qua content script và CSS của extension. Popup không thuộc phạm vi, ngoại trừ một công tắc.

## Ý định và lý do

Giao diện FAP mới (dựng trên mẫu admin Jidox / Bootstrap 5) bị người dùng đánh giá là xấu. Tác giả muốn extension thay lớp hiển thị của FAP bằng một giao diện đẹp hơn mà mọi chức năng của FAP vẫn chạy y nguyên.

Đây là việc đổi **diện mạo**, không phải dựng lại ứng dụng. FAP vẫn là "bộ máy": form, nút, dropdown, thanh toán, phiên đăng nhập, script của FAP đều giữ nguyên. Extension chỉ phủ lên một lớp kiểu dáng.

## Hướng thiết kế đã chốt (do người dùng chọn)

Mẫu tham chiếu: dashboard "Finexy" (thẻ nổi bo góc lớn trên nền xám nhạt; thanh trên là một viên thuốc nổi; menu trái là một thẻ riêng; mục đang chọn là một viên thuốc màu nhấn; ô tìm kiếm dạng viên thuốc; bóng đổ mềm), pha **glassmorphism**: nền có ba mảng màu loang, thanh trên, menu trái, thẻ và hộp thoại trong suốt có viền sáng mảnh.

Người dùng đã xem hai bản mockup và chọn **hướng A: giữ nguyên bố cục và vị trí các khối của FAP, chỉ đổi diện mạo**. Không có thẻ nào lấy dữ liệu từ extension được thêm vào trang FAP (hướng B bị loại).

Mockup đã duyệt: `docs/superpowers/specs/assets/2026-11-04-fap-reskin-mockup.html` (mở bằng trình duyệt; phần A là hướng được duyệt, phần B bị loại). Các điểm chính của nó:
- Thanh trên nổi dạng viên thuốc: logo, ô tìm kiếm, chip cơ sở, nút sáng/tối, chuông, người dùng.
- Menu trái là một thẻ kính bo lớn có nhóm nhãn; mục đang chọn là viên thuốc gradient màu nhấn.
- Thẻ thông tin sinh viên là gradient màu nhấn với các ô số liệu bo góc.
- Danh sách tin tức và Menu nhanh là thẻ kính; chip lọc dạng viên thuốc.

## Mục tiêu

1. Toàn bộ trang FAP (mọi đường dẫn) đổi diện mạo nhất quán: phông chữ, màu, bo góc, bóng đổ, thanh trên, menu trái, chân trang, thẻ, bảng, nút, form, badge, hộp thoại, phân trang.
2. Bốn trang được trau chuốt riêng, theo thứ tự ưu tiên: **trang chủ (dashboard), lịch học (`/WeeklyTimetable`), lịch thi (`/ExamSchedule`), đăng nhập**.
3. Không làm hỏng bất kỳ chức năng nào của FAP.
4. Không nháy giao diện cũ trước khi skin hiện ra (FOUC).
5. Hỗ trợ sáng/tối theo công tắc có sẵn của FAP, và màu nhấn theo lựa chọn của người dùng trong popup.
6. Tắt được bằng một cú nhấp trong popup, và có cách quay lại giao diện gốc ngay trên trang.
7. Người dùng được báo một lần rằng giao diện FAP đã thay đổi (xem mục Thông báo giao diện mới).

## Phi mục tiêu

- Không tạo lại DOM, không đổi tên, di chuyển, ẩn hoặc xóa phần tử của FAP. Không đổi thuộc tính, `id`, `name`, `type`, `href`, `action` của chúng.
- Không đọc, thu thập hay gửi đi dữ liệu nào từ trang FAP bằng skin. Skin không thêm request nào tới FAP.
- Không thêm thẻ dữ liệu của extension vào trang FAP (đã loại hướng B).
- Không hứa trau chuốt từng trang khác ngoài bốn trang ưu tiên; các trang còn lại chỉ cần nhận skin chung và không bị vỡ.
- Không dùng thư viện, build tool, CDN, phông chữ từ máy chủ ngoài, hay mã tải từ xa (quy tắc dự án và chính sách Chrome Web Store).

## Phản mục tiêu (thất bại dù trông đẹp)

- Bất kỳ chức năng nào của FAP ngừng hoạt động hoặc khó dùng hơn (thanh toán, tìm kiếm, thông báo, đăng nhập, điều hướng, menu thu gọn, giao diện điện thoại).
- Chữ không đọc được (tương phản thấp trên nền kính), hoặc nội dung bị che mất.
- Trang chậm hoặc giật khi cuộn.
- Skin che hoặc làm giả thông tin an toàn trên trang đăng nhập (ví dụ ẩn thông báo, giả nút).
- Thông báo giao diện mới che hoặc chặn thao tác trên trang FAP (đặc biệt ô đăng nhập và các nút chính), hoặc tự biến mất trước khi người dùng đọc.

## Ràng buộc

- Manifest V3, Vanilla CSS và JS, không phụ thuộc ngoài. Mã logic dùng chung nằm trong `lib/` theo mẫu UMD.
- Test chạy bằng `node --test tests/*.test.js`, phải đạt 100%. Tính năng mới cần test.
- Không dùng emoji trong giao diện. Icon dùng SVG hoặc bộ icon Remix mà FAP đã nạp sẵn.
- Gói phát hành hiện được tạo bằng lệnh liệt kê cứng `manifest.json *.png popup.* background.js content.js lib/` (xem `AGENTS.md`). Nếu thêm thư mục CSS mới thì lệnh đóng gói trong `AGENTS.md` và `zip-extension.sh` phải được cập nhật.
- Số phiên bản phát hành do người dùng quyết; không tự nâng.
- Các file lưu trang FAP (`page-fap/`) chứa dữ liệu cá nhân và bị `.gitignore`; không commit. Fixture đưa vào `tests/fixtures/` phải được làm sạch (tên, mã số sinh viên, email).

## Hiện trạng FAP (đã đọc từ bản lưu MHTML của trang chủ)

- Khung: `html[data-bs-theme="light|dark"][data-layout-mode][data-menu-color][data-topbar-color][data-layout-position][data-sidenav-size]`. `div.wrapper` chứa `div.navbar-custom > .topbar.fap-topbar`, `aside.leftside-menu.fap-sidebar` (menu `ul.side-nav`, nhóm thu gọn `.side-nav-second-level`) và `div.content-page > .content > .container-fluid`, cuối là `footer.footer`.
- Giao diện điều khiển bằng khoảng 466 biến `--ct-*` (ví dụ `--ct-primary: #4254ba`, `--ct-body-bg`, `--ct-secondary-bg` (nền thẻ), `--ct-tertiary-bg`, `--ct-border-color`, `--ct-border-radius: 0.15rem`, `--ct-font-sans-serif: Roboto`, `--ct-topbar-bg`, `--ct-menu-bg`, `--ct-leftbar-width`, `--ct-topbar-height`). Chế độ tối dùng `html[data-bs-theme="dark"]` (28 quy tắc trong `app.min.css`, 61 trong `style.css`).
- FAP có khoảng 113 lớp riêng theo BEM với tiền tố `fap-` (`fap-topbar`, `fap-sidebar`, `fap-page-title`, `fap-topbar-pill`, `fap-topbar-icon`, `fap-home-student-card__*`, `fap-home-fee__*`, `fap-home-news-*`, `fap-home-quick-menu__*`, `fap-sheet`, `fap-table--stack`, `fap-filter-card`, `fap-chip`...), nằm trong `/css/style.css` và `/css/home.css`.
- Trang chủ: khối thông tin sinh viên, học phí và tin tức không có sẵn trong HTML ban đầu mà được đổ vào `[data-home-slot="fee|student|news"]` bằng `fetch` tới `/Home/StudentContentPartial`. CSS áp được cho phần tải sau.
- Script của FAP (`home.js`, `fap-table-cards.js`, `sidebar-state.js`, `notification-bell.js`...) bám vào lớp và ID hiện có.
- Các CSS của FAP có mã phiên bản (`?v=...`) nên FAP triển khai lại thường xuyên; selector có thể đổi theo thời gian.
- **Lịch học (`/WeeklyTimetable`)**: cùng khung với trang chủ. Nội dung: breadcrumb `fap-page-title__*`, thẻ lọc `.card.fap-filter-card` với ô chọn tuần (`#weekly-timetable-week`, `input[type=week]`) và ba nút `weekly-timetable-week-actions__button` (`#weekly-timetable-prev|current|next`), thẻ kết quả `.fap-result-card` chứa `.weekly-timetable-grid` (bảng desktop; ô có `weekly-timetable-cell-title`, `weekly-timetable-attendance-status`, badge `bg-secondary-subtle`) và các thẻ di động `weekly-timetable-mobile-card` (`__slot`, `__content`, `weekly-timetable-mobile-anchor`). Parser của extension dựa trên chính DOM này.
- **Lịch thi (`/ExamSchedule`)**: cùng khung; nội dung là một `.card.fap-result-card` chứa `table.table-striped.table-hover.fap-sheet.fap-table--stack[data-fap-table-cards]` với các ô `data-label` (script `fap-table-cards.js` của FAP dựng chế độ thẻ xếp chồng trên điện thoại).
- **Đăng nhập (`/Auth/Login?ReturnUrl=...`)**: khác khung. `body.authentication-bg` với `.login-auth-backdrop` (gradient xanh của FAP) và `.account-pages > .container > .card`; chỉ nạp `app.min.css`, `icons.min.css` và `login.css` (không có `style.css`). Thẻ đăng nhập có hai tab Bootstrap: "Cán bộ & Sinh viên" (hai liên kết `#login-google-link`, `#login-feid-link` dẫn sang đăng nhập Google/FeID bên ngoài; **không có ô mật khẩu**) và "Phụ huynh" (`form#frm-parent-login` có `#Username`, `#Password` và reCAPTCHA). Trang không có nút sáng/tối.
- Đã có đủ bản lưu MHTML của bốn trang trong `page-fap/` (không commit).

## Các quyết định

**Của người dùng**
- Hướng A (giữ bố cục FAP, đổi diện mạo), phong cách Finexy pha glassmorphism.
- Phạm vi ưu tiên: dashboard, đăng nhập, lịch học, lịch thi.
- Dựng lại toàn bộ giao diện trang web (không chỉ một vài trang).
- **Màu nhấn:** skin lấy theo màu nhấn đang chọn trong extension (không có bộ màu riêng cho FAP), và **bổ sung thêm màu cam** vào bộ preset dùng chung (ảnh hưởng cả popup). Màu mặc định của extension giữ nguyên, không đổi sang cam.
- **Bật sẵn:** skin bật mặc định khi cài đặt hoặc cập nhật, kèm công tắc tắt.
- **Thông báo lần đầu:** khi người dùng mới vào FAP, hiện một thông báo cho biết giao diện đã thay đổi; chỉ hiện một lần, **không tự biến mất, người dùng phải tự tắt**.

**Của người viết tài liệu (người dùng chưa xác nhận từng điểm; cần được xem lại)**
- Skin theo công tắc sáng/tối có sẵn của FAP; không thêm công tắc sáng/tối riêng. (Mockup dùng màu cam theo mẫu Finexy; màu cam nay là một preset, không phải mặc định.)
- Phông chữ: dùng bộ phông hệ thống (`-apple-system`, ...) hoặc Roboto mà FAP đã nạp sẵn; không nạp phông từ ngoài.
- Cách chặn nháy giao diện cũ: skin áp dụng mặc định, trừ khi `html` mang thuộc tính tắt; xem mục Cách hoạt động.
- Chỉ dùng `backdrop-filter` cho thanh trên, menu trái, hộp thoại và thanh dính; các thẻ trong danh sách dài chỉ trong suốt, không blur (đã dùng nguyên tắc này ở popup để cuộn mượt).

## Cách hoạt động (hướng dẫn cho người dựng; chi tiết để người dựng quyết)

- **Nạp CSS sớm:** khai báo trong `manifest.json` dưới `content_scripts` với `css` và `run_at: "document_start"` cho `*://fap.fpt.edu.vn/*`, để skin có trước khi trang vẽ. Một script nhỏ chạy ở `document_start` đọc cài đặt từ `chrome.storage.local` và đặt thuộc tính điều khiển lên `<html>` (ví dụ `data-fptu-skin="off"` khi người dùng tắt) cũng như biến màu nhấn.
- **Phạm vi CSS:** mọi quy tắc skin phải gắn với một thuộc tính hoặc lớp do extension đặt trên `<html>` để tắt được ngay lập tức mà không cần tải lại. Ưu tiên ghi đè biến `--ct-*` và `[data-bs-theme]` trước, sau đó mới tạo kiểu cho lớp `fap-*`; hạn chế selector bám theo cấu trúc sâu.
- **Khung nổi:** thanh trên và menu trái hiện cố định sát mép (`--ct-topbar-height`, `--ct-leftbar-width`, chế độ `data-sidenav-size` thu gọn/`sm-hover`, nút `.button-toggle-menu`, `.navbar-toggle` trên điện thoại). Skin phải giữ hành vi thu gọn và giao diện điện thoại hoạt động khi biến chúng thành thẻ nổi.
- **Màu nhấn:** dùng lại bộ preset trong `lib/accent.js` (mỗi màu có biến thể sáng và tối); skin ánh xạ chúng vào biến của FAP (như `--ct-primary`) và các biến phụ do skin tự định nghĩa. Thêm preset **cam** vào `ACCENT_PRESETS`; cả hai biến thể sáng/tối phải qua kiểm tra tương phản chữ trắng hiện có (>= 3.5:1), nên màu cam cần đủ đậm, không dùng cam sáng. Lưu ý kỹ thuật: lựa chọn màu hiện được lưu trong `localStorage` của popup (khóa `accentColor`), mà content script trên trang FAP **không đọc được**; phải sao chép sang `chrome.storage.local` (như khóa `theme` đã làm) và giữ hai nơi đồng bộ.
- **Công tắc:** thêm một lựa chọn "Giao diện FAP mới" (bật/tắt) vào hộp thoại Cài đặt của popup, lưu bằng `chrome.storage.local`. Trên trang FAP có một lối thoát nhỏ để xem giao diện gốc ngay (vị trí và hình thức để người dựng quyết, miễn là không che nội dung và không cần mở popup).
- **Cùng chạy với tính năng khác:** content script hiện tại (giữ phiên, bắt lịch học tự động, toolbar khảo sát `#fptu-feedback-toolbar`) vẫn chạy trên các trang này. Skin không được làm hỏng chúng; đặc biệt các parser dựa vào DOM gốc của `/WeeklyTimetable` và `/ExamSchedule`, nên skin tuyệt đối không đổi DOM.

## Các giai đoạn và thứ tự

Đây là một dự án gồm nhiều phần độc lập; làm lần lượt, mỗi phần phải thử được trước khi sang phần sau.

1. **Hạ tầng skin và khung chung:** nạp CSS ở `document_start`, thuộc tính điều khiển trên `<html>`, công tắc trong popup, màu nhấn, các token chung, thanh trên, menu trái, chân trang, thẻ, nút, form, bảng, badge, hộp thoại, phân trang. Kèm test hợp đồng CSS.
2. **Dashboard:** thẻ thông tin sinh viên, học phí (`fap-home-fee*`), tin tức (`fap-home-news-*`), Menu nhanh (`fap-home-quick-menu__*`). Cần dữ liệu thật đã có (bản MHTML).
3. **Lịch học và lịch thi:** trau chuốt `/WeeklyTimetable` (`weekly-timetable-grid`, `weekly-timetable-cell-*`) và `/ExamSchedule` (`fap-sheet`, `fap-table--stack`, thẻ thi).
4. **Đăng nhập:** chỉ đổi giao diện trang `/Auth/Login` của chính FAP (thẻ đăng nhập, hai tab, nút Google/FeID, biểu mẫu phụ huynh). Skin không đọc, không chạm vào ô nhập hay mật khẩu, không thay đổi thuộc tính của chúng, không che thông tin bảo mật (như reCAPTCHA) hay giả lập nút. Trang Google/FeID nơi sinh viên thực sự đăng nhập nằm ngoài tầm với của extension (chỉ chạy trên `fap.fpt.edu.vn`). Trang đăng nhập không có công tắc sáng/tối của FAP, nên dùng chế độ sáng mặc định.

## Cách kiểm chứng

- Test tự động (Node): hợp đồng CSS (không có màu nhấn viết cứng ngoài định nghĩa biến; các lớp `fap-*` mà skin nhắm tới thực sự tồn tại trong fixture đã làm sạch; có phương án thay thế cho `prefers-reduced-transparency` và khi không hỗ trợ `backdrop-filter`); manifest hợp lệ; script `document_start` đặt đúng thuộc tính theo cài đặt; công tắc trong popup lưu và đọc đúng; thông báo giao diện mới chỉ hiện khi skin bật và chưa xem, không tự biến mất, đóng xong không hiện lại, và nút quay lại giao diện gốc tắt skin.
- Kiểm tra giao diện: render các bản lưu (MHTML/fixture đã làm sạch) bằng Chrome không giao diện cùng skin và chụp ảnh sáng/tối cho từng trang ưu tiên; kiểm tra tương phản chữ.
- Kiểm tra thủ công của người dùng trên FAP thật (cần đăng nhập, người dựng không tự làm được): mọi chức năng chính (đổi tuần, đồng bộ, thanh toán hiển thị, thông báo, menu thu gọn, điện thoại) vẫn chạy.

## Thông báo giao diện mới (một lần)

Khi skin đang bật và người dùng vào một trang FAP lần đầu sau khi skin có hiệu lực (cài mới hoặc cập nhật), extension hiện một thông báo cho biết giao diện FAP đã được thay đổi bởi extension.

- **Hiện một lần, không tự tắt:** thông báo ở lại trên trang cho đến khi người dùng tự đóng. Sau khi đóng, không bao giờ hiện lại (cờ đã xem lưu trong `chrome.storage.local`). Nếu người dùng chuyển sang trang FAP khác trước khi đóng thì nó vẫn hiện (cho đến khi được đóng); đây là cách hiểu của người viết tài liệu về "người dùng phải tự tắt".
- **Nội dung (tiếng Việt, không emoji):** nói rõ giao diện FAP đã được FPTU Schedule làm mới, chỉ đổi diện mạo, mọi chức năng giữ nguyên; có thể tắt bất cứ lúc nào. Có hai nút: đóng ("Đã hiểu") và quay lại giao diện gốc (tắt skin ngay và đánh dấu đã xem). Câu chữ cụ thể để người dựng viết, miễn đúng nội dung này.
- **Không chặn thao tác:** không phải hộp thoại chặn màn hình; dạng thẻ nhỏ ở một góc, không che ô đăng nhập hay các nút chính, dùng được bằng bàn phím và đọc được bởi trình đọc màn hình.
- **Cô lập:** là phần tử do extension thêm vào (không phải phần tử của FAP), nên phải cô lập kiểu dáng khỏi CSS của FAP và của skin (ví dụ Shadow DOM hoặc tiền tố riêng) và ngược lại. Không đọc dữ liệu nào của trang.
- **Khi skin đã tắt** (người dùng tắt trước khi thấy thông báo), không hiện thông báo.
- Thông báo cũng hiện trên trang đăng nhập nếu đó là trang đầu tiên người dùng thấy; tuyệt đối không tương tác với ô nhập hay mật khẩu.

## Để người dựng quyết

- Tên file, vị trí thư mục CSS, cách chia nhỏ CSS theo trang.
- Kích thước, bán kính, độ mờ chính xác, cách bố trí khung nổi, hiệu ứng chuyển.
- Hình thức và vị trí của lối thoát "xem giao diện gốc" trên trang FAP.
- Cách đặt tên thuộc tính điều khiển trên `<html>` và khóa lưu trong `chrome.storage`.

## Phát hiện kèm theo (ngoài phạm vi skin)

Khi đọc trang đăng nhập thật phát hiện `lib/fap-keepalive.js` (`isFapSessionCandidate`) không nhận ra các đường dẫn `/Auth/Login`, `/Auth/GoogleLogin`, `/Auth/FeidLogin`, `/Auth/LoginParent`: bộ giữ phiên vẫn chạy trên trang đăng nhập, trái quy tắc "dừng ngay khi ở trang đăng nhập" trong `AGENTS.md`. Plan có một task nhỏ riêng để sửa; có thể bỏ nếu người dùng không muốn.

## Giai đoạn 5: các trang còn lại

Người dùng đã cung cấp bản lưu của toàn bộ 32 trang FAP (trong `page-fap/`, không commit). Khảo sát cho thấy chúng dùng chung một khung và khoảng sáu mẫu lặp lại, nên giai đoạn này chia theo **mẫu** thay vì theo trang: danh sách/bảng kết quả (có DataTables và Select2), báo cáo học tập, biểu mẫu và hộp thoại (gồm trang thanh toán có mã QR), trang chi tiết (tin tức, tài liệu), hồ sơ cá nhân, và các trang trạng thái rỗng. Mục tiêu có thể kiểm chứng: mọi lớp CSS của FAP xuất hiện trong các trang này đều có kiểu trong skin hoặc nằm trong danh sách miễn trừ có lý do, do một test tự động quét các fixture đã làm sạch. Hai ràng buộc bổ sung: mã QR thanh toán giữ nền trắng đặc để quét được, và nội dung người dùng hoặc nhà trường nhập (tin tức, tài liệu) chỉ được chỉnh ở vùng chứa. Kế hoạch: `docs/superpowers/plans/2026-11-04-fap-reskin-remaining-pages.md` (chạy sau plan `2026-11-04-fap-reskin.md`).

## Rủi ro

- FAP đổi cấu trúc hoặc tên lớp khi triển khai lại: giảm bằng cách ưu tiên biến, giữ test hợp đồng, và có công tắc tắt nhanh.
- Chiều cao thanh trên/menu trái cố định của mẫu Jidox xung đột với khung nổi: cần thử ở mọi kích thước (`data-sidenav-size`, điện thoại).
- `backdrop-filter` trên trang dài làm chậm: giới hạn ở các thanh dính và hộp thoại.
- Chính sách Chrome Web Store: skin chỉ đổi diện mạo trên một trang đã khai báo trong `host_permissions`, không tải mã từ xa; cần nêu rõ trong mô tả cửa hàng và trang quyền riêng tư (skin không thu thập dữ liệu).
