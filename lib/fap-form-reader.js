(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.FapFormReader = api;
    if (root.FapPageData) {
      root.FapPageData.forms = api;
    }
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var SKIPPED_TYPES = { hidden: 1, submit: 1, button: 1, reset: 1, image: 1 };
  var TEXT_LIKE = { text: 1, email: 1, tel: 1, number: 1, date: 1, url: 1, search: 1 };

  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function labelFor(doc, el, form) {
    var id = el.getAttribute("id");
    if (id) {
      var byFor = form.querySelector('label[for="' + id.replace(/"/g, '\\"') + '"]');
      if (byFor) return clean(byFor.textContent);
    }
    // A label wrapped around the control.
    var wrapping = el.closest("label");
    if (wrapping) {
      var copy = wrapping.cloneNode(true);
      copy.querySelectorAll("input, select, textarea").forEach(function (n) { n.remove(); });
      var own = clean(copy.textContent);
      if (own) return own;
    }
    // A label (or caption) just before the control inside its own container.
    var container = el.parentElement;
    for (var hops = 0; container && container !== form && hops < 3; hops++) {
      var near = container.querySelector("label.form-label, label");
      if (near && !near.contains(el)) return clean(near.textContent);
      container = container.parentElement;
    }
    return clean(el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || "");
  }

  function errorFor(form, name) {
    if (!name) return undefined;
    var spans = form.querySelectorAll("[data-valmsg-for]");
    for (var i = 0; i < spans.length; i++) {
      if (spans[i].getAttribute("data-valmsg-for") === name) {
        var text = clean(spans[i].textContent);
        return text || undefined;
      }
    }
    return undefined;
  }

  function optionsOf(select) {
    return Array.prototype.map.call(select.querySelectorAll("option"), function (o) {
      return { value: o.getAttribute("value") != null ? o.getAttribute("value") : clean(o.textContent), label: clean(o.textContent) };
    });
  }

  function selectedValue(select) {
    var chosen = select.querySelector("option[selected]");
    if (chosen) return chosen.getAttribute("value") != null ? chosen.getAttribute("value") : clean(chosen.textContent);
    var first = select.querySelector("option");
    return first ? (first.getAttribute("value") != null ? first.getAttribute("value") : clean(first.textContent)) : "";
  }

  /**
   * Describes one form of the FAP page so the interface can show it and drive it. The values are only ever
   * written back into the original controls; this function never submits or changes anything.
   */
  function readForm(doc, selector) {
    if (!doc || !doc.querySelector) return null;
    var form = doc.querySelector(selector);
    if (!form) return null;

    var reasons = [];
    function flag(reason) {
      if (reasons.indexOf(reason) === -1) reasons.push(reason);
    }

    if (form.hasAttribute("data-get-schema-url")) flag("dynamic-schema");

    var submit = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!submit) flag("no-submit");

    var fields = [];
    var group;
    var radioByName = {};
    var nodes = form.querySelectorAll("input, select, textarea, h4, h5, h6");

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var tag = el.tagName.toLowerCase();

      if (tag === "h4" || tag === "h5" || tag === "h6") {
        var heading = clean(el.textContent);
        if (heading) group = heading;
        continue;
      }

      var type = tag === "input" ? (el.getAttribute("type") || "text").toLowerCase() : tag;
      if (SKIPPED_TYPES[type]) continue;
      if (el.className && /select2-search|select2-selection/.test(el.className)) continue;

      if (type === "file") { flag("file-input"); continue; }
      if (type === "password") { flag("password"); continue; }
      if (/\bselect2\b/.test(el.className || "")) flag("select2");

      var name = el.getAttribute("name") || "";

      if (type === "radio") {
        var key = name;
        var option = { value: el.getAttribute("value") || "", label: labelFor(doc, el, form) };
        if (radioByName[key]) {
          radioByName[key].options.push(option);
          if (el.hasAttribute("checked")) radioByName[key].value = option.value;
          continue;
        }
        var radioField = {
          name: name, label: "", type: "radio", value: el.hasAttribute("checked") ? option.value : "",
          readOnly: el.hasAttribute("disabled"), required: el.hasAttribute("required") || el.hasAttribute("data-val-required"),
          options: [option]
        };
        if (group) radioField.group = group;
        var radioError = errorFor(form, name);
        if (radioError) radioField.error = radioError;
        radioByName[key] = radioField;
        fields.push(radioField);
        continue;
      }

      var field = {
        name: name,
        label: labelFor(doc, el, form),
        type: tag === "select" ? "select" : tag === "textarea" ? "textarea" : type === "checkbox" ? "checkbox" : TEXT_LIKE[type] ? type : "text",
        value: "",
        readOnly: el.hasAttribute("readonly") || el.hasAttribute("disabled"),
        required: el.hasAttribute("required") || el.hasAttribute("data-val-required")
      };

      if (tag === "select") {
        field.options = optionsOf(el);
        field.value = selectedValue(el);
      } else if (type === "checkbox") {
        field.value = el.hasAttribute("checked") ? "true" : "false";
      } else if (tag === "textarea") {
        field.value = el.value != null ? el.value : clean(el.textContent);
      } else {
        field.value = el.value != null ? el.value : el.getAttribute("value") || "";
      }

      var max = parseInt(el.getAttribute("maxlength"), 10);
      if (!isNaN(max)) field.maxLength = max;
      var placeholder = el.getAttribute("placeholder");
      if (placeholder) field.placeholder = clean(placeholder);
      if (group) field.group = group;
      var error = errorFor(form, name);
      if (error) field.error = error;

      fields.push(field);
    }

    // A radio group's label is the caption before its first option, not an option's own label.
    Object.keys(radioByName).forEach(function (n) {
      var f = radioByName[n];
      if (!f.label) {
        var first = form.querySelector('input[type="radio"][name="' + n.replace(/"/g, '\\"') + '"]');
        var holder = first && first.closest("label") ? first.closest("label").parentElement : first && first.parentElement;
        var caption = holder && holder.querySelector("span, legend, .form-label");
        f.label = caption && !caption.contains(first) ? clean(caption.textContent) : n;
      }
    });

    return {
      fields: fields,
      action: form.getAttribute("action") || "",
      method: (form.getAttribute("method") || "get").toLowerCase(),
      submitLabel: submit ? clean(submit.tagName.toLowerCase() === "input" ? submit.getAttribute("value") : submit.textContent) : "",
      unsupported: reasons.length > 0,
      unsupportedReasons: reasons
    };
  }

  return { readForm: readForm };
});
