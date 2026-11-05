export function remToPx(css: string, base: number = 16): string {
  return css.replace(/(-?\d*\.?\d+)rem\b/g, (_match, numStr) => {
    const val = parseFloat(numStr);
    const px = Math.round(val * base * 1000) / 1000;
    return `${px}px`;
  });
}

export function splitDocumentCss(css: string): { shadowCss: string; documentCss: string } {
  const documentRules: string[] = [];
  let remainingCss = "";
  let i = 0;

  while (i < css.length) {
    const slice = css.slice(i);
    const atMatch = slice.match(/^@(property|font-face)\b/);
    if (atMatch) {
      const openBrace = css.indexOf("{", i);
      if (openBrace !== -1) {
        let depth = 1;
        let j = openBrace + 1;
        while (j < css.length && depth > 0) {
          if (css[j] === "{") depth++;
          else if (css[j] === "}") depth--;
          j++;
        }
        const rule = css.slice(i, j).trim();
        documentRules.push(rule);
        i = j;
        continue;
      }
    }
    remainingCss += css[i];
    i++;
  }

  const shadowCss = remainingCss.replace(/:root\b/g, ":host").trim();

  return {
    shadowCss,
    documentCss: documentRules.join("\n\n").trim(),
  };
}
