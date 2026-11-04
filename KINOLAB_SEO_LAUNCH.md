# KinoLab SEO launch notes — staging only

The `CineWave-Test-` GitHub Pages site is a **staging** deployment.
Never treat this test URL as the final canonical public address.

## Completed in staging
- Storefront HTML has a meta description, Open Graph site/title/description/locale, and Twitter summary card.
- The React app keeps document language, document title, meta description and OG metadata synchronized with the UI language (hy/ru/en).
- Storefront and Studio pages use `noindex` directives, so the test deployment is not intentionally submitted for search indexing.

## Film page previews (staging, build-time)
- During `npm run build`, `scripts/generate-film-pages.cjs` reads only the public, published rows of staging `kinolab_external_catalog` (up to 500).
- It generates a real HTML index at `/CineWave-Test-/films/` and per-film pages at `/CineWave-Test-/films/external-<id>/`. These are **noindex** staging snapshots and link back into the existing working KinoLab movie dialog.
- Generated page content is escaped before HTML insertion. An API timeout or temporary outage leaves the React application build usable and the static index empty for that build; the snapshots only update on the next approved deployment.
- The generator currently covers **external-link films only**. It does not yet render the separate legacy `movies` table or metadata archive.
- This is a first technical prototype, not complete public-film SEO. Final production needs authoritative domain, stable public URLs, fresh/synchronized pages, correct canonical and localized URLs, and search-friendly indexing.

## Required only after explicit approval to launch the production site
1. Choose and verify the final production domain, HTTPS and canonical homepage URL.
2. Remove `noindex` **in production only**, after confirming the production site is ready, and retain `noindex,nofollow` on the admin pages.
3. Create production `robots.txt` on the **origin root** of the production domain. Note: a `robots.txt` under `/CineWave-Test-/` on github.io is NOT a host-level robots policy; this is why staging relies on the HTML noindex directive.
4. Create a production sitemap with real public HTTPS URLs, including actual crawlable film pages; do **not** submit staging URLs. Do not invent a domain.
5. Verify ownership in Google Search Console and submit the production sitemap once the live pages are crawlable.
6. Review routing: the storefront currently uses fragment/hash routes (`#/movie/...`). Those are poor candidates for individually indexed film detail pages. Move movie detail pages to real crawlable URLs and provide server-rendered or pre-rendered metadata/content before expecting per-film SEO.
7. Only add Movie/VideoObject structured data for records with accurate, verified properties. Outbound links are not evidence that KinoLab hosts or owns video content.
8. Add a licensed social preview image and specify production `og:image` with a real HTTPS URL.
9. Check mobile usability, canonical/hreflang handling when pages have real unique language URLs, and indexability before Search Console submission.

No production website, domain or Supabase project has been modified by these notes.
