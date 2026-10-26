const test = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { verifyPagesBuild } = require("../scripts/check-pages-build.cjs");
function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "cinewave-test-pages-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of ["assets", "admin", "data"])
    mkdirSync(path.join(root, name));
  const html =
    '<html lang="hy"><script src="/CineWave-Test-/assets/app.js"></script></html>';
  for (const page of ["index.html", "admin/index.html"])
    writeFileSync(path.join(root, page), html);
  writeFileSync(
    path.join(root, "assets/app.js"),
    'const backend="https://zayssiouqexwdicudalc.supabase.co";',
  );
  for (const name of [
    "assets/poster-fallback.svg",
    "data/playback-films.json",
    "data/genre-backfill.json",
  ])
    writeFileSync(path.join(root, name), "fixture");
  return root;
}
test("Pages artifact accepts the staging base, backend and admin entry", (t) => {
  assert.doesNotThrow(() => verifyPagesBuild(fixture(t)));
});
test("Pages artifact rejects root-relative assets outside its repository base", (t) => {
  const root = fixture(t);
  writeFileSync(
    path.join(root, "admin/index.html"),
    '<html lang="hy"><script src="/assets/app.js"></script></html>',
  );
  assert.throws(() => verifyPagesBuild(root), /outside staging Pages base/);
});
test("Pages artifact rejects a foreign Supabase endpoint even in a compiled chunk", (t) => {
  const root = fixture(t);
  writeFileSync(
    path.join(root, "assets/app.js"),
    "https://" + "foreignproject" + ".supabase" + ".co",
  );
  assert.throws(() => verifyPagesBuild(root), /Foreign Supabase project/);
});
test("Pages artifact rejects accidental custom-domain configuration", (t) => {
  const root = fixture(t);
  writeFileSync(path.join(root, "CNAME"), "example.invalid");
  assert.throws(() => verifyPagesBuild(root), /Unexpected custom domain/);
});
test("Pages artifact requires the built admin route", (t) => {
  const root = fixture(t);
  rmSync(path.join(root, "admin/index.html"));
  assert.throws(() => verifyPagesBuild(root), /ENOENT/);
});
