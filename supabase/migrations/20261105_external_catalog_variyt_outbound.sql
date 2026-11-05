-- STAGING ONLY: recognize a second, narrow external movie-link format.
-- Variyt is outbound-link only: do not embed or relay its player.
-- Retain admin-only RLS and the external-link terms acknowledgment.
-- Existing records, movie/TV metadata, and other restrictions stay unchanged.
BEGIN;

DO $$
DECLARE
  previous_check text;
BEGIN
  -- Rerunning this migration should not drop the new provider allowlist.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.kinolab_external_catalog'::regclass
      AND conname = 'kinolab_external_watch_url_allowed'
  ) THEN
    RETURN;
  END IF;

  -- The original column CHECK was unnamed and PostgreSQL generated its name.
  -- Inspect the definition rather than assuming an internal constraint name.
  SELECT conname INTO previous_check
    FROM pg_constraint
    WHERE conrelid = 'public.kinolab_external_catalog'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%external_watch_url%'
      AND pg_get_constraintdef(oid) LIKE '%nextembed%'
    ORDER BY oid
    LIMIT 1;

  IF previous_check IS NULL THEN
    RAISE EXCEPTION 'Existing NextEmbed watch URL constraint was not found. No changes were made.';
  END IF;

  EXECUTE format('ALTER TABLE public.kinolab_external_catalog DROP CONSTRAINT %I', previous_check);

  ALTER TABLE public.kinolab_external_catalog
    ADD CONSTRAINT kinolab_external_watch_url_allowed
    CHECK (
      external_watch_url ~ '^https://api[.]nextembed[.]ws/embed/(movie|tv)/[0-9]+(/[0-9]+/[0-9]+)?/?$'
      OR external_watch_url ~ '^https://api[.]variyt[.]ws/embed/movie/[0-9]+/?$'
    );
END
$$;
COMMIT;
