(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.FapReadersArticle = api;
    if (root.FapPageData) {
      root.FapPageData.article = api;
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

  function readArticle(doc) {
    if (!doc || typeof doc.querySelector !== "function") return null;

    // Check for News Detail
    var newsCard = doc.querySelector(".fap-news-detail-card");
    var newsTitle = doc.querySelector(".fap-news-detail-title, h1.fap-news-detail-title");
    var newsBody = doc.querySelector(".fap-news-content");

    if (newsCard || newsTitle || newsBody) {
      if (!newsBody || !newsTitle) return null;

      var title = cleanText(newsTitle.textContent);
      if (!title) return null;

      var meta = [];
      // Category badge
      var badge = doc.querySelector(".fap-news-badge--type, .fap-news-detail-header__badges .badge");
      if (badge) {
        var badgeText = cleanText(badge.textContent);
        if (badgeText) {
          meta.push({ label: "Chuyên mục", value: badgeText });
        }
      }

      // Meta items (author, dates, etc.)
      var metaItems = doc.querySelectorAll(".fap-news-detail-meta__item");
      for (var i = 0; i < metaItems.length; i++) {
        var text = cleanText(metaItems[i].textContent);
        if (!text) continue;
        var colonIdx = text.indexOf(":");
        if (colonIdx !== -1) {
          var label = text.substring(0, colonIdx).trim();
          var val = text.substring(colonIdx + 1).trim();
          if (label && val) {
            meta.push({ label: label, value: val });
          } else {
            meta.push({ label: "Thông tin", value: text });
          }
        } else {
          meta.push({ label: "Thông tin", value: text });
        }
      }

      // Back link
      var backBtn = doc.querySelector(".fap-back-btn");
      var backHref = backBtn ? sanitizeLink(backBtn.getAttribute("href")) : "/News";

      // Attachments
      var attachments = [];
      var links = doc.querySelectorAll(
        ".fap-news-detail-card a.fap-document-file-btn, .fap-news-detail-card a[href*='download'], .fap-news-detail-card a[href*='cdn.fpt.edu.vn']"
      );
      for (var j = 0; j < links.length; j++) {
        var a = links[j];
        var href = sanitizeLink(a.getAttribute("href"));
        if (!href) continue;
        var name = cleanText(a.textContent) || "Tệp đính kèm";
        attachments.push({ name: name, href: href });
      }

      return {
        title: title,
        meta: meta,
        attachments: attachments,
        bodySelector: ".fap-news-content",
        backHref: backHref || "/News",
      };
    }

    // Check for Document Detail
    var docCard = doc.querySelector(".fap-document-detail, .fap-result-card");
    var docTitle = doc.querySelector(".fap-result-card__title, h5.fap-result-card__title");
    var docBody = doc.querySelector(".fap-document-body, .fap-document-content");

    if (docCard || docTitle || docBody) {
      if (!docBody || !docTitle) return null;

      var docTitleText = cleanText(docTitle.textContent);
      if (!docTitleText) return null;

      var docMeta = [];
      var metaSpans = doc.querySelectorAll(".fap-result-card__meta span");
      for (var k = 0; k < metaSpans.length; k++) {
        var spanText = cleanText(metaSpans[k].textContent);
        if (spanText) {
          docMeta.push({ label: "Thời gian", value: spanText });
        }
      }

      var docAttachments = [];
      var fields = doc.querySelectorAll(".fap-detail-field");
      for (var f = 0; f < fields.length; f++) {
        var field = fields[f];
        var labelEl = field.querySelector(".fap-detail-field__label");
        var valEl = field.querySelector(".fap-detail-field__value");
        if (!valEl) continue;

        var fileBtn = valEl.querySelector("a.fap-document-file-btn, a[href]");
        if (fileBtn) {
          var fileHref = sanitizeLink(fileBtn.getAttribute("href"));
          if (fileHref) {
            docAttachments.push({
              name: cleanText(fileBtn.textContent) || "Mở tệp",
              href: fileHref,
            });
          }
        } else {
          var fieldLabel = labelEl ? cleanText(labelEl.textContent) : "";
          var fieldVal = cleanText(valEl.textContent);
          if (fieldLabel && fieldVal) {
            docMeta.push({ label: fieldLabel, value: fieldVal });
          }
        }
      }

      var docBackBtn = doc.querySelector(".fap-back-btn");
      var docBackHref = docBackBtn ? sanitizeLink(docBackBtn.getAttribute("href")) : "/Document";

      var bodySelector = doc.querySelector(".fap-document-body")
        ? ".fap-document-body"
        : ".fap-document-content";

      return {
        title: docTitleText,
        meta: docMeta,
        attachments: docAttachments,
        bodySelector: bodySelector,
        backHref: docBackHref || "/Document",
      };
    }

    return null;
  }

  return {
    readArticle: readArticle,
  };
});
