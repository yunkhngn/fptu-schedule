# FAP Modern React UI (`ui/`)

This directory contains the rebuilt front-end interface for the FPT University Academic Portal (FAP), packaged as a Chrome Extension content script module.

## Architecture

- **Framework:** React 19, TypeScript, Tailwind CSS 4, Vite 6.
- **Output:** Unminified IIFE bundled to `dist/fap-ui.js`.
- **CSS Isolation:** Runs entirely inside a Shadow DOM attached to `#fptu-ui-host`.
- **Zero External Dependencies / No CDN:** All stylesheets, icons, and variable fonts (`Inter Variable`) are bundled locally under `dist/`. No external script or stylesheet is ever loaded at runtime.
- **Dual Mode / Safety:** Students can seamlessly switch back to the original FAP page at any time via the "Xem bản FAP gốc" button. Write actions (submitting forms, making payments) remain on native FAP pages.

## Directory Structure

```
ui/
├── src/
│   ├── boot.ts                 # Page detector, storage check, and fallback mount logic
│   ├── routes.ts               # Path to page route resolution
│   ├── storage.ts              # Chrome storage abstraction (get/set preferences)
│   ├── components/
│   │   ├── atoms/              # Button, Badge, StatusBadge, Avatar, Input, etc.
│   │   ├── molecules/          # StatCard, DashboardCard, NavItem, EmptyState, etc.
│   │   ├── organisms/          # TopNavigation, AppSidebar, ScheduleCalendar, etc.
│   │   └── templates/          # AppShell, PageHeader
│   ├── data/
│   │   ├── types.ts            # Type contracts (ShellData, HomeData, ClassSession, etc.)
│   │   ├── nav.ts              # Navigation hierarchy and leaf routes
│   │   └── mock.ts             # Static mock data for testing and parity harness
│   ├── design/
│   │   ├── DESIGN.md           # Tokens specification and design reference
│   │   └── tokens.css          # Semantic CSS tokens and Shadow DOM variables
│   ├── pages/                  # Base pages: Overview, Timetable, Exams, News
│   └── shadow/
│       ├── mount.ts            # Shadow root creation and styles injection
│       └── css.ts              # PostCSS rem-to-px transform and font @font-face resolution
├── parity/
│   └── harness.html            # Test harness for headless Chrome parity runs
├── reference/                  # 1440x900 reference screenshots for visual parity
└── scripts/
    ├── capture-reference.mjs   # Script to capture baseline screenshots from reference
    ├── parity.mjs              # Automated pixelmatch visual regression test
    └── postcss-rem-to-px.mjs   # PostCSS transform for Shadow DOM root isolation
```

## Atomic Component Rules

1. **Atoms (`components/atoms/`):**
   - Single-responsibility UI elements (buttons, inputs, status badges, avatars).
   - Use `class-variance-authority` (cva) for variants.
   - Do not contain business logic or domain-specific state.

2. **Molecules (`components/molecules/`):**
   - Composed of 2 or more atoms (StatCard, DashboardCard, NavItem, CategoryFilter).
   - Pure presentational components receiving props.

3. **Organisms (`components/organisms/`):**
   - Complex UI sections (AppSidebar, TopNavigation, ScheduleCalendar, DataTable).
   - Coordinate layout and sub-component interactions.

4. **Templates (`components/templates/`):**
   - Structural wrappers (`AppShell`) providing outer layouts (sidebar + topbar + main).

## Shadow DOM Mounting & Isolation

`src/shadow/mount.ts` creates a host container `<div id="fptu-ui-host">` and attaches an open shadow root.
Compiled CSS is transformed from `rem` to `px` (assuming 16px root) so that arbitrary base font sizes on host FAP pages do not break typography scaling.
Fonts are declared using `@font-face` pointing to `chrome.runtime.getURL("dist/fonts/...")`.

## Commands

```bash
# Run unit tests (66 tests across atoms, molecules, organisms, pages, and build)
npm test

# Build production bundle (unminified IIFE dist/fap-ui.js)
npm run build

# Run visual parity check (headless Chrome pixelmatch against reference screenshots)
npm run parity
```
