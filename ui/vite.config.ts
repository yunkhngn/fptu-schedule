import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";

function remToPxPlugin(): Plugin {
  return {
    name: "vite-plugin-rem-to-px",
    enforce: "post",
    transform(code, id) {
      if (id.endsWith(".css") || id.includes(".css?")) {
        return {
          code: code.replace(/(-?\d*\.?\d+)rem\b/g, (_m, numStr) => {
            const val = parseFloat(numStr);
            const px = Math.round(val * 16 * 1000) / 1000;
            return `${px}px`;
          }),
        };
      }
    },
  };
}

function copyFontsPlugin(): Plugin {
  return {
    name: "vite-plugin-copy-fonts",
    closeBundle() {
      const fontSrcDir = path.resolve(__dirname, "node_modules/@fontsource-variable/inter/files");
      const fontDistDir = path.resolve(__dirname, "../dist/fonts");
      if (fs.existsSync(fontSrcDir)) {
        fs.mkdirSync(fontDistDir, { recursive: true });
        const filesToCopy = [
          "inter-latin-wght-normal.woff2",
          "inter-vietnamese-wght-normal.woff2",
        ];
        for (const file of filesToCopy) {
          const src = path.join(fontSrcDir, file);
          const dest = path.join(fontDistDir, file);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), remToPxPlugin(), copyFontsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@lib": path.resolve(__dirname, "../lib"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "../dist",
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: path.resolve(__dirname, "src/main.tsx"),
      name: "FapUi",
      formats: ["iife"],
      fileName: () => "fap-ui.js",
    },
  },
});
