-- KinoLab staging only: source db.json has source IDs and Russian titles only.
-- Archive is informational: no media URLs or streaming permissions.
BEGIN;
CREATE TABLE IF NOT EXISTS public.kinolab_title_archive (
  source_id bigint PRIMARY KEY,
  title_ru text NOT NULL CHECK (length(title_ru) BETWEEN 1 AND 300),
  imported_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kinolab_title_archive ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kinolab_archive_read ON public.kinolab_title_archive;
CREATE POLICY kinolab_archive_read ON public.kinolab_title_archive
 FOR SELECT TO anon, authenticated USING (true);
REVOKE ALL ON public.kinolab_title_archive FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.kinolab_title_archive TO anon, authenticated;
CREATE INDEX IF NOT EXISTS kinolab_archive_title_idx ON public.kinolab_title_archive (title_ru);
CREATE OR REPLACE FUNCTION public.kinolab_import_title_batch(records jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE n integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.cinewave_is_admin() THEN
   RAISE EXCEPTION 'Not an authorized KinoLab administrator';
 END IF;
 IF jsonb_typeof(records) <> 'array' OR jsonb_array_length(records) > 300 THEN
   RAISE EXCEPTION 'Maximum 300 records per batch';
 END IF;
 WITH entries AS (
   SELECT (x->>'id')::bigint AS id, btrim(x->>'title') AS title
   FROM jsonb_array_elements(records) x
 ), valid AS (
   SELECT DISTINCT ON (id) id, title FROM entries
   WHERE id > 0 AND length(title) BETWEEN 1 AND 300 ORDER BY id
 ), inserted AS (
   INSERT INTO public.kinolab_title_archive(source_id,title_ru)
   SELECT id,title FROM valid
   ON CONFLICT (source_id) DO UPDATE SET title_ru=EXCLUDED.title_ru
   RETURNING 1
 )
 SELECT count(*) INTO n FROM inserted;
 RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.kinolab_import_title_batch(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kinolab_import_title_batch(jsonb) TO authenticated;
COMMIT;
