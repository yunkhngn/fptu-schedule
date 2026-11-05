(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.FapReadersReports = api;
    if (root.FapPageData) {
      root.FapPageData.reports = api;
    }
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function cleanText(str) {
    if (!str) return "";
    return str.replace(/\s+/g, " ").trim();
  }

  function readSelect(root, selector) {
    if (!root || typeof root.querySelector !== "function") return null;
    var select = root.querySelector(selector);
    if (!select) return null;

    var selectedOption = select.querySelector("option[selected]") || select.querySelector("option:checked");
    var val = selectedOption ? selectedOption.value : select.value;
    var options = [];
    var optEls = select.querySelectorAll("option");
    for (var i = 0; i < optEls.length; i++) {
      var opt = optEls[i];
      options.push({
        value: opt.value,
        label: cleanText(opt.textContent),
        href: opt.getAttribute("data-fallback-href") || null,
      });
    }

    return {
      value: val,
      options: options,
    };
  }

  function parseCourseFromLabel(label) {
    var code = "";
    var name = label;
    var className = "";
    var m = label.match(/\(([A-Za-z0-9_]+)\)/);
    if (m) {
      code = m[1];
    }
    var mClass = label.match(/\(([A-Za-z0-9]+-[A-Za-z0-9_]+)\)/);
    if (mClass) {
      className = mClass[1];
    }
    name = label.replace(/\s*\([^)]*\)\s*/g, " ").trim();
    return { code: code, name: name, className: className };
  }

  function readAttendanceReport(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var reportContainer = doc.querySelector("#attendance-report, .academic-report, .attendance-session-sheet");
    if (!reportContainer) return null;

    var filter = readSelect(doc, "#attendance-report-term");
    var courseSelect = readSelect(doc, "#attendance-report-course");

    var table = doc.querySelector(".attendance-session-sheet");
    var rows = table ? table.querySelectorAll("tbody tr") : [];

    var sessions = [];
    var attended = 0;
    var absent = 0;

    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      var cells = tr.querySelectorAll("td");
      if (cells.length < 7) continue;

      var index = cleanText(tr.querySelector(".attendance-col-index") ? tr.querySelector(".attendance-col-index").textContent : cells[0].textContent);
      var dateEl = tr.querySelector(".attendance-chip--date") || cells[1];
      var date = cleanText(dateEl.textContent);
      var slotEl = tr.querySelector(".attendance-chip--slot") || cells[2];
      var slot = cleanText(slotEl.textContent);
      var room = cleanText(cells[3].textContent);
      var lecturer = cleanText(cells[4].textContent);
      var className = cleanText(cells[5].textContent);
      var statusEl = tr.querySelector(".attendance-status") || cells[6];
      var status = cleanText(statusEl.textContent);
      var note = cells.length > 7 ? cleanText(cells[7].textContent) : "";

      var statusClasses = statusEl.className || "";
      if (statusClasses.indexOf("present") !== -1 || /có mặt|present/i.test(status)) {
        attended++;
      } else if (statusClasses.indexOf("absent") !== -1 || /vắng|absent/i.test(status)) {
        absent++;
      }

      sessions.push({
        index: index,
        date: date,
        slot: slot,
        room: room,
        lecturer: lecturer,
        class: className,
        status: status,
        note: note,
      });
    }

    var totalRecorded = attended + absent;
    var totalSessions = sessions.length;
    var rate = totalRecorded > 0 ? attended / totalRecorded : null;

    var resultCard = doc.querySelector(".fap-result-card");
    var cardTitleEl = resultCard ? resultCard.querySelector(".fap-result-card__title") : null;
    var cardCodeEl = resultCard ? resultCard.querySelector(".fap-result-card__code") : null;

    var currentCode = cardCodeEl ? cleanText(cardCodeEl.textContent) : "";
    var currentName = cardTitleEl ? cleanText(cardTitleEl.childNodes[0] ? cardTitleEl.childNodes[0].textContent : cardTitleEl.textContent) : "";

    var courses = [];
    var selectedCourse = "";

    if (courseSelect && courseSelect.options.length > 0) {
      for (var c = 0; c < courseSelect.options.length; c++) {
        var opt = courseSelect.options[c];
        var parsed = parseCourseFromLabel(opt.label);
        var isSelected = opt.value === courseSelect.value;
        if (isSelected) {
          selectedCourse = opt.label;
          courses.push({
            id: opt.value,
            code: currentCode || parsed.code,
            name: currentName || parsed.name,
            attended: attended,
            absent: absent,
            total: totalRecorded,
            rate: rate,
            href: opt.href || null,
            selected: true,
          });
        } else {
          courses.push({
            id: opt.value,
            code: parsed.code,
            name: parsed.name,
            attended: 0,
            absent: 0,
            total: 0,
            rate: null,
            href: opt.href || null,
            selected: false,
          });
        }
      }
    } else {
      selectedCourse = currentName || (currentCode ? currentCode : "Báo cáo điểm danh");
      courses.push({
        code: currentCode,
        name: currentName,
        attended: attended,
        absent: absent,
        total: totalRecorded,
        rate: rate,
        selected: true,
      });
    }

    return {
      courses: courses,
      selectedCourse: selectedCourse,
      filter: filter,
      courseFilter: courseSelect,
      sessions: sessions,
    };
  }

  function readGradeReport(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var reportContainer = doc.querySelector("#grade-report, .student-mark-sheet, [data-report-url='/Report/Grade']");
    if (!reportContainer) return null;

    var term = readSelect(doc, "#grade-report-term");
    var courseSelect = readSelect(doc, "#grade-report-course");

    var resultCard = doc.querySelector(".fap-result-card");
    var cardTitleEl = resultCard ? resultCard.querySelector(".fap-result-card__title") : null;
    var cardCodeEl = resultCard ? resultCard.querySelector(".fap-result-card__code") : null;

    var currentCode = cardCodeEl ? cleanText(cardCodeEl.textContent) : "";
    var currentName = cardTitleEl ? cleanText(cardTitleEl.childNodes[0] ? cardTitleEl.childNodes[0].textContent : cardTitleEl.textContent) : "";

    var metaSpans = resultCard ? resultCard.querySelectorAll(".fap-result-card__meta span") : [];
    var currentClassName = "";
    var currentTermName = "";
    for (var mIdx = 0; mIdx < metaSpans.length; mIdx++) {
      var mText = cleanText(metaSpans[mIdx].textContent);
      if (/-/.test(mText) && !currentClassName) {
        currentClassName = mText;
      } else if (/fall|spring|summer/i.test(mText) && !currentTermName) {
        currentTermName = mText;
      }
    }

    var table = doc.querySelector(".student-mark-sheet, #grade-report table, .academic-report table");
    var rows = table ? table.querySelectorAll("tbody tr") : [];

    var components = [];
    var courseTotal = "";
    var rawStatus = "";
    var currentGroup = "";

    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      var isGrandTotal = tr.classList.contains("sheet-grand-total") || tr.classList.contains("grand-total");
      var isSubtotal = tr.classList.contains("sheet-row-total");
      var cells = tr.querySelectorAll("td");
      if (cells.length < 2) continue;

      if (isGrandTotal) {
        var avgInRow = tr.querySelector(".grade-average") || tr.querySelector(".mark-score");
        if (avgInRow && !courseTotal) {
          courseTotal = cleanText(avgInRow.textContent);
        }
        var stInRow = tr.querySelector(".grade-status");
        if (stInRow && !rawStatus) {
          rawStatus = cleanText(stInRow.textContent);
        }
        for (var j = 0; j < cells.length; j++) {
          var cText = cleanText(cells[j].textContent);
          if (!courseTotal && /^[\d]+[.,][\d]+$/.test(cText)) {
            courseTotal = cText;
          }
          if (!rawStatus && /passed|đạt|trượt|failed/i.test(cText)) {
            rawStatus = cText;
          }
        }
        continue;
      }

      if (isSubtotal) {
        continue;
      }

      var groupCell = tr.querySelector(".sheet-group-cell");
      if (groupCell) {
        currentGroup = cleanText(groupCell.textContent);
      }

      var compGroup = currentGroup;
      var compName = "";
      var compWeight = "";
      var compValue = "";
      var compNote = "";

      if (groupCell && cells.length >= 4) {
        compName = cleanText(cells[1].textContent);
        compWeight = cleanText(cells[2].textContent);
        compValue = cleanText(cells[3].textContent);
        compNote = cells.length > 4 ? cleanText(cells[4].textContent) : "";
      } else if (cells.length >= 5) {
        compGroup = cleanText(cells[0].textContent) || currentGroup;
        compName = cleanText(cells[1].textContent);
        compWeight = cleanText(cells[2].textContent);
        compValue = cleanText(cells[3].textContent);
        compNote = cleanText(cells[4].textContent);
      } else if (cells.length === 4) {
        var c1 = cleanText(cells[1].textContent);
        var c2 = cleanText(cells[2].textContent);
        if (/%|^\d+(\.\d+)?$/.test(c1) && /^(\d+([.,]\d+)?|-|—)?$/.test(c2)) {
          compName = cleanText(cells[0].textContent);
          compWeight = c1;
          compValue = c2;
          compNote = cleanText(cells[3].textContent);
        } else {
          compGroup = cleanText(cells[0].textContent);
          compName = c1;
          compWeight = c2;
          compValue = cleanText(cells[3].textContent);
        }
      } else if (cells.length === 3) {
        compName = cleanText(cells[0].textContent);
        compWeight = cleanText(cells[1].textContent);
        compValue = cleanText(cells[2].textContent);
      }

      if (compName && !/^(tổng\s*môn|điểm\s*trung\s*bình|nộp\s*muộn)/i.test(compName)) {
        components.push({
          group: compGroup || "",
          name: compName,
          weight: compWeight,
          value: compValue,
          note: compNote && compNote !== "-" ? compNote : "",
        });
      }
    }

    if (!courseTotal) {
      var avgEl = doc.querySelector(".grade-average");
      if (avgEl) courseTotal = cleanText(avgEl.textContent);
    }
    if (!rawStatus) {
      var stEl = doc.querySelector(".grade-status");
      if (stEl) rawStatus = cleanText(stEl.textContent);
    }

    var weightedSum = 0;
    var totalWeight = 0;
    var hasUngraded = false;
    var finalExamScore = null;

    for (var k = 0; k < components.length; k++) {
      var comp = components[k];
      var isResit = /resit|thi\s*lại/i.test(comp.name);
      if (isResit) continue;

      var wNum = parseFloat((comp.weight || "").replace("%", "").replace(",", "."));
      var vNum = parseFloat((comp.value || "").replace(",", "."));

      var isExam = /final|exam|thi\s*cuối|bảo\s*vệ|fe|pe/i.test(comp.name) || /final|exam/i.test(comp.group);
      if (isExam && !isNaN(vNum)) {
        finalExamScore = vNum;
      }

      if (!isNaN(wNum) && !isNaN(vNum)) {
        weightedSum += vNum * (wNum > 0 ? wNum : 0);
        totalWeight += wNum > 0 ? wNum : 0;
      } else if (!isResit && (comp.value === "-" || comp.value === "—" || !comp.value)) {
        hasUngraded = true;
      }
    }

    var calculatedTotal = null;
    if (totalWeight > 0) {
      calculatedTotal = Math.round((weightedSum / totalWeight) * 10) / 10;
    }

    if (!courseTotal && calculatedTotal !== null) {
      courseTotal = calculatedTotal.toFixed(1).replace(".", ",");
    }

    var status = "";
    if (rawStatus) {
      if (/not\s*passed|không\s*đạt|trượt|failed/i.test(rawStatus)) {
        status = "Not passed";
      } else if (/passed|đạt|qua\s*môn/i.test(rawStatus)) {
        status = "Passed";
      } else if (/in\s*progress|đang\s*học/i.test(rawStatus)) {
        status = "In progress";
      }
    }

    if (!status) {
      var totalNum = courseTotal ? parseFloat(courseTotal.replace(",", ".")) : calculatedTotal;
      if (hasUngraded) {
        status = "In progress";
      } else if (totalNum !== null && totalNum !== undefined) {
        if (totalNum >= 5.0 && (finalExamScore === null || finalExamScore >= 4.0)) {
          status = "Passed";
        } else {
          status = "Not passed";
        }
      } else {
        status = table && table.getAttribute("data-grade-done") === "1" ? "Passed" : "In progress";
      }
    }

    var courses = [];
    if (courseSelect && courseSelect.options.length > 0) {
      for (var c = 0; c < courseSelect.options.length; c++) {
        var opt = courseSelect.options[c];
        var parsed = parseCourseFromLabel(opt.label);
        var isSelected = opt.value === courseSelect.value;
        if (isSelected) {
          courses.push({
            id: opt.value,
            code: currentCode || parsed.code,
            name: currentName || parsed.name,
            className: currentClassName || parsed.className || "",
            termName: currentTermName || "",
            components: components,
            total: courseTotal,
            status: status || "Passed",
            href: opt.href || null,
            selected: true,
          });
        } else {
          courses.push({
            id: opt.value,
            code: parsed.code,
            name: parsed.name,
            className: parsed.className || "",
            termName: currentTermName || "",
            components: [],
            total: "",
            status: "",
            href: opt.href || null,
            selected: false,
          });
        }
      }
    } else {
      courses.push({
        code: currentCode,
        name: currentName,
        className: currentClassName,
        termName: currentTermName,
        components: components,
        total: courseTotal,
        status: status || "Passed",
        selected: true,
      });
    }

    return {
      term: term,
      courseFilter: courseSelect,
      courses: courses,
    };
  }

  function readTranscript(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var table = doc.querySelector(".fap-sheet, table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");
    var gpaHelper = doc.querySelector("#gpa-helper");

    if (!table && !crumb && !gpaHelper) return null;

    var crumbText = crumb ? cleanText(crumb.textContent) : "";
    var isTranscriptPage = crumbText.toLowerCase().indexOf("transcript") !== -1 ||
      crumbText.toLowerCase().indexOf("bảng điểm") !== -1 ||
      Boolean(gpaHelper);

    if (!isTranscriptPage && !table) return null;

    var title = crumbText || "Bảng điểm";

    var trs = table ? table.querySelectorAll("tbody tr") : [];
    var rows = [];
    var totalCredits = 0;
    var weightedGradeSum = 0;
    var gpaCreditsCount = 0;

    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      var codeEl = tr.querySelector("[data-label='MÃ MÔN']");
      var nameEl = tr.querySelector("[data-label='TÊN MÔN']");
      var creditEl = tr.querySelector("[data-label='TÍN CHỈ']");
      var gradeEl = tr.querySelector("[data-label='ĐIỂM']");
      var statusEl = tr.querySelector("[data-label='TRẠNG THÁI']");

      var cells = tr.querySelectorAll("td");
      var code = cleanText(codeEl ? codeEl.textContent : (cells[3] ? cells[3].textContent : ""));
      var name = cleanText(nameEl ? nameEl.textContent : (cells[6] ? cells[6].textContent : ""));
      var credit = cleanText(creditEl ? creditEl.textContent : (cells[7] ? cells[7].textContent : ""));
      var grade = cleanText(gradeEl ? gradeEl.textContent : (cells[8] ? cells[8].textContent : ""));
      var status = cleanText(statusEl ? statusEl.textContent : (cells[9] ? cells[9].textContent : ""));

      if (!code && !name) continue;

      var crVal = parseFloat(credit);
      if (!isNaN(crVal)) {
        totalCredits += crVal;
      }

      var grVal = parseFloat(grade.replace(",", "."));
      if (!isNaN(grVal) && !isNaN(crVal) && crVal > 0) {
        weightedGradeSum += grVal * crVal;
        gpaCreditsCount += crVal;
      }

      rows.push({
        code: code,
        name: name,
        credit: credit,
        grade: grade,
        status: status,
      });
    }

    if (rows.length === 0 && !isTranscriptPage) {
      return null;
    }

    var computedGpa = gpaCreditsCount > 0 ? (weightedGradeSum / gpaCreditsCount).toFixed(2) : undefined;
    var computedCredits = totalCredits > 0 ? String(totalCredits) : undefined;

    return {
      programs: [
        {
          title: title,
          rows: rows,
          gpa: computedGpa,
          credits: computedCredits,
        },
      ],
    };
  }

  return {
    readAttendanceReport: readAttendanceReport,
    readGradeReport: readGradeReport,
    readTranscript: readTranscript,
  };
});

