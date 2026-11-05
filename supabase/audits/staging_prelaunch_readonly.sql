-- KinoLab-Test ONLY. Read-only, privacy-preserving prelaunch audit.
-- Run in https://supabase.com/dashboard/project/zayssiouqexwdicudalc/sql/new
-- Shows counts and flags, not movie titles, watch links, emails, or secrets.
-- This does NOT create a backup, alter RLS, or prove links are licensed/safe.
WITH
catalog AS (
 SELECT
  count(*) AS total,
  count(*) FILTER (WHERE is_published) AS published,
  count(*) FILTER (WHERE NOT is_published) AS unpublished,
  count(*) FILTER (WHERE media_type = 'movie') AS movies,
  count(*) FILTER (WHERE media_type = 'tv') AS tv_shows,
  count(*) FILTER (WHERE trailer_url IS NOT NULL AND btrim(trailer_url) <> '') AS trailers,
  count(*) FILTER (WHERE poster_path IS NULL OR btrim(poster_path) = '') AS missing_posters,
  count(*) FILTER (WHERE overview_en IS NULL OR btrim(overview_en) = '') AS missing_english_descriptions,
  count(*) FILTER (WHERE overview_ru IS NULL OR btrim(overview_ru) = '') AS missing_russian_descriptions,
  count(*) FILTER (WHERE overview_hy IS NULL OR btrim(overview_hy) = '') AS missing_armenian_descriptions,
  count(*) FILTER (WHERE is_published AND NOT terms_confirmed) AS published_without_link_terms,
  count(*) FILTER (WHERE external_watch_url !~* '^https?://[^[:space:]@/?#]+([/?#][^[:space:]]*)?$') AS invalid_web_url_shapes,
  count(*) FILTER (WHERE external_watch_url LIKE 'http://%') AS unencrypted_external_links
 FROM public.kinolab_external_catalog
),
catalog_security AS (
 SELECT relrowsecurity AS enabled
 FROM pg_class
 WHERE oid = 'public.kinolab_external_catalog'::regclass
),
admin_security AS (
 SELECT relrowsecurity AS enabled
 FROM pg_class
 WHERE oid = 'cinewave_private.admin_users'::regclass
),
policies AS (
 SELECT count(*) FILTER (WHERE cmd='SELECT') AS read_policies,
        count(*) FILTER (WHERE cmd='INSERT' AND with_check LIKE '%cinewave_is_admin%') AS guarded_insert,
        count(*) FILTER (WHERE cmd='UPDATE' AND qual LIKE '%cinewave_is_admin%' AND with_check LIKE '%cinewave_is_admin%') AS guarded_update,
        count(*) FILTER (WHERE cmd='DELETE' AND qual LIKE '%cinewave_is_admin%') AS guarded_delete
 FROM pg_policies
 WHERE schemaname='public' AND tablename='kinolab_external_catalog'
),
metrics AS (
 SELECT 'catalog.total' AS metric, total::text AS value FROM catalog
 UNION ALL SELECT 'catalog.published', published::text FROM catalog
 UNION ALL SELECT 'catalog.unpublished', unpublished::text FROM catalog
 UNION ALL SELECT 'catalog.movies', movies::text FROM catalog
 UNION ALL SELECT 'catalog.tv_shows', tv_shows::text FROM catalog
 UNION ALL SELECT 'catalog.with_trailers', trailers::text FROM catalog
 UNION ALL SELECT 'catalog.missing_posters', missing_posters::text FROM catalog
 UNION ALL SELECT 'catalog.missing_overview_en', missing_english_descriptions::text FROM catalog
 UNION ALL SELECT 'catalog.missing_overview_ru', missing_russian_descriptions::text FROM catalog
 UNION ALL SELECT 'catalog.missing_overview_hy', missing_armenian_descriptions::text FROM catalog
 UNION ALL SELECT 'catalog.published_without_link_terms', published_without_link_terms::text FROM catalog
 UNION ALL SELECT 'catalog.invalid_web_url_shapes', invalid_web_url_shapes::text FROM catalog
 UNION ALL SELECT 'catalog.http_not_https_links', unencrypted_external_links::text FROM catalog
 UNION ALL SELECT 'security.external_catalog_rls', enabled::text FROM catalog_security
 UNION ALL SELECT 'security.admin_users_rls', enabled::text FROM admin_security
 UNION ALL SELECT 'security.guarded_insert_policies', guarded_insert::text FROM policies
 UNION ALL SELECT 'security.guarded_update_policies', guarded_update::text FROM policies
 UNION ALL SELECT 'security.guarded_delete_policies', guarded_delete::text FROM policies
 UNION ALL SELECT 'security.read_policies', read_policies::text FROM policies
 UNION ALL SELECT 'storage.poster_bucket_present',
     EXISTS(SELECT 1 FROM storage.buckets WHERE id='cinewave-assets')::text
 UNION ALL SELECT 'storage.poster_bucket_public',
     COALESCE((SELECT public::text FROM storage.buckets WHERE id='cinewave-assets'), 'missing')
)
SELECT metric, value
FROM metrics
ORDER BY metric;
