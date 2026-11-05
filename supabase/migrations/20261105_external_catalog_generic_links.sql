-- KinoLab staging. Enable administrator-curated outbound HTTP/HTTPS links.
-- No iframe playback is authorized by this change. No change to RLS or admin rights.
-- This also brings the optional fields into sync if an earlier migration was skipped.
BEGIN;

ALTER TABLE public.kinolab_external_catalog
  ADD COLUMN IF NOT EXISTS trailer_url text;
ALTER TABLE public.kinolab_external_catalog
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'movie';
ALTER TABLE public.kinolab_external_catalog
  ADD COLUMN IF NOT EXISTS episode_links jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
DECLARE
  restriction record;
BEGIN
  -- Remove ONLY the former provider-specific CHECK constraints on watch URL.
  -- Keep every RLS policy, terms check and unique-link constraint intact.
  FOR restriction IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.kinolab_external_catalog'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%external_watch_url%'
      AND (
        conname = 'kinolab_external_watch_url_allowed'
        OR pg_get_constraintdef(oid) ILIKE '%nextembed%'
        OR pg_get_constraintdef(oid) ILIKE '%variyt%'
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE public.kinolab_external_catalog DROP CONSTRAINT %I',
      restriction.conname
    );
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.kinolab_external_catalog'::regclass
      AND conname = 'kinolab_external_watch_web_url'
  ) THEN
    ALTER TABLE public.kinolab_external_catalog
      ADD CONSTRAINT kinolab_external_watch_web_url
      CHECK (
        length(external_watch_url) <= 2048
        AND external_watch_url ~* '^https?://[^[:space:]@/?#]+([/?#][^[:space:]]*)?$'
        AND external_watch_url !~ '[[:cntrl:][:space:]]'
      );
  END IF;
END
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
