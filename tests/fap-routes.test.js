const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const fapRoutes = require("../lib/fap-routes.js");
const { ROUTES, matchRoute } = fapRoutes;

describe("fap-routes", () => {
  test("ROUTES is an array of route definitions", () => {
    assert.ok(Array.isArray(ROUTES));
    assert.ok(ROUTES.length > 0);
    for (const r of ROUTES) {
      assert.ok(typeof r.id === "string");
      assert.ok(Array.isArray(r.patterns));
      assert.ok(["native", "form", "auth", "wrapped"].includes(r.kind));
      assert.ok(r.nav === null || typeof r.nav === "string");
    }
  });

  test("matches four existing routes as native", () => {
    assert.deepEqual(matchRoute("/"), {
      id: "overview",
      kind: "native",
      nav: "/",
    });
    assert.deepEqual(matchRoute(""), {
      id: "overview",
      kind: "native",
      nav: "/",
    });
    assert.deepEqual(matchRoute("/WeeklyTimetable"), {
      id: "timetable",
      kind: "native",
      nav: "/thoi-khoa-bieu",
    });
    assert.deepEqual(matchRoute("/ExamSchedule"), {
      id: "exams",
      kind: "native",
      nav: "/lich-thi",
    });
    assert.deepEqual(matchRoute("/News"), {
      id: "news",
      kind: "native",
      nav: "/tin-tuc",
    });
  });

  test("matches news-detail specifically, distinct from news list", () => {
    const res = matchRoute("/News/Detail/abc");
    assert.ok(res);
    assert.equal(res.id, "news-detail");
    assert.equal(res.nav, "/tin-tuc");
  });

  test("matches /Auth/Login as auth", () => {
    assert.deepEqual(matchRoute("/Auth/Login"), {
      id: "login",
      kind: "auth",
      nav: null,
    });
  });

  test("returns null for excluded paths that must never mount the new shell", () => {
    assert.equal(matchRoute("/Auth/Logout"), null);
    assert.equal(matchRoute("/Auth/GoogleLogin"), null);
    assert.equal(matchRoute("/Auth/LoginParent"), null);
    assert.equal(matchRoute("/Default.aspx"), null);
    assert.equal(matchRoute("/Default"), null);
  });

  test("returns wrapped for shopping cart and payment pages", () => {
    const cart = matchRoute("/ShoppingCart");
    assert.ok(cart);
    assert.equal(cart.kind, "wrapped");

    const payment = matchRoute("/CoursePendingPayment");
    assert.ok(payment);
    assert.equal(payment.kind, "wrapped");
  });

  test("returns wrapped for pages without a dedicated reader yet", () => {
    const subject = matchRoute("/Subject");
    assert.ok(subject);
    assert.equal(subject.kind, "wrapped");

    const arbitrary = matchRoute("/Whatever/Page");
    assert.ok(arbitrary);
    assert.equal(arbitrary.id, "wrapped");
    assert.equal(arbitrary.kind, "wrapped");
  });

  test("safely handles non-string or edge input", () => {
    assert.equal(matchRoute(null), null);
    assert.equal(matchRoute(undefined), null);
    assert.equal(matchRoute(123), null);
    assert.equal(matchRoute({}), null);
  });

  test("every entry in tests/fixtures/pages/index.json matches a non-null route", () => {
    const indexPath = path.resolve(__dirname, "fixtures/pages/index.json");
    const fixtures = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    for (const item of fixtures) {
      const match = matchRoute(item.route);
      assert.ok(
        match !== null,
        `Expected fixture route "${item.route}" (${item.slug}) to match a non-null route, got null`
      );
    }
  });
});
