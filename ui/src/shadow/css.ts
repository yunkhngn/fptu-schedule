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

export function buildFontFaceCss(fontBaseUrl: string = "fonts/"): string {
  const base = fontBaseUrl ? (fontBaseUrl.endsWith("/") ? fontBaseUrl : `${fontBaseUrl}/`) : "";
  return `
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url('${base}inter-latin-wght-normal.woff2') format('woff2-variations');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url('${base}inter-vietnamese-wght-normal.woff2') format('woff2-variations');
  unicode-range: U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB;
}
@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url('${base}inter-latin-wght-normal.woff2') format('woff2-variations');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
}
@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url('${base}inter-vietnamese-wght-normal.woff2') format('woff2-variations');
  unicode-range: U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB;
}
`.trim();
}
