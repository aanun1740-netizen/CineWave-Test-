// Staging-only build-time HTML snapshots for publicly listed external-link films.
// This does NOT change KinoLab's existing hash routes or deployment permissions.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "dist", "films");
const context = { window: {}, URL };
vm.runInNewContext(fs.readFileSync(path.join(root, "config.js"), "utf8"), context);
const cfg = context.window.CINEWAVE_CONFIG;
const expected = "https://zayssiouqexwdicudalc.supabase.co";
if (cfg.url !== expected || !/^sb_publishable_/.test(cfg.key)) {
  throw new Error("Only the staging Supabase publishable configuration is allowed");
}
const base = "https://aanun1740-netizen.github.io/CineWave-Test-/";
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));
function documentHtml(title, description, contents) {
  return `<!doctype html>
<html lang="hy"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="googlebot" content="noindex,nofollow,noarchive">
<title>${escapeHtml(title)} — KinoLab</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="KinoLab">
<meta property="og:title" content="${escapeHtml(title)} — KinoLab">
<meta property="og:description" content="${escapeHtml(description)}">
<style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;background:#20152e;color:#f7f5f0;font:16px/1.6 system-ui,-apple-system,sans-serif}
header,main,footer{max-width:960px;margin:auto;padding:20px}
header a{color:#d4f458;font-size:28px;font-weight:800;text-decoration:none}
h1{font-size:clamp(28px,5vw,44px);line-height:1.15;margin:12px 0}
p{max-width:70ch}a{color:#d4f458}ul{padding-left:24px}
.poster{width:min(250px,100%);max-height:380px;object-fit:contain;border-radius:10px;float:right;margin:0 0 20px 25px}
.details{min-height:260px}.back{display:inline-block;margin-top:20px}
@media(max-width:600px){.poster{float:none;width:160px;display:block;margin:12px 0}}
</style></head><body><header><a href="${base}">KinoLab</a></header>
<main>${contents}</main><footer><a href="${base}">KinoLab գլխավոր էջ</a></footer></body></html>`;
}
async function main() {
  fs.mkdirSync(out, { recursive: true });
  const params = "select=id,title_en,title_hy,title_ru,overview_en,overview_hy,overview_ru,release_date,poster_path,genre_names&is_published=eq.true&order=id.asc&limit=500";
  let rows = [];
  try {
    const response = await fetch(`${expected}/rest/v1/kinolab_external_catalog?${params}`, {
      headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
      redirect: "error",
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) throw new Error(`Public catalog returned HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid catalog response");
    rows = data;
  } catch (error) {
    // The primary React catalog must still build even if a public API is unreachable.
    console.warn("Film page snapshots unavailable:", error.message);
  }
  const indexItems = [];
  for (const row of rows) {
    if (!Number.isSafeInteger(Number(row.id)) || Number(row.id) < 1) continue;
    const title = row.title_hy || row.title_en || row.title_ru;
    if (!title) continue;
    const page = "external-" + String(row.id);
    const date = typeof row.release_date === "string" && row.release_date.length === 10 && !Number.isNaN(Date.parse(row.release_date)) ? row.release_date : "";
    const description = row.overview_hy || row.overview_en || row.overview_ru || "Ֆիլմի տեղեկությունները KinoLab-ում։";
    const genres = Array.isArray(row.genre_names) ? row.genre_names.filter(x => typeof x === "string").slice(0,10) : [];
    const poster = typeof row.poster_path === "string" && row.poster_path.startsWith("https://") && !/[<>"\u0027]/.test(row.poster_path) ? row.poster_path : null;
    const appRoute = base + "#/movie/" + encodeURIComponent("catalog:external:" + String(row.id));
    const body = `<article class="details">${poster ? `<img class="poster" loading="lazy" src="${escapeHtml(poster)}" alt="">` : ""}
<h1>${escapeHtml(title)}</h1>
${date ? `<p><strong>Թողարկման ամսաթիվ՝</strong> ${escapeHtml(date)}</p>` : ""}
${genres.length ? `<p><strong>Ժանրեր՝</strong> ${escapeHtml(genres.join(", "))}</p>` : ""}
<p>${escapeHtml(description)}</p>
<a class="back" href="${escapeHtml(appRoute)}">Բացել ֆիլմը KinoLab-ում</a>
</article>`;
    const dir = path.join(out, page);
    fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir, "index.html"), documentHtml(title, description, body));
    indexItems.push(`<li><a href="${base}films/${page}/">${escapeHtml(title)}</a></li>`);
    for (const language of ["hy", "ru", "en"]) {
      const titleLocalized = row["title_" + language] || title;
      const descriptionLocalized = row["overview_" + language] || description;
      const labels = {
        hy: {date:"Թողարկման ամսաթիվ",genres:"Ժանրեր",open:"Բացել ֆիլմը KinoLab-ում"},
        ru: {date:"Дата выхода",genres:"Жанры",open:"Открыть фильм в KinoLab"},
        en: {date:"Release date",genres:"Genres",open:"Open movie in KinoLab"}
      }[language];
      const languages = ["hy", "ru", "en"].map(lang =>
        `<a href="${base}films/${lang}/${page}/">${lang.toUpperCase()}</a>`).join(" · ");
      const bodyLocalized = `<nav aria-label="Languages">${languages}</nav><article class="details">
${poster ? `<img class="poster" loading="lazy" src="${escapeHtml(poster)}" alt="">` : ""}
<h1>${escapeHtml(titleLocalized)}</h1>
${date ? `<p><strong>${labels.date}:</strong> ${escapeHtml(date)}</p>` : ""}
${genres.length ? `<p><strong>${labels.genres}:</strong> ${escapeHtml(genres.join(", "))}</p>` : ""}
<p>${escapeHtml(descriptionLocalized)}</p>
<a class="back" href="${escapeHtml(appRoute)}">${labels.open}</a></article>`;
      const languageDir = path.join(out, language, page);
      fs.mkdirSync(languageDir, {recursive:true});
      fs.writeFileSync(path.join(languageDir, "index.html"),
        documentHtml(titleLocalized, descriptionLocalized, bodyLocalized).replace('<html lang="hy">', `<html lang="${language}">`));
    }
  }
  const contents = `<h1>Ֆիլմերի էջեր</h1><p>KinoLab-ի հրապարակված ֆիլմերի առանձին HTML էջերի փորձնական ցուցակ։</p>
<ul>${indexItems.join("\n")}</ul>`;
  fs.writeFileSync(path.join(out, "index.html"), documentHtml("Ֆիլմերի էջեր", "KinoLab-ի ֆիլմերի փորձնական էջերի ցուցակ։", contents));
  console.log(`Generated ${indexItems.length} staging film HTML snapshots (noindex).`);
}
main().catch(err => { console.error(err); process.exitCode=1; });
