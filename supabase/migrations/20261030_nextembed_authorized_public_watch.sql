-- CineWave-Test staging only. The user must have actual public-link distribution rights.
-- Keep source movies unpublished; expose one constrained external link through metadata projection.
BEGIN;
ALTER TABLE public.movie_metadata_public ADD COLUMN IF NOT EXISTS external_watch_url text;
CREATE OR REPLACE FUNCTION public.sync_metadata_external_watch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.metadata_published = true AND NEW.is_published = false THEN
    UPDATE public.movie_metadata_public
    SET external_watch_url = CASE
      WHEN NEW.commercial_streaming_permission IS TRUE
       AND NULLIF(btrim(NEW.rights_holder),'') IS NOT NULL
       AND NULLIF(btrim(NEW.license_type),'') IS NOT NULL
       AND NEW.license_evidence_url ~ '^https://'
       AND NEW.license_terms_url ~ '^https://'
       AND NEW.embed_url ~ '^https://api[.]nextembed[.]ws/embed/(movie|tv)/[0-9]+(/[0-9]+/[0-9]+)?/?$'
      THEN NEW.embed_url ELSE NULL END
    WHERE id=NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_metadata_external_watch() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_zzz_metadata_external_watch ON public.movies;
CREATE TRIGGER trg_zzz_metadata_external_watch
AFTER INSERT OR UPDATE ON public.movies
FOR EACH ROW EXECUTE FUNCTION public.sync_metadata_external_watch();
UPDATE public.movie_metadata_public AS m
SET external_watch_url=CASE
  WHEN p.metadata_published IS TRUE AND p.is_published IS FALSE
   AND p.commercial_streaming_permission IS TRUE
   AND NULLIF(btrim(p.rights_holder),'') IS NOT NULL
   AND NULLIF(btrim(p.license_type),'') IS NOT NULL
   AND p.license_evidence_url ~ '^https://'
   AND p.license_terms_url ~ '^https://'
   AND p.embed_url ~ '^https://api[.]nextembed[.]ws/embed/(movie|tv)/[0-9]+(/[0-9]+/[0-9]+)?/?$'
  THEN p.embed_url ELSE NULL END
FROM public.movies AS p WHERE m.id=p.id;
COMMIT;
