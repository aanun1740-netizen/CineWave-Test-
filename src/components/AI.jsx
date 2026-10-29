import { useEffect, useRef, useState } from "react";
import { backendFetch, config, client } from "../services/backend";

function aiErrorStatus(code, status) {
  if (code === "cooldown") return "aiCooldown";
  if (code === "daily_limit") return "aiDailyLimit";
  if (code === "global_limit") return "aiGlobalLimit";
  if (code === "provider_limit") return "aiProviderLimit";
  if (code === "message_too_long") return "aiTooLong";
  if (code === "sign_in_required" || status === 401) return "aiSignIn";
  return "aiError";
}

export default function AI({ open, setOpen, t }) {
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const input = useRef(null);
  const panel = useRef(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    if (panel.current) panel.current.scrollTop = panel.current.scrollHeight;
  }, [messages]);

  async function submit(event) {
    event.preventDefault();
    if (!message.trim() || busy) return;
    const value = message.trim();
    setMessage("");
    setBusy(true);
    setMessages((prev) => [
      ...prev,
      { text: value, user: true },
      { status: "aiThinking" },
    ]);

    try {
      const { data, error } = await client.auth.getSession();
      const token = data?.session?.access_token;
      if (error || !token) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { status: "aiSignIn" },
        ]);
        return;
      }

      const response = await backendFetch(
        `${config.url}/functions/v1/cinewave-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: config.key,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: value }),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { status: aiErrorStatus(payload?.error, response.status) },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev.slice(0, -1),
        typeof payload?.answer === "string" && payload.answer.trim()
          ? { text: payload.answer }
          : { status: "aiNoAnswer" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { status: "aiError" },
      ]);
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  }

  return (
    <>
      <button
        id="cw-ai-button"
        onClick={() => setOpen(!open)}
        aria-controls="cw-ai-panel"
        aria-expanded={open}
      >
        ✦ <span>MovieLab AI</span>
      </button>
      <section
        id="cw-ai-panel"
        role="dialog"
        aria-labelledby="cw-ai-title"
        hidden={!open}
      >
        <header id="cw-ai-head">
          <div>
            <span className="eyebrow">{t("aiEyebrow")}</span>
            <h2 id="cw-ai-title">MovieLab AI</h2>
          </div>
          <button
            id="cw-ai-close"
            onClick={() => setOpen(false)}
            aria-label={t("aiClose")}
          >
            ×
          </button>
        </header>
        <div id="cw-ai-messages" ref={panel} aria-live="polite">
          <div className="cw-ai-msg cw-ai-bot">{t("aiWelcome")}</div>
          {messages.map((row, i) => (
            <div
              key={i}
              className={`cw-ai-msg cw-ai-${row.user ? "user" : "bot"}`}
            >
              {row.status ? t(row.status) : row.text}
            </div>
          ))}
        </div>
        <form id="cw-ai-form" onSubmit={submit}>
          <input
            ref={input}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            id="cw-ai-input"
            aria-label={t("aiMessage")}
            placeholder={t("aiPlaceholder")}
            maxLength={400}
            required
            disabled={busy}
          />
          <button id="cw-ai-send" disabled={busy} aria-label={t("aiSend")}>
            ↑
          </button>
        </form>
      </section>
    </>
  );
}
