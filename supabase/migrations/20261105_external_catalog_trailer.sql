-- KinoLab staging only: allow an optional external trailer link on Quick add movies.
-- No changes to existing rows, publishing rules, RLS, or watch links.
BEGIN;
ALTER TABLE public.kinolab_external_catalog
  ADD COLUMN IF NOT EXISTS trailer_url text;

-- Limit stored trailer destinations to recognized video providers and HTTPS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.kinolab_external_catalog'::regclass
      AND conname = 'kinolab_external_trailer_url_valid'
  ) THEN
    ALTER TABLE public.kinolab_external_catalog
      ADD CONSTRAINT kinolab_external_trailer_url_valid
      CHECK (
        trailer_url IS NULL OR (
          length(trailer_url) <= 2048
          AND trailer_url ~ '^https://(www[.]youtube[.]com|youtube[.]com|m[.]youtube[.]com|youtu[.]be|vimeo[.]com|www[.]vimeo[.]com|player[.]vimeo[.]com)/'
          AND trailer_url !~ '[[:space:]]'
        )
      );
  END IF;
END
$$;
COMMIT;
