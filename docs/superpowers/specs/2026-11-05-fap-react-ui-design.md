# Giao diện FAP dựng lại bằng React (bản đầu: 4 trang cơ sở)

Ngày: 2026-11-05. Trạng thái: chờ người dùng duyệt.

## 1. Ý định và lý do

Sinh viên thấy giao diện FAP (fap.fpt.edu.vn) xấu. Hướng "skin CSS" đã được thử và gỡ (commit `ba626ce`) vì chỉ đổi được lớp bề mặt, không dựng lại được bố cục theo thiết kế riêng. Người dùng đã tự thiết kế giao diện mới trên Lovable và muốn extension **thay nội dung các trang chỉ đọc của FAP bằng giao diện React đó, tại đúng URL gốc**, vẫn giữ các chức năng đang có.

- Nguồn thiết kế duy nhất (source of truth): repo `https://github.com/yunkhngn/pixel-perfect-pagecraft-99` (bản xem trước: `https://pixel-perfect-pagecraft-99.lovable.app`). Giao diện mới phải **khớp y** bản này.
- Hệ thống thiết kế trong repo gọi là "Pillio-inspired": nền xám lavender nhạt `#F7F8FC`, màu chính lavender `#9695EE`, card bo 20px, chữ Inter, token màu dùng oklch, chỉ có chế độ sáng.

## 2. Mục tiêu, không mục tiêu, phản mục tiêu

**Mục tiêu**
1. Bốn trang cơ sở trong v1: **Tổng quan** (`/`), **Thời khóa biểu** (`/WeeklyTimetable`), **Lịch thi** (`/ExamSchedule`), **Tin tức** (`/News`). Giao diện khớp bản Lovable.
2. Component chia theo atomic design, dùng lại được, có test.
3. Một file `DESIGN.md` mô tả hệ thống thiết kế (token, kiểu chữ, khoảng cách, component, quy tắc dùng).
4. Dữ liệu hiển thị là dữ liệu thật của sinh viên, đọc từ trang FAP.
5. Mọi trang dựng lại đều có lối quay về bản FAP gốc.

**Không mục tiêu (v1)**
- Các trang có ghi dữ liệu: gửi đơn, thanh toán, wishlist, đổi lớp, đơn khởi nghiệp, đăng nhập. Giữ nguyên FAP.
- Các trang chỉ đọc chưa có thiết kế (điểm, điểm danh, bảng điểm, môn học, khung chương trình, chứng chỉ, tài liệu, chi tiết tin...). Người dùng sẽ thiết kế sau, giữ FAP gốc trong v1.
- Chế độ tối, giao diện tiếng Anh, giao diện điện thoại tối ưu (xem mục 9).
- Dùng lại TanStack Start, SSR, server functions của repo Lovable.

**Phản mục tiêu (coi là thất bại dù chạy được)**
- Mất chức năng hiện có của extension (xuất ICS, thông báo, badge, keep-alive, tự bắt lịch tuần, điểm).
- Hiển thị dữ liệu sai hoặc thiếu mà người dùng không biết (lịch học, lịch thi là dữ liệu đi thi).
- Trang trắng khi FAP đổi HTML.
- CSS của giao diện mới rò sang FAP hoặc ngược lại.

## 3. Ràng buộc

- Chrome Extension MV3, ES2020+; mã chạy trong extension phải nằm trong gói, **không tải mã từ xa** (chính sách Chrome Web Store).
- **Ngoại lệ luật AGENTS.md đã được người dùng duyệt (2026-11-05):** cho phép build tool và thư viện bên thứ ba cho riêng lớp giao diện React này. Phần còn lại của extension (popup, background, `lib/`) giữ luật cũ: vanilla JS, không build. Khi spec được duyệt, cập nhật AGENTS.md ghi rõ ngoại lệ.
- Luật vẫn giữ: không dùng emoji trong UI, không tự động submit form, test chạy bằng `node --test`, 100% test pass, không phát hành khi chưa được người dùng yêu cầu.
- Giao diện React không ghi dữ liệu lên FAP trong v1.
- Người dùng xem ở màn hình máy tính; bản Lovable đã có sidebar thu gọn.

## 4. Các quyết định của người dùng

- Dựng lại giao diện bằng React, tại đúng URL FAP (không phải trang riêng của extension).
- Khớp y thiết kế Lovable; component atomic; có `DESIGN.md`.
- Trang ghi giữ nguyên FAP gốc.
- Bản đầu chỉ dựng 4 trang cơ sở; thiết kế thêm trang sau.
- Bỏ luật "không build tool, không thư viện" cho lớp giao diện này.

## 5. Kiến trúc (phần do tôi đề xuất; người xây có thể đổi nếu có lý do)

**Cách chạy trên một trang.** Content script nhận biết URL, đọc dữ liệu từ DOM của trang FAP, rồi mount giao diện React vào một **Shadow DOM** gắn vào `<body>`, đồng thời ẩn nội dung FAP (ẩn bằng một thuộc tính trên `<html>`, không xóa DOM). Nút "Xem bản FAP gốc" bỏ thuộc tính này. Lưu lựa chọn theo từng trang trong `chrome.storage.local`.

**Điều hướng.** Không cần router phía client: mỗi link trong giao diện mới là URL FAP thật (ánh xạ từ route Lovable sang URL FAP), bấm vào là tải trang mới và content script mount lại. Mục sidebar của trang chưa dựng lại trỏ thẳng sang URL FAP tương ứng.

**Nguồn dữ liệu.**
- Thời khóa biểu: dùng lại logic `extractWeeklyScheduleFromTable` (đang trong `content.js`), chuyển sang `lib/` để test được bằng `node --test`.
- Lịch thi: dùng lại `extractExamScheduleFromPage`, cũng chuyển sang `lib/`.
- Tổng quan và Tin tức: **chưa có parser**. Dữ liệu trang Tổng quan được FAP nạp **bất đồng bộ** vào các vùng `[data-home-slot]` (qua `/Home/StudentContentPartial`), nên content script phải chờ các vùng này có nội dung rồi mới đọc (có timeout; hết giờ thì quay về FAP gốc). Fixture tham chiếu: `tests/fixtures/pages/home.html`, `news.html`.
- Thông tin sinh viên, cơ sở, số dư, thông báo: đọc từ khung chung của trang (header, sidebar).

**Cấu trúc thư mục đề xuất**
```
ui/                      mã nguồn giao diện (Vite + React + TypeScript + Tailwind 4)
  src/design/tokens.css  token lấy từ repo Lovable (src/styles.css)
  src/components/
    atoms/               Button, Badge, Avatar, Input, Tabs, Icon...
    molecules/           StatCard, NewsItem, NavItem, SearchField, EmptyState...
    organisms/           AppSidebar, TopNavigation, ScheduleCalendar, DataTable, AnnouncementList...
    templates/           AppShell, PageHeader
  src/pages/             Overview, Timetable, Exams, News
  src/data/              hợp đồng dữ liệu (kiểu TypeScript) giữa parser và trang
  src/mount.tsx          mount vào Shadow DOM, ẩn/hiện FAP gốc
lib/                     parser và logic thuần (vanilla UMD, test bằng node --test)
DESIGN.md                hệ thống thiết kế
dist/                    kết quả build (không commit)
```

**Lấy từ repo Lovable:** component `portal/*` và `ui/*` đang dùng, `styles.css`, dữ liệu mẫu làm dữ liệu giả cho test. Bỏ: TanStack Start, router, server, các file `lovable-error-*`.

## 6. Khớp giao diện (yêu cầu cứng)

1. Token màu, bán kính, bóng, font được sao chép nguyên từ `src/styles.css` của repo Lovable vào `tokens.css`; một test đọc cả hai file và so sánh giá trị.
2. Mỗi trang có kiểm tra ảnh chụp đối chiếu với bản Lovable (cùng dữ liệu mẫu, cùng cỡ cửa sổ); sai khác vượt ngưỡng thì fail.
3. `DESIGN.md` được tạo từ token thật, không tự nghĩ thêm giá trị.

## 7. Điểm kỹ thuật dễ gây lệch giao diện (cần xử lý sớm)

- Tailwind 4 đặt biến trên `:root` và dùng `@property`; cả hai **không hoạt động trong Shadow DOM**. Cần ánh xạ `:root` sang `:host` và chèn các `@property` vào tài liệu chính.
- Đơn vị `rem` phụ thuộc cỡ chữ gốc của FAP; cần cố định cỡ chữ gốc cho cây giao diện (ví dụ chuyển rem sang px khi build hoặc đặt cỡ gốc cho shadow host).
- FAP có CSP chặn style chèn từ trang chính (đã gặp ở bản skin). Content script chạy ở isolated world nên chèn style được; nhúng CSS bằng `adoptedStyleSheets` hoặc thẻ style do content script tạo.
- Font Inter phải nằm trong gói extension (không tải từ Google Fonts).

## 8. Kiểm thử và phát hành

- Parser và logic: test bằng `node --test` với các fixture đã lọc dữ liệu cá nhân (`tests/fixtures/`), như hiện nay.
- Component: test bằng JSDOM (hoặc runner phù hợp do người xây chọn), có thể chạy trong `npm test` bên cạnh `node --test`. Tổng thể vẫn yêu cầu 100% pass.
- Build: `npm run build` tạo `dist/` bằng Vite, **không minify** để reviewer Web Store đọc được. Extension tải từ thư mục gốc cần chạy build một lần; lệnh đóng gói zip trong AGENTS.md phải thêm `dist/`.
- Một test kiểm tra mọi file `manifest.json` tham chiếu đều tồn tại sau khi build.
- Kiểm tra thủ công của người dùng trước khi phát hành: bốn trang trên FAP thật, nút "Xem bản FAP gốc", FAP nạp chậm, mất mạng.

## 9. Việc để người xây tự quyết (mặc định đề xuất)

- Ô chọn cơ sở và ngôn ngữ trên topbar: v1 chỉ **hiển thị** giá trị hiện tại, không đổi được (đổi cơ sở là thao tác ghi của FAP). Chuông thông báo: hiển thị số, bấm vào mở trang FAP gốc.
- Trường dữ liệu có trong mockup mà FAP không cung cấp (ví dụ link phòng online, ký hiệu phòng): chỉ hiển thị khi có dữ liệu; không bịa.
- Thanh tìm kiếm "Tìm chức năng, trang...": tìm trong danh sách menu (không gọi FAP).
- "Chưa đọc" của tin tức: lưu trong `chrome.storage.local` (hook `use-read-news` của Lovable đang dùng `localStorage`).
- Giao diện cho cửa sổ hẹp: giữ hành vi responsive có sẵn của Lovable; không tối ưu thêm trong v1.

## 10. Rủi ro đã biết

| Rủi ro | Cách giảm |
|---|---|
| FAP đổi HTML làm parser vỡ | Parser tách riêng có test với fixture; lỗi thì tự quay về FAP gốc kèm thông báo nhỏ |
| Hiển thị sai dữ liệu đi thi | Kiểm tra số dòng khớp với bản gốc; nút "Xem bản FAP gốc" luôn có |
| Reviewer Web Store khó đọc mã đóng gói | Không minify; ghi rõ cách build trong README |
| Trang Tổng quan nạp chậm | Chờ vùng dữ liệu có timeout, hiển thị khung chờ thay vì trang trống |
| Bảo trì song song với FAP | Chỉ dựng lại trang chỉ đọc; mỗi trang có fixture riêng |
| Bundle React làm chậm mọi trang FAP | Chỉ nạp bundle trên 4 URL đã dựng lại |

## 11. Phương án đã loại

- Skin CSS (đã làm và gỡ).
- Trang riêng của extension (người dùng chọn thay nội dung tại URL gốc).
- Dựng lại cả trang ghi (rủi ro cao với form ASP.NET, reCAPTCHA, thanh toán).
- Viết lại component từ ảnh chụp (người dùng yêu cầu khớp y; có sẵn code).
