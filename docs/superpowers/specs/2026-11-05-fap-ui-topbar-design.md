# Giao diện FAP React: thanh trên hoạt động được

Ngày: 2026-11-05. Trạng thái: chờ người dùng duyệt. Bổ sung cho `2026-11-05-fap-react-ui-design.md`.

## 1. Ý định

Thanh trên của giao diện mới (theo thiết kế Lovable) hiện chỉ là hình: ô tìm kiếm, chọn cơ sở, chọn ngôn ngữ, chuông thông báo và hồ sơ đều không làm gì (nút toàn màn hình đã hoạt động). Người dùng muốn chúng hoạt động như trên FAP gốc.

## 2. Mục tiêu, không mục tiêu, phản mục tiêu

**Mục tiêu**
1. **Tìm chức năng, trang:** bấm vào ô hoặc nhấn Ctrl/Cmd+K mở hộp tìm; gõ để lọc các chức năng và trang (không phân biệt hoa thường và dấu tiếng Việt); chọn bằng chuột hoặc phím mũi tên và Enter để đi tới trang FAP đó.
2. **Cơ sở:** bấm mở danh sách hiển thị cơ sở của sinh viên theo đúng dữ liệu FAP.
3. **Ngôn ngữ:** bấm mở danh sách ngôn ngữ mà FAP cung cấp; chọn thì đổi ngôn ngữ của FAP bằng chính biểu mẫu của FAP, và **giao diện mới hiển thị bằng đúng ngôn ngữ đó** (Tiếng Việt hoặc English): menu, tiêu đề trang, nút, thông báo trạng thái, tên thứ và ngày tháng.
4. **Thông báo:** chuông có số chưa đọc; bấm mở danh sách thông báo của FAP; "Đã đọc tất cả" hoạt động; bấm một thông báo thì đi tới nội dung của nó.
5. **Hồ sơ:** bấm mở menu có tên, mã sinh viên, liên kết tới trang tài khoản và "Đăng xuất" hoạt động.
6. Mọi menu đóng được bằng Escape hoặc bấm ra ngoài, dùng được bằng bàn phím, và đúng ở chế độ sáng lẫn tối.

**Không mục tiêu**
- Chuyển cơ sở: FAP gốc **không** cho sinh viên chuyển cơ sở (menu cơ sở chỉ hiển thị thông tin), nên giao diện mới cũng chỉ hiển thị. Danh sách 5 cơ sở trong mockup Lovable là dữ liệu mẫu, không dùng.
- Tìm kiếm nội dung (tin tức, môn học); chỉ tìm chức năng và trang.
- Tự viết lại việc FAP làm bằng máy chủ (gửi đăng xuất, đổi ngôn ngữ, đánh dấu đã đọc).

**Phản mục tiêu**
- Mất phiên hoặc hỏng chức năng của FAP vì ta gọi API của FAP sai cách (thiếu token chống giả mạo).
- Danh sách thông báo trống hoặc sai mà người dùng không biết.
- Menu bị cắt hoặc mất kiểu dáng vì nằm ngoài Shadow DOM.

## 3. Quyết định của người dùng

- Muốn các nút trên thanh trên hoạt động.

## 4. Thiết kế (phần do tôi đề xuất)

**Nguyên tắc: làm việc thay vì viết lại.** Các thao tác ghi của FAP (đổi ngôn ngữ, đăng xuất, đánh dấu đã đọc) cần mã chống giả mạo (token) và logic của FAP. Giao diện mới **không gọi lại các điểm cuối đó**, mà kích hoạt chính các điều khiển gốc của FAP vẫn còn trong trang (ẩn đi): bấm nút tương ứng trong DOM gốc. FAP tự gửi yêu cầu như người dùng bấm ở giao diện cũ.

| Nút | Dữ liệu hiển thị lấy từ | Hành động |
|---|---|---|
| Cơ sở | `.jidox-campus-topbar__menu` (tên, mã, "Chính") | chỉ hiển thị |
| Ngôn ngữ | biểu mẫu `/Language/SetLanguage` (hai nút `culture` vi và en, nút nào đang `active`) | bấm đúng nút `culture` trong biểu mẫu gốc |
| Thông báo | huy hiệu `data-notification-badge` và danh sách `[data-notification-list]` do FAP tự nạp (`/Notification/BellList`) | mở thông báo gốc để FAP nạp danh sách, đọc danh sách, bấm nút gốc `[data-notification-mark-all]`, đi theo liên kết của từng thông báo |
| Hồ sơ | `.fap-topbar-user` (tên, mã), liên kết `/Account` | bấm nút gốc trong biểu mẫu `/Auth/Logout` |
| Tìm kiếm | danh sách điều hướng của giao diện (`NAV_GROUPS`) và các liên kết "Menu nhanh" | đi tới `navHref` |

**Ngôn ngữ của giao diện.** Nguồn duy nhất là ngôn ngữ mà FAP đang dùng (`language.current` từ `readTopbar`), nên giao diện luôn khớp với dữ liệu mà FAP trả về (tên môn, tiêu đề tin, nhãn bảng do FAP tự dịch). Mọi chuỗi chữ của giao diện đi qua một hàm dịch `t(khóa)` với hai từ điển `vi` và `en` (`ui/src/i18n/`). Chọn ngôn ngữ trong menu thì FAP gửi biểu mẫu và tải lại trang; lần dựng sau đọc ngôn ngữ mới. Khoảng 150 chuỗi cần dịch (điều hướng, các trang, lịch, nút, thông báo trạng thái). Ngày tháng và tên thứ dùng `date-fns` với `vi` hoặc `enUS`. Giá trị lạ hoặc thiếu coi là `vi`.

**Menu nằm trong Shadow DOM.** Bảng menu và hộp tìm kiếm dựng bằng một thành phần tự viết (không dùng thư viện cổng nổi như Radix Popover/Dialog, vì chúng gắn vào `body` ngoài Shadow DOM làm mất kiểu dáng); đóng khi bấm ra ngoài (dựa vào `composedPath`), Escape, trả tiêu điểm về nút mở.

**Giới hạn đã biết.** Danh sách thông báo được FAP nạp động nên mẫu HTML thật của từng thông báo chưa có trong fixture; người xây phân tích theo cách chịu lỗi (lấy chữ, liên kết, trạng thái chưa đọc), và nếu không đọc được thì hiển thị liên kết "Mở thông báo trên FAP". Nếu người dùng gửi được một mẫu đã làm mờ thì thêm vào fixture.

## 5. Ràng buộc

- Không tự động gửi biểu mẫu nào ngoài thao tác người dùng vừa bấm (đăng xuất, đổi ngôn ngữ, đánh dấu đã đọc đều chỉ chạy sau khi người dùng bấm).
- Chuỗi chữ lấy từ FAP luôn hiển thị như văn bản thuần.
- Đọc dữ liệu thanh trên là mã vanilla trong `lib/fap-page-data.js` (có test `node --test`); phần giao diện nằm trong `ui/`.
- Không đổi thiết kế đã duyệt: khi các menu đóng, ảnh chụp đối chiếu không xấu đi quá 0.5 điểm phần trăm.
- Không phát hành, không đổi phiên bản khi chưa có lệnh của người dùng.

## 6. Việc người dùng cần quyết

1. **Mẫu trang tiếng Anh (cần người dùng cung cấp):** bộ đọc dữ liệu (thời khóa biểu, lịch thi, tin tức, tổng quan) hiện chỉ được kiểm tra bằng trang tiếng Việt. Để chắc chúng đọc đúng khi FAP ở tiếng Anh, người dùng chuyển FAP sang English và lưu 4 trang (Tổng quan, Thời khóa biểu, Lịch thi, Tin tức) vào `page-fap/` như lần trước (thư mục này đã bị `.gitignore`); người xây lọc dữ liệu cá nhân thành fixture. Nếu không có mẫu, phần đọc tiếng Anh chỉ được kiểm tra trong phạm vi mã đã có (lịch thi đã hỗ trợ nhãn "Date/Course"), và Task 7 của người dùng là bước kiểm chứng.
2. **Mở rộng nhỏ ngoài danh sách:** nút "Đăng xuất" và "Cài đặt tài khoản" ở chân sidebar cũng đang là nút chết; đề xuất làm luôn (dùng cùng cơ chế với hồ sơ).

## 7. Phụ thuộc

Chạy **sau** plan gộp chế độ tối và màu nhấn (`2026-11-05-fap-ui-theme-and-accent`), vì cả hai sửa `TopNavigation.tsx`, `AppShell.tsx` và `boot.tsx`.
