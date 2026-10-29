-- STAGING ONLY: zayssiouqexwdicudalc (CineWave-Test-).
-- Creates a private, atomic daily Gemini request budget.
-- Deployment order: run this SQL FIRST, then deploy the staged Edge Function.
-- No existing policies, movie records, or production resources are changed.
BEGIN;

CREATE TABLE IF NOT EXISTS cinewave_private.ai_daily_usage (
  usage_day date NOT NULL,
  user_id uuid NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  last_request_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usage_day, user_id)
);

ALTER TABLE cinewave_private.ai_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE cinewave_private.ai_daily_usage FROM PUBLIC, anon, authenticated;

-- Callable only with a server-side secret key. Not callable by browser sessions.
-- All callers serialize on one transaction-level advisory lock so that the
-- aggregate daily cap cannot be bypassed with parallel requests.
CREATE OR REPLACE FUNCTION public.cinewave_ai_claim_quota(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.now();
  v_day date := (pg_catalog.now() AT TIME ZONE 'UTC')::date;
  v_user_count integer := 0;
  v_last_request timestamptz;
  v_global_count bigint := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('allowed', false, 'reason', 'invalid_user');
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(2026, 1029);

  SELECT request_count, last_request_at
  INTO v_user_count, v_last_request
  FROM cinewave_private.ai_daily_usage
  WHERE usage_day = v_day AND user_id = p_user_id;

  -- No parallel or rapid requests from one account.
  IF v_last_request IS NOT NULL
     AND v_last_request > v_now - INTERVAL '20 seconds' THEN
    RETURN pg_catalog.jsonb_build_object('allowed', false, 'reason', 'cooldown');
  END IF;

  -- Up to five requests per account per UTC day.
  IF pg_catalog.coalesce(v_user_count, 0) >= 5 THEN
    RETURN pg_catalog.jsonb_build_object('allowed', false, 'reason', 'daily_limit');
  END IF;

  -- Shared safeguard against mass sign-ups exhausting the provider quota.
  SELECT pg_catalog.coalesce(pg_catalog.sum(request_count), 0)
  INTO v_global_count
  FROM cinewave_private.ai_daily_usage
  WHERE usage_day = v_day;

  IF v_global_count >= 40 THEN
    RETURN pg_catalog.jsonb_build_object('allowed', false, 'reason', 'global_limit');
  END IF;

  INSERT INTO cinewave_private.ai_daily_usage AS usage
    (usage_day, user_id, request_count, last_request_at)
  VALUES (v_day, p_user_id, 1, v_now)
  ON CONFLICT (usage_day, user_id)
  DO UPDATE SET
    request_count = usage.request_count + 1,
    last_request_at = EXCLUDED.last_request_at;

  RETURN pg_catalog.jsonb_build_object(
    'allowed', true,
    'remaining_today', 4 - pg_catalog.coalesce(v_user_count, 0)
  );
END;
$function$;

-- Functions are executable by PUBLIC by default; close that hole before commit.
REVOKE ALL ON FUNCTION public.cinewave_ai_claim_quota(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cinewave_ai_claim_quota(uuid) TO service_role;

COMMIT;

-- Optional read-only verification (SQL Editor):
-- SELECT has_function_privilege('anon',
--   'public.cinewave_ai_claim_quota(uuid)', 'EXECUTE') AS anon_execute,
--   has_function_privilege('authenticated',
--   'public.cinewave_ai_claim_quota(uuid)', 'EXECUTE') AS user_execute,
--   has_function_privilege('service_role',
--   'public.cinewave_ai_claim_quota(uuid)', 'EXECUTE') AS server_execute;
