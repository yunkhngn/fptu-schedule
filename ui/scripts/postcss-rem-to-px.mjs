export default function postcssRemToPx(opts = {}) {
  const base = opts.base || 16;
  return {
    postcssPlugin: "postcss-rem-to-px",
    Declaration(decl) {
      if (decl.value && decl.value.includes("rem")) {
        decl.value = decl.value.replace(/(-?\d*\.?\d+)rem\b/g, (_m, numStr) => {
          const val = parseFloat(numStr);
          const px = Math.round(val * base * 1000) / 1000;
          return `${px}px`;
        });
      }
    },
  };
}

postcssRemToPx.postcss = true;
