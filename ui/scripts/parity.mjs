import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.resolve(__dirname, "..");
const parityDir = path.resolve(uiDir, "parity");
const refDir = path.resolve(uiDir, "reference");

fs.mkdirSync(parityDir, { recursive: true });

const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!fs.existsSync(CHROME_PATH)) {
  console.error("Chrome not found at", CHROME_PATH);
  process.exit(1);
}

const PORT = 5199;
const MAX_ALLOWED_DIFF_PERCENT = 5.0;

let accent = null;
let theme = "light";
let requestedPage = null;

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg.startsWith("--accent=")) {
    accent = arg.slice("--accent=".length).trim();
  } else if (arg === "--accent" && i + 1 < process.argv.length) {
    accent = process.argv[i + 1].trim();
    i++;
  } else if (arg.startsWith("--theme=")) {
    theme = arg.slice("--theme=".length).trim();
  } else if (arg === "--theme" && i + 1 < process.argv.length) {
    theme = process.argv[i + 1].trim();
    i++;
  } else if (arg.startsWith("--page=")) {
    requestedPage = arg.slice("--page=".length).trim();
  } else if (arg === "--page" && i + 1 < process.argv.length) {
    requestedPage = process.argv[i + 1].trim();
    i++;
  }
}

const ALL_PAGES = ["overview", "timetable", "exams", "news"];
const PAGES = requestedPage ? [requestedPage] : ALL_PAGES;

const isVisualInspection =
  (theme && theme !== "light") ||
  Boolean(accent && accent !== "lavender") ||
  (requestedPage ? !fs.existsSync(path.join(refDir, `${requestedPage}.png`)) : false);
const outDir = path.resolve(parityDir, "out");
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log("Starting local Vite server (no HMR) on port", PORT, "...");
  const server = await createServer({
    root: uiDir,
    server: {
      host: "127.0.0.1",
      port: PORT,
      strictPort: true,
      hmr: false,
    },
    logLevel: "warn",
  });
  await server.listen();

  let hasFailure = false;
  const results = [];

  try {
    for (const page of PAGES) {
      const themeParam = theme ? `&theme=${encodeURIComponent(theme)}` : "";
      const accentParam = accent ? `&accent=${encodeURIComponent(accent)}` : "";
      const url = `http://127.0.0.1:${PORT}/parity/harness.html?page=${page}${themeParam}${accentParam}`;

      const actualFilename = isVisualInspection
        ? `actual-${theme}-${accent || "lavender"}-${page}.png`
        : `actual-${page}.png`;

      const actualPath = isVisualInspection
        ? path.join(outDir, actualFilename)
        : path.join(parityDir, actualFilename);
      const refPath = path.join(refDir, `${page}.png`);
      const diffPath = path.join(parityDir, `diff-${page}.png`);

      console.log(`Rendering ${page} -> ${actualPath}...`);
      const cmd = `"${CHROME_PATH}" --headless --disable-gpu --no-sandbox --user-data-dir=/tmp/fap-chrome-profile --hide-scrollbars --window-size=1440,900 --virtual-time-budget=3000 --screenshot="${actualPath}" "${url}"`;
      try {
        await execAsync(cmd);
      } catch (_) {}

      if (!fs.existsSync(actualPath)) {
        console.error(`Failed to generate screenshot for ${page}`);
        hasFailure = true;
        continue;
      }

      if (isVisualInspection) {
        // Also provide convenient alias copies if dark lavender or accent
        if (theme === "dark" && (!accent || accent === "lavender")) {
          const darkAlias = path.join(outDir, `dark-${page}.png`);
          try {
            fs.copyFileSync(actualPath, darkAlias);
          } catch (_) {}
        }
        console.log(`Saved screenshot for visual inspection: ${actualPath}`);
        results.push({ page, savedPath: actualPath });
        continue;
      }

      if (!fs.existsSync(refPath)) {
        console.error(`Reference image missing: ${refPath}`);
        hasFailure = true;
        continue;
      }

      const refPng = PNG.sync.read(fs.readFileSync(refPath));
      const actualPng = PNG.sync.read(fs.readFileSync(actualPath));

      const width = Math.min(refPng.width, actualPng.width);
      const height = Math.min(refPng.height, actualPng.height);
      const diffPng = new PNG({ width, height });

      const diffPixels = pixelmatch(
        refPng.data,
        actualPng.data,
        diffPng.data,
        width,
        height,
        { threshold: 0.1 }
      );

      const totalPixels = width * height;
      const diffPercent = (diffPixels / totalPixels) * 100;
      const pass = diffPercent <= MAX_ALLOWED_DIFF_PERCENT;

      fs.writeFileSync(diffPath, PNG.sync.write(diffPng));

      results.push({ page, diffPercent, diffPixels, totalPixels, pass });

      console.log(
        `[${pass ? "PASS" : "FAIL"}] ${page}: ${diffPercent.toFixed(2)}% pixel difference (${diffPixels}/${totalPixels})`
      );

      if (!pass) {
        hasFailure = true;
      }
    }
  } finally {
    await server.close();
  }

  if (isVisualInspection) {
    console.log(
      `\nVisual inspection screenshots saved to ui/parity/out/ for theme "${theme}" and accent "${accent || "lavender"}":`
    );
    for (const r of results) {
      console.log(`- ${r.page}: ${r.savedPath}`);
    }
    if (hasFailure) {
      console.error("\nVisual inspection screenshot generation failed for one or more pages.");
      process.exit(1);
    } else {
      console.log("\nAll visual inspection screenshots generated successfully.");
      return;
    }
  }

  console.log("\nSummary of Parity Check:");
  for (const r of results) {
    console.log(
      `- ${r.page}: ${r.diffPercent.toFixed(2)}% (${r.pass ? "PASS" : "FAIL"})`
    );
  }

  if (hasFailure) {
    console.error(`\nParity check failed: some pages exceed ${MAX_ALLOWED_DIFF_PERCENT}% difference threshold.`);
    process.exit(1);
  } else {
    console.log(`\nParity check succeeded: all pages within ${MAX_ALLOWED_DIFF_PERCENT}% threshold!`);
  }
}

main().catch((err) => {
  console.error("Fatal error during parity check:", err);
  process.exit(1);
});
