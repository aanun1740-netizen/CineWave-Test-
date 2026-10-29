// STAGING ONLY. Deploy manually to Supabase project zayssiouqexwdicudalc.
// "Verify JWT with legacy secret" may stay OFF; this handler verifies
// each JWT against Supabase Auth using auth.getUser(token) BEFORE quota/AI.
// Never expose the Gemini key or service-role key in browser responses.
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigin = "https://aanun1740-netizen.github.io";
const MAX_CHARS = 400;
const MAX_BODY_CHARS = 3000;
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Vary": "Origin",
};

function reply(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.headers.get("origin") !== allowedOrigin) {
      return reply({ error: "forbidden_origin" }, 403);
    }

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }
    if (req.method !== "POST") {
      return reply({ error: "method_not_allowed" }, 405);
    }
    if (!req.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return reply({ error: "json_required" }, 415);
    }
    const length = Number(req.headers.get("content-length") || 0);
    if (length > MAX_BODY_CHARS * 4) {
      return reply({ error: "message_too_long" }, 413);
    }

    // A user-supplied ID must never determine quota ownership. Verify the
    // signed-in user's JWT with Supabase Auth and obtain user.id from there.
    const jwt = req.headers.get("Authorization")?.match(/^Bearer (\S+)$/i)?.[1];
    if (!jwt) {
      return reply({ error: "sign_in_required" }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const publishableKey =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}").default;
    const secretKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
    if (!url || !publishableKey || !secretKey) {
      console.error("MovieLab AI Supabase configuration unavailable");
      return reply({ error: "server_unavailable" }, 503);
    }

    const userClient = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let userId: string;
    try {
      const { data: { user }, error } = await userClient.auth.getUser(jwt);
      if (error || !user?.id) {
        return reply({ error: "sign_in_required" }, 401);
      }
      userId = user.id;
    } catch {
      console.error("MovieLab AI authentication service unavailable");
      return reply({ error: "auth_unavailable" }, 503);
    }

    let message: string;
    try {
      const raw = await req.text();
      if (raw.length > MAX_BODY_CHARS) {
        return reply({ error: "message_too_long" }, 413);
      }
      const body = JSON.parse(raw);
      message = body?.message;
    } catch {
      return reply({ error: "invalid_json" }, 400);
    }
    if (typeof message !== "string" || !message.trim()) {
      return reply({ error: "invalid_message" }, 400);
    }
    message = message.trim();
    if (message.length > MAX_CHARS) {
      return reply({ error: "message_too_long" }, 413);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("MovieLab AI GEMINI_API_KEY is missing");
      return reply({ error: "provider_unavailable" }, 503);
    }

    // Atomic quota: five requests/account/day, 40 requests/project/day,
    // and a 20-second per-account cooldown. RPC can be called ONLY using
    // the server-only secret client; browsers have no EXECUTE privilege.
    let remainingToday = 0;
    try {
      const serviceClient = createClient(url, secretKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await serviceClient.rpc("cinewave_ai_claim_quota", {
        p_user_id: userId,
      });
      if (error || !data || data.allowed !== true) {
        if (error) {
          console.error("MovieLab AI quota RPC failed", error.code || "unknown");
          return reply({ error: "quota_unavailable" }, 503);
        }
        const reason = typeof data?.reason === "string" ? data.reason : "quota_unavailable";
        if (reason === "cooldown" || reason === "daily_limit" || reason === "global_limit") {
          return reply({ error: reason }, 429);
        }
        return reply({ error: "quota_unavailable" }, 503);
      }
      remainingToday = Number(data.remaining_today ?? 0);
    } catch {
      console.error("MovieLab AI quota connection failed");
      return reply({ error: "quota_unavailable" }, 503);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      let providerResponse: Response;
      try {
        providerResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              model: "gemini-3.5-flash-lite",
              store: false,
              system_instruction:
                "You are MovieLab AI, a friendly movie recommendation assistant. " +
                "Answer in the same language as the user (Armenian, Russian or English). " +
                "Offer concise, accurate movie suggestions. " +
                "Never claim a movie is available on MovieLab unless verified by the site.",
              input: message,
            }),
          },
        );
      } finally {
        clearTimeout(timeout);
      }

      if (!providerResponse.ok) {
        console.error("Gemini request failed", providerResponse.status);
        return reply(
          { error: providerResponse.status === 429 ? "provider_limit" : "provider_unavailable" },
          providerResponse.status === 429 ? 503 : 502,
        );
      }

      const payload = await providerResponse.json();
      const answer = (Array.isArray(payload.steps) ? payload.steps : [])
        .filter((step: any) => step.type === "model_output")
        .flatMap((step: any) => Array.isArray(step.content) ? step.content : [])
        .filter((part: any) => part.type === "text" && typeof part.text === "string")
        .map((part: any) => part.text)
        .join("\n")
        .trim()
        .slice(0, 6000);

      return reply({
        answer: answer || "Please try a different movie question.",
        remaining_today: remainingToday,
      });
    } catch (error) {
      console.error("MovieLab AI provider connection failed",
        error instanceof Error ? error.name : "unknown");
      return reply({ error: "provider_unavailable" }, 502);
    }
  },
};
