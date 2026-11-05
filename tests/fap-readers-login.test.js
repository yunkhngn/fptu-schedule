const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { readLogin } = require("../lib/fap-readers-login.js");

const fixture = fs.readFileSync(path.join(__dirname, "fixtures/pages/auth-login.html"), "utf8");
const docOf = (html) => new JSDOM(`<body>${html}</body>`, { url: "https://fap.fpt.edu.vn/Auth/Login" }).window.document;

test("reads the title, the subtitle and the two tabs of the login page", () => {
  const login = readLogin(docOf(fixture));

  assert.ok(login);
  assert.ok(login.title.length > 0, "the heading above the tabs");
  assert.ok(login.subtitle.length > 0);
  assert.deepStrictEqual(
    login.tabs.map((t) => t.id),
    ["staff", "parent"]
  );
  assert.ok(login.tabs.every((t) => t.label.length > 0));
  assert.strictEqual(login.hasParentForm, true);
  assert.strictEqual(login.hasStaffLogin, true);
});

test("does not read, or report, anything the student typed", () => {
  const doc = docOf(fixture);
  let touched = 0;
  for (const name of ["Username", "Password"]) {
    const el = doc.getElementById(name);
    Object.defineProperty(el, "value", { get() { touched++; return "x"; }, set() { touched++; } });
  }
  const login = readLogin(doc);
  assert.ok(login);
  assert.strictEqual(touched, 0, "no input value was read or written");
  assert.strictEqual(JSON.stringify(login).includes("Password"), false);
});

test("carries FAP's own error banners (a failed sign-in, an expired session)", () => {
  const html = fixture.replace(
    '<div id="login-antiforgery"',
    '<div class="alert alert-danger" role="alert">Sai tên đăng nhập hoặc mật khẩu</div><div id="login-antiforgery"'
  );
  const login = readLogin(docOf(html));
  assert.deepStrictEqual(login.messages, [{ tone: "danger", text: "Sai tên đăng nhập hoặc mật khẩu" }]);
});

test("a page without the credentials block is not recognised", () => {
  assert.strictEqual(readLogin(docOf("<p>Chuyển hướng...</p>")), null);
  assert.strictEqual(readLogin(null), null);
});

test("text that looks like HTML stays text", () => {
  const html = fixture.replace(/<h4([^>]*)>[^<]*<\/h4>/, "<h4$1>&lt;img src=x onerror=alert(1)&gt;</h4>");
  assert.strictEqual(readLogin(docOf(html)).title, "<img src=x onerror=alert(1)>");
});
