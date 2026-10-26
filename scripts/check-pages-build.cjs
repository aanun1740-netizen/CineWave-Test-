const assert = require("node:assert/strict");
const { readFileSync, existsSync, readdirSync, lstatSync } = require("node:fs");
const path = require("node:path");
function verifyPagesBuild(root = path.resolve(__dirname, "..", "dist")) {
  const base = "/CineWave-Test-/";
  assert.ok(
    !existsSync(path.join(root, "CNAME")),
    "Unexpected custom domain in Pages artifact",
  );
  for (const page of ["index.html", "admin/index.html"]) {
    const html = readFileSync(path.join(root, page), "utf8");
    assert.match(
      html,
      /<html lang="hy">/,
      `${page}: Armenian default must be preserved`,
    );
    const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(
      (match) => match[1],
    );
    assert.ok(assets.length > 0, `${page}: compiled assets are missing`);
    for (const asset of assets) {
      assert.ok(
        asset.startsWith(base),
        `${page}: asset outside staging Pages base: ${asset}`,
      );
      assert.ok(
        existsSync(path.join(root, asset.slice(base.length))),
        `${page}: missing asset ${asset}`,
      );
    }
  }
  for (const asset of [
    "assets/poster-fallback.svg",
    "data/playback-films.json",
    "data/genre-backfill.json",
  ]) {
    assert.ok(
      existsSync(path.join(root, asset)),
      `Missing runtime asset ${asset}`,
    );
  }
  let stagingFound = false;
  function inspect(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      assert.ok(
        !lstatSync(file).isSymbolicLink(),
        "Symlinks are not permitted in the Pages artifact",
      );
      if (entry.isDirectory()) {
        inspect(file);
        continue;
      }
      if (!/\.(js|json|html|css)$/.test(entry.name)) continue;
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(
        /\b[a-z0-9-]+\.supabase\.(?:co|in)\b/gi,
      )) {
        assert.equal(
          match[0],
          "zayssiouqexwdicudalc.supabase.co",
          `Foreign Supabase project in ${file}`,
        );
        stagingFound = true;
      }
    }
  }
  inspect(root);
  assert.ok(stagingFound, "Compiled staging Supabase configuration is missing");
  console.log(
    "Pages artifact verified: staging backend, base path, Armenian and admin entries, runtime assets.",
  );
}
module.exports = { verifyPagesBuild };
if (require.main === module) {
  try {
    verifyPagesBuild();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
