-- CineWave-Test staging only (Supabase project zayssiouqexwdicudalc).
-- Public metadata never contains media links, license documents, or private review data.
BEGIN;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS metadata_published boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.movie_metadata_public (
  id bigint PRIMARY KEY,
  title_en text NOT NULL,
  title_ru text,
  title_hy text,
  overview_en text,
  overview_ru text,
  overview_hy text,
  media_type text,
  release_date date,
  genre_names text[],
  poster_path text,
  backdrop_path text
);
ALTER TABLE public.movie_metadata_public ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS movie_metadata_public_read ON public.movie_metadata_public;
CREATE POLICY movie_metadata_public_read ON public.movie_metadata_public FOR SELECT TO anon, authenticated USING (true);
REVOKE ALL ON public.movie_metadata_public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.movie_metadata_public TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.sync_movie_metadata_public()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.movie_metadata_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  IF NEW.metadata_published = true AND NEW.is_published = false THEN
    INSERT INTO public.movie_metadata_public
      (id,title_en,title_ru,title_hy,overview_en,overview_ru,overview_hy,media_type,release_date,genre_names,poster_path,backdrop_path)
    VALUES
      (NEW.id,NEW.title_en,NEW.title_ru,NEW.title_hy,NEW.overview_en,NEW.overview_ru,NEW.overview_hy,NEW.media_type,NEW.release_date,NEW.genre_names,NEW.poster_path,NEW.backdrop_path)
    ON CONFLICT (id) DO UPDATE SET
      title_en=EXCLUDED.title_en,title_ru=EXCLUDED.title_ru,title_hy=EXCLUDED.title_hy,
      overview_en=EXCLUDED.overview_en,overview_ru=EXCLUDED.overview_ru,overview_hy=EXCLUDED.overview_hy,
      media_type=EXCLUDED.media_type,release_date=EXCLUDED.release_date,genre_names=EXCLUDED.genre_names,
      poster_path=EXCLUDED.poster_path,backdrop_path=EXCLUDED.backdrop_path;
  ELSE
    DELETE FROM public.movie_metadata_public WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_movie_metadata_public() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_sync_movie_metadata_public ON public.movies;
CREATE TRIGGER trg_sync_movie_metadata_public AFTER INSERT OR UPDATE OR DELETE ON public.movies
FOR EACH ROW EXECUTE FUNCTION public.sync_movie_metadata_public();
INSERT INTO public.movie_metadata_public (id,title_en,title_ru,title_hy,overview_en,overview_ru,overview_hy,media_type,release_date,genre_names,poster_path,backdrop_path)
SELECT id,title_en,title_ru,title_hy,overview_en,overview_ru,overview_hy,media_type,release_date,genre_names,poster_path,backdrop_path FROM public.movies
WHERE metadata_published AND NOT is_published
ON CONFLICT (id) DO NOTHING;
COMMIT;
