(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.FapReadersLogin = api;
    if (root.FapPageData) {
      root.FapPageData.login = api;
    }
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  /**
   * Reads the text around FAP's sign-in block. It never touches the inputs: not their values, not their
   * attributes. The block itself (tabs, Google and FeID links, the parent form) stays FAP's own markup.
   */
  function readLogin(doc) {
    if (!doc || !doc.querySelector) return null;
    var block = doc.querySelector("#login-step-credentials");
    if (!block) return null;

    var card = block.closest(".card-body") || block.parentElement;
    var heading = card && card.querySelector("h4");
    var subtitle = card && card.querySelector("h4 + p, .text-muted.small");

    var tabs = [];
    var staffTab = block.querySelector("#login-tab-staff-btn");
    var parentTab = block.querySelector("#login-tab-parent-btn");
    if (staffTab) tabs.push({ id: "staff", label: clean(staffTab.textContent) });
    if (parentTab) tabs.push({ id: "parent", label: clean(parentTab.textContent) });

    var messages = [];
    doc.querySelectorAll(".alert").forEach(function (el) {
      if (el.classList.contains("d-none") || el.hasAttribute("hidden")) return;
      var text = clean(el.textContent);
      if (!text) return;
      var tone = el.classList.contains("alert-success") ? "success"
        : el.classList.contains("alert-danger") ? "danger"
        : el.classList.contains("alert-warning") ? "warning" : "info";
      messages.push({ tone: tone, text: text });
    });

    return {
      title: clean(heading && heading.textContent),
      subtitle: clean(subtitle && subtitle.textContent),
      tabs: tabs,
      hasStaffLogin: Boolean(block.querySelector("#login-google-link, #login-feid-link")),
      hasParentForm: Boolean(block.querySelector("#frm-parent-login")),
      messages: messages
    };
  }

  return { readLogin: readLogin };
});
