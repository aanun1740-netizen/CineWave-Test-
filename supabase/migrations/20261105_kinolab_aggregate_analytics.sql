-- Apply ONLY in the KinoLab-Test Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zayssiouqexwdicudalc/sql/new
--
-- Cookie-free aggregate metrics. No IP address, user ID, search text, URL,
-- referer or individual event rows are recorded by this schema.
-- Counts are approximate: anonymous API calls can be automated/spammed.
-- Requires existing public.cinewave_is_admin() and both film catalogs.
-- Do NOT run in production without a separate explicit release approval.
BEGIN;

CREATE SCHEMA IF NOT EXISTS kinolab_analytics;
REVOKE ALL ON SCHEMA kinolab_analytics FROM PUBLIC;
GRANT USAGE ON SCHEMA kinolab_analytics TO anon, authenticated;

CREATE TABLE IF NOT EXISTS kinolab_analytics.daily_metrics (
  event_day date NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('page_view','film_open','watch_click')),
  movie_key text NOT NULL DEFAULT '' CHECK (
    movie_key = '' OR movie_key ~ '^catalog:(external:)?[1-9][0-9]{0,17}$'
  ),
  language text NOT NULL CHECK (language IN ('hy','ru','en')),
  device_type text NOT NULL CHECK (device_type IN ('mobile','desktop')),
  total bigint NOT NULL DEFAULT 0 CHECK (total BETWEEN 0 AND 1000000000),
  PRIMARY KEY(event_day,event_type,movie_key,language,device_type)
);
ALTER TABLE kinolab_analytics.daily_metrics ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON kinolab_analytics.daily_metrics FROM PUBLIC, anon, authenticated;

-- Private implementation: the wrapper in the exposed public schema is
-- SECURITY INVOKER. Privileged table writes remain in this non-exposed schema.
CREATE OR REPLACE FUNCTION kinolab_analytics.record_private(
  p_event text, p_movie_key text, p_language text, p_device text
) RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  film_id bigint;
  today_utc date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  IF p_event IS NULL OR p_event NOT IN ('page_view','film_open','watch_click')
    OR p_language IS NULL OR p_language NOT IN ('hy','ru','en')
    OR p_device IS NULL OR p_device NOT IN ('mobile','desktop')
    OR p_movie_key IS NULL THEN
    RETURN;
  END IF;

  IF p_event = 'page_view' THEN
    IF p_movie_key <> '' THEN RETURN; END IF;
  ELSE
    IF p_movie_key !~ '^catalog:(external:)?[1-9][0-9]{0,17}$' THEN RETURN; END IF;
    IF p_movie_key LIKE 'catalog:external:%' THEN
      film_id := substring(p_movie_key FROM '^catalog:external:([0-9]+)$')::bigint;
      IF NOT EXISTS (
        SELECT 1 FROM public.kinolab_external_catalog
         WHERE id = film_id AND is_published = true
      ) THEN RETURN; END IF;
    ELSE
      film_id := substring(p_movie_key FROM '^catalog:([0-9]+)$')::bigint;
      IF NOT EXISTS (
        SELECT 1 FROM public.movies WHERE id = film_id AND is_published = true
      ) THEN RETURN; END IF;
    END IF;
  END IF;

  INSERT INTO kinolab_analytics.daily_metrics
    (event_day,event_type,movie_key,language,device_type,total)
  VALUES(today_utc,p_event,p_movie_key,p_language,p_device,1)
  ON CONFLICT(event_day,event_type,movie_key,language,device_type)
  DO UPDATE SET total = LEAST(kinolab_analytics.daily_metrics.total + 1,1000000000);
END;
$$;
REVOKE ALL ON FUNCTION kinolab_analytics.record_private(text,text,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION kinolab_analytics.record_private(text,text,text,text)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.kinolab_record_event(
  p_event text, p_movie_key text DEFAULT '',
  p_language text DEFAULT 'hy', p_device text DEFAULT 'desktop'
) RETURNS void LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT kinolab_analytics.record_private(p_event,p_movie_key,p_language,p_device);
$$;
REVOKE ALL ON FUNCTION public.kinolab_record_event(text,text,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kinolab_record_event(text,text,text,text)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION kinolab_analytics.read_private(p_days integer)
RETURNS TABLE(
  event_day date, event_type text, movie_key text,
  language text, device_type text, total bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.cinewave_is_admin() THEN
    RAISE EXCEPTION 'Analytics access denied' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT m.event_day,m.event_type,m.movie_key,m.language,m.device_type,m.total
    FROM kinolab_analytics.daily_metrics AS m
    WHERE m.event_day >= (now() AT TIME ZONE 'UTC')::date
      - LEAST(GREATEST(COALESCE(p_days,30),1),90) + 1
    ORDER BY m.event_day DESC, m.total DESC;
END;
$$;
REVOKE ALL ON FUNCTION kinolab_analytics.read_private(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION kinolab_analytics.read_private(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.kinolab_get_metrics(p_days integer DEFAULT 30)
RETURNS TABLE(
  event_day date, event_type text, movie_key text,
  language text, device_type text, total bigint
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
 SELECT * FROM kinolab_analytics.read_private(p_days);
$$;
REVOKE ALL ON FUNCTION public.kinolab_get_metrics(integer)
 FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kinolab_get_metrics(integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Data retention: aggregate counters only, no personal visitor identifiers.
-- To remove data older than 90 UTC days during periodic maintenance, run:
-- DELETE FROM kinolab_analytics.daily_metrics
-- WHERE event_day < (now() AT TIME ZONE 'UTC')::date - 90;
