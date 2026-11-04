// Production-only sitemap generator. Not wired into the staging build.
// Invoke explicitly after launch approval, with a verified live HTTPS domain.
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function xml(value) {
  return String(value).replace(/[&<>"\x27]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "\x27":"&apos;" })[ch]);
}
function validateSite(site) {
  const url = new URL(site);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash)
    throw Error("Verified HTTPS production URL required");
  if (url.hostname === "github.io" || url.hostname.endsWith(".github.io") || url.hostname === "localhost" || url.hostname.endsWith(".invalid"))
    throw Error("Staging and placeholder domains cannot produce a public sitemap");
  if (url.pathname !== "/") throw Error("Use the production domain root, ending with /");
  return url;
}
function buildSitemap(root, site) {
  const url = validateSite(site);
  const home = path.join(root, "index.html");
  if (!fs.existsSync(home)) throw Error("Missing production homepage");
  const index = fs.readFileSync(home, "utf8");
  if (/name=["\x27]robots["\x27][^>]*noindex|noindex[^>]*name=["\x27]robots["\x27]/i.test(index))
    throw Error("Production homepage is still noindex");
  const records = [new URL("/", url).href];
  const filmDir = path.join(root, "films");
  const links = new Map();
  for (const language of ["hy", "ru", "en"]) {
    const langDir = path.join(filmDir, language);
    if (!fs.existsSync(langDir)) continue;
    for (const entry of fs.readdirSync(langDir, { withFileTypes:true })) {
      if (!entry.isDirectory() || !/^external-[1-9]\d*$/.test(entry.name)) continue;
      const html = path.join(langDir, entry.name, "index.html");
      if (!fs.existsSync(html)) continue;
      const content = fs.readFileSync(html, "utf8");
      if (/name=["\x27]robots["\x27][^>]*noindex|noindex[^>]*name=["\x27]robots["\x27]/i.test(content))
        throw Error("Film HTML remains noindex: " + html);
      const href = new URL("films/" + language + "/" + entry.name + "/", url).href;
      records.push(href);
      if (!links.has(entry.name)) links.set(entry.name, new Map());
      links.get(entry.name).set(language, href);
    }
  }
  if (records.length > 50000) throw Error("Sitemap exceeds Google maximum of 50000 URLs");
  const entries = records.map(href => {
    const match = href.match(/\/films\/(hy|ru|en)\/(external-[1-9]\d*)\/$/);
    const translations = match ? links.get(match[2]) : null;
    const alternates = translations && translations.size === 3
      ? [...translations].map(([lang, link]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${xml(link)}"/>`).join("")
      : "";
    return `  <url><loc>${xml(href)}</loc>${alternates}</url>`;
  });
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`;
  if (Buffer.byteLength(sitemap, "utf8") > 50 * 1024 * 1024) throw Error("Sitemap exceeds 50MB limit");
  return sitemap;
}
if (require.main === module) {
  const [site, root = path.resolve(__dirname, "..", "dist")] = process.argv.slice(2);
  if (!site) { console.error("Usage: node scripts/generate-production-sitemap.cjs https://your-real-domain.example/ [built-site-directory]"); process.exit(1); }
  try {
    const sitemap = buildSitemap(root, site);
    fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
    console.log("Production sitemap generated after explicit domain selection");
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { buildSitemap, validateSite };
