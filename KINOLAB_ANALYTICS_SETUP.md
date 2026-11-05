# KinoLab-Test — privacy-aware aggregate analytics (staging only)

## State

**Enabled in staging source, NOT deployed by this commit.** The owner reported that the migration succeeded and both 5-field and 3-field SQL permission checks returned true. `config.js` now contains `analyticsEnabled: true`, but actual visitor counting starts only after a separately approved staging-only GitHub Pages publish. Production repository/Supabase/domain remain unchanged.

The owner approved the **analytics development phase**. SQL is applied in the **staging** database; visitor notice is now available at `/CineWave-Test-/privacy.html` once deployed, and the staging flag is enabled in source. Actual data collection requires successful build-only CI, an approved staging publish and verification of the administrator-only dashboard. A live non-admin RPC denial test is still recommended.

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

## 3. Activation (separate explicit staging publication approval)

After owner-confirmed SQL checks, the staging-only flag has been switched on in the repo and the trilingual privacy notice was created. **Run build-only CI again for the updated source**, review the result, and manually publish the exact HEAD SHA through `.github/workflows/pages.yml` **only after the owner explicitly approves staging publication**.

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

1. Owner completed staging SQL and direct database privilege checks (5 true + 3 true); **live non-admin RPC denial and admin RPC success are still to be verified after publication**.
2. Staging flag is enabled in source and privacy notice included, but not live until a separately approved staging deploy.
3. Execute build-only GitHub workflow for the newest HEAD SHA and inspect job results.
4. Owner explicitly approves **staging-only** publication and dispatches the SHA-gated staging deploy.
5. Verify both an admin can view aggregates and a non-admin cannot read the analytics RPC, then generate a few clicks and press Refresh.
6. Never change production or domain without a separate explicit authorization.
