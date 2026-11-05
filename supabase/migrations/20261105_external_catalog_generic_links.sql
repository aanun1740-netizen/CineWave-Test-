-- KinoLab-Test only. Admins can add any normal web URL for outbound FILM playback.
-- TV season/episode support remains restricted to the existing NextEmbed format.
-- Existing records, RLS, rights acknowledgment and unique URL stay untouched.
BEGIN;

ALTER TABLE public.kinolab_external_catalog
  ADD COLUMN IF NOT EXISTS trailer_url text;
ALTER TABLE public.kinolab_external_catalog
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'movie';
ALTER TABLE public.kinolab_external_catalog
  ADD COLUMN IF NOT EXISTS episode_links jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
DECLARE restriction record;
BEGIN
  -- Drop only watch URL checks on this single column, not TV shape/RLS checks.
  FOR restriction IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attname = 'external_watch_url'
    WHERE c.conrelid = 'public.kinolab_external_catalog'::regclass
      AND c.contype = 'c'
      AND c.conkey = ARRAY[a.attnum]::smallint[]
      AND (
        c.conname = 'kinolab_external_watch_url_allowed'
        OR c.conname = 'kinolab_external_watch_web_url'
        OR pg_get_constraintdef(c.oid) ILIKE '%nextembed%'
        OR pg_get_constraintdef(c.oid) ILIKE '%variyt%'
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE public.kinolab_external_catalog DROP CONSTRAINT %I',
      restriction.conname
    );
  END LOOP;

  ALTER TABLE public.kinolab_external_catalog
    ADD CONSTRAINT kinolab_external_watch_web_url
    CHECK (
      length(external_watch_url) <= 2048
      AND external_watch_url !~ '[[:cntrl:][:space:]]'
      AND (
        (media_type = 'movie'
          AND external_watch_url ~* '^https?://[^[:space:]@/?#]+([/?#][^[:space:]]*)?$')
        OR
        (media_type = 'tv'
          AND external_watch_url ~ '^https://api[.]nextembed[.]ws/embed/tv/[0-9]+(/[0-9]+/[0-9]+)?/?$')
      )
    );
END
$$;

NOTIFY pgrst, 'reload schema';
COMMIT;
