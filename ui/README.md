# FAP Modern React UI (`ui/`)

This directory contains the rebuilt front-end interface for the FPT University Academic Portal (FAP), packaged as a Chrome Extension content script module.

## Architecture

- **Framework:** React 19, TypeScript, Tailwind CSS 4, Vite 6.
- **Output:** Unminified IIFE bundled to `dist/fap-ui.js`.
- **CSS Isolation:** Runs entirely inside a Shadow DOM attached to `#fptu-ui-host`.
- **Zero External Dependencies / No CDN:** All stylesheets, icons, and variable fonts (`Inter Variable`) are bundled locally under `dist/`. No external script or stylesheet is ever loaded at runtime.
- **Dual Mode / Safety:** Students can switch back to the original FAP page at any time (one master switch in the popup, sidebar or the floating button on original pages). Pages that cannot be rebuilt safely are shown as FAP's own content inside the new frame, never as the old interface.
- **Write actions:** the interface never submits anything by itself. A rebuilt form writes values into FAP's own controls and presses FAP's own submit button once, after the student clicks ours. Payment pages (`/ShoppingCart`, `/CoursePendingPayment`) are never rebuilt.

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
│   ├── pages/                  # One component per rebuilt page, plus registry.ts (route id -> reader + component)
│   ├── forms/                  # Form driving: useOriginalForm, FormView, setFieldValue/submitForm
│   ├── login/                  # Login page: adopts FAP's login card into a light-DOM slot
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
# Run unit tests (atoms, molecules, organisms, pages, boot, and a smoke test of the built bundle)
npm test

# Build production bundle (unminified IIFE dist/fap-ui.js)
npm run build

# Run visual parity check (headless Chrome pixelmatch against reference screenshots)
npm run parity
```

## Route kinds

The single route table is `lib/fap-routes.js` (vanilla UMD, shared with the early content script). Every path resolves to one of:

| Kind | Meaning |
|---|---|
| `native` | React rebuilds the page from data read out of FAP's DOM. Read-only. |
| `form` | React draws the form but drives FAP's original fields and submit button. Falls back to `wrapped` if the form cannot be read safely. |
| `auth` | The login page. FAP's login card is adopted into a slot so the password manager, reCAPTCHA and anti-forgery token keep working. |
| `wrapped` | The new sidebar and top bar around FAP's own page content (the default for every path without its own route). |

`tests/fap-routes-coverage.test.js` and `src/pages/coverage.test.ts` keep the table, the registry, the fixtures and the sidebar consistent.

## Adding a page

1. **Fixture:** save the page, run it through `scripts/sanitize-fap-page.py`, put it in `tests/fixtures/pages/` and add it to `index.json`. `tests/fixtures-secrets.test.js` must pass.
2. **Reader:** add a function to a `lib/fap-readers-*.js` file (vanilla, UMD) that turns the page DOM into plain data, and a `node --test` test that uses the fixture. List the file in `manifest.json` (document_idle js) and expose the reader on `FapPageData`.
3. **Component:** add `src/pages/<Name>.tsx` built from the atoms, molecules and organisms. Every visible string goes through `useT()` (add both `vi` and `en`). Add a render test.
4. **Registry:** add an entry to `src/pages/registry.ts` (`id`, optional `ready`, `read`, `Component`) and to the exact list in `registry.test.ts`.
5. **Route:** add or change the route in `lib/fap-routes.js` (`kind: "native"` or `"form"`). `nav` is the sidebar address to highlight, or `null` for pages that are not in the sidebar.
6. **Sidebar:** if it is a sidebar entry, add it to `NAV_GROUPS` and `FAP_URLS` in `src/data/nav.ts`.
7. Run `node --test tests/*.test.js`, `npm test`, `npm run build` and `npm run parity`.
