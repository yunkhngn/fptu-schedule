# Design Specification: Privacy Policy and Chrome Web Store Compliance

- **Date:** 2026-09-07
- **Topic:** Dedicated Privacy Policy Page, Terms of Service, and Compliance Integration
- **Target Version:** v3.6.5 Documentation & Compliance Fix

---

## 1. Background & Problem Statement

The extension submission for FPTU Schedule was rejected during Chrome Web Store review because the published documentation website (`https://yunkhngn.github.io/fptu-schedule/`) lacked prominent, direct links to the Privacy Policy and Terms of Service.

Google Chrome Web Store Developer Program Policies mandate:
1. Every extension handling user data must provide an accessible, valid, and prominent Privacy Policy URL.
2. The homepage/documentation URL submitted in the developer console must clearly link to the Privacy Policy.
3. The Privacy Policy must clearly articulate data collection practices, on-device local processing, zero third-party data sharing, and specific permission justifications (such as `storage`, `alarms`, `notifications`, and host permissions for FAP).

---

## 2. Goals & Success Criteria

- **CWS Compliance:** Provide a dedicated, standalone, static HTML page at `docs/privacy.html` accessible at `https://yunkhngn.github.io/fptu-schedule/privacy.html`.
- **Prominent Navigation:** Add unambiguous Privacy Policy and Terms of Service links in the header navigation, footer, and FAQ of `docs/index.html`.
- **In-App Transparency:** Add a direct Privacy Policy link in `popup.html` footer so students can inspect the policy directly from the extension UI.
- **Bilingual & Professional:** Provide a legally robust English Privacy Policy and Terms of Service satisfying Google Web Store reviewer standards, paired with clear Vietnamese section summaries for Vietnamese student clarity.
- **Zero-Emoji Compliance:** Adhere strictly to the project-wide Zero-Emoji rule in all UI text, HTML documents, and documentation files.
- **Design Consistency:** Match the existing glassmorphic, responsive, and dark/light theme styling of `docs/styles.css`.

---

## 3. Architecture & Components

### 3.1. Standalone Document: `docs/privacy.html`

The page will be structured as follows:
- **Header:**
  - Site brand logo linking back to `index.html`.
  - Navigation links back to Main Documentation (`index.html`) and relevant sections (`#privacy`, `#terms`, `#permissions`, `#contact`).
  - Interactive Theme Toggle (Dark/Light) wired into `localStorage` (matching `docs/index.html`).
- **Legal Content Sections:**
  1. **Overview & Principles:**
     - Open-source, non-profit extension for FPT University students.
     - 100% offline, local-first architecture.
  2. **Data Handling & Storage:**
     - What data is read: Class timetable slots, exam dates, subject codes, rooms, campus names, grades, and attendance rates from FAP (`fap.fpt.edu.vn`).
     - Where data is kept: Exclusively in client-side storage (`chrome.storage.local`).
     - Zero telemetry, zero analytics tracking, zero third-party servers.
  3. **Chrome Extension Permissions Justification:**
     - `storage`: Caching timetable and user preferences locally.
     - `alarms`: Scheduling local countdown checks and keep-alive ping intervals.
     - `notifications`: Firing native OS notifications before scheduled classes.
     - `*://fap.fpt.edu.vn/*`: Reading schedule tables and keeping the ASP.NET session alive during active browser usage.
  4. **Terms of Service:**
     - Licensed under the open-source MIT License.
     - User responsibility: Extension operates solely on behalf of the student; it does not alter FAP grades or submit surveys automatically.
     - Disclaimer of affiliation: Independent open-source project, not an official product of FPT University.
  5. **Contact & Rights:**
     - GitHub Issues link for security disclosures or privacy questions.
     - Clear statement on user data deletion (clearing browser data or uninstalling the extension immediately removes all data).
- **Footer:** Consistent with `docs/index.html` with links to GitHub, Releases, and Main Site.

### 3.2. Updates to `docs/index.html`

- **Header Nav:** Add `<a href="privacy.html">Quyền riêng tư</a>`.
- **Site Footer Links:** Add:
  - `<a href="privacy.html">Chính sách quyền riêng tư</a>`
  - `<a href="privacy.html#terms">Điều khoản sử dụng</a>`
- **FAQ Section:** Add an explicit FAQ entry addressing data safety and privacy, linking to `privacy.html`.

### 3.3. Updates to `popup.html`

- In the popup footer (`<footer class="popup-footer">`), add a link to `https://yunkhngn.github.io/fptu-schedule/privacy.html` alongside the existing documentation link.

### 3.4. Updates to `STORE_LISTING.txt` & `README.md`

- Document the exact Privacy Policy URL (`https://yunkhngn.github.io/fptu-schedule/privacy.html`) for fast reference when updating the Chrome Web Store Developer Dashboard.

---

## 4. Verification & Testing

- **Automated Tests:** Execute `node --test tests/*.test.js` to ensure zero regressions across all existing parser and utility tests.
- **Link & Anchor Verification:** Verify all relative links (`privacy.html`, `index.html`, `#terms`, `#privacy`) resolve without 404s.
- **Theme Consistency:** Test Dark and Light modes on `privacy.html` using the existing CSS variables.
- **Zero-Emoji Check:** Verify no unicode emojis are present in any modified or newly created files.
