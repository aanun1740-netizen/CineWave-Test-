-- KinoLab staging: catalog TV series and ordered external episode references.
-- Existing rows stay as movies. Existing RLS admin-only write policies are unchanged.
BEGIN;
ALTER TABLE public.kinolab_external_catalog
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'movie';
ALTER TABLE public.kinolab_external_catalog
  ADD COLUMN IF NOT EXISTS episode_links jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid='public.kinolab_external_catalog'::regclass
      AND conname='kinolab_external_media_type_valid') THEN
    ALTER TABLE public.kinolab_external_catalog
      ADD CONSTRAINT kinolab_external_media_type_valid
      CHECK (media_type IN ('movie','tv'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid='public.kinolab_external_catalog'::regclass
      AND conname='kinolab_external_episodes_shape_valid') THEN
    ALTER TABLE public.kinolab_external_catalog
      ADD CONSTRAINT kinolab_external_episodes_shape_valid
      CHECK (
        jsonb_typeof(episode_links)='array'
        AND jsonb_array_length(episode_links)<=200
        AND (
          (media_type='movie' AND episode_links='[]'::jsonb
           AND external_watch_url ~ '^https://api[.]nextembed[.]ws/embed/movie/[0-9]+/?$')
          OR
          (media_type='tv' AND jsonb_array_length(episode_links)>0
           AND external_watch_url ~ '^https://api[.]nextembed[.]ws/embed/tv/[0-9]+/[0-9]+/[0-9]+/?$')
        )
      );
  END IF;
END
$$;
COMMIT;
