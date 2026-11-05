# Giao diện FAP React: chế độ tối

Ngày: 2026-11-05. Trạng thái: chờ người dùng duyệt. Bổ sung cho `2026-11-05-fap-react-ui-design.md` (không sửa file đó).

## 1. Ý định

Thiết kế Lovable chỉ có chế độ sáng, nên giao diện FAP React hiện chỉ sáng. Extension đã có 3 chế độ (Tự động, Sáng, Tối) trong popup và người dùng muốn giao diện FAP mới cũng có chế độ tối, theo đúng lựa chọn đó.

## 2. Mục tiêu, không mục tiêu, phản mục tiêu

**Mục tiêu**
1. Giao diện FAP mới có chế độ tối, đồng bộ với lựa chọn Tự động/Sáng/Tối của extension, đổi ngay khi người dùng đổi (mọi tab FAP đang mở, không cần tải lại).
2. "Tự động" theo hệ thống (`prefers-color-scheme`) và đổi theo khi hệ thống đổi.
3. Chữ đủ đọc ở chế độ tối (độ tương phản WCAG AA) và các lớp nổi (thẻ, bóng, gradient) vẫn phân biệt được với nền.
4. Chế độ sáng không đổi một pixel so với hiện nay (đối chiếu ảnh chụp vẫn đạt ngưỡng cũ).

**Không mục tiêu**
- Chế độ tối cho trang FAP gốc (các trang chưa dựng lại, hoặc khi công tắc giao diện mới tắt) và cho `data-bs-theme` của FAP.
- Tự dựng lại thiết kế Lovable: không có bản tối của Lovable, bảng màu tối ở đây là **đề xuất của tôi, cần người dùng duyệt bằng ảnh chụp** (mục 6).
- Đổi bố cục hay component.

**Phản mục tiêu**
- Nhấp nháy sáng rồi mới tối mỗi lần mở trang.
- Chữ nhạt khó đọc, hoặc thẻ chìm vào nền ở chế độ tối.
- Màu cứng nào đó trong component làm một vùng vẫn sáng trong chế độ tối.

## 3. Quyết định của người dùng

- Có chế độ tối cho giao diện FAP React, theo extension.

## 4. Thiết kế (phần do tôi đề xuất)

**Nguồn lựa chọn.** Popup đã lưu lựa chọn trong `chrome.storage.local` khóa `theme` (`"auto" | "light" | "dark"`). Giao diện React đọc cùng khóa. Hàm quyết định dùng lại `resolveEffectiveTheme(saved, systemPrefersDark)` của `lib/theme.js` (một nguồn duy nhất, không viết lại). Giá trị lạ hoặc thiếu thì coi là `auto`.

**Áp dụng.** Đặt thuộc tính `data-theme="light" | "dark"` lên host Shadow DOM. Token tối nằm trong khối `:host([data-theme="dark"])` của `ui/src/design/tokens.css`, ghi đè **mọi** token màu, bóng và gradient của khối `:host` sáng; thêm `color-scheme: dark` để thanh cuộn và điều khiển gốc đồng bộ. Đọc `chrome.storage.local` trước khi mount (chờ tối đa 300 ms, quá thì theo hệ thống) để không nhấp nháy; sau đó nghe `storage.onChanged` (khóa `theme`) và `matchMedia("(prefers-color-scheme: dark)")` để đổi trực tiếp.

**Màu cứng cần chuyển thành token.** Component và trang chỉ dùng token (đã kiểm tra: không có màu hex hoặc `bg-white`), chỉ có hai chỗ cứng trong `tokens.css`: tiện ích `glass` (`oklch(1 0 0 / 0.72)`) và `scrollbar-thin` (`oklch(0.88 0.015 280)`). Chuyển sang token `--glass` và `--scrollbar`.

**Bảng màu tối đề xuất (giá trị khởi đầu, người xây chỉnh theo kiểm tra tương phản và ảnh chụp)**
| Token | Sáng (hiện có) | Tối (đề xuất) |
|---|---|---|
| `--background` | `oklch(0.98 0.005 275)` | `oklch(0.16 0.012 276)` |
| `--surface`, `--card`, `--popover` | `oklch(1 0 0)` | `oklch(0.2 0.014 277)` |
| `--surface-2`, `--muted`, `--secondary` | `oklch(0.968 0.008 278.6)` | `oklch(0.25 0.016 278)` |
| `--foreground` | `oklch(0.21 0.01 276.6)` | `oklch(0.95 0.006 275)` |
| `--muted-foreground` | `oklch(0.629 0.02 275.5)` | `oklch(0.72 0.02 275)` |
| `--border`, `--input` | `oklch(0.949 0.008 271.3)` | `oklch(0.3 0.015 276)` |
| `--primary` | `oklch(0.707 0.129 283.1)` | `oklch(0.72 0.13 283)` |
| `--primary-strong` (chữ nhấn) | `oklch(0.56 0.16 281)` | `oklch(0.82 0.1 283)` |
| `--primary-soft` | `oklch(0.939 0.031 287.8)` | `oklch(0.3 0.06 285)` |
| `--ink` / `--ink-foreground` | tối / sáng | sáng / tối (đảo, để nút chính nổi trên nền tối) |
Các token `success`, `warning`, `danger` (nền nhạt và chữ đậm), gradient `lavender`, `surface` và ba bóng được người xây đổi tương ứng: nền nhạt thành tối bão hòa thấp, chữ đậm thành sáng; bóng đậm hơn và đen hơn.

**Công tắc trong giao diện.** Thêm nút đổi chế độ (mặt trời, mặt trăng, màn hình) ở thanh trên, quay vòng Tự động, Sáng, Tối bằng `getNextTheme` của `lib/theme.js` và ghi khóa `theme` (giống nút trong popup). Đây là bổ sung của tôi (thiết kế Lovable không có); bỏ được nếu người dùng không muốn.

**Liên hệ với plan màu nhấn (`2026-11-05-fap-ui-accent-sync`).** Hàm suy ra bảng màu nhấn hiện giữ độ sáng L của token sáng. Ở chế độ tối phải giữ L của token tối và dùng màu `dark` của preset. Nếu plan màu nhấn đã chạy thì có một task mở rộng hàm đó nhận tham số chế độ (Task 6); nếu chưa chạy thì bỏ task này và ghi chú cho người xây plan màu nhấn.

## 5. Ràng buộc

- Chỉ đổi token và hai tiện ích `glass`, `scrollbar-thin`; không sửa component (trừ nút đổi chế độ).
- `lib/theme.js` giữ UMD; popup giữ vanilla JS.
- Khối token sáng phải giữ nguyên giá trị so với `ui/reference/lovable-styles.css` (test so khớp hiện có vẫn chạy cho khối sáng).
- Không phát hành, không đổi phiên bản khi chưa có lệnh của người dùng.

## 6. Cổng duyệt của người dùng

Vì bảng màu tối không có thiết kế gốc, người xây phải tạo ảnh chụp 4 trang ở chế độ tối (Task 7) và dừng để người dùng xem. Chỉ khi người dùng duyệt (hoặc yêu cầu chỉnh màu) mới coi bảng màu là xong.

## 7. Việc để người xây tự quyết

- Cách tính độ tương phản (viết hàm đổi oklch sang sRGB và tỷ lệ tương phản, dùng chung với plan màu nhấn nếu đã có `ui/src/design/color.ts`).
- Giá trị tối cụ thể của `success`, `warning`, `danger` và gradient, miễn là đạt kiểm tra tương phản và nhìn rõ trong ảnh chụp.
