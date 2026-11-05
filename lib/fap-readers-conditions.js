(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.FapReadersConditions = api;
    if (root.FapPageData) {
      root.FapPageData.conditions = api;
    }
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function cleanText(str) {
    if (!str) return "";
    return str.replace(/\s+/g, " ").trim();
  }

  function readConditions(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var emptyCard = doc.querySelector(".fap-empty-card, .card.fap-empty-card");
    var table = doc.querySelector("table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");

    var crumbText = crumb ? cleanText(crumb.textContent).toLowerCase() : "";
    var isConditionPage =
      crumbText.indexOf("điều kiện") !== -1 ||
      crumbText.indexOf("ojt") !== -1 ||
      crumbText.indexOf("khóa luận") !== -1 ||
      crumbText.indexOf("thesis") !== -1 ||
      Boolean(emptyCard);

    if (!isConditionPage && !emptyCard && !table) return null;

    var emptyMessage = "";
    if (emptyCard) {
      var body = emptyCard.querySelector(".card-body") || emptyCard;
      emptyMessage = cleanText(body.textContent);
    }

    var checks = [];
    if (table) {
      var tbody = table.querySelector("tbody");
      var trs = tbody ? tbody.querySelectorAll("tr") : table.querySelectorAll("tr");
      var startIdx = 0;
      var headerRow = table.querySelector("thead tr") || table.querySelector("tr:first-child");
      if (!tbody && headerRow && trs.length > 0 && trs[0] === headerRow) {
        startIdx = 1;
      }

      for (var i = startIdx; i < trs.length; i++) {
        var tr = trs[i];
        if (tr.parentElement && tr.parentElement.tagName.toLowerCase() === "thead") continue;
        var cells = tr.querySelectorAll("td");
        if (cells.length < 3) continue;

        var label = "";
        var required = "";
        var actual = "";
        var statusCell = null;

        if (cells.length >= 4) {
          label = cleanText(cells[0].textContent);
          required = cleanText(cells[1].textContent);
          actual = cleanText(cells[2].textContent);
          statusCell = cells[3];
        } else {
          label = cleanText(cells[0].textContent);
          required = "—";
          actual = cleanText(cells[1].textContent);
          statusCell = cells[2];
        }

        var passed = null;
        if (statusCell) {
          var html = statusCell.innerHTML || "";
          var text = cleanText(statusCell.textContent);

          var hasPassIcon = /ri-checkbox-circle|badge-success|bg-success|text-success/i.test(html);
          var hasFailIcon = /ri-close-circle|badge-danger|bg-danger|text-danger/i.test(html);

          if (hasFailIcon || /không đạt|chưa đạt|failed|trượt/i.test(text)) {
            passed = false;
          } else if (hasPassIcon || /đạt|passed|thỏa/i.test(text)) {
            passed = true;
          } else {
            passed = null;
          }
        }

        checks.push({
          label: label,
          required: required,
          actual: actual,
          passed: passed,
        });
      }
    }

    var eligible = null;
    if (checks.length > 0) {
      var allPass = true;
      var hasFail = false;
      var hasUnknown = false;

      for (var k = 0; k < checks.length; k++) {
        if (checks[k].passed === false) {
          hasFail = true;
          allPass = false;
        } else if (checks[k].passed === null) {
          hasUnknown = true;
          allPass = false;
        }
      }

      if (hasFail) {
        eligible = false;
      } else if (allPass && !hasUnknown) {
        eligible = true;
      } else {
        eligible = null;
      }
    }

    var summaryMessage = emptyMessage;
    if (!summaryMessage) {
      if (eligible === true) {
        summaryMessage = "Đủ điều kiện";
      } else if (eligible === false) {
        summaryMessage = "Chưa đủ điều kiện";
      } else {
        summaryMessage = "Chưa xác định";
      }
    }

    return {
      summary: {
        eligible: eligible,
        message: summaryMessage,
      },
      checks: checks,
    };
  }

  return {
    readConditions: readConditions,
  };
});
