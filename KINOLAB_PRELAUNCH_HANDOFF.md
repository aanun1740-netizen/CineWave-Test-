# KinoLab: pre-domain staging handoff

**Scope:** `aanun1740-netizen/CineWave-Test-` only, backed by staging Supabase project `zayssiouqexwdicudalc`.
No production repository, production Supabase project, domain, or live search indexing has been changed as part of this handoff.

## Current stage (2026-11-05)

- Owner reports that the current staging storefront and external movie Watch flow work.
- The UI supports hy, ru, en, persisted Dark / Light themes, external film listings, trailers, and the TV/episodes form.
- The public external film Watch button opens the admin-provided destination in a **new tab**; it does not verify that the external host actually plays a film or that external content is legally distributable.
- Staging remains `noindex`. A final canonical domain, DNS/HTTPS and production sitemap are not yet configured.
- This static review **does not** verify a fresh CI run or directly query the live Supabase database.

## Step 1: run the read-only staging audit

Open the [staging SQL editor](https://supabase.com/dashboard/project/zayssiouqexwdicudalc/sql/new).
Run `supabase/audits/staging_prelaunch_readonly.sql` as written.

- The report includes only counts and security flags. It does **not** print movie titles, link destinations, emails, or authentication secrets.
- `security.external_catalog_rls` and `security.admin_users_rls` should be `true`.
- `security.guarded_insert_policies`, `guarded_update_policies`, and `guarded_delete_policies` should be at least `1` each.
- `catalog.published_without_link_terms` and `catalog.invalid_web_url_shapes` should be `0`.
- Missing posters/descriptions do not by themselves indicate broken RLS; they are content-completeness checks.
- An `http://` watch link is unencrypted. Prefer `https://` where available.
- Those are configuration checks, **not** a substitute for an actual non-admin authorization test or external provider rights review.

## Step 2: make a real local backup before migrating or promoting data

In the same staging Supabase SQL Editor, run **one query at a time** and select **Export -> CSV** from the results.

**External film and TV catalog**

```sql
SELECT * FROM public.kinolab_external_catalog ORDER BY id;
```

**Existing legacy movie catalog**

```sql
SELECT * FROM public.movies ORDER BY id;
```

Save both CSV files on an access-controlled local drive, with the project name and backup date in their filenames. If the legacy table is empty, keep a record of that fact. CSV is a useful content export, **not** a complete PostgreSQL database backup.

Separately copy the media files actually used from the Supabase Storage bucket `cinewave-assets` (a CSV of URLs does **not** contain poster image bytes). Keep SQL schema/migration files in version control. If you need full database disaster recovery, arrange a provider-supported database backup or dump and a tested restore procedure before production.

**Never** upload private CSV exports, admin details, tokens, service-role keys, or Storage originals to a public GitHub repository or an online screenshot.

## Step 3: owner acceptance checks on the existing staging site

Run on desktop and on a phone:

- Sign in to Studio and verify an existing movie **without editing it**.
- Confirm three languages change both titles and overviews.
- Open published film details, follow Watch to the exact expected external website in a new tab, and confirm KinoLab remains open.
- Confirm trailer links work where provided.
- Check both Light and Dark modes and the saved preference after refresh.
- Check that hidden/draft films do not appear to an anonymous visitor.
- Check TV Shows season / episode selections, when TV data are available.
- Check that the external site's own Watch/playback behavior works, independently of KinoLab.
- Review admin-only operations and storage policies after any database policy change.
- Do **not** delete or unpublish real listings just to exercise tests.

## Step 4: controlled GitHub Pages validation

Use [staging workflow](https://github.com/aanun1740-netizen/CineWave-Test-/actions/workflows/pages.yml) on branch `main`.

1. First dispatch `publish=false` for build/unit/E2E only.
2. Review all test/build/E2E results. Do not claim they passed without seeing the result.
3. Only publish through the workflow's existing `publish=true`, `confirm_repository`, and full HEAD `approved_sha` gates when the owner approves.
4. If deployment fails, inspect the failed job logs rather than changing production or bypassing the gates.

## Step 5: after buying a real domain

Domain availability and brand rights must be verified before purchase. Once the owner provides the real domain and approves production work, **separately** plan production promotion and verify data backup/restore, target backend, HTTPS/DNS, canonical URLs, robots, sitemap, and Google Search Console.

The current `KINOLAB_SEO_LAUNCH.md` notes that production indexing requires true crawlable movie pages, not just the existing hash routes. Do not remove staging `noindex` or submit its URLs to Google.

## Release decision

Do not declare production ready solely because the storefront works. The next blocking evidence is the **read-only audit result and a verified local backup**. Production changes require a separate explicit approval.
