#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
    role: "Clean white surface for cards and container elevations",
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
    role: "Deep readable lavender for text on light backgrounds",
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
    role: "Deep neutral ink for dark surface sections and emphasis",
    example: "Dark pills, high-emphasis chip tags"
  },
  "--ink-foreground": {
    role: "Light contrasting text rendered on ink backgrounds",
    example: "Text on dark ink badges or inverted chips"
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
    role: "High-contrast green for text and iconography on light",
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
  const tokens = parseTokens(tokensCss);

  const colorTokens = Object.entries(tokens).filter(([name]) =>
    /--(?:background|foreground|surface|card|popover|primary|ink|secondary|muted|accent|success|warning|danger|destructive|border|input|ring|chart-|sidebar)/.test(
      name
    )
  );

  const colorRows = colorTokens
    .map(([name, val]) => {
      const meta = TOKEN_METADATA[name] || {
        role: "Color token",
        example: `Used via var(${name})`
      };
      return `| \`${name}\` | \`${val}\` | ${meta.role} | ${meta.example} |`;
    })
    .join("\n");

  return `# Design System Specification

## 1. Design Principles

- **Pillio-Inspired Aesthetic:** Light neutral foundation paired with soft lavender/periwinkle accents (\`oklch(0.707 0.129 283.1)\`), creating a calm, modern, and uncluttered student experience.
- **Pure OKLCH Color Space:** All color definitions exclusively use the perceptual \`oklch()\` color model, guaranteeing smooth transitions, consistent perceived lightness, and predictable contrast across surfaces.
- **Generous Rounded Geometry:** High-radius pill shapes and rounded card containers (\`--radius: 1.25rem\` base, scaling up to \`36px\` for outer pills) create a friendly and approachable feel.
- **Layered Elevation:** Low-contrast soft shadows and translucent glass backdrops provide subtle hierarchy without visual noise or harsh dark lines.
- **Strict Non-Intrusiveness:** Purely client-side presentation that never submits forms automatically and acts solely to clarify academic data.

---

## 2. Color Palette

Every color token is defined in \`ui/src/design/tokens.css\` and mapped into Tailwind CSS utility classes via \`@theme inline\`.

| Token | OKLCH Value | Role | Usage Example |
| :--- | :--- | :--- | :--- |
${colorRows}

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
   - \`NewsItem\`: Announcement preview card with read/unread toggle and date badge.
   - \`CategoryFilter\`: Horizontal pill category switcher.
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
   - \`AnnouncementList\`: Filterable list of campus notifications.
   - \`AppShell\`: Full page layout shell combining sidebar, header, and content.
   - \`PageHeader\`: Standard page header with title, description, and action buttons.

4. **Pages (\`ui/src/pages/\`):**
   - Dashboard (overview metrics, today's schedule, latest notices).
   - Weekly Timetable (full-week class calendar with slot status).
   - Exam Schedule (table of upcoming examination slots, rooms, and seat numbers).
   - News and Announcements (campus bulletin board).

---

## 7. Strict Zero-Emoji UI Standard

- **Zero Emojis in Interface:** In strict compliance with extension guidelines, character emojis are never rendered in user-facing components, toasts, badges, or dialogs.
- **Vector Iconography:** All visual icons are rendered exclusively through inline SVG elements (Lucide icons in the React UI, and SVG symbol references in the extension popup).
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
