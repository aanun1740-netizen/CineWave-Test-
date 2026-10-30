-- CineWave-Test staging only. Apply after 20261030_embed_url_staging.sql.
-- An unapproved external URL can be recorded in an unpublished draft,
-- but cannot be published or embedded in the storefront.
BEGIN;
ALTER TABLE public.movies DROP CONSTRAINT IF EXISTS movies_embed_url_safe;
ALTER TABLE public.movies ADD CONSTRAINT movies_embed_url_safe CHECK (
  embed_url IS NULL OR embed_url = '' OR (
    length(embed_url) <= 1500
    AND embed_url ~ '^https://[^[:space:]/?#@]+'
    AND (
      is_published = false
      OR embed_url ~ '^https://(www[.]youtube[.]com|m[.]youtube[.]com|youtu[.]be|vimeo[.]com|www[.]vimeo[.]com|player[.]vimeo[.]com)/'
    )
  )
);
COMMIT;
