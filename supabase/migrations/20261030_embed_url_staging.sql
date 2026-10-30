-- Staging only: apply in Supabase project zayssiouqexwdicudalc before publishing UI.
-- Separate third-party embed URL from trailers and direct-media sources.
-- This does not grant streaming rights or relax publication verification.
BEGIN;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS embed_url text;
ALTER TABLE public.movies DROP CONSTRAINT IF EXISTS movies_embed_url_safe;
ALTER TABLE public.movies ADD CONSTRAINT movies_embed_url_safe CHECK (
  embed_url IS NULL OR embed_url = '' OR (
    length(embed_url) <= 1500 AND
    embed_url ~ '^https://(www\\.youtube\\.com/(watch\\?v=|embed/)|m\\.youtube\\.com/watch\\?v=|youtu\\.be/|player\\.vimeo\\.com/video/|www\\.vimeo\\.com/|vimeo\\.com/)'
  )
);
COMMIT;
