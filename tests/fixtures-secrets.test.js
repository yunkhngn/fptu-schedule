const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

// Pages saved from FAP carry the site's own client-side keys. They are not ours, but they must not be
// committed: GitHub secret scanning flags them and they are noise in a public repository.
const SECRET_PATTERNS = [
  { name: "Google API key", regex: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "private key block", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ }
];

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

test("no committed fixture contains a Google API key or a private key", () => {
  const root = path.join(__dirname, "fixtures");
  const offenders = [];
  for (const file of listFiles(root)) {
    const text = fs.readFileSync(file, "utf8");
    for (const { name, regex } of SECRET_PATTERNS) {
      if (regex.test(text)) offenders.push(`${path.relative(__dirname, file)} (${name})`);
    }
  }
  assert.deepStrictEqual(offenders, [], "redact these values before committing fixtures");
});
