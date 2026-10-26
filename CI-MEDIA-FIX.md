# CI-ի MP4/HLS decoding-ի ուղղում

Նշված run՝ https://github.com/aanun1740-netizen/CineWave-Test-/actions/runs/40283595408 ։
Տրված ախտանիշը՝ desktop/mobile MP4 և HLS դեպքերում `readyState === 0`,
մինչ WebM decoding-ը անցնում է։

## Հետաքննություն

- FFprobe՝ MP4 և HLS MPEG-TS segment-ը նույն H.264 High profile/level 1.0,
  yuv420p, 160×90 տեսանյութն են։ WebM-ը VP8 է։ Այսպիսով չորս ձախողումները կապված են
  նույն codec-ից կախվածության հետ։
- FFmpeg-ը MP4, HLS և WebM ֆայլերն ամբողջությամբ վերծանեց առանց սխալի։
  Պարտադիր fixture վերագեներացման պատճառ չի հայտնաբերվել։
- Test routes-ը MP4/WebM/HLS/TS-ի համար վերադարձնում են համապատասխան MIME-երը,
  CORS header և ճիշտ 200/206 Content-Range պատասխաններ։ HLS-ի segment URL-ը
  լուծվում է թեստի նույն `https://media.invalid/` origin-ի ներքո։ Արտաքին հարցումները
  իրական ցանց չեն հասնում․ դրանք fulfill կամ abort են արվում։
- Կարգավորման իրական տարբերությունը՝ նախկինում տեղային գործարկումը ընտրում էր
  `/usr/bin/chromium`, երբ այն առկա էր, իսկ CI-ն՝ Playwright-ի լռելյայն ներբեռնված
  browser/headless shell-ը։ Սա չէր երաշխավորում H.264 decoder-ի նույն հնարավորությունները։
  MP4 և HLS decoding-ը կախված են H.264-ից, իսկ HLS.js-ի դեպքում նաև MediaSource-ից։

## Ուղղում

- Playwright-ը տեղային և CI ռեժիմներում հստակ ընտրում է branded Chrome-ի `chrome`
  channel-ը։ Համակարգի Chromium-ի ավտոմատ ընտրությունը հեռացված է։
- Workflow-ը տեղադրում է `npx playwright install --with-deps chrome`։
- Ոչ ստանդարտ Chrome տեղադրման համար նախատեսված է միայն հստակ
  `PLAYWRIGHT_CHROME_EXECUTABLE_PATH` override-ը։
- Ավելացված են desktop/mobile H.264, VP8 և H.264 MediaSource capability թեստեր։
  Պահպանված են իրական decoding/play/seek/resume assertion-ները և նախկին timeout-ը։
- Media թեստերը կցում են browser version-ը, իրական source URL-ը և codec capability-ները։
  Decoder-ի սխալը ցուցադրում է MediaError code/message-ը։ Workflow-ը ձախողման դեպքում
  պահպանում է `test-results/` ախտորոշիչ արտեֆակտը։

## Ստուգումներ և սահմանափակումներ

- Phase 0՝ 10/10, React՝ 17/17, build՝ հաջող։
- `CI=true` և branded Google Chrome 156.0.8078.47՝ browser թեստեր 12/12,
  ներառյալ MP4/WebM/HLS-ի իրական decoding-ը desktop/mobile viewport-ներում։
- FFmpeg-ի երեք ամբողջական decode ստուգումները՝ հաջող։ Fixture-ները չեն փոփոխվել։
- GitHub log API-ն այս միջավայրից վերադարձնում է `Forbidden`, իսկ CI-ի նախկին
  Playwright browser-ի ներբեռնումը՝ `403 Domain forbidden`։ Հետևաբար նախկին CI
  binary-ի ուղղակի A/B վերարտադրությունն այս միջավայրում չի կատարվել։ Ուղղումը վերացնում
  է հայտնաբերված browser/codec միջավայրի տարբերությունը, բայց նոր GitHub run-ի
  հաջողությունը պետք է հաստատել GitHub-ում։

Հավելվածի player-ը, Supabase-ը, տվյալները և RLS-ը չեն փոփոխվել։ Merge կամ deployment չկա։
