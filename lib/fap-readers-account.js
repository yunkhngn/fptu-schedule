(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.FapReadersAccount = api;
    if (root.FapPageData) {
      root.FapPageData.account = api;
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
    if (/^https?:\/\/([a-z0-9.-]+\.)?fpt\.edu\.vn/i.test(trimmed) || /^\/[^/]/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  function readAccount(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var container = doc.querySelector(".student-profile, .account-page");
    if (!container) return null;

    var cards = container.querySelectorAll(".card");
    if (cards.length === 0) return null;

    var sections = [];

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var fields = card.querySelectorAll(".student-profile-field");
      if (fields.length === 0) continue;

      var headerEl = card.querySelector(".card-header h5, .card-header");
      var title = headerEl ? cleanText(headerEl.textContent) : "Thông tin";

      var items = [];
      for (var j = 0; j < fields.length; j++) {
        var f = fields[j];
        var labelEl = f.querySelector(".student-profile-field__label");
        var valEl = f.querySelector(".student-profile-field__value");

        var label = labelEl ? cleanText(labelEl.textContent) : "";
        var val = valEl ? cleanText(valEl.textContent) : "";

        if (val === "" || val === "-") {
          val = "—";
        }

        if (label) {
          items.push({ label: label, value: val });
        }
      }

      if (items.length > 0) {
        sections.push({
          title: title,
          items: items,
        });
      }
    }

    if (sections.length === 0) return null;

    var editBtn = doc.querySelector("a[href*='/StudentProfile']");
    var editHref = editBtn ? sanitizeLink(editBtn.getAttribute("href")) : null;

    return {
      sections: sections,
      editHref: editHref,
    };
  }

  return {
    readAccount: readAccount,
  };
});
