import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
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

