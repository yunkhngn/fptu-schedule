const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  POSITIVE_COMMENTS,
  getRandomFeedbackComment,
  findFapFeedbackRadioGroups,
  findFapCommentTextarea,
  fillFapFeedbackForm,
  resetFapFeedbackForm
} = require("../lib/fap-feedback.js");

// Minimal mock DOM for Node test environment
function createMockElement(tagName, attrs = {}) {
  const el = {
    tagName: tagName.toUpperCase(),
    attributes: { ...attrs },
    checked: !!attrs.checked,
    value: attrs.value || "",
    name: attrs.name || "",
    id: attrs.id || "",
    type: attrs.type || "",
    textContent: attrs.textContent || "",
    children: [],
    parentElement: null,
    getAttribute(k) { return this.attributes[k] || null; },
    setAttribute(k, v) { this.attributes[k] = v; },
    closest(sel) {
      let cur = this;
      while (cur) {
        if (sel && cur.tagName === sel.toUpperCase()) return cur;
        cur = cur.parentElement;
      }
      return null;
    },
    get nextElementSibling() {
      if (!this.parentElement) return null;
      const sibs = this.parentElement.children;
      const idx = sibs.indexOf(this);
      return (idx >= 0 && idx + 1 < sibs.length) ? sibs[idx + 1] : null;
    },
    querySelectorAll(selector) {
      const results = [];
      function walk(node) {
        for (const child of node.children) {
          if (matchSelector(child, selector)) results.push(child);
          walk(child);
        }
      }
      walk(el);
      return results;
    },
    querySelector(selector) {
      const res = el.querySelectorAll(selector);
      return res.length > 0 ? res[0] : null;
    },
    appendChild(child) {
      child.parentElement = el;
      el.children.push(child);
      return child;
    },
    dispatchEvent() {}
  };
  return el;
}

function matchSelector(node, selector) {
  if (selector === 'input[type="radio"]') return node.tagName === "INPUT" && node.type === "radio";
  if (selector === "textarea") return node.tagName === "TEXTAREA";
  if (selector.includes("txtComment") || selector.includes("Comment")) {
    return node.tagName === "TEXTAREA" && ((node.id && node.id.includes("Comment")) || (node.name && node.name.includes("Comment")));
  }
  return false;
}

describe("FAP Survey Feedback Core Engine", () => {
  test("POSITIVE_COMMENTS contains at least 10 polite comments", () => {
    assert.ok(Array.isArray(POSITIVE_COMMENTS));
    assert.ok(POSITIVE_COMMENTS.length >= 10);
    POSITIVE_COMMENTS.forEach((c) => {
      assert.ok(typeof c === "string" && c.length > 10);
    });
  });

  test("getRandomFeedbackComment returns random item and excludes previous if specified", () => {
    const first = getRandomFeedbackComment();
    assert.ok(first.comment);
    assert.ok(first.index >= 0);
    const second = getRandomFeedbackComment(first.index);
    assert.notStrictEqual(second.index, first.index);
  });

  test("fillFapFeedbackForm checks the highest rating radio for each question and fills comment", () => {
    const root = createMockElement("div");

    // Question 1: 4 options (values 1, 2, 3, 4)
    for (let i = 1; i <= 4; i++) {
      root.appendChild(createMockElement("input", { type: "radio", name: "grp_q1", value: String(i) }));
    }
    // Question 2: 5 options (values 1, 2, 3, 4, 5)
    for (let i = 1; i <= 5; i++) {
      root.appendChild(createMockElement("input", { type: "radio", name: "grp_q2", value: String(i) }));
    }
    // Comment textarea
    const txt = root.appendChild(createMockElement("textarea", { id: "ctl00_mainContent_txtComment", name: "txtComment" }));

    const result = fillFapFeedbackForm(root, "Thầy dạy rất hay và nhiệt huyết ạ.");
    assert.strictEqual(result.radiosFilled, 2);
    assert.strictEqual(result.commentFilled, true);

    const q1Radios = root.querySelectorAll('input[type="radio"]').filter((r) => r.name === "grp_q1");
    const q2Radios = root.querySelectorAll('input[type="radio"]').filter((r) => r.name === "grp_q2");

    assert.strictEqual(q1Radios.find((r) => r.value === "4").checked, true);
    assert.strictEqual(q1Radios.find((r) => r.value === "1").checked, false);
    assert.strictEqual(q2Radios.find((r) => r.value === "5").checked, true);
    assert.strictEqual(txt.value, "Thầy dạy rất hay và nhiệt huyết ạ.");
  });

  test("resetFapFeedbackForm clears all checked radios and comment", () => {
    const root = createMockElement("div");
    const r1 = root.appendChild(createMockElement("input", { type: "radio", name: "grp_q1", value: "4", checked: true }));
    const txt = root.appendChild(createMockElement("textarea", { id: "txtComment", value: "Great" }));
    txt.value = "Great";

    const res = resetFapFeedbackForm(root);
    assert.strictEqual(res.radiosCleared, 1);
    assert.strictEqual(res.commentCleared, true);
    assert.strictEqual(r1.checked, false);
    assert.strictEqual(txt.value, "");
  });

  test("fillFapFeedbackForm selects 4-star (highest rating) and NEVER 1-star on FAP UUID values", () => {
    const root = createMockElement("div");

    // Real FAP Question 1: Punctuality
    const q1Questions = [
      { id: "ans-0-1", val: "01a07c76-6145-767e-ac28-25bfbce84dc2", text: "1 - Not at all punctual" },
      { id: "ans-0-2", val: "01a07c76-6145-7633-a2ed-06fef2650829", text: "2 - Rarely punctual" },
      { id: "ans-0-3", val: "01a07c76-6145-71d2-b9ee-4904279a077e", text: "3 - Mostly punctual" },
      { id: "ans-0-4", val: "01a07c76-6145-7667-b184-22054e59bd3a", text: "4 - Always punctual" }
    ];
    for (const opt of q1Questions) {
      const lbl = root.appendChild(createMockElement("label", { textContent: opt.text }));
      lbl.appendChild(createMockElement("input", { type: "radio", name: "Answers[0].AnswerId", id: opt.id, value: opt.val }));
    }

    // Real FAP Question 2: Teaching skills
    const q2Questions = [
      { id: "ans-1-1", val: "01a07c76-6145-7147-abd4-8f367518e882", text: "1 - Poor" },
      { id: "ans-1-2", val: "01a07c76-6145-7a25-8b82-a6434cd8c5b6", text: "2 - Average" },
      { id: "ans-1-3", val: "01a07c76-6145-7f5f-832a-dd255b589285", text: "3 - Good" },
      { id: "ans-1-4", val: "01a07c76-6145-7a19-a3ff-fee1ab21b08e", text: "4 - Very Good" }
    ];
    for (const opt of q2Questions) {
      const lbl = root.appendChild(createMockElement("label", { textContent: opt.text }));
      lbl.appendChild(createMockElement("input", { type: "radio", name: "Answers[1].AnswerId", id: opt.id, value: opt.val }));
    }

    // Real FAP Question 5: Answering questions
    const q5Questions = [
      { id: "ans-4-1", val: "01a07c76-6145-7948-a32b-3fc3c3d31a84", text: "1 - Most queries left unanswered" },
      { id: "ans-4-2", val: "01a07c76-6145-7b10-8940-357b37308020", text: "2 - Some queries left unanswered" },
      { id: "ans-4-3", val: "01a07c76-6145-7c91-8f27-9ced7c173322", text: "3 - Answered in the next session" },
      { id: "ans-4-4", val: "01a07c76-6145-77f2-9cf4-7a9cb5476ef5", text: "4 - Answered immediately or just after the session" }
    ];
    for (const opt of q5Questions) {
      const lbl = root.appendChild(createMockElement("label", { textContent: opt.text }));
      lbl.appendChild(createMockElement("input", { type: "radio", name: "Answers[4].AnswerId", id: opt.id, value: opt.val }));
    }

    const txt = root.appendChild(createMockElement("textarea", { id: "Comment", name: "Comment" }));

    const res = fillFapFeedbackForm(root);
    assert.strictEqual(res.radiosFilled, 3);
    assert.strictEqual(res.commentFilled, true);

    const q1Radios = root.querySelectorAll('input[type="radio"]').filter((r) => r.name === "Answers[0].AnswerId");
    assert.strictEqual(q1Radios[3].checked, true, "Question 1 should select 4 - Always punctual");
    assert.strictEqual(q1Radios[0].checked, false, "Question 1 must NOT select 1 - Not at all punctual");

    const q2Radios = root.querySelectorAll('input[type="radio"]').filter((r) => r.name === "Answers[1].AnswerId");
    assert.strictEqual(q2Radios[3].checked, true, "Question 2 should select 4 - Very Good");
    assert.strictEqual(q2Radios[0].checked, false, "Question 2 must NOT select 1 - Poor");

    const q5Radios = root.querySelectorAll('input[type="radio"]').filter((r) => r.name === "Answers[4].AnswerId");
    assert.strictEqual(q5Radios[3].checked, true, "Question 5 should select 4 - Answered immediately");
    assert.strictEqual(q5Radios[0].checked, false, "Question 5 must NOT select 1 - Most queries left unanswered");
  });

  test("fillFapFeedbackForm selects highest rating even when options are listed in reverse order (5 to 1)", () => {
    const root = createMockElement("div");
    const reverseOptions = [
      { text: "5 - Rất tốt", val: "uuid-5" },
      { text: "4 - Tốt", val: "uuid-4" },
      { text: "3 - Bình thường", val: "uuid-3" },
      { text: "2 - Kém", val: "uuid-2" },
      { text: "1 - Rất kém", val: "uuid-1" }
    ];
    for (const opt of reverseOptions) {
      const lbl = root.appendChild(createMockElement("label", { textContent: opt.text }));
      lbl.appendChild(createMockElement("input", { type: "radio", name: "grp_reverse", value: opt.val }));
    }

    fillFapFeedbackForm(root);
    const radios = root.querySelectorAll('input[type="radio"]').filter((r) => r.name === "grp_reverse");
    assert.strictEqual(radios[0].checked, true, "Option 5 should be selected when listed first");
    assert.strictEqual(radios[4].checked, false, "Option 1 should not be selected");
  });

  test("fills real FAP feedback-form.html fixture with 100% highest rating on live DOM", () => {
    const fs = require("node:fs");
    const path = require("node:path");
    const { JSDOM } = require("jsdom");

    const fixturePath = path.join(__dirname, "fixtures", "pages", "feedback-form.html");
    const html = fs.readFileSync(fixturePath, "utf8");
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const res = fillFapFeedbackForm(doc, "Giảng viên rất tận tâm và giảng dạy xuất sắc.");
    assert.strictEqual(res.radiosFilled, 5, "All 5 survey questions must be answered");
    assert.strictEqual(res.commentFilled, true, "Comment must be filled");

    // Verify each question selected the 4th option (highest score) and NOT the 1st option
    for (let q = 0; q < 5; q++) {
      const groupRadios = Array.from(doc.querySelectorAll(`input[name="Answers[${q}].AnswerId"]`));
      assert.strictEqual(groupRadios.length, 4, `Question ${q + 1} should have 4 options`);
      assert.strictEqual(groupRadios[0].checked, false, `Question ${q + 1} option 1 (1 star) must NOT be checked`);
      assert.strictEqual(groupRadios[1].checked, false, `Question ${q + 1} option 2 must NOT be checked`);
      assert.strictEqual(groupRadios[2].checked, false, `Question ${q + 1} option 3 must NOT be checked`);
      assert.strictEqual(groupRadios[3].checked, true, `Question ${q + 1} option 4 (highest rating) MUST be checked`);
    }

    const commentEl = doc.querySelector("#Comment");
    assert.strictEqual(commentEl.value, "Giảng viên rất tận tâm và giảng dạy xuất sắc.");

    // Verify reset clears everything
    const resetRes = resetFapFeedbackForm(doc);
    assert.strictEqual(resetRes.radiosCleared, 5);
    assert.strictEqual(resetRes.commentCleared, true);
    assert.strictEqual(commentEl.value, "");
    for (let q = 0; q < 5; q++) {
      const groupRadios = Array.from(doc.querySelectorAll(`input[name="Answers[${q}].AnswerId"]`));
      assert.ok(groupRadios.every((r) => !r.checked), `Question ${q + 1} all radios must be unchecked after reset`);
    }
  });
});
