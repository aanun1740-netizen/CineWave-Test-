// Backup of the working staging Supabase Edge Function supplied by the user.
// cinewave-ai, project zayssiouqexwdicudalc, 2026-10-29.
// To roll back, paste the function code below (without these two comment lines)
// into the SAME staging Supabase Edge Function and deploy.
import { createSupabaseContext } from "npm:@supabase/server@1";

const allowedOrigin = "https://aanun1740-netizen.github.io";

const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Vary": "Origin",
};

function reply(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: cors,
  });
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (req.headers.get("origin") !== allowedOrigin) {
      return reply({ error: "Forbidden origin" }, 403);
    }

    if (req.method !== "POST") {
      return reply({ error: "Method not allowed" }, 405);
    }

    // Only authenticated users.
    const { data: ctx, error: authError } =
      await createSupabaseContext(req, { auth: "user" });

    if (authError || !ctx) {
      return reply({ error: "Sign in required" }, 401);
    }

    // Admin-only during testing.
    const { data: isAdmin, error: roleError } =
      await ctx.supabase.rpc("cinewave_is_admin");

    if (roleError || isAdmin !== true) {
      return reply({ error: "Admin testing only" }, 403);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return reply({ error: "Invalid JSON" }, 400);
    }

    const message = body?.message;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 500
    ) {
      return reply({ error: "Invalid message" }, 400);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return reply({ error: "Gemini API key missing" }, 503);
    }

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            model: "gemini-3.5-flash-lite",
            store: false,
            system_instruction:
              "You are MovieLab AI, a friendly movie assistant. " +
              "Reply in the user's language: Armenian, Russian or English. " +
              "Recommend interesting movies and explain your choices briefly. " +
              "Do not claim that movies are available on MovieLab " +
              "unless their availability has been confirmed.",
            input: message.trim(),
          }),
        },
      );

      if (!response.ok) {
        console.error("Gemini request failed:", response.status);
        return reply({ error: "Gemini provider unavailable" }, 502);
      }

      const data = await response.json();

      const answer = (data.steps || [])
        .filter((step: any) => step.type === "model_output")
        .flatMap((step: any) => step.content || [])
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join("\n")
        .trim();

      return reply({
        answer: answer || "Please try another movie question.",
      });
    } catch (error) {
      console.error("Gemini connection failed");
      return reply({ error: "AI request failed" }, 502);
    }
  },
};
