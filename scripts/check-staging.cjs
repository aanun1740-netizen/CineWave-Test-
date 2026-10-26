const assert = require("node:assert/strict");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const run = promisify(execFile);
const { readFileSync, readdirSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const git = async (...args) =>
  (await run("git", args, { cwd: root, encoding: "utf8" })).stdout.trim();
function validateRemote(url) {
  assert.match(
    url,
    /^(?:https:\/\/github\.com\/|git@github\.com:)aanun1740-netizen\/CineWave-Test-(?:\.git)?$/,
    "Non-staging Git remote",
  );
}
function validateSource(source, file) {
  for (const match of source.matchAll(
    /\b([a-z0-9-]+)\.supabase\.(co|in)\b/gi,
  )) {
    assert.equal(
      match[0],
      "zayssiouqexwdicudalc.supabase.co",
      `Forbidden backend in ${file}`,
    );
  }
  assert.ok(
    !new RegExp("sb_" + "secret_|service" + "_role", "i").test(source),
    `Privileged credential reference in ${file}`,
  );
}
async function main() {
  assert.equal(
    path.basename(root),
    "CineWave-Test-",
    "Wrong checkout directory",
  );
  const remotes = (await git("remote")).split("\n").filter(Boolean);
  assert.ok(remotes.includes("origin"), "Staging origin is required");
  for (const remote of remotes) {
    for (const direction of [[], ["--push"]]) {
      for (const url of (
        await git("remote", "get-url", "--all", ...direction, remote)
      ).split("\n")) {
        validateRemote(url);
      }
    }
  }
  const context = { window: {}, URL };
  vm.runInNewContext(
    readFileSync(path.join(root, "config.js"), "utf8"),
    context,
  );
  assert.equal(
    context.window.CINEWAVE_CONFIG.url,
    "https://zayssiouqexwdicudalc.supabase.co",
  );
  assert.match(context.window.CINEWAVE_CONFIG.key, /^sb_publishable_/);
  function scan(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (
        [
          ".git",
          "node_modules",
          "vendor",
          "dist",
          "test-results",
          "playwright-report",
        ].includes(item.name) ||
        item.name.endsWith(".min.js")
      )
        continue;
      const file = path.join(dir, item.name);
      if (item.isDirectory()) {
        scan(file);
        continue;
      }
      if (
        !/\.(js|jsx|mjs|cjs|json|html|md|ya?ml|env|txt)$/.test(item.name) &&
        !item.name.startsWith(".env")
      )
        continue;
      const source = readFileSync(file, "utf8");
      validateSource(source, path.relative(root, file));
    }
  }
  scan(root);
  for (const [page, entry] of [
    ["index.html", "/src/main.jsx"],
    ["admin/index.html", "/src/admin-main.jsx"],
  ]) {
    const source = readFileSync(path.join(root, page), "utf8");
    const scripts = [...source.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(
      (match) => match[1],
    );
    assert.deepEqual(
      scripts,
      [entry],
      `${page}: one React module entry; no duplicate configuration`,
    );
    assert.match(source, /type="module"/);
    const entrySource = readFileSync(path.join(root, entry.slice(1)), "utf8");
    assert.match(entrySource, /import ['"]\.\/services\/backend['"]/);
  }
  const backend = readFileSync(
    path.join(root, "src/services/backend.js"),
    "utf8",
  );
  assert.equal(
    (backend.match(/import ['"]\.\.\/\.\.\/config\.js['"]/g) || []).length,
    1,
    "Load shared configuration once",
  );
  assert.ok(
    backend.search(/import ['"]\.\.\/\.\.\/config\.js['"]/) <
      backend.search(/import ['"]\.\.\/\.\.\/auth-client\.js['"]/),
    "Validate configuration before Auth",
  );
  const auth = readFileSync(path.join(root, "auth-client.js"), "utf8");
  assert.ok(
    auth.indexOf("assertURL(config.url)") <
      auth.indexOf("createClient(config.url"),
    "Guard SDK initialization",
  );
  assert.match(auth, /global:\{fetch:window\.CineWaveStaging\.fetch/);
  assert.equal(
    readFileSync(path.join(root, "assets/poster-fallback.svg"), "utf8"),
    readFileSync(path.join(root, "public/assets/poster-fallback.svg"), "utf8"),
  );
  const vite = readFileSync(path.join(root, "vite.config.js"), "utf8");
  assert.match(vite, /base: ['"]\/CineWave-Test-\/['"]/);
  console.log(
    "Staging repository, backend, public key and page wiring checks passed.",
  );
}
module.exports = { validateRemote, validateSource };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
