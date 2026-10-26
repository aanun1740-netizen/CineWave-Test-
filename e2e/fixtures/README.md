Այս ֆայլերը վեց վայրկյան տևողությամբ, առանց ձայնի, միագույն սինթետիկ տեսանյութեր են։
Դրանք օգտագործվում են միայն offline browser թեստերում և չեն մտնում production build։

Վերստեղծում՝ պահոցի արմատից, FFmpeg-ով․

```sh
ffmpeg -f lavfi -i color=c=0x281b35:s=160x90:r=12 -t 6 -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart -y e2e/fixtures/sample.mp4
ffmpeg -f lavfi -i color=c=0x281b35:s=160x90:r=12 -t 6 -an -c:v libvpx -b:v 60k -y e2e/fixtures/sample.webm
ffmpeg -i e2e/fixtures/sample.mp4 -c copy -hls_time 2 -hls_list_size 0 -hls_segment_filename e2e/fixtures/segment%02d.ts -y e2e/fixtures/sample.m3u8
```

Ստուգված ձևաչափերը՝ MP4 և MPEG-TS/HLS՝ H.264 High profile, level 1.0,
160×90, yuv420p, WebM՝ VP8։ MP4-ի `faststart` կարգավորումը metadata-ն պահում է
ֆայլի սկզբում։ HLS playlist-ի `segment00.ts` հարաբերական URL-ը լուծվում է նույն
թեստային origin-ի վրա։ Միակ segment-ի տևողությունը վեց վայրկյան է, և playlist-ի
`TARGETDURATION`-ը նույնպես 6 է։

Ստուգում՝ առանց վերագեներացման․

```sh
ffprobe -v error -show_streams -show_format e2e/fixtures/sample.mp4
ffprobe -v error -show_streams -show_format e2e/fixtures/segment00.ts
ffprobe -v error -show_streams -show_format e2e/fixtures/sample.webm
ffmpeg -v error -i e2e/fixtures/sample.mp4 -f null -
ffmpeg -v error -i e2e/fixtures/sample.m3u8 -f null -
ffmpeg -v error -i e2e/fixtures/sample.webm -f null -
```

Թեստային պատասխանների MIME-երը՝ `video/mp4`, `video/webm`,
`application/vnd.apple.mpegurl`, `video/mp2t`։ Range հարցումները ստանում են
206 և համապատասխան Content-Range, սովորական հարցումները՝ 200։ Fixture-ները
ճիշտ են և CI ուղղման համար չեն վերագեներացվել։ H.264-ի համար անհրաժեշտ է
համապատասխան decoder ունեցող browser․ թեստերը հիմա հստակ ընտրում են Chrome-ը։
