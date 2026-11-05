# KinoLab — production launch plan (planning only)

Prepared: 2026-11-05. This document is stored **only** in the staging GitHub repository `aanun1740-netizen/CineWave-Test-`.
No production code, database, domain, DNS, credentials, or search indexing are modified by this plan.

## Current verified inputs

- Owner confirmed six final staging UI/functional checks passed (desktop/mobile, languages, outbound film Watch, trailers, Dark/Light, and Studio create/edit).
- Owner exported a staging `kinolab_external_catalog` CSV and downloaded image backups; a restore rehearsal has **not** yet been verified.
- Read-only staging audit supplied by owner: 9 catalog rows, all published; 9 with trailers; none missing posters or hy/ru/en descriptions; 0 malformed watch URLs; 0 published without accepted link terms; 0 HTTP-only outbound links.
- RLS enabled on external catalog and private admin table; audit observed guarded insert/update/delete policies and the public poster bucket. These metrics do **not** constitute a penetration test.
- Legacy `public.movies` query returned zero rows according to owner.
- Staging remains `noindex`; custom domain has **not** been purchased.

## Required separation

The current application is purpose-built for staging:

- `config.js` pins Supabase to `https://zayssiouqexwdicudalc.supabase.co` and fails closed if a request targets another backend.
- `vite.config.js` sets `base: "/CineWave-Test-/"`; production at a root domain will require a different base.
- `scripts/check-staging.cjs` rejects non-staging repository names, remotes, and Supabase backends.
- `.github/workflows/pages.yml` permits publishing **only** from the staging repository, manually, with its SHA approval gates.
- The existing staging public assets and database data must not be silently reused as an assumed production environment.

**Never simply change these constants in the staging repository.** A dedicated, approved production configuration and build/deploy process must be prepared separately.

## Brand decision (owner-confirmed, 2026-11-05)

- **Keep the product name KinoLab**, including the existing KinoLab logo and public-facing brand.
- This is a naming decision only. **No domain has been selected or purchased** and no production website is authorized for changes.
- Check domain availability, pricing, and relevant trademark/brand rights before choosing a domain. Existing similar film site name usage is a possible confusion risk, not a verified legal finding.

## Phase A — choose and verify domain (no purchase yet)

1. Decide preferred final domain spelling and top-level domain (.com, .tv or another extension).
   **Naming finding (public web check, 2026-11-05):** a Georgian-language film/TV website already uses the **KinoLab** name at https://kinolab.cc/ (also reported at kinolab.net). This is a possible branding/confusion risk, not proof of trademark infringement. Verify trademarks and brand rights before buying a domain; a different suffix alone does not establish distinct branding.
2. Check live registrar availability, annual renewal price, transfer fees, WHOIS/privacy and trademark conflicts before purchase. No availability or price is assumed.
3. Record the intended canonical URL (`https://www.<chosen-domain>/` or `https://<chosen-domain>/`).
4. Keep the staging URL intact and `noindex` whether or not a domain is registered.

## Phase B — approve the exact production target

1. Confirm which repository will be considered *the* production KinoLab site; do not guess based on an old CineWave name.
2. Confirm a separate production Supabase project, its migration history, authentication configuration and poster storage plan.
3. Agree what the first production release contains (the 9 published listings or a curated subset) and verify link rights and external provider reliability.
4. Agree exact production admin users and account setup. Never copy client secrets or privileged credentials into GitHub.
5. Require explicit owner approval before writing any production repo, Supabase project, or domain settings.

## Phase C — prepare a separate production release candidate

After approval of targets, work only in a specifically approved production branch/repository/configuration:

- Configure public base URL for the chosen domain; update asset paths, router and static HTML references.
- Use environment-scoped Supabase URL and publishable browser key; keep service-role secrets out of public artifacts.
- Recreate schema, constraints, indexes, RLS, storage policies, and admin membership in production via reviewed migrations, then test anonymous vs admin access.
- Restore the 9 film records from verified local export; upload the corresponding image bytes and rewrite public poster URLs to the production bucket. Validate every migrated image, overview, genre, trailer, and outbound Watch URL.
- Set production Auth redirect URL, Site URL, allowed origins/CORS, and any relevant AI server integrations explicitly; retain staging's original values untouched.
- Render accessible hy/ru/en pages and check responsive layouts, search, theme persistence, trailers and outbound movie Watch.
- Add production-only GitHub Actions checks, build, E2E, explicit approval and rollback procedure. Do not reuse the staging-only gates as a production deployment workflow.
- Treat the content provider's playback and publication rights as separate go-live approvals.

## Phase D — launch readiness / rollback gates

**No go-live until all true:**

- A clean build/CI and owner-performed functional acceptance tests pass in the target environment.
- Backup restore was verified and both catalog CSV and poster image bytes are stored safely.
- No staging Supabase URL or `/CineWave-Test-/` links leak into production.
- Permissions and RLS verified by an authenticated admin and a non-admin.
- The chosen site works over HTTPS, including pages, assets, Supabase Auth and outgoing links.
- DNS ownership verified before configuration, no wildcard records, and both canonical domain and `www` behavior confirmed.
- A rollback action is documented: preserve the last good static release, stop/promote only approved data changes, and have a database restore procedure ready. A static rollback alone cannot reverse a database migration.

## Phase E — SEO after production passes acceptance

- Production public pages should have crawlable URLs, canonical URLs and correct localized metadata; staging remains `noindex`.
- Keep Studio `noindex,nofollow` and access-controlled.
- Only after the production hostname is verified and production pages are crawlable: publish a **production** root `robots.txt`, accurate `sitemap.xml`, then verify domain in Google Search Console and submit sitemap.
- Staging's `KINOLAB_SEO_LAUNCH.md` explains why hash routes and the build-time staging film preview pages are not yet a production SEO solution.
- No guarantees that Google will index pages or that an external host will stream an individual movie.

## Sources for future execution

- GitHub Pages custom domains and verification: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pages HTTPS: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- Supabase environments: https://supabase.com/docs/guides/deployment/managing-environments
- Google site migrations: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes

## Next owner action

Choose a domain direction, **without needing to buy it now**: e.g. prioritize `kinolab.com` versus `kinolab.tv`, or propose another exact name. Availability, trademarks and prices must be checked before any purchase. This alone authorizes no production mutation.
