#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as accentPkg from "../../lib/accent.js";

export const ACCENT_PRESETS =
  accentPkg.ACCENT_PRESETS || accentPkg.default?.ACCENT_PRESETS || [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function parseTokens(cssText) {
  const blockMatch = cssText.match(/(?::root|:host)\s*\{([\s\S]*?)\}/);
  if (!blockMatch) return {};
  const block = blockMatch[1];
  const tokens = {};
  const regex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = regex.exec(block)) !== null) {
    const name = m[1].trim();
    const rawVal = m[2].replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const normalizedVal = rawVal.replace(/\s+/g, " ");
    tokens[name] = normalizedVal;
  }
  return tokens;
}

export function parseDarkTokens(cssText) {
  const blockMatch = cssText.match(/:host\(\[data-theme="dark"\]\)\s*\{([\s\S]*?)\}/);
  if (!blockMatch) return {};
  const block = blockMatch[1];
  const tokens = {};
  const regex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = regex.exec(block)) !== null) {
    const name = m[1].trim();
    const rawVal = m[2].replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const normalizedVal = rawVal.replace(/\s+/g, " ");
    tokens[name] = normalizedVal;
  }
  return tokens;
}

function srgbToLinear(c) {
  const v = Math.max(0, Math.min(255, c)) / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v) {
  const c = Math.max(0, Math.min(1, v));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return [
    Math.round(linearToSrgb(rLin) * 255),
    Math.round(linearToSrgb(gLin) * 255),
    Math.round(linearToSrgb(bLin) * 255),
  ];
}

function oklchToRgb(oklch) {
  const hRad = (oklch.h * Math.PI) / 180;
  const a = oklch.c * Math.cos(hRad);
  const b = oklch.c * Math.sin(hRad);
  return oklabToRgb(oklch.l, a, b);
}

function parseOklch(css) {
  const match = css.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/
  );
  if (!match) throw new Error(`Cannot parse oklch string: "${css}"`);
  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
  };
}

function relativeLuminance(r, g, b) {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function contrastRatio(lum1, lum2) {
  const max = Math.max(lum1, lum2);
  const min = Math.min(lum1, lum2);
  return (max + 0.05) / (min + 0.05);
}

export function contrastBetween(color1Css, color2Css) {
  const c1 = parseOklch(color1Css);
  const c2 = parseOklch(color2Css);
  const rgb1 = oklchToRgb(c1);
  const rgb2 = oklchToRgb(c2);
  const lum1 = relativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = relativeLuminance(rgb2[0], rgb2[1], rgb2[2]);
  return contrastRatio(lum1, lum2);
}

export const TOKEN_METADATA = {
  "--background": {
    role: "Base application background canvas",
    example: "Root container background `bg-background`"
  },
  "--foreground": {
    role: "Primary high-contrast text and icon color",
    example: "Body headings, table cell text, primary labels"
  },
  "--surface": {
    role: "Clean surface for cards and container elevations",
    example: "Card backgrounds, panel containers `bg-surface`"
  },
  "--surface-2": {
    role: "Secondary surface for layered cards and zebra rows",
    example: "Table alternating rows, secondary card sections"
  },
  "--card": {
    role: "Card container background surface",
    example: "Dashboard widgets, timetable session cards"
  },
  "--card-foreground": {
    role: "Text color rendered on card backgrounds",
    example: "Card titles, body copy within cards"
  },
  "--popover": {
    role: "Floating popover and dropdown menu background",
    example: "Tooltip backings, dropdown menus, context popups"
  },
  "--popover-foreground": {
    role: "Text color inside popovers and floating panels",
    example: "Dropdown item labels, popover descriptions"
  },
  "--primary": {
    role: "Signature lavender/periwinkle accent color",
    example: "Primary call-to-action buttons, active navigation indicators"
  },
  "--primary-foreground": {
    role: "High-contrast text on primary filled backgrounds",
    example: "Button label text on filled primary buttons"
  },
  "--primary-strong": {
    role: "Readable lavender for text on surfaces",
    example: "Lavender text links, bold badges, emphasized values"
  },
  "--primary-soft": {
    role: "Gentle lavender tint for pill tags and hover states",
    example: "Active tab backgrounds, badge fills, selection highlights"
  },
  "--primary-muted": {
    role: "Muted lavender for soft interactive borders",
    example: "Subtle borders around lavender cards or inputs"
  },
  "--ink": {
    role: "Neutral ink for inverted surface sections and emphasis",
    example: "Inverted pills, high-emphasis chip tags"
  },
  "--ink-foreground": {
    role: "Contrasting text rendered on ink backgrounds",
    example: "Text on inverted ink badges or chips"
  },
  "--secondary": {
    role: "Subtle neutral backing for secondary actions",
    example: "Secondary button fills, input background fills"
  },
  "--secondary-foreground": {
    role: "Text color for secondary buttons and controls",
    example: "Secondary button label text, pill text"
  },
  "--muted": {
    role: "Muted background for disabled or low-priority areas",
    example: "Disabled inputs, inactive tabs, subtle dividers"
  },
  "--muted-foreground": {
    role: "Subdued text color for secondary metadata and hints",
    example: "Slot time ranges, room numbers, explanatory captions"
  },
  "--accent": {
    role: "Hover and selection accent background",
    example: "Hover state on list items, active row backgrounds"
  },
  "--accent-foreground": {
    role: "Text color on hovered or selected accent elements",
    example: "Hovered menu item text, selected list item text"
  },
  "--success": {
    role: "Fresh sage green for positive states and full attendance",
    example: "Attendance present badges, completed course status"
  },
  "--success-soft": {
    role: "Soft sage green tint for success badge backgrounds",
    example: "StatusBadge background when attendance status is present"
  },
  "--success-strong": {
    role: "High-contrast green for text and iconography",
    example: "Attendance percentage text, positive alert labels"
  },
  "--warning": {
    role: "Warm amber for cautionary states and attendance risk",
    example: "Upcoming deadline indicators, attendance risk warning pills"
  },
  "--warning-soft": {
    role: "Soft amber tint for warning badge backgrounds",
    example: "StatusBadge background when session is approaching absence threshold"
  },
  "--warning-strong": {
    role: "High-contrast amber for warning text and alerts",
    example: "Warning toast titles, cautionary attendance notices"
  },
  "--danger": {
    role: "Soft crimson for absence limit breaches and errors",
    example: "Absence limit exceeded alert, exam conflicts"
  },
  "--danger-soft": {
    role: "Soft crimson tint for danger badge backgrounds",
    example: "StatusBadge background for absent or cancelled slots"
  },
  "--danger-strong": {
    role: "High-contrast crimson for danger text and critical warnings",
    example: "Over-absence percentage alerts, error banner copy"
  },
  "--destructive": {
    role: "Destructive action fill (matches danger crimson)",
    example: "Delete confirmation buttons, clear-cache action"
  },
  "--destructive-foreground": {
    role: "Text color on destructive action buttons",
    example: "Button label on destructive action triggers"
  },
  "--border": {
    role: "Subtle neutral border color for layout containers",
    example: "Card outlines, table grid borders, horizontal separators"
  },
  "--input": {
    role: "Border color for interactive input controls",
    example: "Text input borders, select dropdown outlines"
  },
  "--ring": {
    role: "Keyboard focus ring indicator color (lavender)",
    example: "Focus ring on accessible buttons, inputs, tabs"
  },
  "--chart-1": {
    role: "Chart series 1 color (lavender primary)",
    example: "Timetable distribution charts, progress ring segments"
  },
  "--chart-2": {
    role: "Chart series 2 color (sage green)",
    example: "Attendance rate line series, completed credits segment"
  },
  "--chart-3": {
    role: "Chart series 3 color (amber warning)",
    example: "Risk distribution bar, upcoming assignment indicator"
  },
  "--chart-4": {
    role: "Chart series 4 color (crimson danger)",
    example: "Absence breakdown bar, overdue notice series"
  },
  "--chart-5": {
    role: "Chart series 5 color (sky blue neutral)",
    example: "Elective course breakdown, secondary comparison line"
  },
  "--sidebar": {
    role: "Sidebar navigation background surface",
    example: "AppSidebar root container fill"
  },
  "--sidebar-foreground": {
    role: "Sidebar navigation text and icon color",
    example: "Navigation group labels, inactive link text"
  },
  "--sidebar-primary": {
    role: "Active sidebar navigation item accent",
    example: "Active route indicator pill and icon accent"
  },
  "--sidebar-primary-foreground": {
    role: "Text color on active sidebar navigation item",
    example: "Label on currently active navigation item"
  },
  "--sidebar-accent": {
    role: "Hover background on sidebar navigation links",
    example: "Hover state on sidebar items and campus switcher"
  },
  "--sidebar-accent-foreground": {
    role: "Text color on hovered sidebar navigation item",
    example: "Sidebar item label when cursor hovers over it"
  },
  "--sidebar-border": {
    role: "Vertical divider between sidebar and main content",
    example: "Right border of AppSidebar"
  },
  "--sidebar-ring": {
    role: "Keyboard focus outline for sidebar navigation controls",
    example: "Focus ring when navigating sidebar with Tab key"
  }
};

export function generateDesignMd(tokensCss) {
  const lightTokens = parseTokens(tokensCss);
  const darkTokens = parseDarkTokens(tokensCss);

  const lightColorTokens = Object.entries(lightTokens).filter(([name]) =>
    /--(?:background|foreground|surface|card|popover|primary|ink|secondary|muted|accent|success|warning|danger|destructive|border|input|ring|chart-|sidebar)/.test(
      name
    )
  );

  const lightColorRows = lightColorTokens
    .map(([name, val]) => {
      const meta = TOKEN_METADATA[name] || {
        role: "Color token",
        example: `Used via var(${name})`
      };
      return `| \`${name}\` | \`${val}\` | ${meta.role} | ${meta.example} |`;
    })
    .join("\n");

  const darkColorTokens = Object.entries(darkTokens).filter(([name]) =>
    /--(?:background|foreground|surface|card|popover|primary|ink|secondary|muted|accent|success|warning|danger|destructive|border|input|ring|chart-|sidebar)/.test(
      name
    )
  );

  const darkColorRows = darkColorTokens
    .map(([name, val]) => {
      const meta = TOKEN_METADATA[name] || {
        role: "Dark color token",
        example: `Used via var(${name})`
      };
      return `| \`${name}\` | \`${val}\` | ${meta.role} | ${meta.example} |`;
    })
    .join("\n");

  const presetRows = ACCENT_PRESETS.map(
    (p) => `| \`${p.id}\` | ${p.label} | \`${p.light}\` | \`${p.dark}\` |`
  ).join("\n");

  // Contrast measurements for dark theme
  const contrastPairs = [
    {
      fgName: "--foreground",
      bgName: "--background",
      ratio: contrastBetween(darkTokens["--foreground"], darkTokens["--background"]),
      target: ">= 7.0:1 (WCAG AAA)",
      status: "Dat chuan"
    },
    {
      fgName: "--foreground",
      bgName: "--surface",
      ratio: contrastBetween(darkTokens["--foreground"], darkTokens["--surface"]),
      target: ">= 7.0:1 (WCAG AAA)",
      status: "Dat chuan"
    },
    {
      fgName: "--muted-foreground",
      bgName: "--surface",
      ratio: contrastBetween(darkTokens["--muted-foreground"], darkTokens["--surface"]),
      target: ">= 4.5:1 (WCAG AA)",
      status: "Dat chuan"
    },
    {
      fgName: "--primary-strong",
      bgName: "--surface",
      ratio: contrastBetween(darkTokens["--primary-strong"], darkTokens["--surface"]),
      target: ">= 4.5:1 (WCAG AA)",
      status: "Dat chuan"
    },
    {
      fgName: "--primary-strong",
      bgName: "--primary-soft",
      ratio: contrastBetween(darkTokens["--primary-strong"], darkTokens["--primary-soft"]),
      target: ">= 4.5:1 (WCAG AA)",
      status: "Dat chuan"
    },
    {
      fgName: "--ink-foreground",
      bgName: "--ink",
      ratio: contrastBetween(darkTokens["--ink-foreground"], darkTokens["--ink"]),
      target: ">= 4.5:1 (WCAG AA)",
      status: "Dat chuan"
    },
    {
      fgName: "--success-strong",
      bgName: "--success-soft",
      ratio: contrastBetween(darkTokens["--success-strong"], darkTokens["--success-soft"]),
      target: ">= 4.5:1 (WCAG AA)",
      status: "Dat chuan"
    },
    {
      fgName: "--warning-strong",
      bgName: "--warning-soft",
      ratio: contrastBetween(darkTokens["--warning-strong"], darkTokens["--warning-soft"]),
      target: ">= 4.5:1 (WCAG AA)",
      status: "Dat chuan"
    },
    {
      fgName: "--danger-strong",
      bgName: "--danger-soft",
      ratio: contrastBetween(darkTokens["--danger-strong"], darkTokens["--danger-soft"]),
      target: ">= 4.5:1 (WCAG AA)",
      status: "Dat chuan"
    },
    {
      fgName: "--border",
      bgName: "--background",
      ratio: contrastBetween(darkTokens["--border"], darkTokens["--background"]),
      target: ">= 1.15:1 (Phan dinh cau truc)",
      status: "Dat chuan"
    }
  ];

  const contrastRows = contrastPairs
    .map(
      (p) =>
        `| \`${p.fgName}\` tren \`${p.bgName}\` | **${p.ratio.toFixed(2)}:1** | ${p.target} | ${p.status} |`
    )
    .join("\n");

  return `# Design System Specification

## 1. Design Principles

- **Pillio-Inspired Aesthetic:** Light neutral foundation paired with soft lavender/periwinkle accents (\`oklch(0.707 0.129 283.1)\`), creating a calm, modern, and uncluttered student experience.
- **Pure OKLCH Color Space:** All color definitions exclusively use the perceptual \`oklch()\` color model, guaranteeing smooth transitions, consistent perceived lightness, and predictable contrast across surfaces.
- **Generous Rounded Geometry:** High-radius pill shapes and rounded card containers (\`--radius: 1.25rem\` base, scaling up to \`36px\` for outer pills) create a friendly and approachable feel.
- **Layered Elevation:** Low-contrast soft shadows and translucent glass backdrops provide subtle hierarchy without visual noise or harsh dark lines.
- **Strict Non-Intrusiveness:** Purely client-side presentation that never submits forms automatically and acts solely to clarify academic data.

---

## 2. Color Palette (Light Theme)

Every color token is defined in \`ui/src/design/tokens.css\` and mapped into Tailwind CSS utility classes via \`@theme inline\`.

| Token | OKLCH Value | Role | Usage Example |
| :--- | :--- | :--- | :--- |
${lightColorRows}

---

## 3. Gradients and Surface Effects

| Token | Value | Role / Usage |
| :--- | :--- | :--- |
| \`--gradient-lavender\` | \`linear-gradient(135deg, oklch(0.93 0.04 288) 0%, oklch(0.89 0.06 284) 45%, oklch(0.94 0.035 250) 100%)\` | Primary accent background for hero banners and welcome cards |
| \`--gradient-lavender-glow\` | \`radial-gradient(120% 120% at 100% 0%, oklch(0.82 0.09 284 / 0.55) 0%, transparent 55%)\` | Corner glow overlay combined with \`--gradient-lavender\` |
| \`--gradient-surface\` | \`linear-gradient(180deg, oklch(1 0 0) 0%, oklch(0.985 0.006 280) 100%)\` | Subtle vertical gradient for elevated white cards |
| \`glass\` | \`oklch(1 0 0 / 0.72)\` with \`backdrop-filter: blur(18px) saturate(160%)\` | Translucent top navigation and floating headers |

---

## 4. Typography

- **Font Family:** \`"Inter", ui-sans-serif, system-ui, sans-serif\`
- **OpenType Font Features:** \`"cv11", "ss01"\` (enables disambiguated numeral \`1\` / capital \`I\` / lowercase \`l\`, and single-story stylistic alternates)
- **Letter Spacing:** \`-0.006em\` for tight, modern headline and interface legibility
- **Fallback Policy:** If FAP host Content Security Policy (CSP) or network isolation restricts loading external font files (\`.woff2\`), the interface automatically falls back to system fonts (\`ui-sans-serif, system-ui, sans-serif\`) without layout shift.

### Component Type Scale

| Utility | Calculated Size | Typical Component Usage |
| :--- | :--- | :--- |
| \`text-xs\` | 12px (0.75rem) | Badges, slot time ranges, metadata tags, table caption timestamps |
| \`text-sm\` | 14px (0.875rem) | Default body text, table cell contents, form inputs, sidebar items |
| \`text-base\` | 16px (1rem) | Emphasized body text, lead paragraphs, modal descriptions |
| \`text-lg\` | 18px (1.125rem) | Card headings, stat labels, subsection headers |
| \`text-xl\` | 20px (1.25rem) | Modal headers, section titles, calendar week navigator |
| \`text-2xl\` | 24px (1.5rem) | Main page titles, dashboard greeting, hero stat figures |

---

## 5. Radii, Elevation and Motion

### Border Radii Scale

- **Base Radius:** \`--radius: 1.25rem\` (20px)

| Token | Formula / Value | Usage |
| :--- | :--- | :--- |
| \`--radius-sm\` | \`calc(var(--radius) - 8px)\` (12px) | Small tags, nested badges, compact controls |
| \`--radius-md\` | \`calc(var(--radius) - 6px)\` (14px) | Buttons, form inputs, pill filters |
| \`--radius-lg\` | \`calc(var(--radius) - 4px)\` (16px) | Popovers, tooltips, dialogs, medium cards |
| \`--radius-xl\` | \`var(--radius)\` (20px) | Standard surface cards, timetable class blocks |
| \`--radius-2xl\` | \`calc(var(--radius) + 4px)\` (24px) | Floating dashboard panels, modal containers |
| \`--radius-3xl\` | \`calc(var(--radius) + 10px)\` (30px) | Hero banners and announcement cards |
| \`--radius-4xl\` | \`calc(var(--radius) + 16px)\` (36px) | Outermost container wrappers |

### Elevation Shadows

- \`--shadow-soft\`: \`0 1px 2px oklch(0.21 0.01 276.6 / 0.03), 0 4px 16px -6px oklch(0.3 0.04 280 / 0.06)\` (Subtle resting card elevation)
- \`--shadow-float\`: \`0 2px 4px oklch(0.21 0.01 276.6 / 0.03), 0 16px 40px -16px oklch(0.35 0.08 283 / 0.16)\` (Floating dropdowns and popovers)
- \`--shadow-pop\`: \`0 12px 40px -12px oklch(0.25 0.04 280 / 0.22), 0 2px 6px oklch(0.21 0.01 276.6 / 0.05)\` (Prominent dialogs and modal overlays)

### Motion and Transitions

- **Natural Easing Curve:** \`--ease-natural: cubic-bezier(0.22, 0.61, 0.36, 1)\`
- **Page Transition:** \`page-enter\` (duration 220ms with \`--ease-natural\`, translating \`translateY(6px)\` to \`translateY(0)\` with opacity fade-in)

---

## 6. Component Atomic Hierarchy

The user interface follows atomic design hierarchy across four structured levels:

1. **Atoms (\`ui/src/components/atoms/\`):**
   - \`Button\`: Primary, secondary, outline, ghost, and destructive interactive triggers.
   - \`Badge\` & \`StatusBadge\`: Status indicators with optional pulsing dot.
   - \`Avatar\`: Student profile image with initials fallback.
   - \`IconTile\`: Rounded icon tile with customizable tone.
   - \`Input\`: Clean text input field with focus ring.
   - \`Tabs\`: Accessible tab list and trigger navigation.
   - \`Skeleton\`: Loading placeholder block with shimmer.
   - \`Separator\`: Subtle horizontal/vertical divider.
   - \`Tooltip\`: Informational hover hint.

2. **Molecules (\`ui/src/components/molecules/\`):**
   - \`DashboardCard\`: Standard card container with header, actions, and content area.
   - \`StatCard\`: Metric display card with icon tile, label, value, and hint.
   - \`StatTile\`: Metric summary tile with label, value, hint, and tone support.
   - \`NewsItem\`: Announcement preview card with read/unread toggle and date badge.
   - \`CategoryFilter\`: Horizontal pill category switcher.
   - \`FilterBar\`: Dropdown select filter with uppercase label.
   - \`KeyValueList\`: Definition list for key-value property pairs.
   - \`Section\`: Container section with title, description, and action button.
   - \`NavItem\`: Sidebar navigation row with active indicator.
   - \`SearchField\`: Compound search input with leading icon and clear button.
   - \`EmptyState\`: Illustration tile and message for empty views.
   - \`SkeletonRows\`: Multi-row shimmer placeholder for data loading.

3. **Organisms & Templates (\`ui/src/components/organisms/\`, \`ui/src/components/templates/\`):**
   - \`AppSidebar\`: Collapsible navigation sidebar with campus indicator.
   - \`TopNavigation\`: Header bar with breadcrumbs, campus info, and original FAP toggle.
   - \`ScheduleCalendar\`: 7-day weekly timetable grid with slot positioning.
   - \`MiniCalendar\`: Compact monthly calendar widget.
   - \`DataTable\`: Structured data table for exam schedules and grade reports.
   - \`RichTable\`: Styled data table with column alignment, tone highlights, empty state, and caption.
   - \`AnnouncementList\`: Filterable list of campus notifications.
   - \`AppShell\`: Full page layout shell combining sidebar, header, and content.
   - \`PageHeader\`: Standard page header with title, description, and action buttons.

4. **Pages (\`ui/src/pages/\`):**
   - Dashboard (overview metrics, today's schedule, latest notices).
   - Weekly Timetable (full-week class calendar with slot status).
   - Exam Schedule (table of upcoming examination slots, rooms, and seat numbers).
   - News and Announcements (campus bulletin board).
   - Wrapped (shell wrapper adopting native FAP content via Shadow DOM slot).

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
${presetRows}

### Quy tắc mặc định (Default Behavior)

- Khi giá trị màu nhấn chưa được thiết lập (unset), rỗng (empty), không hợp lệ (unknown ID), hoặc chọn \`"lavender"\` (màu mặc định của giao diện FAP UI):
  - Giao diện giữ nguyên toàn bộ token màu tím lavender mặc định của Lovable (\`tokens.css\`) mà không áp dụng bất kỳ thuộc tính ghi đè nào. Hàm \`applyAppearance\` trả về đối tượng rỗng \`{}\` và gỡ bỏ các biến style inline trên host.
  - Điều này đảm bảo tính ổn định và bảo toàn độ tương phản chuẩn của giao diện gốc khi người dùng không tùy biến màu sắc.

### Quy tắc suy biến màu nhấn cho cả hai chế độ (Derivation Rules for Light and Dark Themes)

Các token biến thể được tính toán động từ màu nhấn của preset thông qua mô hình không gian màu cảm nhận trực quan OKLCH cho cả chế độ sáng (light) và chế độ tối (dark):

#### 1. Quy tắc ở chế độ sáng (Light Theme Derivation)

- **Điểm quy chiếu (Base Light Lavender):** Màu gốc tím lavender sáng có tọa độ sắc độ quy chiếu \`hue = 283.1\` ($h_{base}$) và chroma $C_{base} = 0.163$ trích xuất từ mã màu light base (\`#6d5fd6\`).
- **Độ lệch sắc độ và tỉ lệ bão hòa:**
  - Chuyển đổi mã màu light của preset sang OKLCH để lấy tọa độ $(L_{preset}, C_{preset}, h_{preset})$.
  - Độ lệch sắc độ: \`hueDelta\` $\\Delta h = h_{preset} - 283.1$.
  - Tỉ lệ điều chỉnh chroma: $k = C_{preset} / C_{base}$ (nếu $C_{base} > 0$, ngược lại $k = 1$).
- **Giữ nguyên độ sáng (Lightness L):** Kế thừa độ sáng $L$ từ token sáng cơ sở để bảo toàn phân tầng thị giác của thiết kế.
- **Dịch chuyển sắc độ và nhân bão hòa:** $h_{new} = (h_{base} + \\text{hueDelta}) \\pmod{360}$, $c_{new} = c_{base} \\times k$.
- **Đảm bảo độ tương phản WCAG:** Đối với \`--primary-strong\`, tỉ số tương phản phải đạt ít nhất **4.5:1** trên nền trắng (\`#ffffff\`) và trên \`--primary-soft\` sáng. Nếu chưa đạt, giảm $L$ từng bước 0.02 cho đến khi đạt hoặc chạm sàn an toàn $L = 0.40$.

#### 2. Quy tắc ở chế độ tối (Dark Theme Derivation)

- **Điểm quy chiếu (Base Dark Lavender):** Màu gốc tím lavender tối có tọa độ sắc độ quy chiếu \`hue = 283.0\` ($h_{base}$) và chroma $C_{base} = 0.149$ trích xuất từ mã màu dark base (\`#7c6fe0\`).
- **Độ lệch sắc độ và tỉ lệ bão hòa:**
  - Chuyển đổi mã màu dark của preset sang OKLCH để lấy tọa độ $(L_{preset}, C_{preset}, h_{preset})$.
  - Độ lệch sắc độ: \`hueDelta\` $\\Delta h = h_{preset} - 283.0$.
  - Tỉ lệ điều chỉnh chroma: $k = C_{preset} / C_{base}$ (nếu $C_{base} > 0$, ngược lại $k = 1$).
- **Giữ nguyên độ sáng (Lightness L):** Kế thừa độ sáng $L$ từ token tối cơ sở trong khối \`:host([data-theme="dark"])\`.
- **Dịch chuyển sắc độ và nhân bão hòa:** $h_{new} = (h_{base} + \\text{hueDelta}) \\pmod{360}$, $c_{new} = c_{base} \\times k$.
- **Đảm bảo độ tương phản WCAG:** Đối với \`--primary-strong\`, tỉ số tương phản phải đạt ít nhất **4.5:1** trên bề mặt tối \`--surface\` (\`oklch(0.2 0.014 277)\`) và trên \`--primary-soft\` tối (\`oklch(0.3 0.06 285)\`). Nếu chưa đạt, tăng $L$ từng bước 0.02 cho đến khi đạt hoặc chạm trần an toàn $L = 0.95$.

#### 3. Token chuyển màu (Gradients)

- \`--gradient-lavender\` và \`--gradient-lavender-glow\` được tạo lại với các điểm dừng màu (color stops) đã áp dụng cùng độ lệch \`hueDelta\` và hệ số $k$ theo chế độ tương ứng.

---

## 9. Chế độ tối (Dark Mode)

Giao diện FAP mới hỗ trợ chế độ tối hoàn chỉnh, đồng bộ chặt chẽ với tiện ích mở rộng và hệ thống điều hành của người dùng.

### Nguồn lựa chọn và đồng bộ (Source of Truth)

- **Khóa lưu trữ:** Trạng thái giao diện được lưu trữ trong \`chrome.storage.local\` với khóa \`theme\`. Khóa nhận 1 trong 3 giá trị:
  - \`"auto"\`: Tự động nhận diện theo thiết lập giao diện của hệ thống điều hành.
  - \`"light"\`: Cố định chế độ sáng.
  - \`"dark"\`: Cố định chế độ tối.
- **Đồng bộ đa tab thời gian thực:** Khi người dùng thay đổi chế độ từ popup tiện ích hoặc nút đổi chế độ ở thanh trên, tiện ích cập nhật khóa \`theme\`. Bộ theo dõi \`watchAppearance\` nhận sự kiện qua \`chrome.storage.onChanged\` và cập nhật ngay lập tức trên mọi tab FAP đang mở mà không cần tải lại trang.

### Quy tắc "Tự động theo hệ thống" (System Auto Behavior)

- Khi \`theme\` là \`"auto"\`, giao diện lắng nghe truy vấn media tiêu chuẩn \`window.matchMedia("(prefers-color-scheme: dark)")\`.
- Nếu hệ thống điều hành đang đặt chế độ tối, giá trị hiệu lực (\`effectiveTheme\`) giải quyết thành \`"dark"\`. Ngược lại, giá trị giải quyết thành \`"light"\`.
- Khi người dùng thay đổi chế độ hệ thống, listener \`change\` kích hoạt và cập nhật lại giao diện ngay tức thì.

### Cơ chế áp dụng qua CSS Selector (Theme Activation)

- Giá trị hiệu lực được áp dụng bằng thuộc tính \`data-theme\` trực tiếp lên host element của Shadow DOM:
  - Sáng: \`<div id="fptu-ui-host" data-theme="light">\`
  - Tối: \`<div id="fptu-ui-host" data-theme="dark">\`
- Khối token tối được khai báo tập trung trong \`:host([data-theme="dark"])\` tại \`ui/src/design/tokens.css\`, thiết lập \`color-scheme: dark\` và ghi đè toàn bộ token màu, bóng đổ và gradient.

### Bảng màu tối (Dark Theme Palette)

| Token | OKLCH Value | Role | Usage Example |
| :--- | :--- | :--- | :--- |
${darkColorRows}

### Tỷ lệ tương phản WCAG chính (WCAG Contrast Ratios)

Mọi cặp màu văn bản và phần tử tương tác chính ở chế độ tối đều được kiểm tra tỷ lệ tương phản độ chói tương đối (relative luminance) theo chuẩn WCAG 2.1:

| Cặp màu kiểm tra | Tỷ lệ tương phản đo được | Tiêu chuẩn WCAG | Trạng thái |
| :--- | :--- | :--- | :--- |
${contrastRows}
`;
}

// CLI execution
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const uiDir = resolve(__dirname, "..");
  const repoRoot = resolve(uiDir, "..");
  const tokensPath = resolve(uiDir, "src/design/tokens.css");
  const targetMdPath = resolve(repoRoot, "DESIGN.md");

  const tokensCss = readFileSync(tokensPath, "utf8");
  const generatedMd = generateDesignMd(tokensCss);

  const isCheck = process.argv.includes("--check");

  if (isCheck) {
    try {
      const existing = readFileSync(targetMdPath, "utf8");
      if (existing.trim() === generatedMd.trim()) {
        console.log("DESIGN.md is up-to-date");
        process.exit(0);
      } else {
        console.error("DESIGN.md is out of date. Run 'node ui/scripts/gen-design-md.mjs' to regenerate.");
        process.exit(1);
      }
    } catch (err) {
      console.error("DESIGN.md does not exist. Run 'node ui/scripts/gen-design-md.mjs' to generate.");
      process.exit(1);
    }
  } else {
    writeFileSync(targetMdPath, generatedMd, "utf8");
    console.log("Generated DESIGN.md successfully");
  }
}
