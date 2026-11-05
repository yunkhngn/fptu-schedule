const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { ROUTES, matchRoute } = require("../lib/fap-routes.js");

const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "pages", "index.json"), "utf8"));

test("every surveyed FAP page resolves to a route", () => {
  fixtures.forEach(({ slug, route }) => {
    const pathname = route.split("?")[0];
    const match = matchRoute(pathname);
    assert.notStrictEqual(match, null, `${slug} (${pathname}) is not matched`);
  });
});

test("no surveyed page falls through to the generic fallback", () => {
  // The generic fallback wraps whatever the page is. A surveyed page should have its own decision recorded in the table.
  fixtures.forEach(({ slug, route }) => {
    const match = matchRoute(route.split("?")[0]);
    assert.notStrictEqual(match.id, "wrapped", `${slug} (${route}) has no route of its own`);
  });
});

test("route ids are unique and no pattern is claimed by two routes", () => {
  const ids = new Set();
  const patterns = new Map();
  ROUTES.forEach((r) => {
    assert.ok(!ids.has(r.id), `duplicate route id ${r.id}`);
    ids.add(r.id);
    r.patterns.forEach((p) => {
      assert.ok(!patterns.has(p), `pattern ${p} is in both ${patterns.get(p)} and ${r.id}`);
      patterns.set(p, r.id);
    });
  });
});

test("every route has a known kind", () => {
  ROUTES.forEach((r) => assert.ok(["native", "form", "auth", "wrapped"].includes(r.kind), `${r.id}: ${r.kind}`));
});

test("payment pages stay wrapped so the QR code and pay button are never rebuilt", () => {
  ["/ShoppingCart", "/ShoppingCart/Pay", "/CoursePendingPayment", "/CoursePendingPayment/Index"].forEach((p) => {
    assert.strictEqual(matchRoute(p).kind, "wrapped", p);
  });
});

test("an unknown path is wrapped, and logout and OAuth redirects never mount the interface", () => {
  assert.strictEqual(matchRoute("/Something/New").kind, "wrapped");
  ["/Auth/Logout", "/Auth/GoogleLogin", "/Default.aspx"].forEach((p) => assert.strictEqual(matchRoute(p), null, p));
});

test("every native or form route has a fixture and that fixture is used by a test", () => {
  const testFiles = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    if (e.name === "node_modules" || e.name === "dist") return;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.test\.(js|ts|tsx)$/.test(e.name)) testFiles.push(fs.readFileSync(p, "utf8"));
  });
  walk(path.join(__dirname));
  walk(path.join(__dirname, "..", "ui", "src"));
  const all = testFiles.join("\n");

  // These pages are read from the live home page and the weekly grid, which have their own dedicated tests.
  const NO_FIXTURE_NEEDED = new Set(["overview", "timetable", "exams", "news"]);
  ROUTES.filter((r) => (r.kind === "native" || r.kind === "form") && !NO_FIXTURE_NEEDED.has(r.id)).forEach((r) => {
    const fixture = fixtures.find((f) => matchRoute(f.route.split("?")[0]).id === r.id);
    assert.ok(fixture, `route ${r.id} has no fixture in tests/fixtures/pages/index.json`);
    assert.ok(all.includes(fixture.slug), `fixture ${fixture.slug} for route ${r.id} is not used by any test`);
  });
});
