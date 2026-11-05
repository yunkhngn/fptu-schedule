const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const manifestPath = path.join(root, "manifest.json");

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

test("manifest content scripts and web accessible resources exist on disk", () => {
  const manifest = readManifest();
  const distExists = fs.existsSync(path.join(root, "dist"));

  assert.ok(Array.isArray(manifest.content_scripts), "content_scripts must be an array");

  for (const cs of manifest.content_scripts) {
    if (cs.css) {
      for (const cssFile of cs.css) {
        if (cssFile.startsWith("dist/")) {
          if (distExists) {
            assert.ok(fs.existsSync(path.join(root, cssFile)), `dist CSS file ${cssFile} should exist`);
          }
        } else {
          assert.ok(fs.existsSync(path.join(root, cssFile)), `CSS file ${cssFile} must exist`);
        }
      }
    }
    if (cs.js) {
      for (const jsFile of cs.js) {
        if (jsFile.startsWith("dist/")) {
          if (distExists) {
            assert.ok(fs.existsSync(path.join(root, jsFile)), `dist JS file ${jsFile} should exist`);
          }
        } else {
          assert.ok(fs.existsSync(path.join(root, jsFile)), `JS file ${jsFile} must exist`);
        }
      }
    }
  }

  if (manifest.web_accessible_resources) {
    for (const entry of manifest.web_accessible_resources) {
      for (const res of entry.resources) {
        const cleanRes = res.replace(/\*$/, "");
        if (cleanRes.startsWith("dist/")) {
          if (distExists) {
            assert.ok(fs.existsSync(path.join(root, cleanRes)), `Resource ${cleanRes} should exist in dist`);
          }
        } else {
          assert.ok(fs.existsSync(path.join(root, cleanRes)), `Resource ${cleanRes} must exist`);
        }
      }
    }
  }
});

test("manifest includes early hide document_start content script", () => {
  const manifest = readManifest();
  const startScript = manifest.content_scripts.find(
    (cs) => cs.run_at === "document_start"
  );

  assert.ok(startScript, "Must have a document_start content script block");
  assert.ok(startScript.css && startScript.css.includes("lib/fap-ui-early.css"));
  assert.ok(startScript.js && startScript.js.includes("lib/fap-ui-early.js"));
  assert.ok(startScript.js && startScript.js.includes("lib/fap-routes.js"));

  const routesIndex = startScript.js.indexOf("lib/fap-routes.js");
  const earlyIndex = startScript.js.indexOf("lib/fap-ui-early.js");
  assert.ok(routesIndex < earlyIndex, "lib/fap-routes.js must come before lib/fap-ui-early.js");
  assert.deepStrictEqual(startScript.matches, ["*://fap.fpt.edu.vn/*"]);
});

test("manifest includes document_idle content script with fap-ui.js after content.js", () => {
  const manifest = readManifest();
  const idleScripts = manifest.content_scripts.filter(
    (cs) => cs.run_at === "document_idle" || !cs.run_at
  );

  assert.ok(idleScripts.length >= 2, "Must have existing content.js block and new fap-ui block");

  const fapUiScript = manifest.content_scripts.find(
    (cs) => cs.js && cs.js.includes("dist/fap-ui.js")
  );
  assert.ok(fapUiScript, "Must have a block containing dist/fap-ui.js");
  assert.deepStrictEqual(fapUiScript.matches, ["*://fap.fpt.edu.vn/*"]);

  let contentJsIndex = -1;
  let fapUiIndex = -1;
  let blockCounter = 0;

  for (const cs of manifest.content_scripts) {
    if (cs.js) {
      for (const f of cs.js) {
        if (f === "content.js") contentJsIndex = blockCounter;
        if (f === "dist/fap-ui.js") fapUiIndex = blockCounter;
        blockCounter++;
      }
    }
  }

  assert.ok(contentJsIndex >= 0, "content.js must be present in manifest");
  assert.ok(fapUiIndex >= 0, "dist/fap-ui.js must be present in manifest");
  assert.ok(
    contentJsIndex < fapUiIndex,
    `content.js (pos ${contentJsIndex}) must load before dist/fap-ui.js (pos ${fapUiIndex})`
  );
});

test("manifest declares web_accessible_resources for local fonts", () => {
  const manifest = readManifest();
  assert.ok(Array.isArray(manifest.web_accessible_resources));
  const fontEntry = manifest.web_accessible_resources.find((entry) =>
    entry.resources.includes("dist/fonts/*")
  );
  assert.ok(fontEntry, "Must declare dist/fonts/* as web_accessible_resources");
  assert.ok(fontEntry.matches.includes("*://fap.fpt.edu.vn/*"));
});

test("popup.html includes #fapUiToggle switch and popup.js saves fapUiEnabled preference", async () => {
  const popupHtml = fs.readFileSync(path.join(root, "popup.html"), "utf8");
  assert.ok(popupHtml.includes('id="fapUiToggle"'), "popup.html must contain #fapUiToggle");

  const fullHtml = popupHtml.replace(
    /<script src="([^"]+)"><\/script>/g,
    (_, src) => `<script>${fs.readFileSync(path.join(root, src), "utf8")}</script>`
  );

  const storageCalls = [];
  const dom = new JSDOM(fullHtml, {
    runScripts: "dangerously",
    url: "https://localhost/popup.html",
    beforeParse(window) {
      window.chrome = {
        runtime: {
          lastError: undefined,
          onMessage: { addListener: () => {} },
          sendMessage: (_m, cb) => cb && cb({ ok: true }),
          getURL: (p) => `chrome-extension://test/${p}`,
        },
        storage: {
          local: {
            get: (keys, cb) => {
              cb && cb({ fapUiEnabled: true });
            },
            set: (items, cb) => {
              storageCalls.push(items);
              cb && cb();
            },
            remove: () => {},
          },
        },
        tabs: {
          query: (_q, cb) => cb && cb([]),
          create: () => {},
          sendMessage: (_id, _msg, cb) => cb && cb(undefined),
          onUpdated: { addListener: () => {}, removeListener: () => {} },
          update: () => {},
        },
        scripting: { executeScript: (_o, cb) => cb && cb([]) },
      };
      window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    },
  });

  await new Promise((resolve) => {
    if (dom.window.document.readyState === "complete") return resolve();
    dom.window.addEventListener("load", resolve, { once: true });
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const toggle = dom.window.document.getElementById("fapUiToggle");
  assert.ok(toggle, "#fapUiToggle element must exist in DOM");
  assert.strictEqual(toggle.checked, true, "#fapUiToggle should default to checked");

  // Simulate user changing switch to false
  toggle.checked = false;
  toggle.dispatchEvent(new dom.window.Event("change"));

  const hasUiEnabledUpdate = storageCalls.some(
    (call) => call.fapUiEnabled === false
  );
  assert.ok(hasUiEnabledUpdate, "Changing #fapUiToggle must persist fapUiEnabled to storage");
});
