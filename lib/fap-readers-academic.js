(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.FapReadersAcademic = api;
    if (root.FapPageData) {
      root.FapPageData.academic = api;
    }
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function cleanText(str) {
    if (!str) return "";
    return str.replace(/\s+/g, " ").trim();
  }

  function sanitizeLink(href) {
    if (!href) return null;
    var trimmed = href.trim();
    if (/^javascript:/i.test(trimmed)) return null;
    if (/^https?:\/\/fap\.fpt\.edu\.vn/i.test(trimmed) || /^\/[^/]/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  function readSubjects(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var table = doc.querySelector("table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");
    var filterCard = doc.querySelector(".fap-filter-card form[action*='/Subject'], form#form-subject");

    var crumbText = crumb ? cleanText(crumb.textContent).toLowerCase() : "";
    var isSubjectPage =
      crumbText.indexOf("môn học") !== -1 ||
      Boolean(filterCard) ||
      (table && Boolean(table.querySelector("th[data-label*='Mã môn'], th:nth-child(2)")));

    if (!isSubjectPage && !filterCard && !table) return null;

    var rows = [];
    var trs = table ? table.querySelectorAll("tbody tr") : [];

    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      var cells = tr.querySelectorAll("td");
      if (cells.length < 3) continue;

      var codeEl = tr.querySelector("[data-label='Mã môn học']") || cells[1];
      var nameEl = tr.querySelector("[data-label*='Tên môn']") || cells[2];

      var code = cleanText(codeEl.textContent);
      var name = cleanText(nameEl.textContent);

      if (!code && !name) continue;

      var status = "Active";
      if (cells.length >= 6) {
        var isGraded = cleanText(cells[4].textContent);
        var takeAttendance = cleanText(cells[5].textContent);
        if (isGraded === "✓" || takeAttendance === "✓") {
          status = "Active";
        }
      }

      rows.push({
        code: code,
        name: name,
        credit: "—",
        status: status,
      });
    }

    if (rows.length === 0 && !isSubjectPage) return null;

    return {
      rows: rows,
    };
  }

  function readCurriculum(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var table = doc.querySelector("table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");

    var crumbText = crumb ? cleanText(crumb.textContent).toLowerCase() : "";
    var isCurriculumPage =
      crumbText.indexOf("khung chương trình") !== -1 ||
      crumbText.indexOf("curriculum") !== -1 ||
      (table && Boolean(table.querySelector("th:nth-child(4)")));

    if (!isCurriculumPage && !table) return null;

    var trs = table ? table.querySelectorAll("tbody tr") : [];
    var groupsMap = {};
    var groupOrder = [];

    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      var cells = tr.querySelectorAll("td");
      if (cells.length < 4) continue;

      var codeEl = tr.querySelector("[data-label='Mã môn']") || cells[1];
      var nameEl = tr.querySelector("[data-label='Tên môn học']") || cells[2];
      var semEl = tr.querySelector("[data-label='Kỳ']") || cells[3];
      var prereqEl = tr.querySelector("[data-label='Điều kiện tiên quyết']") || (cells.length > 4 ? cells[4] : null);

      var code = cleanText(codeEl.textContent);
      var name = cleanText(nameEl.textContent);
      var sem = cleanText(semEl.textContent) || "0";
      var prereq = prereqEl ? cleanText(prereqEl.textContent) : "None";

      if (!code && !name) continue;

      var groupKey = "Học kỳ " + sem;
      if (!groupsMap[groupKey]) {
        groupsMap[groupKey] = [];
        groupOrder.push(groupKey);
      }

      groupsMap[groupKey].push({
        code: code,
        name: name,
        credit: "—",
        prerequisite: prereq === "Aaaaa aa" || !prereq ? "None" : prereq,
        status: "Active",
      });
    }

    if (groupOrder.length === 0 && !isCurriculumPage) return null;

    var groups = groupOrder.map(function (key) {
      return {
        title: key,
        rows: groupsMap[key],
      };
    });

    return {
      groups: groups,
      totalCredits: undefined,
    };
  }

  function readCertificates(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var table = doc.querySelector("table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");

    var crumbText = crumb ? cleanText(crumb.textContent).toLowerCase() : "";
    var isCertPage =
      crumbText.indexOf("chứng chỉ") !== -1 ||
      crumbText.indexOf("certificate") !== -1 ||
      (table && Boolean(table.querySelector("[data-label='Loại chứng chỉ']")));

    if (!isCertPage && !table) return null;

    var trs = table ? table.querySelectorAll("tbody tr") : [];
    var items = [];

    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      var cells = tr.querySelectorAll("td");
      if (cells.length < 3) continue;

      var nameEl = tr.querySelector("[data-label='Loại chứng chỉ']") || cells[1];
      var refEl = tr.querySelector("[data-label='Số tham chiếu']") || (cells.length > 2 ? cells[2] : null);
      var dateEl = tr.querySelector("[data-label='Ngày cấp']") || (cells.length > 5 ? cells[5] : null);

      var name = cleanText(nameEl ? nameEl.textContent : "");
      var ref = refEl ? cleanText(refEl.textContent) : "";
      var date = dateEl ? cleanText(dateEl.textContent) : "";

      var linkEl = tr.querySelector("a[href]");
      var rawHref = linkEl ? linkEl.getAttribute("href") : null;
      var href = sanitizeLink(rawHref);

      if (!name) continue;

      items.push({
        name: name,
        issuer: ref,
        date: date,
        status: "Valid",
        href: href,
      });
    }

    if (items.length === 0 && !isCertPage) return null;

    return {
      items: items,
    };
  }

  return {
    readSubjects: readSubjects,
    readCurriculum: readCurriculum,
    readCertificates: readCertificates,
  };
});
