Այս ֆայլերը վեց վայրկյան տևողությամբ, առանց ձայնի, միագույն սինթետիկ տեսանյութեր են։
Դրանք օգտագործվում են միայն offline browser թեստերում և չեն մտնում production build։

Վերստեղծում՝ պահոցի արմատից, FFmpeg-ով․

```sh
ffmpeg -f lavfi -i color=c=0x281b35:s=160x90:r=12 -t 6 -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart -y e2e/fixtures/sample.mp4
ffmpeg -f lavfi -i color=c=0x281b35:s=160x90:r=12 -t 6 -an -c:v libvpx -b:v 60k -y e2e/fixtures/sample.webm
ffmpeg -i e2e/fixtures/sample.mp4 -c copy -hls_time 2 -hls_list_size 0 -hls_segment_filename e2e/fixtures/segment%02d.ts -y e2e/fixtures/sample.m3u8
```
