# Chrome Web Store Privacy Policy and Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve Chrome Web Store submission rejection by establishing a standalone, comprehensive Privacy Policy and Terms of Service page at `docs/privacy.html`, with prominent cross-links in the documentation site navigation, footer, FAQ, extension popup, and repository documentation.

**Architecture:** Static HTML5/CSS page (`docs/privacy.html`) inheriting the glassmorphic, responsive design system and theme switcher of `docs/styles.css`. All navigation links between `docs/index.html` and `docs/privacy.html` are relative and standard HTML, with zero runtime build dependencies.

**Tech Stack:** Pure Vanilla HTML5, Vanilla CSS3, SVG icons, Node.js built-in test runner.

## Global Constraints

- **Strict Zero-Emoji Policy:** Absolutely NO character emojis in user-facing UI, HTML documents, release notes, or store listings. Always use inline SVG symbol icons.
- **Zero External Dependencies:** No CDNs, no external CSS/JS libraries, no build tools.
- **Privacy Standard:** 100% offline, on-device local storage only (`chrome.storage.local`). Zero telemetry or external server communication.
- **Legal Compliance:** Comprehensive English legal policy addressing Chrome Web Store Developer Program Policies, paired with clear Vietnamese summaries for FPT University students.
- **Test Integrity:** 100% test pass rate maintained with `node --test tests/*.test.js`.

---

### Task 1: Create `docs/privacy.html` Standalone Policy Document

**Files:**
- Create: `docs/privacy.html`
- Test: Link integrity and theme functionality check

**Interfaces:**
- Consumes: `docs/styles.css`, `docs/icon-128.png`, `docs/icon.png`
- Produces: `docs/privacy.html` with anchors `#privacy`, `#terms`, `#permissions`, `#contact`

- [ ] **Step 1: Draft the complete `docs/privacy.html` file**

Create `docs/privacy.html` with:
- Standard HTML5 head with title "FPTU Schedule — Chính sách quyền riêng tư & Điều khoản sử dụng" and meta description.
- Sticky glassmorphic header with brand logo, link back to `index.html`, section anchors (`#privacy`, `#terms`, `#permissions`, `#contact`), and theme toggle button (Dark/Light).
- Hero / Header introducing the policy version, effective date (September 2026), and open-source nature.
- Policy Section 1: Overview and Core Principles (100% client-side, non-profit, student-first).
- Policy Section 2: Data Handling, Collection, and Storage (explicitly noting timetable, grades, exam schedules, and attendance are stored strictly in `chrome.storage.local` with zero external transmission).
- Policy Section 3: Chrome Extension Permissions Justification (detailed technical explanations of `storage`, `alarms`, `notifications`, and `*://fap.fpt.edu.vn/*`).
- Policy Section 4: Terms of Service (MIT License terms, student responsibility, no automated form submissions, non-affiliation disclaimer).
- Policy Section 5: Data Deletion and User Rights (how to delete data instantly by clearing extension storage or uninstalling).
- Policy Section 6: Contact and Reporting (GitHub Issues link at `https://github.com/yunkhngn/fptu-schedule/issues`).
- Site Footer mirroring `docs/index.html` with links to Home, GitHub, Releases, and Chrome Store.
- Embedded inline vanilla JavaScript for the theme switcher synced with `localStorage.getItem('fptu_docs_theme')`.

- [ ] **Step 2: Verify `docs/privacy.html` formatting, zero-emoji compliance, and styling**

Run: `node -e 'const fs=require("fs"); const c=fs.readFileSync("docs/privacy.html","utf8"); if(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u.test(c)){console.error("FAIL: emoji detected"); process.exit(1);} else {console.log("PASS: zero emoji");}'`
Expected: PASS: zero emoji

- [ ] **Step 3: Commit `docs/privacy.html`**

```bash
git add docs/privacy.html
git commit -m "docs: add standalone privacy policy and terms page"
```

---

### Task 2: Integrate Privacy Policy Links in `docs/index.html`

**Files:**
- Modify: `docs/index.html:26-35` (Header navigation)
- Modify: `docs/index.html:987-995` (Site footer links)
- Modify: `docs/index.html:910-975` (FAQ section)

**Interfaces:**
- Consumes: `docs/privacy.html`
- Produces: Prominent navigation links in header, footer, and FAQ pointing to `privacy.html`

- [ ] **Step 1: Update header navigation in `docs/index.html`**

In `<nav class="site-nav" aria-label="Điều hướng chính">`, add:
```html
<a href="privacy.html">Quyền riêng tư</a>
```

- [ ] **Step 2: Update site footer links in `docs/index.html`**

In `<div class="site-footer__links">`, add:
```html
<a href="privacy.html">Chính sách quyền riêng tư</a>
<a href="privacy.html#terms">Điều khoản sử dụng</a>
```

- [ ] **Step 3: Add Privacy and Security entry to FAQ section in `docs/index.html`**

Add a dedicated accordion / FAQ item:
"Dữ liệu lịch học và điểm số của tôi có được gửi ra ngoài không?"
With answer explaining the 100% offline, on-device architecture, zero tracking, and direct link to `privacy.html`.

- [ ] **Step 4: Verify zero-emoji and link validity in `docs/index.html`**

Run: `node -e 'const fs=require("fs"); const c=fs.readFileSync("docs/index.html","utf8"); if(!c.includes("privacy.html")){console.error("FAIL: missing privacy link"); process.exit(1);} else {console.log("PASS: privacy link present");}'`
Expected: PASS: privacy link present

- [ ] **Step 5: Commit `docs/index.html` updates**

```bash
git add docs/index.html
git commit -m "docs: add privacy policy and terms links to navigation, footer and faq"
```

---

### Task 3: Add Privacy Link to Extension `popup.html`

**Files:**
- Modify: `popup.html:420-427` (Popup footer)

**Interfaces:**
- Consumes: `https://yunkhngn.github.io/fptu-schedule/privacy.html`
- Produces: Direct privacy link visible to users in popup footer

- [ ] **Step 1: Add privacy link to `popup.html` footer**

In `<footer class="popup-footer">`, update the links row to include:
```html
<span class="footer-dot">·</span>
<a id="privacyLink" href="https://yunkhngn.github.io/fptu-schedule/privacy.html" target="_blank" rel="noopener">Quyền riêng tư</a>
```

- [ ] **Step 2: Verify zero-emoji and test suite passes**

Run: `node --test tests/*.test.js`
Expected: All 122 tests pass with 0 failures.

- [ ] **Step 3: Commit `popup.html` update**

```bash
git add popup.html
git commit -m "feat(ui): add privacy policy link to extension popup footer"
```

---

### Task 4: Update `README.md` and `STORE_LISTING.txt`

**Files:**
- Modify: `README.md:214-230`
- Modify: `STORE_LISTING.txt`

**Interfaces:**
- Consumes: `https://yunkhngn.github.io/fptu-schedule/privacy.html`
- Produces: Clear, copy-pasteable compliance information for Chrome Web Store Developer Console resubmission

- [ ] **Step 1: Update Privacy section in `README.md`**

Add direct link to the Privacy Policy:
`Privacy Policy: [yunkhngn.github.io/fptu-schedule/privacy.html](https://yunkhngn.github.io/fptu-schedule/privacy.html)`

- [ ] **Step 2: Update `STORE_LISTING.txt`**

Add the official Privacy Policy URL under the support/links section so the developer can paste it directly into Chrome Web Store Developer Dashboard.

- [ ] **Step 3: Commit documentation updates**

```bash
git add README.md STORE_LISTING.txt
git commit -m "docs: add official privacy policy url to readme and store listing"
```

---

### Task 5: Full Regression Testing & Compliance Audit

**Files:**
- Test all repository tests: `tests/*.test.js`
- Audit all modified files for Zero-Emoji rule

- [ ] **Step 1: Run complete automated test suite**

Run: `node --test tests/*.test.js`
Expected: 100% pass rate.

- [ ] **Step 2: Audit git diff and zero-emoji compliance**

Run: `git diff main~4..HEAD`
Verify no unintended regressions or emojis were introduced.
