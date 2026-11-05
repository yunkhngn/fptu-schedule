(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FapFeedback = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const POSITIVE_COMMENTS = [
    "Thầy/Cô dạy rất nhiệt tình, giải đáp thắc mắc của sinh viên rất chi tiết và tận tâm ạ.",
    "Bài giảng dễ hiểu, thầy/cô luôn tạo không khí học tập tích cực và truyền cảm hứng cho sinh viên.",
    "Phương pháp giảng dạy rất hay và thực tế, em học hỏi được rất nhiều kiến thức bổ ích từ môn học.",
    "Thầy/Cô chấm chữa bài kỹ lưỡng, đưa ra nhận xét rất chi tiết giúp sinh viên tiến bộ từng ngày ạ.",
    "Em rất cảm ơn thầy/cô đã đồng hành và hỗ trợ lớp nhiệt tình trong suốt học kỳ vừa qua ạ!",
    "Giảng viên có kiến thức chuyên môn sâu rộng, truyền đạt cuốn hút và luôn quan tâm đến sinh viên.",
    "Tiết học luôn sinh động, nhiều ví dụ thực tế sát với công việc sau này. Em rất thích phong cách dạy của thầy/cô.",
    "Thầy/Cô hỗ trợ giải đáp bài tập ngoài giờ rất nhiệt tình, luôn sẵn sàng lắng nghe ý kiến của sinh viên.",
    "Em rất ấn tượng với sự tận tụy và tâm huyết của thầy/cô dành cho môn học và sinh viên ạ.",
    "Thầy/Cô thân thiện, cởi mở, giải thích từng khái niệm rõ ràng, giúp em tiếp thu kiến thức rất hiệu quả.",
    "Bài giảng chuẩn bị rất công phu và dễ tiếp thu, tạo động lực học tập rất lớn cho em ạ.",
    "Mọi thắc mắc của lớp đều được thầy/cô hướng dẫn chu đáo. Em xin chân thành cảm ơn thầy/cô!"
  ];

  function getRandomFeedbackComment(excludeIndex = -1) {
    if (POSITIVE_COMMENTS.length <= 1) {
      return { comment: POSITIVE_COMMENTS[0], index: 0 };
    }
    let idx = Math.floor(Math.random() * POSITIVE_COMMENTS.length);
    if (idx === excludeIndex) {
      idx = (idx + 1) % POSITIVE_COMMENTS.length;
    }
    return {
      comment: POSITIVE_COMMENTS[idx],
      index: idx
    };
  }

  function findFapFeedbackRadioGroups(container) {
    const root = container || (typeof document !== "undefined" ? document : null);
    if (!root) return new Map();

    const radios = Array.from(root.querySelectorAll('input[type="radio"]'));
    const groups = new Map();

    radios.forEach((r) => {
      const name = r.name || (typeof r.getAttribute === "function" ? r.getAttribute("name") : "");
      if (!name) return;
      if (!groups.has(name)) {
        groups.set(name, []);
      }
      groups.get(name).push(r);
    });

    return groups;
  }

  function findFapCommentTextarea(container) {
    const root = container || (typeof document !== "undefined" ? document : null);
    if (!root) return null;

    return (
      root.querySelector('textarea[id*="txtComment"]') ||
      root.querySelector('textarea[name*="Comment"]') ||
      root.querySelector('textarea[id*="Comment"]') ||
      root.querySelector('textarea[id*="mainContent"]') ||
      root.querySelector("textarea")
    );
  }

  function extractRadioLabelText(r) {
    if (!r) return "";
    let text = "";
    try {
      if (r.labels && r.labels.length > 0) {
        text = Array.from(r.labels).map((l) => l.textContent || "").join(" ");
      } else if (typeof r.closest === "function") {
        const lbl = r.closest("label");
        if (lbl) text = lbl.textContent || "";
      }
      if (!text && r.id) {
        const doc = r.ownerDocument || (typeof document !== "undefined" ? document : null);
        if (doc && typeof doc.querySelector === "function") {
          const forLbl = doc.querySelector('label[for="' + r.id + '"]');
          if (forLbl) text = forLbl.textContent || "";
        }
      }
      if (!text && r.nextElementSibling) {
        text = r.nextElementSibling.textContent || "";
      }
      if (!text && r.parentElement) {
        text = r.parentElement.textContent || "";
      }
    } catch (_) {}
    return (text || "").trim();
  }

  function getRadioRatingScore(r, index) {
    if (!r) return -Infinity;

    const labelText = extractRadioLabelText(r);

    // 1. Explicit numeric rating in label: e.g. "4 - Always punctual", "1 - Poor", "5. Very good", "4/5"
    if (labelText) {
      const numMatch = labelText.match(/^\s*(\d+)\s*[-–—.:/)]/);
      if (numMatch) {
        return parseInt(numMatch[1], 10);
      }
      const startNumMatch = labelText.match(/^\s*(\d+)\b/);
      if (startNumMatch) {
        return parseInt(startNumMatch[1], 10);
      }
    }

    // 2. Purely numeric radio value: "4", "5", "10"
    // CRITICAL: NEVER parse alphanumeric strings or UUIDs like "01a07c76-..." where parseFloat yields 1!
    const rawVal = typeof r.value === "string" ? r.value.trim() : String(r.value || "").trim();
    if (/^[-+]?\d+(\.\d+)?$/.test(rawVal)) {
      const parsedVal = parseFloat(rawVal);
      if (!isNaN(parsedVal)) {
        return parsedVal;
      }
    }

    // 3. Keyword sentiment heuristic if label has text without leading numbers
    if (labelText) {
      const lower = labelText.toLowerCase();
      if (/(rất tốt|hoàn toàn|xuất sắc|very good|excellent|always|fully|always punctual)/i.test(lower)) {
        return 100;
      }
      if (/(tốt|khá|good|mostly|mostly punctual)/i.test(lower)) {
        return 50;
      }
      if (/(trung bình|bình thường|average|rarely|rarely punctual|partially)/i.test(lower)) {
        return 20;
      }
      if (/(kém|rất kém|không|yếu|poor|not at all|never)/i.test(lower)) {
        return 0;
      }
    }

    // 4. Default Likert order fallback: higher index in DOM = higher rating
    return typeof index === "number" ? index : 0;
  }

  function getHighestRatingRadio(radios) {
    if (!radios || radios.length === 0) return null;
    let best = radios[radios.length - 1];
    let maxVal = -Infinity;

    for (let i = 0; i < radios.length; i++) {
      const r = radios[i];
      const score = getRadioRatingScore(r, i);
      if (score > maxVal) {
        maxVal = score;
        best = r;
      }
    }
    return best;
  }

  function fillFapFeedbackForm(container, commentText) {
    const groups = findFapFeedbackRadioGroups(container);
    let radiosFilled = 0;

    groups.forEach((radios) => {
      const highestRadio = getHighestRatingRadio(radios);
      if (highestRadio) {
        highestRadio.checked = true;
        try {
          highestRadio.dispatchEvent(new Event("change", { bubbles: true }));
          highestRadio.dispatchEvent(new Event("click", { bubbles: true }));
        } catch (_) {}
        radiosFilled++;
      }
    });

    let commentFilled = false;
    const txt = findFapCommentTextarea(container);
    if (txt) {
      const textToUse = commentText || getRandomFeedbackComment().comment;
      txt.value = textToUse;
      try {
        txt.dispatchEvent(new Event("input", { bubbles: true }));
        txt.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (_) {}
      commentFilled = true;
    }

    return { radiosFilled, commentFilled };
  }

  function resetFapFeedbackForm(container) {
    const root = container || (typeof document !== "undefined" ? document : null);
    if (!root) return { radiosCleared: 0, commentCleared: false };

    const radios = Array.from(root.querySelectorAll('input[type="radio"]'));
    let radiosCleared = 0;
    radios.forEach((r) => {
      if (r.checked) {
        r.checked = false;
        try {
          r.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (_) {}
        radiosCleared++;
      }
    });

    const txt = findFapCommentTextarea(root);
    let commentCleared = false;
    if (txt) {
      txt.value = "";
      try {
        txt.dispatchEvent(new Event("input", { bubbles: true }));
        txt.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (_) {}
      commentCleared = true;
    }

    return { radiosCleared, commentCleared };
  }

  const TOOLBAR_STYLES = `
    #fptu-feedback-toolbar {
      position: fixed;
      top: 18px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #0f172a;
      --tb-accent: var(--fptu-accent, #2563eb);
      --tb-accent-strong: var(--fptu-accent-strong, #1d4ed8);
      --tb-accent-rgb: var(--fptu-accent-rgb, 37, 99, 235);
    }
    #fptu-feedback-toolbar * {
      box-sizing: border-box;
    }
    .fptu-feedback-panel {
      width: 320px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 14px;
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(var(--tb-accent-rgb), 0.12);
      padding: 14px 16px;
      color: #0f172a;
      animation: fptuFeedbackSlideIn 0.25s ease-out;
    }
    .fptu-feedback-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }
    .fptu-feedback-title {
      font-weight: 700;
      font-size: 13px;
      letter-spacing: -0.01em;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .fptu-feedback-badge {
      background: var(--tb-accent);
      color: #ffffff;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .fptu-feedback-close {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 4px;
      border-radius: 6px;
      transition: all 0.15s ease;
    }
    .fptu-feedback-close:hover {
      color: #0f172a;
      background: rgba(15, 23, 42, 0.06);
    }
    .fptu-feedback-btn-primary {
      width: 100%;
      background: linear-gradient(135deg, var(--tb-accent) 0%, var(--tb-accent-strong) 100%);
      color: #ffffff;
      font-weight: 600;
      font-size: 13px;
      border: none;
      border-radius: 8px;
      padding: 10px 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 4px 14px rgba(var(--tb-accent-rgb), 0.35);
      transition: all 0.15s ease;
      margin-bottom: 8px;
    }
    .fptu-feedback-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(var(--tb-accent-rgb), 0.45);
      filter: brightness(1.05);
    }
    .fptu-feedback-btn-primary:active {
      transform: translateY(0);
    }
    .fptu-feedback-row-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .fptu-feedback-btn-secondary {
      flex: 1;
      background: rgba(15, 23, 42, 0.04);
      border: 1px solid rgba(15, 23, 42, 0.1);
      color: #334155;
      font-size: 12px;
      font-weight: 500;
      border-radius: 8px;
      padding: 7px 10px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .fptu-feedback-btn-secondary:hover {
      background: rgba(15, 23, 42, 0.08);
      color: #0f172a;
    }
    .fptu-feedback-btn-secondary:active {
      transform: scale(0.98);
    }
    .fptu-feedback-preview {
      font-size: 11.5px;
      color: #334155;
      background: rgba(var(--tb-accent-rgb), 0.05);
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 8px;
      line-height: 1.45;
      font-style: italic;
      border-left: 3px solid var(--tb-accent);
      max-height: 60px;
      overflow-y: auto;
    }
    .fptu-feedback-note {
      font-size: 10.5px;
      color: #64748b;
      text-align: center;
      line-height: 1.35;
    }
    .fptu-feedback-pill {
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--tb-accent);
      color: #0f172a;
      padding: 7px 14px;
      border-radius: 999px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 12px;
      transition: all 0.2s ease;
    }
    .fptu-feedback-pill:hover {
      background: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 10px 28px rgba(var(--tb-accent-rgb), 0.25);
    }
    .fptu-feedback-toast {
      position: absolute;
      bottom: -40px;
      right: 0;
      background: #10b981;
      color: #ffffff;
      font-size: 11.5px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
      animation: fptuFeedbackFade 0.2s ease-out;
      white-space: nowrap;
    }
    .fptu-feedback-icon {
      flex-shrink: 0;
      vertical-align: -2px;
    }

    /* Dark theme adaptation when page or system is dark */
    @media (prefers-color-scheme: dark) {
      #fptu-feedback-toolbar {
        color: #f8fafc;
      }
      .fptu-feedback-panel {
        background: rgba(15, 23, 42, 0.94);
        border-color: rgba(255, 255, 255, 0.14);
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(var(--tb-accent-rgb), 0.18);
        color: #f8fafc;
      }
      .fptu-feedback-header {
        border-bottom-color: rgba(255, 255, 255, 0.08);
      }
      .fptu-feedback-title {
        color: #f8fafc;
      }
      .fptu-feedback-close {
        color: #94a3b8;
      }
      .fptu-feedback-close:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
      }
      .fptu-feedback-btn-secondary {
        background: rgba(255, 255, 255, 0.07);
        border-color: rgba(255, 255, 255, 0.12);
        color: #e2e8f0;
      }
      .fptu-feedback-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.13);
        color: #ffffff;
      }
      .fptu-feedback-preview {
        background: rgba(0, 0, 0, 0.28);
        color: #cbd5e1;
      }
      .fptu-feedback-note {
        color: #94a3b8;
      }
      .fptu-feedback-pill {
        background: rgba(15, 23, 42, 0.94);
        color: #f8fafc;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }
      .fptu-feedback-pill:hover {
        background: rgba(30, 41, 59, 0.98);
      }
    }

    /* Explicit Dark Theme override via data attributes */
    html[data-bs-theme="dark"] #fptu-feedback-toolbar,
    html[data-fptu-theme="dark"] #fptu-feedback-toolbar,
    html.dark #fptu-feedback-toolbar {
      color: #f8fafc;
    }
    html[data-bs-theme="dark"] .fptu-feedback-panel,
    html[data-fptu-theme="dark"] .fptu-feedback-panel,
    html.dark .fptu-feedback-panel {
      background: rgba(15, 23, 42, 0.94);
      border-color: rgba(255, 255, 255, 0.14);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(var(--tb-accent-rgb), 0.18);
      color: #f8fafc;
    }
    html[data-bs-theme="dark"] .fptu-feedback-header,
    html[data-fptu-theme="dark"] .fptu-feedback-header,
    html.dark .fptu-feedback-header {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }
    html[data-bs-theme="dark"] .fptu-feedback-title,
    html[data-fptu-theme="dark"] .fptu-feedback-title,
    html.dark .fptu-feedback-title {
      color: #f8fafc;
    }
    html[data-bs-theme="dark"] .fptu-feedback-close,
    html[data-fptu-theme="dark"] .fptu-feedback-close,
    html.dark .fptu-feedback-close {
      color: #94a3b8;
    }
    html[data-bs-theme="dark"] .fptu-feedback-close:hover,
    html[data-fptu-theme="dark"] .fptu-feedback-close:hover,
    html.dark .fptu-feedback-close:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }
    html[data-bs-theme="dark"] .fptu-feedback-btn-secondary,
    html[data-fptu-theme="dark"] .fptu-feedback-btn-secondary,
    html.dark .fptu-feedback-btn-secondary {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
    }
    html[data-bs-theme="dark"] .fptu-feedback-btn-secondary:hover,
    html[data-fptu-theme="dark"] .fptu-feedback-btn-secondary:hover,
    html.dark .fptu-feedback-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.13);
      color: #ffffff;
    }
    html[data-bs-theme="dark"] .fptu-feedback-preview,
    html[data-fptu-theme="dark"] .fptu-feedback-preview,
    html.dark .fptu-feedback-preview {
      background: rgba(0, 0, 0, 0.28);
      color: #cbd5e1;
    }
    html[data-bs-theme="dark"] .fptu-feedback-note,
    html[data-fptu-theme="dark"] .fptu-feedback-note,
    html.dark .fptu-feedback-note {
      color: #94a3b8;
    }
    html[data-bs-theme="dark"] .fptu-feedback-pill,
    html[data-fptu-theme="dark"] .fptu-feedback-pill,
    html.dark .fptu-feedback-pill {
      background: rgba(15, 23, 42, 0.94);
      color: #f8fafc;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    html[data-bs-theme="dark"] .fptu-feedback-pill:hover,
    html[data-fptu-theme="dark"] .fptu-feedback-pill:hover,
    html.dark .fptu-feedback-pill:hover {
      background: rgba(30, 41, 59, 0.98);
    }
    @keyframes fptuFeedbackSlideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fptuFeedbackFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  // Inline SVG icons: the toolbar lives on the FAP page, so no external sprite is available.
  function svgIcon(body) {
    return '<svg class="fptu-feedback-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body + "</svg>";
  }
  const ICON_BOLT = svgIcon('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>');
  const ICON_DICE = svgIcon('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="12" cy="12" r="1"/>');
  const ICON_RESET = svgIcon('<path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 9 9 9"/>');
  const ICON_CLOSE = svgIcon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>');

  function injectFapFeedbackToolbar(doc) {
    const documentObj = doc || (typeof document !== "undefined" ? document : null);
    if (!documentObj) return null;

    let existing = documentObj.getElementById("fptu-feedback-toolbar");
    if (existing) return existing;

    // Inject styles
    if (!documentObj.getElementById("fptu-feedback-toolbar-style")) {
      const styleEl = documentObj.createElement("style");
      styleEl.id = "fptu-feedback-toolbar-style";
      styleEl.textContent = TOOLBAR_STYLES;
      if (documentObj.head) {
        documentObj.head.appendChild(styleEl);
      }
    }

    let currentCommentState = getRandomFeedbackComment();
    let extVersion = "v4.1.0";
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.getManifest === "function") {
        const manifest = chrome.runtime.getManifest();
        if (manifest && manifest.version) {
          extVersion = "v" + manifest.version;
        }
      }
    } catch (_) {}

    const container = documentObj.createElement("div");
    container.id = "fptu-feedback-toolbar";

    const panel = documentObj.createElement("div");
    panel.className = "fptu-feedback-panel";

    const pill = documentObj.createElement("div");
    pill.className = "fptu-feedback-pill";
    pill.style.display = "none";
    pill.innerHTML = `${ICON_BOLT}<span>Khảo sát nhanh</span>`;

    function renderPanelContent() {
      panel.innerHTML = `
        <div class="fptu-feedback-header">
          <div class="fptu-feedback-title">
            <span>${ICON_BOLT} Khảo sát FAP</span>
            <span class="fptu-feedback-badge">${extVersion}</span>
          </div>
          <button class="fptu-feedback-close" id="fptu-btn-minimize" title="Thu gọn toolbar" aria-label="Thu gọn toolbar">${ICON_CLOSE}</button>
        </div>
        <button class="fptu-feedback-btn-primary" id="fptu-btn-fill-5star">
          ${ICON_BOLT}
          <span>Điền Tốt Tất Cả (5 sao) & Khen</span>
        </button>
        <div class="fptu-feedback-row-actions">
          <button class="fptu-feedback-btn-secondary" id="fptu-btn-random-comment">
            ${ICON_DICE}
            <span>Đổi lời khen</span>
          </button>
          <button class="fptu-feedback-btn-secondary" id="fptu-btn-reset">
            ${ICON_RESET}
            <span>Xoá chọn</span>
          </button>
        </div>
        <div class="fptu-feedback-preview" id="fptu-comment-preview">
          "${currentCommentState.comment}"
        </div>
        <div class="fptu-feedback-note">
          Tự động đánh giá 5 sao và lời khen lịch sự. Bạn vui lòng kiểm tra lại rồi bấm <b>Gửi ý kiến</b> của trường nhé!
        </div>
      `;

      const btnFill = panel.querySelector("#fptu-btn-fill-5star");
      if (btnFill) {
        btnFill.addEventListener("click", () => {
          const res = fillFapFeedbackForm(documentObj, currentCommentState.comment);
          showToast(`Đã điền ${res.radiosFilled} câu & nhận xét!`);
        });
      }

      const btnRandom = panel.querySelector("#fptu-btn-random-comment");
      if (btnRandom) {
        btnRandom.addEventListener("click", () => {
          currentCommentState = getRandomFeedbackComment(currentCommentState.index);
          const preview = panel.querySelector("#fptu-comment-preview");
          if (preview) {
            preview.textContent = `"${currentCommentState.comment}"`;
          }
          const txt = findFapCommentTextarea(documentObj);
          if (txt && txt.value) {
            txt.value = currentCommentState.comment;
            try {
              txt.dispatchEvent(new Event("input", { bubbles: true }));
              txt.dispatchEvent(new Event("change", { bubbles: true }));
            } catch (_) {}
          }
          showToast("Đã đổi lời khen mới!");
        });
      }

      const btnReset = panel.querySelector("#fptu-btn-reset");
      if (btnReset) {
        btnReset.addEventListener("click", () => {
          resetFapFeedbackForm(documentObj);
          showToast("Đã xoá lựa chọn!");
        });
      }

      const btnMin = panel.querySelector("#fptu-btn-minimize");
      if (btnMin) {
        btnMin.addEventListener("click", () => {
          panel.style.display = "none";
          pill.style.display = "flex";
        });
      }
    }

    pill.addEventListener("click", () => {
      pill.style.display = "none";
      panel.style.display = "block";
    });

    function showToast(msg) {
      const existingToast = container.querySelector(".fptu-feedback-toast");
      if (existingToast && existingToast.remove) existingToast.remove();

      const toast = documentObj.createElement("div");
      toast.className = "fptu-feedback-toast";
      toast.textContent = msg;
      container.appendChild(toast);
      setTimeout(() => {
        if (toast && toast.remove) toast.remove();
      }, 2500);
    }

    renderPanelContent();
    container.appendChild(panel);
    container.appendChild(pill);

    if (documentObj.body) {
      documentObj.body.appendChild(container);
    }

    return container;
  }

  return {
    POSITIVE_COMMENTS,
    getRandomFeedbackComment,
    findFapFeedbackRadioGroups,
    findFapCommentTextarea,
    getHighestRatingRadio,
    fillFapFeedbackForm,
    resetFapFeedbackForm,
    injectFapFeedbackToolbar
  };
});
