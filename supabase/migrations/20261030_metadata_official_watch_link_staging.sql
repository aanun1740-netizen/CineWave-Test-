-- Staging only. Expose an official provider landing page for metadata-only films.
-- Do not expose arbitrary embed/watch URLs or grant streaming permissions.
BEGIN;
ALTER TABLE public.movie_metadata_public ADD COLUMN IF NOT EXISTS official_watch_url text;
CREATE OR REPLACE FUNCTION public.sync_official_movie_link()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.metadata_published AND NOT NEW.is_published THEN
    UPDATE public.movie_metadata_public
    SET official_watch_url = CASE
      WHEN NEW.original_source_url ~ '^https://(www[.])?netflix[.]com/title/[0-9]+/?$'
      THEN NEW.original_source_url ELSE NULL END
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_official_movie_link() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_zz_official_movie_link ON public.movies;
CREATE TRIGGER trg_zz_official_movie_link AFTER INSERT OR UPDATE ON public.movies
FOR EACH ROW EXECUTE FUNCTION public.sync_official_movie_link();
UPDATE public.movie_metadata_public AS m
SET official_watch_url = CASE
  WHEN p.original_source_url ~ '^https://(www[.])?netflix[.]com/title/[0-9]+/?$'
  THEN p.original_source_url ELSE NULL END
FROM public.movies AS p
WHERE m.id = p.id AND p.metadata_published AND NOT p.is_published;
COMMIT;
