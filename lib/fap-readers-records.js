(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.FapReadersRecords = api;
    if (root.FapPageData) {
      root.FapPageData.records = api;
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

  function readTransactions(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var table = doc.querySelector("#transaction-datatable, table.dataTable, table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");
    var filterForm = doc.querySelector("#transaction-filter-form, form[action*='/Transaction']");

    var crumbText = crumb ? cleanText(crumb.textContent).toLowerCase() : "";
    var isTxPage = crumbText.indexOf("giao dịch") !== -1 || Boolean(filterForm);

    if (!isTxPage && !table) return null;

    var rows = [];
    var trs = table ? table.querySelectorAll("tbody tr") : [];

    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      var cells = tr.querySelectorAll("td");
      if (cells.length < 5) continue;

      var date = cleanText(cells[2].textContent);
      var amountStr = cleanText(cells[3].textContent);
      var desc = cleanText(cells[5] ? cells[5].textContent : cells[4].textContent);

      if (!date && !amountStr && !desc) continue;

      var direction = "unknown";
      if (amountStr.indexOf("-") !== -1) {
        direction = "out";
      } else if (/[0-9]/.test(amountStr)) {
        direction = "in";
      }

      rows.push({
        date: date,
        description: desc,
        amount: amountStr,
        direction: direction,
        status: "Thành công",
      });
    }

    if (rows.length === 0 && !isTxPage) return null;

    return {
      rows: rows,
      balance: undefined,
    };
  }

  function readDocuments(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var table = doc.querySelector("table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");
    var filterForm = doc.querySelector("#document-filter-form, form[action*='/Document']");

    var crumbText = crumb ? cleanText(crumb.textContent).toLowerCase() : "";
    var isDocPage = crumbText.indexOf("tài liệu") !== -1 || Boolean(filterForm);

    if (!isDocPage && !table) return null;

    var rows = [];
    var trs = table ? table.querySelectorAll("tbody tr") : [];

    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      var cells = tr.querySelectorAll("td");
      if (cells.length < 3) continue;

      var title = cleanText(cells[1].textContent);
      var category = cells.length > 2 ? cleanText(cells[2].textContent) : "";
      var date = cells.length > 3 ? cleanText(cells[3].textContent) : "";

      var linkEl = tr.querySelector("a[href]");
      var href = linkEl ? sanitizeLink(linkEl.getAttribute("href")) : null;

      if (!title) continue;

      rows.push({
        title: title,
        category: category,
        date: date,
        href: href,
      });
    }

    if (rows.length === 0 && !isDocPage) return null;

    return {
      rows: rows,
    };
  }

  function readWishlist(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var table = doc.querySelector("table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");
    var filterForm = doc.querySelector("#wishlist-filter-form, form[action*='/Wishlist']");
    var emptyState = doc.querySelector(".fap-empty-state");

    var crumbText = crumb ? cleanText(crumb.textContent).toLowerCase() : "";
    var isWishlistPage =
      crumbText.indexOf("chờ lớp") !== -1 ||
      crumbText.indexOf("wishlist") !== -1 ||
      Boolean(filterForm);

    if (!isWishlistPage && !emptyState && !table) return null;

    var rows = [];
    var trs = table ? table.querySelectorAll("tbody tr") : [];

    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      if (tr.classList.contains("fap-table-card--empty")) continue;
      var cells = tr.querySelectorAll("td");
      if (cells.length < 3) continue;

      var code = cleanText(cells[1].textContent);
      var name = cleanText(cells[2].textContent);
      var status = cells.length > 3 ? cleanText(cells[3].textContent) : "Chờ lớp";

      if (!code && !name) continue;

      rows.push({
        code: code,
        name: name,
        status: status,
      });
    }

    var registerBtn = doc.querySelector("a[href*='/Wishlist/Register']");
    var registerHref = registerBtn ? sanitizeLink(registerBtn.getAttribute("href")) : "/Wishlist/Register";

    return {
      rows: rows,
      registerHref: registerHref,
    };
  }

  function readFyeLog(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var table = doc.querySelector("table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");

    var crumbText = crumb ? cleanText(crumb.textContent).toLowerCase() : "";
    var isFyePage =
      crumbText.indexOf("fye") !== -1 ||
      crumbText.indexOf("check-in") !== -1 ||
      crumbText.indexOf("mentor") !== -1;

    if (!isFyePage && !table) return null;

    var rows = [];
    var trs = table ? table.querySelectorAll("tbody tr") : [];

    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      if (tr.classList.contains("fap-table-card--empty")) continue;
      var cells = tr.querySelectorAll("td");
      if (cells.length < 2) continue;

      var rowData = {};
      for (var c = 0; c < cells.length; c++) {
        var label = "col_" + c;
        rowData[label] = cleanText(cells[c].textContent);
      }
      rows.push(rowData);
    }

    return {
      rows: rows,
    };
  }

  function readApplications(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var table = doc.querySelector("table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");

    var crumbText = crumb ? cleanText(crumb.textContent).toLowerCase() : "";
    var isAppPage = crumbText.indexOf("xem đơn") !== -1 || crumbText.indexOf("application") !== -1;

    if (!isAppPage && !table) return null;

    var rows = [];
    var trs = table ? table.querySelectorAll("tbody tr") : [];

    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      var cells = tr.querySelectorAll("td");
      if (cells.length < 3) continue;

      var type = cleanText(cells[0].textContent);
      var content = cells.length > 1 ? cleanText(cells[1].textContent) : "";
      var status = cells.length > 2 ? cleanText(cells[2].textContent) : "";
      var created = cells.length > 6 ? cleanText(cells[6].textContent) : "";

      var link = tr.querySelector("a[href]");
      var href = link ? sanitizeLink(link.getAttribute("href")) : null;

      if (!type && !status) continue;

      rows.push({
        type: type || content,
        created: created,
        status: status,
        href: href,
      });
    }

    if (rows.length === 0 && !isAppPage) return null;

    return {
      rows: rows,
    };
  }

  function readApplicationCatalog(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var table = doc.querySelector("table");
    var crumb = doc.querySelector(".fap-page-title__crumb-current");

    var crumbText = crumb ? cleanText(crumb.textContent).toLowerCase() : "";
    var isCatalogPage =
      crumbText.indexOf("gửi đơn") !== -1 ||
      (table && Boolean(table.querySelector("th[data-label*='Loại đơn'], th:nth-child(2)")));

    if (!isCatalogPage && !table) return null;

    var items = [];
    var trs = table ? table.querySelectorAll("tbody tr") : [];

    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      var cells = tr.querySelectorAll("td");
      if (cells.length < 3) continue;

      var title = cleanText(cells[1].textContent);
      var desc = cleanText(cells[2].textContent);
      var link = tr.querySelector("a[href]");
      var href = link ? sanitizeLink(link.getAttribute("href")) : "/Application/Create";

      if (!title) continue;

      items.push({
        title: title,
        description: desc === "-" ? undefined : desc,
        href: href || "/Application/Create",
      });
    }

    if (items.length === 0 && !isCatalogPage) return null;

    return {
      items: items,
    };
  }

  function readListOrEmpty(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    var emptyCard = doc.querySelector(".fap-empty-card, .fap-empty-state");
    var table = doc.querySelector("table:not(.d-none)");
    var createBtn = doc.querySelector("a.fap-create-btn, a[href*='/Create'], a[href*='/Add']");
    var createHref = createBtn ? sanitizeLink(createBtn.getAttribute("href")) : null;

    if (emptyCard || (table && table.querySelectorAll("tbody tr").length === 0)) {
      return {
        empty: true,
        createHref: createHref,
      };
    }
    if (table && table.querySelectorAll("tbody tr").length > 0) {
      return {
        empty: false,
        createHref: createHref,
      };
    }
    if (createHref) {
      return {
        empty: true,
        createHref: createHref,
      };
    }

    return null;
  }

  return {
    readTransactions: readTransactions,
    readDocuments: readDocuments,
    readWishlist: readWishlist,
    readFyeLog: readFyeLog,
    readApplications: readApplications,
    readApplicationCatalog: readApplicationCatalog,
    readListOrEmpty: readListOrEmpty,
  };
});
