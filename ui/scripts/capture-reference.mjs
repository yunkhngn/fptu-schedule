import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const refDir = path.resolve(__dirname, "../reference");
fs.mkdirSync(refDir, { recursive: true });

const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!fs.existsSync(CHROME_PATH)) {
  console.error("Chrome not found at", CHROME_PATH);
  process.exit(1);
}

const BASE_URL = "https://pixel-perfect-pagecraft-99.lovable.app";

const PAGES = [
  { name: "overview", path: "/" },
  { name: "timetable", path: "/thoi-khoa-bieu" },
  { name: "exams", path: "/lich-thi" },
  { name: "news", path: "/tin-tuc" },
];

for (const p of PAGES) {
  const url = `${BASE_URL}${p.path}`;
  const outPath = path.join(refDir, `${p.name}.png`);
  console.log(`Capturing ${p.name} from ${url} -> ${outPath}...`);

  const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --no-sandbox --user-data-dir=/tmp/fap-chrome-profile --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 puppeteer" --hide-scrollbars --window-size=1440,900 --virtual-time-budget=5000 --screenshot="${outPath}" "${url}"`;
  execSync(cmd, { stdio: "inherit" });
}

console.log("All reference screenshots captured successfully!");

