# CineWave-Test- — React + JavaScript + Vite

Գործող մուտքային էջերն են `index.html` և `admin/index.html`։ Երկուսն էլ աշխատում են
React-ով։ Հին controller-ները չեն բեռնվում էջերում․ դրանք պահված են համեմատության
և հետադարձ համատեղելիության համար։ Catalog-ի ու admin-ի ընդհանուր վավերացումները,
Phase 0-ի authentication/session շերտը և HTML5 player-ը վերաօգտագործվում են։

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Նախադիտում՝ `http://localhost:4173/CineWave-Test-/`, admin՝
`http://localhost:4173/CineWave-Test-/admin/`։ Զարգացման համար՝ `npm run dev`,
ապա `http://localhost:5173/CineWave-Test-/`։ GitHub Pages-ի base-ը ամրագրված է
`/CineWave-Test-/`․ movie/watch/account ուղիները hash-ով են և վերաբեռնման ժամանակ
սերվերային rewrite չեն պահանջում։ Build-ը ստեղծում է տեղային `dist/` և ոչինչ չի deploy անում։

Նոր այցելուի լռելյայն լեզուն հայերենն է։ Ռուսերենն ու անգլերենը հասանելի են,
իսկ նախկինում պահպանված լեզվի ընտրությունը հարգվում է։ Գործող մուգ responsive
ոճերը պահպանված են։ Guest My List-ը և Continue Watching-ը շարունակում են օգտագործել
նախկին localStorage բանալիները, authentication-ը՝ նախկին per-tab session storage-ը։

Browser թեստեր՝ build-ից հետո `npm run test:e2e`։ Տեղային և CI գործարկումները օգտագործում են
Playwright-ի `chrome` channel-ը՝ H.264 աջակցությամբ branded Google Chrome։ Նախ
գործարկեք `npx playwright install chrome`։ Եթե Chrome-ը տեղադրված է ոչ ստանդարտ
ուղով, օգտագործեք `PLAYWRIGHT_CHROME_EXECUTABLE_PATH` փոփոխականը։ Browser-ի
ընտրությունն այլևս ինքնաբերաբար չի փոխվում համակարգի Chromium-ի առկայությունից։ Թեստերը բոլոր արտաքին հարցումները փոխարինում կամ
արգելափակում են և չեն միանում իրական Supabase-ին։ MP4/WebM/HLS fixture-ները
տեղային սինթետիկ տեսանյութեր են․ վերստեղծման հրահանգները՝ `e2e/fixtures/README.md`։

Phase 2-ի փոփոխությունների, ստուգումների և սահմանափակումների ամբողջական հաշվետվությունը՝
[PHASE-2.md](PHASE-2.md)։ Տվյալների բազայի գործողությունները, deployment-ը և merge-ը
պահանջում են առանձին հաստատում։

## Նախկին bundle-ների լիցենզիաներ

`hls.light.min.js` is the unmodified light browser bundle from npm `hls.js@1.7.3`, installed with npm artifact-integrity verification. Its Apache-2.0 license is in `HLS-LICENSE.txt` (including the project's third-party notice). The light bundle provides HLS/MSE playback; alternate audio tracks and subtitles are not included. No runtime CDN request is required. Native HLS is preferred when the browser supports it. The package's upstream repository is https://github.com/video-dev/hls.js.

Full Apache-2.0 terms are included in `Apache-2.0.txt` (SPDX license-list-data source: https://raw.githubusercontent.com/spdx/license-list-data/main/text/Apache-2.0.txt).

Package integrity: `sha512-MsPlx6yVW4Qv4C7mEVou4/gk/5cN2dVxOTnrNjPSmyH2f0Ln+/UkG10Ax1PE6OvrmTVPKgQYozTtBaPOuCzq7A==`.

Bundle SHA-256: `0251332c00a216a35d7d6919044d60da82b78beb3bd50ac6c662ae74a2f5474b`.


Admin Auth SDK: unmodified UMD bundle from `@supabase/supabase-js@2.118.0`, MIT. Bundled package notices are in `supabase-licenses/`. Installed with npm artifact-integrity verification, with scripts disabled.

SDK bundle SHA-256: `ee3be8de192b97cb1d73d1e95d6b82bb1f6b658c0f97c4ef757fc331996ed3d3`. Package integrity: `sha512-FxI8UXMVC2UG7IkeiI8fuQZqq2oI3JeSuN8MPIC2RLVaoEAxKS0nqE6kii9Ewpq8f9gNPM6git1Y8f0vN/QLFw==`.

The SDK and notices retain their original bytes, including significant template-string whitespace and license CRLF endings. Narrow `.gitattributes` entries exempt these copied artifacts from Git whitespace linting; package-integrity and recorded SHA-256 verification remain intact.

## Phase 0․ staging-ի անվտանգություն և թեստեր

Այս checkout-ը նախատեսված է միայն `aanun1740-netizen/CineWave-Test-` պահոցի և
`https://zayssiouqexwdicudalc.supabase.co` staging նախագծի համար։

Phase 0-ի սկզբնական թեստերը արտաքին կախվածություններ չունեն։ Միգրացիայից հետո
ամբողջ հավելվածի համար պահանջվում է Node.js 22.12+ և npm։
Պահոցի արմատից գործարկեք՝

```sh
npm ci --ignore-scripts
npm test
```

`npm run check:staging`-ը ստուգում է բոլոր Git remote-ների fetch/push հասցեները,
Supabase կարգավորումը, publishable բանալու տեսակը, աղբյուրներում այլ Supabase
նախագծերի և արտոնյալ բանալիների բացակայությունը, էջերի script-երի առկայությունն ու
`config.js`-ի միակի բեռնումը authentication-ից առաջ։ Ստուգումը պետք է գործարկել
պահոցի սկզբնական՝ `CineWave-Test-` անունով պանակում։ Նույն թեստերը սահմանված են
GitHub Actions-ում՝ push և pull request իրադարձությունների համար, առանց deployment-ի։

Runtime ստուգումը մերժում է staging origin-ից տարբերվող backend հասցեները մինչև
SDK-ի ստեղծումը։ SDK-ի, կատալոգի և AI-ի backend fetch հարցումներն անցնում են staging
ստուգմամբ և չեն հետևում HTTP redirect-ներին։ Սովորական մեդիա URL-ները չեն սահմանափակվում
այս backend ստուգմամբ։ Սա պատահական սխալ կարգավորումների պաշտպանություն է․
սերվերային թույլտվությունները շարունակում է կառավարել Supabase-ը։

Թեստերը գործարկում են իրական catalog, authentication, admin model և playback
օգնականների կոդը մեկուսացված JavaScript միջավայրում։ Authentication SDK-ն ու storage-ը
փոխարինվում են տեղային կեղծ իրականացումներով։ Սխալ staging հասցեների, արտոնյալ
բանալիների, session-ի մաքրման, նկարների fallback-ի, բազմալեզու metadata-ի,
admin մուտքային տվյալների, playback ապացույցների և առաջընթացի դեպքերը ստուգվում են
առանց ցանցի կամ տվյալների բազայի հասանելիության։

Սահմանափակումներ․ այս փուլը չի ստուգում իրական օգտատիրոջ մուտքը, RLS-ը, admin CRUD-ը,
դիտարկիչի տեսքը կամ MP4/HLS decoding-ը։ Phase 2-ի նոր browser թեստերը լրացնում են
տեսքի և MP4/WebM/HLS decoding-ի ծածկույթը։ Տվյալների բազայի, schema-ի, RLS-ի,
իրական տվյալների փոփոխությունների և deployment-ի ցանկացած գործողությունից առաջ
պահանջվում է առանձին հաստատում։ React + Vite միգրացիան իրականացվել է Phase 0-ի հաստատումից հետո։

CI media decoding-ի ուղղման հետաքննությունը՝ [CI-MEDIA-FIX.md](CI-MEDIA-FIX.md)։

GitHub Pages workflow-ի անվտանգ նախապատրաստումն ու առանձին հաստատման քայլերը՝
[PAGES-DEPLOYMENT.md](PAGES-DEPLOYMENT.md)։ Workflow-ը լռելյայն միայն build է պատրաստում
և push/PR իրադարձությամբ ոչինչ չի հրապարակում։
