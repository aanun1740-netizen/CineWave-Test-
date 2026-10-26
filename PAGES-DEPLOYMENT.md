# CineWave-Test-․ GitHub Pages-ի անվտանգ նախապատրաստում

Պահոց՝ `aanun1740-netizen/CineWave-Test-`, feature branch՝
`feature/phase-0-staging-safety`, PR՝ #1։ Այս աշխատանքը միայն նախապատրաստում է․
Pages workflow չի գործարկվել, merge/deployment կամ Supabase փոփոխություն չկա։

## Ինչ է ստուգվել

- Միակ Git remote-ը staging պահոցն է։ Վերջին main/feature ref-երը կարդացվել են
  միայն այս պահոցից։ Հեռավար main-ում Pages workflow կամ CNAME չի գտնվել։
- Գործող feature CI-ը ստուգում է staging-ը, Phase 0/React թեստերը, build-ը և Chrome
  browser թեստերը։ Վերջին GitHub ստուգումների կանաչ լինելը **չի հաստատվել**․
  `gh pr checks 1` և Actions runs API-ն այս միջավայրից վերադարձնում են `Forbidden`։
- Իրական Pages build source-ը, custom domain-ը և environment պաշտպանությունները
  **չեն հաստատվել**․ `GET /repos/aanun1740-netizen/CineWave-Test-/pages` վերադարձնում է
  `Forbidden`։ Repository settings-ը չի փոփոխվել։
- Vite-ի base-ը ամրագրված է `/CineWave-Test-/`։ Build-ը պահպանում է
  `dist/index.html` և `dist/admin/index.html`։ Movie/watch/account hash routes-ը
  GitHub Pages-ում server rewrite չի պահանջում։
- Backend-ը միայն `https://zayssiouqexwdicudalc.supabase.co` է։ Authentication-ի
  PKCE/per-tab storage-ը, profile/My List-ը և hy/ru/en լեզուները չեն փոփոխվել։

## Պատրաստված workflow

`.github/workflows/pages.yml`-ը ունի միայն `workflow_dispatch` իրադարձություն։
Push-ը, PR-ը կամ CI-ի ավարտը publication չեն գործարկում։ Feature branch-ին workflow-ի
push-ը չի գործարկում այս նոր workflow-ը։ Այն ունի հետևյալ ռեժիմները․

1. Լռելյայն `publish=false`՝ ստուգումներ, build և `dist` artifact-ի upload։
   `deploy` job-ը բաց է թողնվում։ Pages settings-ը չի կարդացվում կամ փոխվում այս ռեժիմում։
2. Ապագա, առանձին հաստատված հրապարակում՝ միայն այս պահոցում և `main` ref-ից,
   `publish=true`, `confirm_repository=aanun1740-netizen/CineWave-Test-` և
   `approved_sha`-ում տվյալ main կոմիտի ամբողջական SHA։ Անհամապատասխան մուտքը
   կանգնեցնում է job-ը մինչև build-ը։

Checkout-ը կապված է տվյալ run-ի `github.sha`-ին։ Build job-ն ունի միայն
`contents: read` իրավունք։ Հաջող Phase 0/React/build/Chrome թեստերից հետո միայն
`dist/`-ը փոխանցվում է `actions/upload-pages-artifact@v3`-ին։ Նույն run-ի artifact-ը
օգտագործում է `actions/deploy-pages@v4`-ը։ Միայն deploy job-ն ունի `pages: write` և
`id-token: write` իրավունքներ, այն կապված է `github-pages` environment-ին։

`actions/configure-pages@v5`-ը deploy job-ում ունի `enablement: false`․ workflow-ը
Pages-ը չի միացնում ինքնուրույն։ Publication-ները հաջորդական են,
`cancel-in-progress: false`։ Workflow-ում main-ի commit կամ push քայլ չկա։

GitHub-ը `workflow_dispatch`-ը Actions UI-ում հասանելի է դարձնում միայն այն ժամանակ,
երբ workflow-ը առկա է default branch-ում։ Քանի դեռ այս փոփոխությունը միայն feature
branch-ում է, manual workflow-ի հասանելիությունը **չի ենթադրվում**։ PR #1-ի merge-ը
պահանջում է առանձին հաստատում և այստեղ չի կատարվել։

## Լրացուցիչ artifact պաշտպանություն

`scripts/check-pages-build.cjs`-ը ներառված է `npm run build`-ում և ստուգում է․

- storefront/admin HTML-երի առկայությունը և հայերեն սկզբնական լեզուն,
- բոլոր compiled asset հղումների repository base-ը և իրական ֆայլերի առկայությունը,
- fallback SVG-ն և գործող approval JSON-ները,
- compiled JS/JSON/HTML/CSS-ում միայն staging Supabase հասցեն,
- անսպասելի `CNAME`-ի և symlink-ների բացակայությունը։

Առանձին regression թեստերը մերժում են սխալ base-ը, այլ Supabase նախագիծը,
բացակայող admin էջը և custom domain-ի պատահական ավելացումը։

## Նախքան որևէ հրապարակում՝ առանձին հաստատմամբ

- Վերականգնել GitHub API-ի հասանելիությունը և հաստատել PR #1-ի **վերջին SHA-ի**
  բոլոր պարտադիր CI ստուգումների հաջողությունը։ Տեղային անցած թեստերը GitHub CI-ի
  հաստատում չեն։
- Ստուգել հենց CineWave-Test- repository-ի Pages settings-ը։ Անհրաժեշտության դեպքում
  միայն հաստատումից հետո ընտրել Source = GitHub Actions։ Production պահոցը չբացել։
- Ստուգել `github-pages` environment-ը․ publication branch-ը պետք է սահմանափակված
  լինի `main`-ով և հնարավորության դեպքում ունենա required reviewer։ Այս պաշտպանությունները
  YAML հղումից ինքնուրույն չեն առաջանում և այս աշխատանքում չեն կարգավորվել։
- PR #1-ի merge-ի համար ստանալ առանձին հաստատում։ Merge-ը ինքնուրույն deployment
  չի գործարկում այս workflow-ով։ Հետո ստանալ կոնկրետ main SHA-ի publication հաստատում։
- Հաստատել site-ի իրական URL-ը՝ առանց custom domain ավելացնելու։ GitHub-ի սովորական
  սպասվող URL-ը `https://aanun1740-netizen.github.io/CineWave-Test-/` է, admin-ը՝
  նույն հասցեի `admin/` ուղով։ Իրական Pages URL-ն API-ով դեռ հաստատված չէ։
- Staging Supabase-ի գործող Auth redirect allowlist-ի համապատասխանությունը ստուգել
  սեփականատիրոջ հետ։ Registration/recovery callback-ը օգտագործում է site-ի base URL-ը։
  Այստեղ Supabase settings-ը չեն կարդացվել կամ փոփոխվել․ որևէ անհրաժեշտ փոփոխություն
  պահանջում է առանձին հաստատում։
- Միայն այդ քայլերից հետո լիազորված անձը կարող է ձեռքով dispatch անել publication-ը
  հաստատված SHA-ով և անցնել environment reviewer-ի հաստատումը, եթե այն կարգավորված է։

## Տեղային ստուգումներ

`npm test`՝ 15 Node/Phase 0/artifact և 17 React թեստ։ `npm run build`՝ Vite և
Pages artifact ստուգում։ `npm run test:e2e`՝ 12 Chrome desktop/mobile թեստ՝
առանց իրական Supabase կամ արտաքին մեդիա հարցումների։ YAML-ը և approval gate-ի վեց
դեպքերը փորձարկվել են տեղային՝ առանց GitHub job-ի գործարկման։

Workflow-ների syntax/expression ստուգումը `actionlint v1.7.7`-ով նույնպես անցել է։
