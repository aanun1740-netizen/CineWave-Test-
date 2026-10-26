# Phase 2 — React + JavaScript + Vite միգրացիա

Աշխատանքը շարունակվել է `feature/phase-0-staging-safety` branch-ում՝ միայն
`aanun1740-netizen/CineWave-Test-` checkout-ում։ Միակ Supabase backend-ը
`https://zayssiouqexwdicudalc.supabase.co` staging նախագիծն է։ Production պահոցին
կամ նախագծին հասանելիություն չի կատարվել։ Տվյալների, աղյուսակների և RLS-ի
փոփոխություններ, deployment, push կամ merge չեն կատարվել։

## Փոփոխված և ավելացված ֆայլերը

- `index.html`, `admin/index.html` — առանձին React մուտքային էջեր։
- `src/main.jsx`, `src/admin-main.jsx`, `src/App.jsx`, `src/Admin.jsx` — storefront-ի
  և admin-ի React rendering, state, իրադարձություններ և lifecycle։ Admin-ում պահպանված են
  դերերի ստուգումը և պարբերական վերահաստատումը, էջավոր catalog բեռնումը, վիճակագրությունը,
  որոնումը, publication/rights զտիչները, երեք լեզվով խմբագրումը, draft պահպանումը,
  optimistic concurrency-ը `updated_at`-ով, publication/delete հաստատումները,
  իրավունքների review-ը, նկարների upload-ը և մեդիայի preview-ը։
- `src/components/Accounts.jsx`, `src/hooks/useAccount.js` — մուտք, գրանցում,
  պրոֆիլ, գաղտնաբառի վերականգնում/փոփոխում, local logout, guest և account My List,
  guest ցանկի ներմուծում։ Account գործողությունները օգտագործում են գործող profiles,
  user_watchlist և Auth API-ները․ նոր schema կամ privilege չի ավելացվել։
- `src/components/AI.jsx`, `Icons.jsx`, `MovieRow.jsx`, `MovieDialog.jsx`, `Player.jsx` —
  AI զրույցը, նույն պատկերակներն ու brand-ը, ֆիլմերի շարքերը, մանրամասները և player-ը։
  React-ը կառավարում է player-ի ստեղծումն ու մաքրումը։ Պահպանված են focus trap-ը,
  Escape-ը, ստեղնաշարի կառավարումը, mute/volume/fullscreen-ը և իրական quality renditions-ը։
- `src/domain.js`, `src/hooks/useLanguage.js`, `src/translations.js`,
  `src/account-translations.js`, `src/admin-translations.js` — կատալոգի ընդհանուր
  մոդել, որոնում/ժանրեր/ուղիներ և երեք լեզուների տեքստեր։ Նոր այցելուի լեզուն հայերենն է,
  իսկ սարքում նախկինում պահպանված ռուսերենը կամ անգլերենը պահպանվում է։
- `src/services/backend.js`, `auth-client.js` — npm Supabase SDK-ի միացում նույն
  Phase 0 staging transport-ին, PKCE-ին և per-tab session storage-ին։
- `availability.js`, `model.js`, `admin/model.js` — WebM-ի թույլատրելիություն՝ նույն
  HTTPS/իրավունքների ապացույցների կանոններով։ `catalog.js`-ում ավելացվել է ընդհանուր
  API՝ գործող փոխակերպումները վերաօգտագործելու համար։
- `player.js` — դիրքի պահպանում նաև seek-ի ավարտին։ MP4, WebM և HLS decoding-ը
  աշխատում է browser-ի և HLS.js-ի հնարավորությունների սահմաններում։
- `admin/admin.css` — միայն React-ի արտաքին editor fieldset-ի չեզոքացում։
  `storefront.css`, `accounts.css` և `player.css` դիզայնները պահպանված են։
- `vite.config.js`, `package.json`, `package-lock.json`, `.gitignore` — Vite,
  ամրագրված npm տարբերակներ, `/CineWave-Test-/` base, երկու build entry,
  առանձին dependency chunks և տեղային build/test արտեֆակտների անտեսում։
  Admin-ի production CSP-ն պահպանվում է Vite build-ում։
- `public/assets/poster-fallback.svg`, `public/data/*.json`, `public/licenses/**` —
  Pages-ի ճիշտ ուղիներով fallback-ը, գործող approval JSON-ները և լիցենզիաները։
- `scripts/check-staging.cjs` — Phase 0 ստուգումները հարմարեցված են React entry-ներին․
  պահպանված են Git remote-ների, staging URL-ի, բանալու տեսակի, այլ Supabase
  հասցեների ու արտոնյալ բանալիների ստուգումները։ Ավելացված են JSX-ի սկանավորում,
  base path-ի և configuration-ի միակի ներմուծման ստուգումներ։
- `src/App.test.jsx`, `src/domain.test.js`, `src/hooks/useAccount.test.jsx`,
  `src/test-setup.js` — React/domain/session/watchlist թեստեր։
- `playwright.config.js`, `e2e/migration.spec.js`, `e2e/fixtures/*` — Chromium
  desktop/mobile թեստեր և տեղային, առանց ձայնի սինթետիկ մեդիա։
- `.github/workflows/phase-0.yml` — install, Phase 0/React թեստեր, build և browser
  ստուգումներ՝ առանց deployment քայլի։ `README.md` — գործարկման հրահանգներ։

`.gitattributes`-ում նեղ բացառությամբ պահպանված են պատճենված tslib լիցենզիայի
CRLF բնօրինակ բայթերը։

Phase 0-ի `config.js`, `assets/poster-fallback.svg` և `tests/phase-0.test.cjs`
պաշտպանությունները պահպանված են։ Նախկին `app.js`, `ai.js`, `accounts.js`,
`routes.js`, `admin/admin.js`, `admin/i18n.js` controller-ները չեն բեռնվում նոր էջերում։
Դրանք պահված են համեմատության համար։ Նոր runtime-ը օգտագործում է `src/` բաղադրիչները։

## Վերջնական ստուգումներ

| Ստուգում | Արդյունք |
| --- | --- |
| `npm ci --ignore-scripts --offline`՝ առկա npm cache-ից | հաջող, lockfile-ը կրկնելի է |
| `npm run check:staging` | հաջող |
| `npm run test:phase0` | 10/10 անցած |
| `npm run test:react` | 17/17 անցած |
| `npm run build` | հաջող, երկու մուտքային էջերը՝ `dist/`-ում |
| `npm run test:e2e` | 10/10 անցած՝ desktop/mobile Chromium |
| `git diff --check` | հաջող |

Browser թեստերը ստուգում են Pages prefix-ը, Armenian default-ը, երեք լեզուները,
բազմալեզու որոնումը, guest My List-ը, hash route reload-ը, fallback-ի բեռնումը,
հորիզոնական overflow-ի բացակայությունը և admin-ի մուտքային էջը։ Սինթետիկ
MP4/WebM/HLS ֆայլերով ստուգվում են իրական decoding-ը, play-ը, seek-ը, դիտման դիրքի
պահպանումն ու reload-ից հետո վերականգնումը և Continue Watching-ը։ React թեստերը նաև
ստուգում են դեր չունեցող admin-ի մերժումը, հաստատման dialog-ը և account ցանկի
user-scoped հարցումները՝ կեղծ SDK-ով։ Բոլոր արտաքին browser հարցումները տեղային են
փոխարինվում կամ արգելափակվում․ իրական Supabase հարցումներ չեն կատարվում։

## Սահմանափակումներ և չստուգված մասեր

- Իրական staging հաշիվներով մուտքը, email հաստատումը, recovery նամակները,
  պրոֆիլի/հաշվի ցանկի պահպանումը, admin CRUD/upload/rights/publication գործողությունները
  և գործող RLS-ը չեն ստուգվել։ Թեստերում օգտագործվել են կեղծ պատասխաններ։
- WebM-ի frontend վավերացումն ու decoding-ը ստուգված են․ գործող սերվերային
  վավերացումների հետ WebM պահպանումը դեռ չի ստուգվել։ Եթե անհրաժեշտ լինի schema/RLS
  փոփոխություն, աշխատանքը պետք է կանգնեցնել և առանձին հաստատում ստանալ։
- Mobile ստուգումը Chromium-ի փոքր viewport է․ իրական iOS/Safari/native HLS-ը,
  Firefox-ը, DRM-ը և բազմազան codec-ները չեն փորձարկվել։ HLS light bundle-ի
  այլընտրանքային ձայնագծերի/ենթագրերի նախկին սահմանափակումը պահպանված է։
- Responsiveness-ը և հիմնական տեսքը ստուգված են fixture-ներով։ Իրական կատալոգի բոլոր
  նկարներով pixel-by-pixel համեմատություն չի կատարվել։
- GitHub Actions-ը սահմանված է, բայց GitHub-ում չի գործարկվել։ Build-ը տեղային է։

## Նախադիտում

Պահոցի արմատից՝ Node.js 22.12+ միջավայրում․

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Բացեք `http://localhost:4173/CineWave-Test-/` և
`http://localhost:4173/CineWave-Test-/admin/`։ Զարգացման ռեժիմ՝ `npm run dev`,
`http://localhost:5173/CineWave-Test-/`։ Browser թեստերը՝ `npm run test:e2e`։
Թեստային screenshots-ը պահպանվում են անտեսվող `test-results/` պանակում։

Ձեռքով preview-ն օգտագործում է staging ինտեգրացիան։ Agent-ի կողմից իրական տվյալների
գործողությունները, deployment-ը կամ merge-ը սպասում են ձեր առանձին հաստատմանը։
