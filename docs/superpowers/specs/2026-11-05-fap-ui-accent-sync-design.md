# Giao diện FAP React: đồng bộ màu nhấn với extension

Ngày: 2026-11-05. Trạng thái: chờ người dùng duyệt. Bổ sung cho `2026-11-05-fap-react-ui-design.md` (không sửa file đó).

## 1. Ý định

Trước đây màu nhấn do người dùng chọn trong popup được áp lên giao diện FAP. Giao diện React mới đang cố định màu lavender của thiết kế Lovable nên màu nhấn không còn tác dụng ở FAP. Người dùng muốn **đồng bộ màu nhấn**: chọn màu trong popup thì giao diện FAP mới đổi theo, kể cả khi trang đang mở.

## 2. Mục tiêu, không mục tiêu, phản mục tiêu

**Mục tiêu**
1. Chọn một màu nhấn trong popup làm bộ màu `primary-*` của giao diện FAP mới đổi theo, ngay lập tức, không cần tải lại trang.
2. Khi người dùng chưa chọn gì, giao diện giữ **đúng** lavender của Lovable (khớp thiết kế, kiểm bằng ảnh chụp đối chiếu hiện có).
3. Mọi màu nhấn vẫn giữ chữ đủ đọc (độ tương phản).

**Không mục tiêu**
- Chế độ tối cho giao diện FAP mới (thiết kế Lovable chỉ có chế độ sáng; chỉ dùng màu `light` của preset).
- Cho người dùng chọn màu tự do ngoài các preset có sẵn trong popup.
- Đổi màu nền, màu trạng thái (thành công, cảnh báo, nguy hiểm) hay màu chữ trung tính.

**Phản mục tiêu**
- Chọn lavender hoặc để mặc định mà giao diện lệch so với thiết kế Lovable.
- Một màu nhấn nào đó làm chữ khó đọc (ví dụ chữ đậm màu nhấn trên nền nhạt dưới 4.5:1).
- Giao diện nhấp nháy đổi màu mỗi lần mở trang.

## 3. Quyết định của người dùng

- Đồng bộ màu nhấn giữa popup và giao diện FAP mới.

## 4. Thiết kế (phần do tôi đề xuất)

**Nguồn sự thật:** `lib/accent.js` (`ACCENT_PRESETS`). Giao diện React import danh sách này, không chép lại.

**Lưu trữ.** Popup lưu lựa chọn trong `localStorage` của popup nên content script không đọc được. Popup phải **chép thêm** vào `chrome.storage.local` khóa `accentColor` (giá trị là `id` của preset): khi bấm chọn, và khi mở popup lần đầu nếu `localStorage` đã có giá trị mà `chrome.storage.local` chưa có (người dùng cũ).

**Preset mới `lavender`.** Thêm vào `ACCENT_PRESETS` (không đứng đầu danh sách; `blue` vẫn là mặc định của popup): `{ id: "lavender", label: "Tím lavender", light: "#6d5fd6", dark: "#7c6fe0" }`. Cả hai đạt tương phản chữ trắng tối thiểu 3.5 (đo được 4.93 và 4.03). Chọn `lavender` cho ra giao diện FAP đúng thiết kế Lovable.

**Quy tắc chọn màu cho giao diện FAP mới**
| Giá trị `accentColor` | Kết quả |
|---|---|
| chưa có, rỗng, id lạ | lavender gốc của Lovable (không đặt biến nào) |
| `lavender` | lavender gốc của Lovable |
| preset khác (kể cả `blue`) | bảng màu suy ra từ màu `light` của preset |

**Cách suy ra bảng màu.** Lấy các token lavender của Lovable (`--primary`, `--primary-strong`, `--primary-soft`, `--primary-muted`, `--ring`, `--chart-1`, `--accent`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-ring` và hai gradient `--gradient-lavender`, `--gradient-lavender-glow`) rồi, trong không gian OKLCH: **giữ nguyên độ sáng L**, đổi hue theo hue của màu preset (cộng độ lệch hue giữa preset và lavender gốc 283.1 vào mọi token, kể cả các điểm dừng gradient), nhân chroma với `k = chroma(preset.light) / chroma(#6d5fd6)`. Nhờ vậy preset ít bão hòa (xám than) ra giao diện nhạt hơn thay vì sặc sỡ. Sau đó kiểm tương phản: `--primary-strong` trên trắng và trên `--primary-soft` phải đạt 4.5:1; nếu chưa đạt thì giảm L của `--primary-strong` từng bước 0.02 (sàn 0.40).

**Áp dụng.** Đặt các biến lên **host** của Shadow DOM bằng `style` (biến từ ngoài thắng `:host` trong tokens). Đọc `chrome.storage.local` **trước khi mount** (chờ tối đa 300 ms, quá thì dùng lavender) để không nhấp nháy; sau đó nghe `chrome.storage.onChanged` (vùng `local`, khóa `accentColor`) để đổi trực tiếp.

## 5. Ràng buộc

- Đổi màu chỉ qua biến CSS trên host; không viết lại component.
- `lib/accent.js` giữ UMD; popup giữ vanilla JS (ngoại lệ build chỉ cho `ui/`).
- Ảnh chụp đối chiếu hiện có (`ui/reference/*.png`) phải còn đạt ngưỡng 2% ở trạng thái mặc định.
- Không phát hành, không đổi phiên bản khi chưa có lệnh của người dùng.

## 6. Việc để người xây tự quyết

- Chọn thư viện chuyển hex sang OKLCH và ngược lại (có thể tự viết bằng toán, không cần thêm dependency).
- Cách nhập `lib/accent.js` từ `ui/` (alias Vite hoặc đường dẫn tương đối), miễn là một nguồn duy nhất.

## 7. Vấn đề mở cần người dùng quyết

Popup hiện mặc định tô sáng màu **xanh dương** khi chưa chọn gì, trong khi giao diện FAP mới mặc định lavender. Hai nơi này lệch nhau cho tới khi người dùng chọn một màu. Đề xuất: chấp nhận lệch này ở v1 (tránh đổi giao diện mặc định của popup). Nếu muốn nhất quán, một việc riêng là làm `lavender` thành mặc định của popup (cần đổi `popup.css`).
