# Giao diện FAP React: các trang còn lại và đăng nhập

Ngày: 2026-11-05. Trạng thái: chờ người dùng duyệt. Bổ sung cho `2026-11-05-fap-react-ui-design.md`.

## 1. Ý định

Giao diện mới mới có 4 trang (Tổng quan, Thời khóa biểu, Lịch thi, Tin tức). Các mục còn lại trên sidebar vẫn mở ra trang FAP cũ, gây giật giữa hai giao diện. Người dùng muốn **hoàn thiện các trang còn lại, kể cả đăng nhập**, và không muốn thấy giao diện FAP cũ.

## 2. Mục tiêu, không mục tiêu, phản mục tiêu

**Mục tiêu**
1. Mọi trang FAP mà sinh viên dùng hiển thị trong giao diện mới (sidebar, thanh trên, kiểu dáng thống nhất), kể cả trang chưa có thiết kế riêng.
2. Các trang chỉ đọc được dựng lại bằng React từ dữ liệu FAP (báo cáo điểm danh, báo cáo điểm, bảng điểm, điều kiện OJT và khóa luận, môn học, khung chương trình, chứng chỉ, giao dịch, tài liệu, chi tiết tin và tài liệu, tài khoản, xem đơn, danh mục gửi đơn, danh sách chờ lớp, FYE).
3. Trang đăng nhập có giao diện mới, vẫn đăng nhập được bằng Google, FeID và tài khoản phụ huynh.
4. Các trang có thao tác ghi (gửi đơn, đăng ký chờ lớp, đổi lớp chéo, nhóm khởi nghiệp, hồ sơ, thanh toán) hoạt động đúng như hiện nay.
5. Không bao giờ thấy trang trắng hay giao diện hỏng: trang nào không dựng được thì rơi về **khung mới bao quanh nội dung FAP cũ**, không phải về giao diện cũ hoàn toàn.

**Không mục tiêu**
- Thiết kế mới cho từng trang từ Lovable: Lovable chỉ có thiết kế cho 4 trang cộng "Gửi đơn". Các trang còn lại dựng bằng hệ thống thiết kế đang có (`DESIGN.md`), người dùng duyệt qua ảnh chụp theo từng nhóm.
- Tự gửi thay người dùng bất kỳ biểu mẫu nào (luật AGENTS.md mục 4 giữ nguyên).
- Lưu hoặc đọc mật khẩu bằng mã của extension.
- Trang khảo sát (feedback) được tự điền: giữ nguyên chức năng, nằm trong khung mới.

**Phản mục tiêu (thất bại dù chạy được)**
- Mất chức năng của FAP vì ta chuyển DOM (DataTables, Select2, hộp thoại, biểu mẫu ngừng chạy).
- Gửi biểu mẫu hai lần, hoặc gửi mà người dùng chưa bấm.
- Mã QR thanh toán bị đổi màu hoặc làm mờ.
- Trình quản lý mật khẩu của trình duyệt không điền được vào ô đăng nhập.
- Ô nhập, nút hoặc dữ liệu trên trang cũ biến mất sau khi tắt giao diện mới.

## 3. Quyết định của người dùng

- Làm các trang còn lại và đăng nhập; không muốn thấy FAP cũ.

## 4. Thiết kế (phần do tôi đề xuất)

Ba loại trang, theo mức độ rủi ro, từ thấp đến cao:

| Loại | Cách dựng | Dùng cho |
|---|---|---|
| **Khung bao (wrapped)** | Giao diện mới (sidebar, thanh trên) bao quanh **nguyên nội dung FAP**: node `.content-page` được chuyển vào một khe (`<slot>`) của Shadow DOM, vẫn là DOM gốc nên script, biểu mẫu và bảng của FAP chạy như cũ; tắt giao diện thì đặt node về đúng chỗ cũ | mặc định cho mọi trang chưa dựng lại, và nơi rơi về khi dựng lại thất bại |
| **Dựng lại (native)** | React dựng từ dữ liệu đọc ở DOM FAP, không ghi gì | các trang chỉ đọc |
| **Biểu mẫu (form)** | React dựng giao diện, nhưng mọi giá trị được ghi vào **ô và nút gốc** của FAP và chỉ gửi khi người dùng bấm nút của ta (khi đó bấm nút gửi gốc). FAP tự kiểm tra, gắn token và gửi | trang ghi |

**Một bảng route duy nhất.** Hiện danh sách trang nằm ở ba nơi (`ui/src/routes.ts`, `lib/fap-ui-early.js`, `manifest.json`). Gom vào `lib/fap-routes.js` (vanilla UMD, có test); mỗi route có `id`, mẫu đường dẫn, loại, và mục điều hướng để tô sáng. Mọi đường dẫn khác là "khung bao".

**Đăng nhập.** Trang đăng nhập không có sidebar. Giao diện mới dựng bố cục (logo, hai tab "Cán bộ và Sinh viên" và "Phụ huynh", nút Google và FeID). Với tài khoản phụ huynh, **ô Tên đăng nhập và Mật khẩu gốc của FAP được đưa vào khe của bố cục (nằm ở DOM thường, không nằm trong Shadow DOM)**, vì trình quản lý mật khẩu và tự điền của trình duyệt không hoạt động tin cậy bên trong Shadow DOM, và vì reCAPTCHA và token chống giả mạo của FAP phải nằm đúng chỗ. Nút Google và FeID kích hoạt liên kết gốc (FAP gán đích thật cho chúng bằng script). Thông báo lỗi lấy từ phần tử kiểm tra hợp lệ của FAP.

**Chi tiết tin và tài liệu.** Phần nội dung bài viết do FAP kiểm soát (HTML nhiều định dạng). Giữ phần thân bài là DOM gốc đặt vào khe, thay vì tự dựng lại từ HTML.

## 5. Ràng buộc

- Chỉ dùng thành phần của `DESIGN.md` (atoms, molecules, organisms); thành phần mới thêm vào đúng tầng và có test.
- Mọi chuỗi chữ qua `t()` (hệ thống hai ngôn ngữ trong plan thanh trên); không chữ cứng.
- Bộ đọc là mã vanilla trong `lib/` (test bằng `node --test` với fixture đã lọc ở `tests/fixtures/pages/`); giao diện trong `ui/`.
- Fixture mới phải qua `scripts/sanitize-fap-page.py` và không chứa khóa API, mã xác thực, hoặc dữ liệu cá nhân (có test `tests/fixtures-secrets.test.js`).
- Không gọi trực tiếp điểm cuối ghi của FAP; chỉ kích hoạt điều khiển gốc sau thao tác của người dùng.
- Không phát hành, không đổi phiên bản khi chưa có lệnh của người dùng.

## 6. Việc người dùng cần quyết

1. **Thanh toán** (Thanh toán các khoản phải nộp, Phí xếp lớp chờ thanh toán): có mã QR và nút thanh toán, rủi ro cao nhất. Đề xuất: **giữ ở dạng khung bao** (nội dung FAP cũ trong khung mới), không dựng lại, cho tới khi có lý do rõ ràng.
2. **Duyệt thiết kế theo nhóm:** mỗi nhóm trang (báo cáo, học vụ, tài chính, nội dung, tài khoản và đơn) kết thúc bằng ảnh chụp để người dùng duyệt; người dùng nêu chỗ cần đổi.
3. **Nhiều trang chưa có mẫu:** trang khảo sát (feedback), FYE chi tiết và vài trang hiếm không có fixture; chúng chạy ở dạng khung bao cho đến khi người dùng lưu mẫu của chúng.

## 7. Phụ thuộc

Chạy **sau** plan thanh trên và hai ngôn ngữ (`2026-11-05-fap-ui-topbar.md`, cần `t()` và `ProfileMenu`) và plan gộp chế độ tối và màu nhấn.
