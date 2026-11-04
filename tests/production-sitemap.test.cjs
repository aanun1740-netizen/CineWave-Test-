const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildSitemap, validateSite } = require("../scripts/generate-production-sitemap.cjs");
function fixture(t, noindex = false) {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), "kinolab-seo-"));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(root,"index.html"),noindex ? '<meta name="robots" content="noindex">' : "<html></html>");
 for(const lang of ["hy","ru","en"]){
   const dir = path.join(root,"films",lang,"external-1");
   fs.mkdirSync(dir,{recursive:true});
   fs.writeFileSync(path.join(dir,"index.html"),noindex ? '<meta name="robots" content="noindex">' : "<html></html>");
 }
 return root;
}
test("sitemap supports three languages", t=>{
 const result=buildSitemap(fixture(t),"https://movies.example.com/");
 for(const lang of ["hy","ru","en"]){
  assert.ok(result.includes("films/"+lang+"/external-1/"));
  assert.ok(result.includes('hreflang="'+lang+'"'));
 }
 assert.equal(result.split("<url>").length-1,4);
});
test("staging is not a valid production domain",()=>{
 assert.throws(()=>validateSite("https://github.io/"),/Staging/);
 assert.throws(()=>validateSite("http://movies.example.com/"),/HTTPS/);
});
test("noindex documents cannot enter sitemap",t=>{
 assert.throws(()=>buildSitemap(fixture(t,true),"https://movies.example.com/"),/noindex/);
});
