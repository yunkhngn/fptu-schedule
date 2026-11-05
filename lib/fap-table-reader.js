(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.FapTableReader = api;
    if (root.FapPageData) {
      root.FapPageData.tables = api;
    }
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function cleanText(str) {
    if (!str) return "";
    return str.replace(/\s+/g, " ").trim();
  }

  function readTables(root) {
    if (!root || typeof root.querySelectorAll !== "function") return [];
    var tables = root.querySelectorAll("table");
    var result = [];

    for (var i = 0; i < tables.length; i++) {
      var tbl = tables[i];
      var captionEl = tbl.querySelector("caption");
      var caption = captionEl ? cleanText(captionEl.textContent) : undefined;

      var headerRow = tbl.querySelector("thead tr") || tbl.querySelector("tr:first-child");
      var headers = [];
      if (headerRow) {
        var ths = headerRow.querySelectorAll("th");
        if (ths.length === 0) ths = headerRow.querySelectorAll("td");
        for (var h = 0; h < ths.length; h++) {
          headers.push(cleanText(ths[h].textContent));
        }
      }

      var tbody = tbl.querySelector("tbody");
      var trs = tbody ? tbody.querySelectorAll("tr") : tbl.querySelectorAll("tr");
      var rows = [];
      var links = [];

      var startIdx = 0;
      if (!tbody && headerRow && trs.length > 0 && trs[0] === headerRow) {
        startIdx = 1;
      }

      for (var r = startIdx; r < trs.length; r++) {
        var tr = trs[r];
        if (tr.parentElement && tr.parentElement.tagName.toLowerCase() === "thead") continue;
        var cells = tr.querySelectorAll("td, th");
        if (cells.length === 0) continue;

        var rowData = [];
        var rowLinks = [];
        for (var c = 0; c < cells.length; c++) {
          var cell = cells[c];
          rowData.push(cleanText(cell.textContent));
          var a = cell.querySelector("a[href]");
          rowLinks.push(a ? a.getAttribute("href") : null);
        }
        rows.push(rowData);
        links.push(rowLinks);
      }

      result.push({
        caption: caption,
        headers: headers,
        rows: rows,
        links: links,
      });
    }

    return result;
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
      });
    }

    return {
      value: val,
      options: options,
    };
  }

  return {
    readTables: readTables,
    readSelect: readSelect,
  };
});
