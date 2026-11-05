const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { readForm } = require("../lib/fap-form-reader.js");

const fixture = (name) => fs.readFileSync(path.join(__dirname, "fixtures/pages", `${name}.html`), "utf8");
const docOf = (html) => new JSDOM(`<body>${html}</body>`, { url: "https://fap.fpt.edu.vn/" }).window.document;

test("student profile: lists every field in order, read-only ones locked, the editable ones named", () => {
  const form = readForm(docOf(fixture("student-profile")), 'form[action$="/StudentProfile"]');

  assert.ok(form, "the form is found");
  assert.strictEqual(form.unsupported, false);
  assert.strictEqual(form.method, "post");
  assert.match(form.action, /\/StudentProfile$/);
  assert.strictEqual(form.submitLabel, "Lưu thông tin");

  const writable = form.fields.filter((f) => !f.readOnly);
  assert.deepStrictEqual(
    writable.map((f) => f.name),
    [
      "Form.PlaceOfIssue",
      "Form.NationCode",
      "Form.EthnicId",
      "Form.ReligionId",
      "Form.ProvinceId",
      "Form.WardId",
      "Form.Address"
    ]
  );
  assert.ok(form.fields.length > writable.length, "the read-only profile data is listed too");
  assert.ok(form.fields.filter((f) => f.readOnly).every((f) => f.label), "every field has a label");

  const ethnic = form.fields.find((f) => f.name === "Form.EthnicId");
  assert.strictEqual(ethnic.type, "select");
  assert.ok(ethnic.options.length > 5);
  assert.strictEqual(ethnic.options[0].value, "");
  assert.strictEqual(form.fields.find((f) => f.name === "Form.NationCode").maxLength, 8);
});

test("student profile: section headings become the group of the fields that follow", () => {
  const form = readForm(docOf(fixture("student-profile")), 'form[action$="/StudentProfile"]');
  const insurance = form.fields.find((f) => f.label === "Mã BHYT");
  assert.strictEqual(insurance.group, "Bảo hiểm y tế");
});

test("a form with a file input is unsupported, and says why", () => {
  const form = readForm(docOf(fixture("application-create")), "#test-create-app-form");
  assert.strictEqual(form.unsupported, true);
  assert.ok(form.unsupportedReasons.includes("file-input"));
  assert.ok(form.unsupportedReasons.includes("dynamic-schema"), "its fields are loaded by a script from a schema URL");
});

test("a form driven by Select2 with no submit button of its own is unsupported", () => {
  const form = readForm(docOf(fixture("wishlist-register")), "#wishlist-register-form");
  assert.strictEqual(form.unsupported, true);
  assert.ok(form.unsupportedReasons.includes("select2"));
  assert.ok(form.unsupportedReasons.includes("no-submit"));
});

test("a password field is never handled: the form is unsupported", () => {
  const form = readForm(
    docOf(`<form id="f" method="post"><label for="p">Mật khẩu</label><input id="p" name="Password" type="password"><button type="submit">Gửi</button></form>`),
    "#f"
  );
  assert.strictEqual(form.unsupported, true);
  assert.ok(form.unsupportedReasons.includes("password"));
  assert.strictEqual(form.fields.some((f) => f.name === "Password"), false, "the field is not even listed");
});

test("required fields, server validation messages, checkboxes and radio groups", () => {
  const form = readForm(
    docOf(`
      <form id="f" method="post" action="/x">
        <div><label for="a">Họ tên</label><input id="a" name="Name" type="text" value="An" required>
          <span data-valmsg-for="Name">Vui lòng nhập họ tên</span></div>
        <div><label for="b">Email</label><input id="b" name="Mail" type="email" data-val-required="Bắt buộc">
          <span data-valmsg-for="Mail"></span></div>
        <div><label for="c">Đồng ý</label><input id="c" name="Agree" type="checkbox" checked></div>
        <div><span>Hình thức</span>
          <label><input type="radio" name="Mode" value="a" checked> Trực tiếp</label>
          <label><input type="radio" name="Mode" value="b"> Trực tuyến</label></div>
        <input type="hidden" name="__RequestVerificationToken" value="secret">
        <button type="submit">Gửi đơn</button>
      </form>`),
    "#f"
  );

  const byName = Object.fromEntries(form.fields.map((f) => [f.name, f]));
  assert.strictEqual(byName.Name.required, true);
  assert.strictEqual(byName.Name.error, "Vui lòng nhập họ tên");
  assert.strictEqual(byName.Name.value, "An");
  assert.strictEqual(byName.Mail.required, true, "data-val-required counts");
  assert.strictEqual(byName.Mail.error, undefined, "an empty message is not an error");
  assert.strictEqual(byName.Mail.type, "email");
  assert.strictEqual(byName.Agree.type, "checkbox");
  assert.strictEqual(byName.Agree.value, "true");
  assert.strictEqual(byName.Mode.type, "radio");
  assert.deepStrictEqual(byName.Mode.options.map((o) => o.label), ["Trực tiếp", "Trực tuyến"]);
  assert.strictEqual(byName.Mode.value, "a");
  assert.strictEqual(form.fields.some((f) => f.name === "__RequestVerificationToken"), false, "hidden tokens are not listed");
  assert.strictEqual(form.submitLabel, "Gửi đơn");
});

test("a missing form gives null, and text that looks like HTML stays text", () => {
  assert.strictEqual(readForm(docOf("<p>no form</p>"), "#nope"), null);
  assert.strictEqual(readForm(null, "#f"), null);

  const form = readForm(
    docOf(`<form id="f"><label for="a">&lt;img src=x onerror=alert(1)&gt;</label><input id="a" name="A" type="text"><button type="submit">Lưu</button></form>`),
    "#f"
  );
  assert.strictEqual(form.fields[0].label, "<img src=x onerror=alert(1)>");
});
