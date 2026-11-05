# KinoLab-Test — privacy-aware aggregate analytics (staging only)

## State

**Prepared in staging source, OFF by default.** No events are currently sent by this implementation because `config.js` contains `analyticsEnabled: false`. No production repository/Supabase project/domain was modified.

The owner approved the **analytics development phase**. Actual data collection starts only after applying the SQL in the **staging** database, reviewing visitors' privacy notice, switching the staging flag on in a separately reviewed commit, and explicitly publishing staging.

## What counts and what it doesn't

| Counter | Definition |
|---|---|
| Page loads | One counter per storefront browser load, not unique people and not every internal route |
| Film opens | A movie detail dialog opened through the app, including a direct film hash route |
| Watch clicks | One click on the outbound film Watch button, TV episode link, or internal watch action |
| Languages | Language of the counted action: hy, ru, en |
| Devices | Simplified viewport width: mobile <= 767px; otherwise desktop |
| Film popularity | Counts by published catalog movie ID (not watch/play completion) |

**Not supported:** unique visitors, exact people, IP addresses, countries, geolocation, search texts, referrers, device IDs, cookies, user agent storage, or actual external-site play completion. A single person can generate several visits and any anonymous client can automate counter increments. Do not represent this as verified audience traffic or ad revenue.

The event body contains only `p_event`, `p_movie_key`, `p_language` and `p_device`. There is no third-party analytics library, persistent visitor identifier or new cookie in this implementation. Supabase and browsers may still process IPs or other request metadata transiently/in infrastructure logs, outside the KinoLab aggregate table. Assess applicable privacy notices and consent requirements before activation.

## 1. Run SQL on staging (owner action)

- Open https://supabase.com/dashboard/project/zayssiouqexwdicudalc/sql/new
- Copy the complete text of `supabase/migrations/20261105_kinolab_aggregate_analytics.sql` into the SQL editor.
- **Double-check project ID = zayssiouqexwdicudalc**, not the production project.
- Run the single migration and confirm SQL Editor displays **Success**.
- The migration is designed to be idempotent; however, do not run it in another environment without reviewing schema and authorization.
- It creates a separate non-exposed `kinolab_analytics` schema with one aggregate table, private implementation functions and two small public API wrappers:
  - `kinolab_record_event`: anonymous/authenticated aggregate increments, no raw individual events.
  - `kinolab_get_metrics`: only an authorized signed-in administrator can access summary records; membership is checked inside the DB.
- No past visits can be backfilled from this new counter.

## 2. Verify schema and permissions (optional read-only SQL)

```sql
SELECT
  to_regclass('kinolab_analytics.daily_metrics') IS NOT NULL AS metrics_table_exists,
  to_regprocedure('public.kinolab_record_event(text,text,text,text)') IS NOT NULL AS counter_rpc_exists,
  to_regprocedure('public.kinolab_get_metrics(integer)') IS NOT NULL AS admin_rpc_exists,
  has_function_privilege('anon','public.kinolab_record_event(text,text,text,text)','EXECUTE') AS anonymous_can_record,
  NOT has_function_privilege('anon','public.kinolab_get_metrics(integer)','EXECUTE') AS anonymous_cannot_read;
```

All five values should read `true`. To test that a **non-admin authenticated** user can't read the metrics, call the public `kinolab_get_metrics` RPC with a non-admin session; it should be denied. Using SQL Editor as postgres is not a substitute for an admin/non-admin API test.

## 3. Activation (separate explicit owner approval)

After step 1, privacy notice review, and passing tests, switch `config.js` staging `analyticsEnabled` to `true` **only in this repo** and manually publish the exact new staging commit SHA through `.github/workflows/pages.yml`.

The `Analytics` tab in the KinoLab-Test Studio will then show counts. Admin visits are excluded in the storefront app after session/admin resolution. If the SQL has not been applied, dashboard shows a setup/error message and no events are collected.

## 4. How the owner reviews it

Sign in at https://aanun1740-netizen.github.io/CineWave-Test-/admin/ and select:
`▥ Վիճակագրություն / Статистика / Analytics`.

- Choose 7 or 30 days.
- Review page loads, film opens, Watch clicks.
- See top films, language, device and daily totals.
- Press Refresh to reload.

**Do not interpret counts as unique viewers or as successful movie playbacks.** Counts start at zero when activated.

## 5. Data hygiene and safeguards

- The aggregate table is in a non-exposed schema with RLS enabled; direct anonymous and authenticated table privileges are revoked.
- Public endpoint wrappers are `SECURITY INVOKER`; privileged helpers reside in the private schema with `search_path = ''`.
- Event types and IDs are constrained; only currently published films can accumulate per-film counters.
- Any anonymous public counter can be spammed; inspect for abnormal spikes before ad sales or business decisions. If serious abuse occurs, disable collection with `analyticsEnabled: false` and adjust server throttling.
- Run this housekeeping SQL monthly to remove counts older than 90 days:

```sql
DELETE FROM kinolab_analytics.daily_metrics
WHERE event_day < (now() AT TIME ZONE 'UTC')::date - 90;
```

This SQL affects **only** the staging metrics table, not film data. No automatic retention job is installed.

## Source documentation

- Supabase database functions security: https://supabase.com/docs/guides/database/functions
- Supabase database RLS and grants: https://supabase.com/docs/guides/database/postgres/row-level-security

## Release gates

1. Apply staging SQL.
2. Verify anon cannot read, non-admin cannot read, and admin can read.
3. Verify storefront still works with analytics disabled.
4. Approve privacy notice and switch to staging-only enablement.
5. Execute build-only GitHub workflow, then ask owner for staging-only publish approval.
6. Never change production or domain without a separate explicit authorization.
