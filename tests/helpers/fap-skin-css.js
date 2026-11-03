const fs = require("node:fs");
const path = require("node:path");

/**
 * Strips CSS comments.
 */
function stripComments(cssText) {
  return (cssText || "").replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Parses CSS text into individual rule blocks, stripping comments and supporting
 * one level of @media / @supports grouping.
 */
function parseRules(cssText) {
  const clean = stripComments(cssText).trim();
  const rules = [];

  let i = 0;
  while (i < clean.length) {
    while (i < clean.length && /\s/.test(clean[i])) i++;
    if (i >= clean.length) break;

    if (clean[i] === "@") {
      const atStart = i;
      while (i < clean.length && clean[i] !== "{" && clean[i] !== ";") i++;
      if (i >= clean.length) break;
      if (clean[i] === ";") {
        i++;
        continue;
      }
      const atHeader = clean.slice(atStart, i).trim();
      i++; // skip '{'
      let depth = 1;
      const bodyStart = i;
      while (i < clean.length && depth > 0) {
        if (clean[i] === "{") depth++;
        else if (clean[i] === "}") depth--;
        i++;
      }
      const atBody = clean.slice(bodyStart, i - 1);
      if (/^@(media|supports)/i.test(atHeader)) {
        const inner = parseRules(atBody);
        for (const r of inner) {
          rules.push({ selector: r.selector, body: r.body, at: atHeader });
        }
      }
      continue;
    }

    const selStart = i;
    while (i < clean.length && clean[i] !== "{" && clean[i] !== "}") i++;
    if (i >= clean.length || clean[i] === "}") break;
    const selector = clean.slice(selStart, i).trim();
    i++; // skip '{'
    let depth = 1;
    const bodyStart = i;
    while (i < clean.length && depth > 0) {
      if (clean[i] === "{") depth++;
      else if (clean[i] === "}") depth--;
      i++;
    }
    const body = clean.slice(bodyStart, i - 1).trim();
    if (selector) {
      rules.push({ selector, body, at: null });
    }
  }

  return rules;
}

const cssPath = path.join(__dirname, "../../lib/fap-skin.css");
const css = fs.readFileSync(cssPath, "utf8");
const rules = parseRules(css);

module.exports = {
  css,
  stripComments,
  parseRules,
  rules
};
