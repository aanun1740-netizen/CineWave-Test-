# KinoLab — staging release checklist

Scope: `aanun1740-netizen/CineWave-Test-` only. Do not change the production CineWave repository or Supabase project during staging verification.

## Deployment gates (all required)
- [ ] GitHub Actions `.github/workflows/pages.yml` build succeeds: npm test, npm run build and npm run test:e2e.
- [ ] Publish is explicitly approved via workflow_dispatch on main, with publish=true, matching confirm_repository, and exact full latest approved SHA.
- [ ] Desktop and mobile storefront load without runtime errors.
- [ ] Studio admin login works and an authorized admin can save a test catalog listing.
- [ ] Catalog listing appears in public storefront in Armenian, Russian and English.
- [ ] Poster, title, summary, genres and trailer (when configured) render correctly.
- [ ] Existing authorized MP4/HLS player plays and quality selector reflects *actual* available streams.
- [ ] External provider links are saved as references; public Watch is shown only when the source terms/rights permit publication and backend publication projection exposes external_watch_url.
- [ ] Opening permitted external links uses a new tab; KinoLab remains open.
- [ ] Existing duplicate Animals references (IDs 1 and 6) are reviewed before deleting either.
- [ ] 70,157-title archive import is confirmed by database count before claiming completed.
- [ ] Uploading full-length films from a PC is NOT marked implemented until video storage, resumable uploading, player delivery, access rules and rights checks are tested.
- [ ] Custom domain is configured and verified. Search-engine sitemap, robots, page titles and Search Console are checked.

## Existing staging blockers / known limits
- NextEmbed movie ID 92733 is an external **page** URL and not a stable, licensed MP4/HLS/DASH stream.
- An MPD XML manifest or expiring signed media segments are not interchangeable with a stable `.mpd` URL.
- The public metadata projection `movie_metadata_public.external_watch_url` may remain null for drafts unless its authorization checks are satisfied.
- GitHub Pages hosts the frontend, not full-length movie uploads.
- A visible movie listing does not imply playback permission or a functional Watch link.

## Release sequence
1. Perform build-only workflow dispatch (`publish=false`) for the current main SHA.
2. Resolve any failures in tests/build/e2e.
3. Verify and record the Supabase staging data migration status.
4. Exercise a legal test film end-to-end in Studio and storefront.
5. Run final mobile and three-language acceptance checks.
6. Publish staging via explicit owner authorization.
7. Only after successful staging approval, separately plan production promotion and domain/Google indexing.
