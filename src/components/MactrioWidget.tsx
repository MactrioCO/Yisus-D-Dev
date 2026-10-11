import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RotateCcw, Send, User, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicContent } from "../lib/cms";
import { answerQuestion } from "../lib/mactrio/engine";
import { getSupabase } from "../lib/supabase";

interface Msg { id: string; sender: "visitor" | "bot" | "owner"; body: string; created_at: string; }
type Status = "bot" | "pending_human" | "human" | "resolved" | "closed";

const CONV_KEY = "mactrio_conv_id";
const FN_URL = import.meta.env.VITE_MACTRIO_FUNCTION_URL as string | undefined;

export default function MactrioWidget({ content }: { content: PublicContent }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("bot");
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [suggest, setSuggest] = useState<string[]>(content.bot.suggestions);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }));
  }, []);
  useEffect(scrollDown, [msgs, open, scrollDown]);

  // Sesión anónima + conversación
  useEffect(() => {
    if (!open || ready) return;
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const { data: { session } } = await sb.auth.getSession();
      let user = session?.user ?? null;
      if (!user) {
        // Requiere "Anonymous sign-ins" activado en Supabase → Auth → Providers.
        const { data, error } = await sb.auth.signInAnonymously();
        if (error || !data.user) return;
        user = data.user;
      }
      const stored = localStorage.getItem(CONV_KEY);
      let conv: { id: string; status: Status } | null = null;
      if (stored) {
        const { data } = await sb.from("chat_conversations").select("id,status").eq("id", stored).maybeSingle();
        if (data) conv = data as { id: string; status: Status };
      }
      if (!conv) {
        const { data, error } = await sb.from("chat_conversations")
          .insert({ visitor_user_id: user.id }).select("id,status").single();
        if (error || !data) return;
        conv = data as { id: string; status: Status };
        localStorage.setItem(CONV_KEY, conv.id);
        await sb.from("chat_messages").insert({ conversation_id: conv.id, sender: "bot", body: content.bot.welcome });
      }
      setConvId(conv.id);
      setStatus(conv.status);
      const { data: m } = await sb.from("chat_messages").select("*").eq("conversation_id", conv.id).order("created_at");
      setMsgs((m ?? []) as Msg[]);
      setReady(true);
    })();
  }, [open, ready, content.bot.welcome]);

  // Realtime + polling de respaldo
  useEffect(() => {
    if (!open || !convId) return;
    const sb = getSupabase();
    if (!sb) return;
    const ch = sb.channel(`mactrio-${convId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${convId}` },
        (p) => setMsgs((ms) => (ms.some((m) => m.id === (p.new as Msg).id) ? ms : [...ms, p.new as Msg])))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_conversations", filter: `id=eq.${convId}` },
        (p) => setStatus((p.new as { status: Status }).status))
      .subscribe();
    const poll = setInterval(async () => {
      const { data: m } = await sb.from("chat_messages").select("*").eq("conversation_id", convId).order("created_at");
      if (m) setMsgs(m as Msg[]);
      const { data: c } = await sb.from("chat_conversations").select("status").eq("id", convId).maybeSingle();
      if (c) setStatus((c as { status: Status }).status);
    }, 15000);
    return () => {
      sb.removeChannel(ch);
      clearInterval(poll);
    };
  }, [open, convId]);

  useEffect(() => {
    localStorage.removeItem("mactrio:fab"); // limpieza de la posición arrastrable anterior
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pushBot = useCallback(async (cid: string, text: string) => {
    setTyping(true);
    await new Promise((r) => setTimeout(r, 850));
    const sb = getSupabase();
    if (sb) await sb.from("chat_messages").insert({ conversation_id: cid, sender: "bot", body: text });
    setTyping(false);
  }, []);

  const requestHandoff = useCallback(async (reason: string) => {
    const sb = getSupabase();
    if (!sb || !convId) return;
    await sb.from("chat_conversations").update({ status: "pending_human", handoff_requested: true }).eq("id", convId);
    await sb.from("chat_handoff_requests").insert({ conversation_id: convId, reason });
    setStatus("pending_human");
    await pushBot(convId, content.bot.absence);
  }, [convId, pushBot, content.bot.absence]);

  const send = useCallback(async (raw?: string) => {
    const text = (raw ?? input).trim().slice(0, 1000);
    const sb = getSupabase();
    if (!text || !sb || !convId || sending) return;
    if (status === "resolved" || status === "closed") return;
    setSending(true);
    setInput("");
    setSuggest([]);
    await sb.from("chat_messages").insert({ conversation_id: convId, sender: "visitor", body: text });
    await sb.from("chat_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", convId);

    if (status === "bot") {
      let answer = answerQuestion(text, content);
      // Vía endurecida: Edge Function si está configurada (con fallback local)
      if (FN_URL) {
        try {
          const { data: { session } } = await sb.auth.getSession();
          const res = await fetch(FN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
            body: JSON.stringify({ conversation_id: convId, message: text }),
          });
          if (res.ok) {
            const j = await res.json();
            if (typeof j.reply === "string" && j.reply) answer = { text: j.reply, answered: j.answered !== false, suggestions: j.suggestions ?? [] };
          }
        } catch { /* fallback local */ }
      }
      if (answer.text === "__HANDOFF__") {
        await pushBot(convId, "Con gusto te paso con un humano. Registro tu solicitud ahora mismo…");
        await requestHandoff(text);
      } else {
        await pushBot(convId, answer.text);
        if (!answer.answered) {
          await sb.from("chatbot_unanswered").insert({ question: text, conversation_id: convId });
        }
        if (answer.suggestions.length) setSuggest(answer.suggestions);
      }
    }
    setSending(false);
    inputRef.current?.focus();
  }, [input, convId, sending, status, content, pushBot, requestHandoff]);

  const newConversation = async () => {
    localStorage.removeItem(CONV_KEY);
    setReady(false);
    setMsgs([]);
    setStatus("bot");
    setSuggest(content.bot.suggestions);
  };

  if (!getSupabase()) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Cerrar chat de Mactrio Bot" : "Abrir chat de Mactrio Bot"}
        className="btn-primary fixed! bottom-24 right-5 z-[65] grid h-14 w-14 place-items-center rounded-full text-white shadow-2xl"
      >
        {open ? (
          <X size={22} />
        ) : (
          <img src="/mactrio-bot.png" alt="" width={44} height={44} draggable={false} className="h-11 w-11 rounded-full object-cover ring-2 ring-white/30" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Conversación con Mactrio Bot"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="glass fixed! bottom-[168px] right-5 z-[65] flex h-[min(560px,62vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl shadow-2xl"
          >
            <header className="flex items-center gap-3 border-b border-white/10 bg-black/30 px-4 py-3">
              <img src="/mactrio-bot.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-white">Mactrio Bot</p>
                <p className="font-mono2 truncate text-[11px] text-slate-500">
                  {status === "human" ? "Yisus te está atendiendo" : status === "pending_human" ? "Solicitud registrada" : status === "resolved" ? "Conversación resuelta" : "asistente de Yisus D Dev"}
                </p>
              </div>
              {(status === "resolved" || status === "closed") && (
                <button onClick={newConversation} aria-label="Iniciar nueva conversación" className="btn-ghost grid h-8 w-8 place-items-center rounded-lg text-slate-300">
                  <RotateCcw size={15} />
                </button>
              )}
            </header>

            <div ref={boxRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              <p className="font-mono2 rounded-lg bg-white/[0.03] p-2.5 text-[11px] leading-relaxed text-slate-500">
                Esta conversación se guarda para gestionar tu consulta. No compartas contraseñas ni datos sensibles.
              </p>
              {msgs.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                  {m.sender !== "visitor" && (
                    m.sender === "owner" ? (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
                        <User size={14} />
                      </span>
                    ) : (
                      <img src="/mactrio-bot.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
                    )
                  )}
                  <p className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    m.sender === "visitor" ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                    : m.sender === "owner" ? "border border-emerald-400/25 bg-emerald-400/10 text-slate-100"
                    : "border border-white/10 bg-white/[0.05] text-slate-200"}`}>
                    {m.sender === "owner" && <span className="font-mono2 mb-1 block text-[10px] uppercase tracking-widest text-emerald-300">Yisus</span>}
                    {m.body}
                  </p>
                </div>
              ))}
              {typing && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 size={15} className="animate-spin" />
                  <span className="font-mono2 text-xs">Mactrio está escribiendo…</span>
                </div>
              )}
              {status === "pending_human" && (
                <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-200">
                  Tu solicitud está registrada. Yisus la atenderá por aquí mismo; puedes seguir escribiendo.
                </p>
              )}
            </div>

            {suggest.length > 0 && status === "bot" && (
              <div className="flex gap-2 overflow-x-auto px-4 pb-2">
                {suggest.map((s) => (
                  <button key={s} onClick={() => send(s)} className="btn-ghost shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-slate-200">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2 border-t border-white/10 bg-black/30 p-3"
            >
              <label htmlFor="mactrio-input" className="sr-only">Escribe tu mensaje</label>
              <input
                id="mactrio-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={status === "resolved" || status === "closed" ? "Conversación finalizada" : "Escribe tu pregunta…"}
                disabled={sending || status === "resolved" || status === "closed"}
                maxLength={1000}
                autoComplete="off"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/60 disabled:opacity-50"
              />
              <button type="submit" disabled={sending || !input.trim()} aria-label="Enviar mensaje" className="btn-primary grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white disabled:opacity-50">
                <Send size={16} />
              </button>
            </form>
            {content.bot.handoff_enabled && (status === "bot") && (
              <button onClick={() => requestHandoff("solicitud manual desde el widget")} className="border-t border-white/[0.07] py-2 text-center text-xs font-medium text-cyan-300 hover:text-white">
                Hablar con un humano
              </button>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
