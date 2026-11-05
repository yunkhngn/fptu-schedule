# Design System Specification

## 1. Design Principles

- **Pillio-Inspired Aesthetic:** Light neutral foundation paired with soft lavender/periwinkle accents (`oklch(0.707 0.129 283.1)`), creating a calm, modern, and uncluttered student experience.
- **Pure OKLCH Color Space:** All color definitions exclusively use the perceptual `oklch()` color model, guaranteeing smooth transitions, consistent perceived lightness, and predictable contrast across surfaces.
- **Generous Rounded Geometry:** High-radius pill shapes and rounded card containers (`--radius: 1.25rem` base, scaling up to `36px` for outer pills) create a friendly and approachable feel.
- **Layered Elevation:** Low-contrast soft shadows and translucent glass backdrops provide subtle hierarchy without visual noise or harsh dark lines.
- **Strict Non-Intrusiveness:** Purely client-side presentation that never submits forms automatically and acts solely to clarify academic data.

---

## 2. Color Palette (Light Theme)

Every color token is defined in `ui/src/design/tokens.css` and mapped into Tailwind CSS utility classes via `@theme inline`.

| Token | OKLCH Value | Role | Usage Example |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.98 0.005 275)` | Base application background canvas | Root container background `bg-background` |
| `--foreground` | `oklch(0.21 0.01 276.6)` | Primary high-contrast text and icon color | Body headings, table cell text, primary labels |
| `--surface` | `oklch(1 0 0)` | Clean surface for cards and container elevations | Card backgrounds, panel containers `bg-surface` |
| `--surface-2` | `oklch(0.968 0.008 278.6)` | Secondary surface for layered cards and zebra rows | Table alternating rows, secondary card sections |
| `--card` | `oklch(1 0 0)` | Card container background surface | Dashboard widgets, timetable session cards |
| `--card-foreground` | `oklch(0.21 0.01 276.6)` | Text color rendered on card backgrounds | Card titles, body copy within cards |
| `--popover` | `oklch(1 0 0)` | Floating popover and dropdown menu background | Tooltip backings, dropdown menus, context popups |
| `--popover-foreground` | `oklch(0.21 0.01 276.6)` | Text color inside popovers and floating panels | Dropdown item labels, popover descriptions |
| `--primary` | `oklch(0.707 0.129 283.1)` | Signature lavender/periwinkle accent color | Primary call-to-action buttons, active navigation indicators |
| `--primary-foreground` | `oklch(1 0 0)` | High-contrast text on primary filled backgrounds | Button label text on filled primary buttons |
| `--primary-strong` | `oklch(0.56 0.16 281)` | Readable lavender for text on surfaces | Lavender text links, bold badges, emphasized values |
| `--primary-soft` | `oklch(0.939 0.031 287.8)` | Gentle lavender tint for pill tags and hover states | Active tab backgrounds, badge fills, selection highlights |
| `--primary-muted` | `oklch(0.849 0.065 285.9)` | Muted lavender for soft interactive borders | Subtle borders around lavender cards or inputs |
| `--ink` | `oklch(0.21 0.01 276.6)` | Neutral ink for inverted surface sections and emphasis | Inverted pills, high-emphasis chip tags |
| `--ink-foreground` | `oklch(0.98 0.005 275)` | Contrasting text rendered on ink backgrounds | Text on inverted ink badges or chips |
| `--secondary` | `oklch(0.968 0.008 278.6)` | Subtle neutral backing for secondary actions | Secondary button fills, input background fills |
| `--secondary-foreground` | `oklch(0.21 0.01 276.6)` | Text color for secondary buttons and controls | Secondary button label text, pill text |
| `--muted` | `oklch(0.968 0.008 278.6)` | Muted background for disabled or low-priority areas | Disabled inputs, inactive tabs, subtle dividers |
| `--muted-foreground` | `oklch(0.629 0.02 275.5)` | Subdued text color for secondary metadata and hints | Slot time ranges, room numbers, explanatory captions |
| `--accent` | `oklch(0.955 0.018 284)` | Hover and selection accent background | Hover state on list items, active row backgrounds |
| `--accent-foreground` | `oklch(0.21 0.01 276.6)` | Text color on hovered or selected accent elements | Hovered menu item text, selected list item text |
| `--success` | `oklch(0.721 0.101 165)` | Fresh sage green for positive states and full attendance | Attendance present badges, completed course status |
| `--success-soft` | `oklch(0.955 0.03 165)` | Soft sage green tint for success badge backgrounds | StatusBadge background when attendance status is present |
| `--success-strong` | `oklch(0.52 0.09 165)` | High-contrast green for text and iconography | Attendance percentage text, positive alert labels |
| `--warning` | `oklch(0.803 0.109 76)` | Warm amber for cautionary states and attendance risk | Upcoming deadline indicators, attendance risk warning pills |
| `--warning-soft` | `oklch(0.965 0.035 80)` | Soft amber tint for warning badge backgrounds | StatusBadge background when session is approaching absence threshold |
| `--warning-strong` | `oklch(0.56 0.1 65)` | High-contrast amber for warning text and alerts | Warning toast titles, cautionary attendance notices |
| `--danger` | `oklch(0.722 0.122 14.8)` | Soft crimson for absence limit breaches and errors | Absence limit exceeded alert, exam conflicts |
| `--danger-soft` | `oklch(0.96 0.025 15)` | Soft crimson tint for danger badge backgrounds | StatusBadge background for absent or cancelled slots |
| `--danger-strong` | `oklch(0.55 0.15 18)` | High-contrast crimson for danger text and critical warnings | Over-absence percentage alerts, error banner copy |
| `--destructive` | `oklch(0.722 0.122 14.8)` | Destructive action fill (matches danger crimson) | Delete confirmation buttons, clear-cache action |
| `--destructive-foreground` | `oklch(1 0 0)` | Text color on destructive action buttons | Button label on destructive action triggers |
| `--border` | `oklch(0.949 0.008 271.3)` | Subtle neutral border color for layout containers | Card outlines, table grid borders, horizontal separators |
| `--input` | `oklch(0.93 0.01 275)` | Border color for interactive input controls | Text input borders, select dropdown outlines |
| `--ring` | `oklch(0.707 0.129 283.1)` | Keyboard focus ring indicator color (lavender) | Focus ring on accessible buttons, inputs, tabs |
| `--chart-1` | `oklch(0.707 0.129 283.1)` | Chart series 1 color (lavender primary) | Timetable distribution charts, progress ring segments |
| `--chart-2` | `oklch(0.721 0.101 165)` | Chart series 2 color (sage green) | Attendance rate line series, completed credits segment |
| `--chart-3` | `oklch(0.803 0.109 76)` | Chart series 3 color (amber warning) | Risk distribution bar, upcoming assignment indicator |
| `--chart-4` | `oklch(0.722 0.122 14.8)` | Chart series 4 color (crimson danger) | Absence breakdown bar, overdue notice series |
| `--chart-5` | `oklch(0.75 0.09 230)` | Chart series 5 color (sky blue neutral) | Elective course breakdown, secondary comparison line |
| `--sidebar` | `oklch(1 0 0)` | Sidebar navigation background surface | AppSidebar root container fill |
| `--sidebar-foreground` | `oklch(0.21 0.01 276.6)` | Sidebar navigation text and icon color | Navigation group labels, inactive link text |
| `--sidebar-primary` | `oklch(0.707 0.129 283.1)` | Active sidebar navigation item accent | Active route indicator pill and icon accent |
| `--sidebar-primary-foreground` | `oklch(1 0 0)` | Text color on active sidebar navigation item | Label on currently active navigation item |
| `--sidebar-accent` | `oklch(0.955 0.018 284)` | Hover background on sidebar navigation links | Hover state on sidebar items and campus switcher |
| `--sidebar-accent-foreground` | `oklch(0.21 0.01 276.6)` | Text color on hovered sidebar navigation item | Sidebar item label when cursor hovers over it |
| `--sidebar-border` | `oklch(0.949 0.008 271.3)` | Vertical divider between sidebar and main content | Right border of AppSidebar |
| `--sidebar-ring` | `oklch(0.707 0.129 283.1)` | Keyboard focus outline for sidebar navigation controls | Focus ring when navigating sidebar with Tab key |

---

## 3. Gradients and Surface Effects

| Token | Value | Role / Usage |
| :--- | :--- | :--- |
| `--gradient-lavender` | `linear-gradient(135deg, oklch(0.93 0.04 288) 0%, oklch(0.89 0.06 284) 45%, oklch(0.94 0.035 250) 100%)` | Primary accent background for hero banners and welcome cards |
| `--gradient-lavender-glow` | `radial-gradient(120% 120% at 100% 0%, oklch(0.82 0.09 284 / 0.55) 0%, transparent 55%)` | Corner glow overlay combined with `--gradient-lavender` |
| `--gradient-surface` | `linear-gradient(180deg, oklch(1 0 0) 0%, oklch(0.985 0.006 280) 100%)` | Subtle vertical gradient for elevated white cards |
| `glass` | `oklch(1 0 0 / 0.72)` with `backdrop-filter: blur(18px) saturate(160%)` | Translucent top navigation and floating headers |

---

## 4. Typography

- **Font Family:** `"Inter", ui-sans-serif, system-ui, sans-serif`
- **OpenType Font Features:** `"cv11", "ss01"` (enables disambiguated numeral `1` / capital `I` / lowercase `l`, and single-story stylistic alternates)
- **Letter Spacing:** `-0.006em` for tight, modern headline and interface legibility
- **Fallback Policy:** If FAP host Content Security Policy (CSP) or network isolation restricts loading external font files (`.woff2`), the interface automatically falls back to system fonts (`ui-sans-serif, system-ui, sans-serif`) without layout shift.

### Component Type Scale

| Utility | Calculated Size | Typical Component Usage |
| :--- | :--- | :--- |
| `text-xs` | 12px (0.75rem) | Badges, slot time ranges, metadata tags, table caption timestamps |
| `text-sm` | 14px (0.875rem) | Default body text, table cell contents, form inputs, sidebar items |
| `text-base` | 16px (1rem) | Emphasized body text, lead paragraphs, modal descriptions |
| `text-lg` | 18px (1.125rem) | Card headings, stat labels, subsection headers |
| `text-xl` | 20px (1.25rem) | Modal headers, section titles, calendar week navigator |
| `text-2xl` | 24px (1.5rem) | Main page titles, dashboard greeting, hero stat figures |

---

## 5. Radii, Elevation and Motion

### Border Radii Scale

- **Base Radius:** `--radius: 1.25rem` (20px)

| Token | Formula / Value | Usage |
| :--- | :--- | :--- |
| `--radius-sm` | `calc(var(--radius) - 8px)` (12px) | Small tags, nested badges, compact controls |
| `--radius-md` | `calc(var(--radius) - 6px)` (14px) | Buttons, form inputs, pill filters |
| `--radius-lg` | `calc(var(--radius) - 4px)` (16px) | Popovers, tooltips, dialogs, medium cards |
| `--radius-xl` | `var(--radius)` (20px) | Standard surface cards, timetable class blocks |
| `--radius-2xl` | `calc(var(--radius) + 4px)` (24px) | Floating dashboard panels, modal containers |
| `--radius-3xl` | `calc(var(--radius) + 10px)` (30px) | Hero banners and announcement cards |
| `--radius-4xl` | `calc(var(--radius) + 16px)` (36px) | Outermost container wrappers |

### Elevation Shadows

- `--shadow-soft`: `0 1px 2px oklch(0.21 0.01 276.6 / 0.03), 0 4px 16px -6px oklch(0.3 0.04 280 / 0.06)` (Subtle resting card elevation)
- `--shadow-float`: `0 2px 4px oklch(0.21 0.01 276.6 / 0.03), 0 16px 40px -16px oklch(0.35 0.08 283 / 0.16)` (Floating dropdowns and popovers)
- `--shadow-pop`: `0 12px 40px -12px oklch(0.25 0.04 280 / 0.22), 0 2px 6px oklch(0.21 0.01 276.6 / 0.05)` (Prominent dialogs and modal overlays)

### Motion and Transitions

- **Natural Easing Curve:** `--ease-natural: cubic-bezier(0.22, 0.61, 0.36, 1)`
- **Page Transition:** `page-enter` (duration 220ms with `--ease-natural`, translating `translateY(6px)` to `translateY(0)` with opacity fade-in)

---

## 6. Component Atomic Hierarchy

The user interface follows atomic design hierarchy across four structured levels:

1. **Atoms (`ui/src/components/atoms/`):**
   - `Button`: Primary, secondary, outline, ghost, and destructive interactive triggers.
   - `Badge` & `StatusBadge`: Status indicators with optional pulsing dot.
   - `Avatar`: Student profile image with initials fallback.
   - `IconTile`: Rounded icon tile with customizable tone.
   - `Input`: Clean text input field with focus ring.
   - `Tabs`: Accessible tab list and trigger navigation.
   - `Skeleton`: Loading placeholder block with shimmer.
   - `Separator`: Subtle horizontal/vertical divider.
   - `Tooltip`: Informational hover hint.

2. **Molecules (`ui/src/components/molecules/`):**
   - `DashboardCard`: Standard card container with header, actions, and content area.
   - `StatCard`: Metric display card with icon tile, label, value, and hint.
   - `NewsItem`: Announcement preview card with read/unread toggle and date badge.
   - `CategoryFilter`: Horizontal pill category switcher.
   - `NavItem`: Sidebar navigation row with active indicator.
   - `SearchField`: Compound search input with leading icon and clear button.
   - `EmptyState`: Illustration tile and message for empty views.
   - `SkeletonRows`: Multi-row shimmer placeholder for data loading.

3. **Organisms & Templates (`ui/src/components/organisms/`, `ui/src/components/templates/`):**
   - `AppSidebar`: Collapsible navigation sidebar with campus indicator.
   - `TopNavigation`: Header bar with breadcrumbs, campus info, and original FAP toggle.
   - `ScheduleCalendar`: 7-day weekly timetable grid with slot positioning.
   - `MiniCalendar`: Compact monthly calendar widget.
   - `DataTable`: Structured data table for exam schedules and grade reports.
   - `AnnouncementList`: Filterable list of campus notifications.
   - `AppShell`: Full page layout shell combining sidebar, header, and content.
   - `PageHeader`: Standard page header with title, description, and action buttons.

4. **Pages (`ui/src/pages/`):**
   - Dashboard (overview metrics, today's schedule, latest notices).
   - Weekly Timetable (full-week class calendar with slot status).
   - Exam Schedule (table of upcoming examination slots, rooms, and seat numbers).
   - News and Announcements (campus bulletin board).

---

## 7. Strict Zero-Emoji UI Standard

- **Zero Emojis in Interface:** In strict compliance with extension guidelines, character emojis are never rendered in user-facing components, toasts, badges, or dialogs.
- **Vector Iconography:** All visual icons are rendered exclusively through inline SVG elements (Lucide icons in the React UI, and SVG symbol references in the extension popup).

---

## 8. Màu nhấn (Accent Colors)

Hệ thống giao diện hỗ trợ các màu nhấn (accent presets) đồng bộ giữa tiện ích mở rộng và giao diện FAP mới. Mỗi preset cung cấp giá trị màu tương ứng cho cả giao diện sáng (light) và tối (dark).

### Danh sách Preset

| Preset ID | Nhãn hiển thị | Màu Light | Màu Dark |
| :--- | :--- | :--- | :--- |
| `blue` | Xanh dương | `#2563eb` | `#3b82f6` |
| `indigo` | Chàm | `#4f46e5` | `#6366f1` |
| `violet` | Tím | `#7c3aed` | `#8b5cf6` |
| `lavender` | Tím lavender | `#6d5fd6` | `#7c6fe0` |
| `pink` | Hồng | `#db2777` | `#ec4899` |
| `orange` | Cam | `#e0510a` | `#ea580c` |
| `teal` | Xanh ngọc | `#0f766e` | `#0d9488` |
| `green` | Xanh lá | `#15803d` | `#059669` |
| `graphite` | Xám than | `#475569` | `#64748b` |

### Quy tắc mặc định (Default Behavior)

- Khi giá trị màu nhấn chưa được thiết lập (unset), rỗng (empty), không hợp lệ (unknown ID), hoặc chọn `"lavender"` (màu mặc định của giao diện FAP UI):
  - Giao diện giữ nguyên toàn bộ token màu tím lavender mặc định của Lovable (`tokens.css`) mà không áp dụng bất kỳ thuộc tính ghi đè nào. Hàm `applyAppearance` trả về đối tượng rỗng `{}` và gỡ bỏ các biến style inline trên host.
  - Điều này đảm bảo tính ổn định và bảo toàn độ tương phản chuẩn của giao diện gốc khi người dùng không tùy biến màu sắc.

### Quy tắc suy biến màu nhấn cho cả hai chế độ (Derivation Rules for Light and Dark Themes)

Các token biến thể được tính toán động từ màu nhấn của preset thông qua mô hình không gian màu cảm nhận trực quan OKLCH cho cả chế độ sáng (light) và chế độ tối (dark):

#### 1. Quy tắc ở chế độ sáng (Light Theme Derivation)

- **Điểm quy chiếu (Base Light Lavender):** Màu gốc tím lavender sáng có tọa độ sắc độ quy chiếu `hue = 283.1` ($h_{base}$) và chroma $C_{base} = 0.163$ trích xuất từ mã màu light base (`#6d5fd6`).
- **Độ lệch sắc độ và tỉ lệ bão hòa:**
  - Chuyển đổi mã màu light của preset sang OKLCH để lấy tọa độ $(L_{preset}, C_{preset}, h_{preset})$.
  - Độ lệch sắc độ: `hueDelta` $\Delta h = h_{preset} - 283.1$.
  - Tỉ lệ điều chỉnh chroma: $k = C_{preset} / C_{base}$ (nếu $C_{base} > 0$, ngược lại $k = 1$).
- **Giữ nguyên độ sáng (Lightness L):** Kế thừa độ sáng $L$ từ token sáng cơ sở để bảo toàn phân tầng thị giác của thiết kế.
- **Dịch chuyển sắc độ và nhân bão hòa:** $h_{new} = (h_{base} + \text{hueDelta}) \pmod{360}$, $c_{new} = c_{base} \times k$.
- **Đảm bảo độ tương phản WCAG:** Đối với `--primary-strong`, tỉ số tương phản phải đạt ít nhất **4.5:1** trên nền trắng (`#ffffff`) và trên `--primary-soft` sáng. Nếu chưa đạt, giảm $L$ từng bước 0.02 cho đến khi đạt hoặc chạm sàn an toàn $L = 0.40$.

#### 2. Quy tắc ở chế độ tối (Dark Theme Derivation)

- **Điểm quy chiếu (Base Dark Lavender):** Màu gốc tím lavender tối có tọa độ sắc độ quy chiếu `hue = 283.0` ($h_{base}$) và chroma $C_{base} = 0.149$ trích xuất từ mã màu dark base (`#7c6fe0`).
- **Độ lệch sắc độ và tỉ lệ bão hòa:**
  - Chuyển đổi mã màu dark của preset sang OKLCH để lấy tọa độ $(L_{preset}, C_{preset}, h_{preset})$.
  - Độ lệch sắc độ: `hueDelta` $\Delta h = h_{preset} - 283.0$.
  - Tỉ lệ điều chỉnh chroma: $k = C_{preset} / C_{base}$ (nếu $C_{base} > 0$, ngược lại $k = 1$).
- **Giữ nguyên độ sáng (Lightness L):** Kế thừa độ sáng $L$ từ token tối cơ sở trong khối `:host([data-theme="dark"])`.
- **Dịch chuyển sắc độ và nhân bão hòa:** $h_{new} = (h_{base} + \text{hueDelta}) \pmod{360}$, $c_{new} = c_{base} \times k$.
- **Đảm bảo độ tương phản WCAG:** Đối với `--primary-strong`, tỉ số tương phản phải đạt ít nhất **4.5:1** trên bề mặt tối `--surface` (`oklch(0.2 0.014 277)`) và trên `--primary-soft` tối (`oklch(0.3 0.06 285)`). Nếu chưa đạt, tăng $L$ từng bước 0.02 cho đến khi đạt hoặc chạm trần an toàn $L = 0.95$.

#### 3. Token chuyển màu (Gradients)

- `--gradient-lavender` và `--gradient-lavender-glow` được tạo lại với các điểm dừng màu (color stops) đã áp dụng cùng độ lệch `hueDelta` và hệ số $k$ theo chế độ tương ứng.

---

## 9. Chế độ tối (Dark Mode)

Giao diện FAP mới hỗ trợ chế độ tối hoàn chỉnh, đồng bộ chặt chẽ với tiện ích mở rộng và hệ thống điều hành của người dùng.

### Nguồn lựa chọn và đồng bộ (Source of Truth)

- **Khóa lưu trữ:** Trạng thái giao diện được lưu trữ trong `chrome.storage.local` với khóa `theme`. Khóa nhận 1 trong 3 giá trị:
  - `"auto"`: Tự động nhận diện theo thiết lập giao diện của hệ thống điều hành.
  - `"light"`: Cố định chế độ sáng.
  - `"dark"`: Cố định chế độ tối.
- **Đồng bộ đa tab thời gian thực:** Khi người dùng thay đổi chế độ từ popup tiện ích hoặc nút đổi chế độ ở thanh trên, tiện ích cập nhật khóa `theme`. Bộ theo dõi `watchAppearance` nhận sự kiện qua `chrome.storage.onChanged` và cập nhật ngay lập tức trên mọi tab FAP đang mở mà không cần tải lại trang.

### Quy tắc "Tự động theo hệ thống" (System Auto Behavior)

- Khi `theme` là `"auto"`, giao diện lắng nghe truy vấn media tiêu chuẩn `window.matchMedia("(prefers-color-scheme: dark)")`.
- Nếu hệ thống điều hành đang đặt chế độ tối, giá trị hiệu lực (`effectiveTheme`) giải quyết thành `"dark"`. Ngược lại, giá trị giải quyết thành `"light"`.
- Khi người dùng thay đổi chế độ hệ thống, listener `change` kích hoạt và cập nhật lại giao diện ngay tức thì.

### Cơ chế áp dụng qua CSS Selector (Theme Activation)

- Giá trị hiệu lực được áp dụng bằng thuộc tính `data-theme` trực tiếp lên host element của Shadow DOM:
  - Sáng: `<div id="fptu-ui-host" data-theme="light">`
  - Tối: `<div id="fptu-ui-host" data-theme="dark">`
- Khối token tối được khai báo tập trung trong `:host([data-theme="dark"])` tại `ui/src/design/tokens.css`, thiết lập `color-scheme: dark` và ghi đè toàn bộ token màu, bóng đổ và gradient.

### Bảng màu tối (Dark Theme Palette)

| Token | OKLCH Value | Role | Usage Example |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.16 0.012 276)` | Base application background canvas | Root container background `bg-background` |
| `--foreground` | `oklch(0.95 0.006 275)` | Primary high-contrast text and icon color | Body headings, table cell text, primary labels |
| `--surface` | `oklch(0.2 0.014 277)` | Clean surface for cards and container elevations | Card backgrounds, panel containers `bg-surface` |
| `--surface-2` | `oklch(0.25 0.016 278)` | Secondary surface for layered cards and zebra rows | Table alternating rows, secondary card sections |
| `--card` | `oklch(0.2 0.014 277)` | Card container background surface | Dashboard widgets, timetable session cards |
| `--card-foreground` | `oklch(0.95 0.006 275)` | Text color rendered on card backgrounds | Card titles, body copy within cards |
| `--popover` | `oklch(0.2 0.014 277)` | Floating popover and dropdown menu background | Tooltip backings, dropdown menus, context popups |
| `--popover-foreground` | `oklch(0.95 0.006 275)` | Text color inside popovers and floating panels | Dropdown item labels, popover descriptions |
| `--primary` | `oklch(0.72 0.13 283)` | Signature lavender/periwinkle accent color | Primary call-to-action buttons, active navigation indicators |
| `--primary-foreground` | `oklch(0.16 0.012 276)` | High-contrast text on primary filled backgrounds | Button label text on filled primary buttons |
| `--primary-strong` | `oklch(0.82 0.1 283)` | Readable lavender for text on surfaces | Lavender text links, bold badges, emphasized values |
| `--primary-soft` | `oklch(0.3 0.06 285)` | Gentle lavender tint for pill tags and hover states | Active tab backgrounds, badge fills, selection highlights |
| `--primary-muted` | `oklch(0.4 0.07 285)` | Muted lavender for soft interactive borders | Subtle borders around lavender cards or inputs |
| `--ink` | `oklch(0.95 0.006 275)` | Neutral ink for inverted surface sections and emphasis | Inverted pills, high-emphasis chip tags |
| `--ink-foreground` | `oklch(0.16 0.012 276)` | Contrasting text rendered on ink backgrounds | Text on inverted ink badges or chips |
| `--secondary` | `oklch(0.25 0.016 278)` | Subtle neutral backing for secondary actions | Secondary button fills, input background fills |
| `--secondary-foreground` | `oklch(0.95 0.006 275)` | Text color for secondary buttons and controls | Secondary button label text, pill text |
| `--muted` | `oklch(0.25 0.016 278)` | Muted background for disabled or low-priority areas | Disabled inputs, inactive tabs, subtle dividers |
| `--muted-foreground` | `oklch(0.72 0.02 275)` | Subdued text color for secondary metadata and hints | Slot time ranges, room numbers, explanatory captions |
| `--accent` | `oklch(0.26 0.02 284)` | Hover and selection accent background | Hover state on list items, active row backgrounds |
| `--accent-foreground` | `oklch(0.95 0.006 275)` | Text color on hovered or selected accent elements | Hovered menu item text, selected list item text |
| `--success` | `oklch(0.75 0.12 165)` | Fresh sage green for positive states and full attendance | Attendance present badges, completed course status |
| `--success-soft` | `oklch(0.28 0.04 165)` | Soft sage green tint for success badge backgrounds | StatusBadge background when attendance status is present |
| `--success-strong` | `oklch(0.82 0.12 165)` | High-contrast green for text and iconography | Attendance percentage text, positive alert labels |
| `--warning` | `oklch(0.78 0.12 76)` | Warm amber for cautionary states and attendance risk | Upcoming deadline indicators, attendance risk warning pills |
| `--warning-soft` | `oklch(0.3 0.05 76)` | Soft amber tint for warning badge backgrounds | StatusBadge background when session is approaching absence threshold |
| `--warning-strong` | `oklch(0.84 0.12 76)` | High-contrast amber for warning text and alerts | Warning toast titles, cautionary attendance notices |
| `--danger` | `oklch(0.72 0.14 18)` | Soft crimson for absence limit breaches and errors | Absence limit exceeded alert, exam conflicts |
| `--danger-soft` | `oklch(0.28 0.05 18)` | Soft crimson tint for danger badge backgrounds | StatusBadge background for absent or cancelled slots |
| `--danger-strong` | `oklch(0.82 0.14 18)` | High-contrast crimson for danger text and critical warnings | Over-absence percentage alerts, error banner copy |
| `--destructive` | `oklch(0.72 0.14 18)` | Destructive action fill (matches danger crimson) | Delete confirmation buttons, clear-cache action |
| `--destructive-foreground` | `oklch(0.16 0.012 276)` | Text color on destructive action buttons | Button label on destructive action triggers |
| `--border` | `oklch(0.3 0.015 276)` | Subtle neutral border color for layout containers | Card outlines, table grid borders, horizontal separators |
| `--input` | `oklch(0.3 0.015 276)` | Border color for interactive input controls | Text input borders, select dropdown outlines |
| `--ring` | `oklch(0.72 0.13 283)` | Keyboard focus ring indicator color (lavender) | Focus ring on accessible buttons, inputs, tabs |
| `--chart-1` | `oklch(0.72 0.13 283)` | Chart series 1 color (lavender primary) | Timetable distribution charts, progress ring segments |
| `--chart-2` | `oklch(0.75 0.12 165)` | Chart series 2 color (sage green) | Attendance rate line series, completed credits segment |
| `--chart-3` | `oklch(0.78 0.12 76)` | Chart series 3 color (amber warning) | Risk distribution bar, upcoming assignment indicator |
| `--chart-4` | `oklch(0.72 0.14 18)` | Chart series 4 color (crimson danger) | Absence breakdown bar, overdue notice series |
| `--chart-5` | `oklch(0.76 0.1 230)` | Chart series 5 color (sky blue neutral) | Elective course breakdown, secondary comparison line |
| `--sidebar` | `oklch(0.2 0.014 277)` | Sidebar navigation background surface | AppSidebar root container fill |
| `--sidebar-foreground` | `oklch(0.95 0.006 275)` | Sidebar navigation text and icon color | Navigation group labels, inactive link text |
| `--sidebar-primary` | `oklch(0.72 0.13 283)` | Active sidebar navigation item accent | Active route indicator pill and icon accent |
| `--sidebar-primary-foreground` | `oklch(0.16 0.012 276)` | Text color on active sidebar navigation item | Label on currently active navigation item |
| `--sidebar-accent` | `oklch(0.26 0.02 284)` | Hover background on sidebar navigation links | Hover state on sidebar items and campus switcher |
| `--sidebar-accent-foreground` | `oklch(0.95 0.006 275)` | Text color on hovered sidebar navigation item | Sidebar item label when cursor hovers over it |
| `--sidebar-border` | `oklch(0.3 0.015 276)` | Vertical divider between sidebar and main content | Right border of AppSidebar |
| `--sidebar-ring` | `oklch(0.72 0.13 283)` | Keyboard focus outline for sidebar navigation controls | Focus ring when navigating sidebar with Tab key |

### Tỷ lệ tương phản WCAG chính (WCAG Contrast Ratios)

Mọi cặp màu văn bản và phần tử tương tác chính ở chế độ tối đều được kiểm tra tỷ lệ tương phản độ chói tương đối (relative luminance) theo chuẩn WCAG 2.1:

| Cặp màu kiểm tra | Tỷ lệ tương phản đo được | Tiêu chuẩn WCAG | Trạng thái |
| :--- | :--- | :--- | :--- |
| `--foreground` tren `--background` | **16.75:1** | >= 7.0:1 (WCAG AAA) | Dat chuan |
| `--foreground` tren `--surface` | **15.61:1** | >= 7.0:1 (WCAG AAA) | Dat chuan |
| `--muted-foreground` tren `--surface` | **7.29:1** | >= 4.5:1 (WCAG AA) | Dat chuan |
| `--primary-strong` tren `--surface` | **10.12:1** | >= 4.5:1 (WCAG AA) | Dat chuan |
| `--primary-strong` tren `--primary-soft` | **7.72:1** | >= 4.5:1 (WCAG AA) | Dat chuan |
| `--ink-foreground` tren `--ink` | **16.75:1** | >= 4.5:1 (WCAG AA) | Dat chuan |
| `--success-strong` tren `--success-soft` | **8.66:1** | >= 4.5:1 (WCAG AA) | Dat chuan |
| `--warning-strong` tren `--warning-soft` | **8.31:1** | >= 4.5:1 (WCAG AA) | Dat chuan |
| `--danger-strong` tren `--danger-soft` | **7.51:1** | >= 4.5:1 (WCAG AA) | Dat chuan |
| `--border` tren `--background` | **1.42:1** | >= 1.15:1 (Phan dinh cau truc) | Dat chuan |
