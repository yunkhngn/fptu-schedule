(function (root, factory) {
  const api = factory();
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function parseNumber(str) {
    if (!str || typeof str !== "string") return null;
    const cleaned = str.replace(/%/g, "").replace(/,/g, ".").trim();
    if (!cleaned) return null;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  function findFapGradeTable(doc) {
    if (!doc) doc = typeof document !== "undefined" ? document : null;
    if (!doc) return null;
    const bySummary = doc.querySelector('table[summary="Report"]');
    if (bySummary) return bySummary;

    // Check modern FAP table classes
    const byClass = doc.querySelector("table.student-mark-sheet, .fap-result-card table");
    if (byClass) return byClass;

    const tables = Array.from(doc.querySelectorAll("table"));
    for (const tbl of tables) {
      const text = tbl.textContent || "";
      const isWeight = /Weight/i.test(text) || /Trọng\s*số/i.test(text) || /Tỷ\s*lệ/i.test(text);
      const isValue = /Value/i.test(text) || /\bĐiểm\b/i.test(text) || /Giá\s*trị/i.test(text);
      const isGradeReport =
        /Grade/i.test(text) ||
        /Course total/i.test(text) ||
        /Average/i.test(text) ||
        /Passed|Not passed/i.test(text) ||
        /Trung\s*bình/i.test(text) ||
        /Tổng\s*kết/i.test(text) ||
        /Tổng\s*môn/i.test(text) ||
        /Đạt|Không\s*đạt/i.test(text) ||
        /Thành\s*phần/i.test(text) ||
        /Nhóm\s*điểm/i.test(text);
      if (isWeight && isValue && isGradeReport) {
        return tbl;
      }
    }
    for (const tbl of tables) {
      const text = tbl.textContent || "";
      const isWeight = /Weight/i.test(text) || /Trọng\s*số/i.test(text) || /Tỷ\s*lệ/i.test(text);
      const isValue = /Value/i.test(text) || /\bĐiểm\b/i.test(text) || /Giá\s*trị/i.test(text);
      if (isWeight && isValue && (/Total/i.test(text) || /Average/i.test(text) || /Tổng\s*kết/i.test(text) || /Tổng\s*môn/i.test(text) || /Trung\s*bình/i.test(text))) {
        return tbl;
      }
    }
    return null;
  }

  function parseFapGradeTable(tableEl) {
    if (!tableEl) {
      return { categories: [], bonus: 0, average: null, status: null };
    }

    const headerRow = tableEl.querySelector("thead tr, tr:first-child");
    const ths = headerRow
      ? Array.from(headerRow.querySelectorAll("th, td")).map((c) => (c.textContent || "").trim())
      : [];
    const hasCategoryCol = ths.some((t) => /category|nhóm\s*điểm|thành\s*phần|đầu\s*điểm|cột\s*điểm/i.test(t)) || ths.length >= 5;

    const allRows = Array.from(tableEl.querySelectorAll("tr"));
    const rows = allRows.filter((r) => {
      if (r.closest("thead")) return false;
      if (r.classList && (r.classList.contains("sheet-grand-total") || r.classList.contains("grand-total"))) return false;
      if (r.querySelectorAll("th").length === r.cells.length && r.cells.length > 0) return false;
      const text = (r.textContent || "").trim();
      if (/^(COURSE\s*TOTAL|AVERAGE|STATUS|TỔNG\s*KẾT|TRUNG\s*BÌNH|TRẠNG\s*THÁI|TỔNG\s*MÔN|NỘP\s*MUỘN)/i.test(text)) return false;
      if (text.includes("Nộp muộn") || text.includes("Điểm trung bình") || text.includes("Tổng môn")) return false;
      return true;
    });

    const categoriesMap = new Map();
    let currentCategory = "";
    let bonus = 0;

    rows.forEach((row) => {
      const cells = Array.from(row.cells).map((c) => c.textContent.trim());
      if (cells.length === 0) return;

      let category = "";
      let item = "";
      let weightStr = "";
      let valueStr = "";

      // Check if data-label exists on row cells
      const cellsWithLabel = Array.from(row.cells).filter((c) => c.getAttribute("data-label"));
      if (cellsWithLabel.length >= 3) {
        const getLabelVal = (regex) => {
          const found = Array.from(row.cells).find((c) => regex.test(c.getAttribute("data-label") || ""));
          return found ? found.textContent.trim() : "";
        };
        category = getLabelVal(/nhóm\s*điểm|category|thành\s*phần/i);
        item = getLabelVal(/tên\s*cột\s*điểm|grade\s*item|đầu\s*điểm|bài/i);
        weightStr = getLabelVal(/trọng\s*số|weight|tỷ\s*lệ/i);
        valueStr = getLabelVal(/điểm\s*cuối|điểm|value|grade/i);
        if (category) currentCategory = category;
        else category = currentCategory;
      } else if (hasCategoryCol) {
        if (cells.length >= 5) {
          category = cells[0];
          item = cells[1];
          weightStr = cells[2];
          valueStr = cells[3];
          currentCategory = category || currentCategory;
        } else if (cells.length === 4) {
          category = currentCategory;
          item = cells[0];
          weightStr = cells[1];
          valueStr = cells[2];
        } else if (cells.length === 3) {
          category = currentCategory;
          item = cells[0];
          weightStr = cells[1];
          valueStr = cells[2];
        }
      } else {
        if (cells[0].toLowerCase() === "total" || cells[0].toLowerCase() === "tổng") {
          category = currentCategory;
          item = "Total";
          weightStr = cells[1];
          valueStr = cells[2];
        } else {
          category = cells[0];
          item = cells[0];
          weightStr = cells[1];
          valueStr = cells[2];
          currentCategory = category;
        }
      }

      if (/bonus|thưởng|cộng/i.test(item) || /bonus|thưởng|cộng/i.test(category)) {
        const b = parseNumber(valueStr);
        if (b != null) bonus += b;
        return;
      }

      const catName = (category || currentCategory || item).trim();
      if (!catName || /resit|thi\s*lại|học\s*lại/i.test(catName) || /resit|thi\s*lại|học\s*lại/i.test(item)) {
        // Skip resit rows
        return;
      }

      const weight = parseNumber(weightStr);
      const value = parseNumber(valueStr);

      if (!categoriesMap.has(catName)) {
        categoriesMap.set(catName, {
          category: catName,
          weight: 0,
          value: null,
          isFinal: /final|exam|presentation|thi|cuối\s*kỳ|bảo\s*vệ|fe|pe|báo\s*cáo\s*cuối/i.test(catName),
          items: []
        });
      }

      const catObj = categoriesMap.get(catName);

      if (item.toLowerCase() === "total" || item.toLowerCase() === "tổng") {
        if (weight != null) catObj.weight = weight;
        if (value != null) catObj.value = value;
      } else {
        catObj.items.push({ name: item, weight: weight || 0, value });
        if (catObj.weight === 0 && weight != null) catObj.weight = weight;
        if (catObj.value == null && value != null) catObj.value = value;
      }
    });

    // If total was never explicitly seen, sum item weights and compute weighted average for category
    const categories = Array.from(categoriesMap.values()).map((cat) => {
      if (cat.weight === 0 && cat.items.length > 0) {
        cat.weight = cat.items.reduce((sum, it) => sum + (it.weight || 0), 0);
      }
      if (cat.value == null && cat.items.length > 0) {
        let totalItemWeight = 0;
        let weightedSum = 0;
        let hasAnyValue = false;
        cat.items.forEach((it) => {
          if (it.value != null) {
            hasAnyValue = true;
            const w = it.weight > 0 ? it.weight : 1;
            weightedSum += it.value * w;
            totalItemWeight += w;
          }
        });
        if (hasAnyValue && totalItemWeight > 0) {
          cat.value = Math.round((weightedSum / totalItemWeight) * 100) / 100;
        }
      }
      return cat;
    });

    // Extract footer Average & Status
    let average = null;
    let status = null;

    // Check modern element classes first (.grade-average, .grade-status)
    const cardEl = tableEl.closest ? tableEl.closest(".card, .fap-result-card") : null;
    const avgEl = tableEl.querySelector(".grade-average") || (cardEl && cardEl.querySelector(".grade-average"));
    if (avgEl) {
      average = parseNumber(avgEl.textContent);
    }

    const statusEl = tableEl.querySelector(".grade-status") || (cardEl && cardEl.querySelector(".grade-status"));
    if (statusEl) {
      const stText = statusEl.textContent || "";
      if (/not\s*passed|không\s*đạt|trượt|failed/i.test(stText)) status = "Not passed";
      else if (/passed|đạt|qua\s*môn/i.test(stText)) status = "Passed";
    }

    const tfoot = tableEl.querySelector("tfoot");
    if (tfoot) {
      const footText = tfoot.textContent;
      if (average == null) {
        const avgMatch = footText.match(/(?:Average|Trung\s*bình|Tổng\s*kết|Tổng\s*môn)\s*[:\s]*([\d.,]+)/i);
        if (avgMatch) average = parseNumber(avgMatch[1]);
      }
      if (status == null) {
        if (/not\s*passed|không\s*đạt|trượt|failed/i.test(footText)) status = "Not passed";
        else if (/passed|đạt|qua\s*môn/i.test(footText)) status = "Passed";
      }
    }

    const allText = tableEl.textContent || "";
    if (average == null) {
      const avgMatch = allText.match(/(?:Average|Trung\s*bình|Tổng\s*kết|Tổng\s*môn)\s*[:\s]*([\d.,]+)/i);
      if (avgMatch) average = parseNumber(avgMatch[1]);
    }
    if (status == null) {
      if (/not\s*passed|không\s*đạt|trượt|failed/i.test(allText)) status = "Not passed";
      else if (/passed|đạt|qua\s*môn/i.test(allText)) status = "Passed";
    }

    return { categories, bonus, average, status };
  }

  function calculateCurrentScore(categories, bonus = 0) {
    if (!Array.isArray(categories)) {
      return { currentWeightedScore: Number(bonus) || 0, completedWeight: 0, remainingWeight: 100 };
    }

    let completedWeight = 0;
    let currentScore = 0;

    categories.forEach((cat) => {
      if (cat.value != null && cat.weight > 0) {
        completedWeight += cat.weight;
        currentScore += (cat.value * cat.weight) / 100;
      }
    });

    currentScore += Number(bonus) || 0;
    const remainingWeight = Math.max(0, 100 - completedWeight);

    return {
      currentWeightedScore: currentScore,
      completedWeight,
      remainingWeight
    };
  }

  function calculateRequiredExamScore(categories, bonus = 0, targetTotal = 5.0, examMinScore = 4.0) {
    const { currentWeightedScore, completedWeight, remainingWeight } = calculateCurrentScore(categories, bonus);

    if (remainingWeight <= 0) {
      return {
        targetTotal,
        currentWeightedScore,
        remainingWeight: 0,
        requiredScore: 0,
        minRequired: currentWeightedScore >= targetTotal ? 0 : examMinScore,
        status: "completed"
      };
    }

    const neededFromRemaining = targetTotal - currentWeightedScore;
    const rawRequired = (neededFromRemaining / (remainingWeight / 100));
    const minRequired = Math.max(rawRequired, examMinScore);

    let status = "achievable";
    if (rawRequired > 10.0) {
      status = "impossible";
    } else if (rawRequired <= examMinScore && currentWeightedScore + (examMinScore * remainingWeight) / 100 >= targetTotal) {
      status = "pass_guaranteed";
    }

    return {
      targetTotal,
      currentWeightedScore,
      remainingWeight,
      requiredScore: rawRequired,
      minRequired,
      status
    };
  }

  return {
    parseNumber,
    findFapGradeTable,
    parseFapGradeTable,
    calculateCurrentScore,
    calculateRequiredExamScore
  };
});
