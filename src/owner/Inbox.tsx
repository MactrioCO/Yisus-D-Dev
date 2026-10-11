import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logActivity } from "../lib/owner-auth";
import { getSupabase } from "../lib/supabase";

/** Mactrio Inbox: bandeja de atención humana con realtime. */

type Status = "bot" | "pending_human" | "human" | "resolved" | "closed";
interface Conv { id: string; visitor_name: string; status: Status; handoff_requested: boolean; last_message_at: string; created_at: string; }
interface Msg { id: string; sender: string; body: string; created_at: string; }

const FILTERS: { v: Status | "all"; label: string }[] = [
  { v: "all", label: "Todas" }, { v: "pending_human", label: "Pendientes" },
  { v: "human", label: "En atención" }, { v: "bot", label: "Con bot" },
  { v: "resolved", label: "Resueltas" }, { v: "closed", label: "Cerradas" },
];

export default function Inbox() {
  const [list, setList] = useState<Conv[]>([]);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const loadList = async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from("chat_conversations").select("*").order("last_message_at", { ascending: false }).limit(100);
    setList((data ?? []) as Conv[]);
  };

  useEffect(() => { loadList(); }, []);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const ch = sb.channel("owner-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => loadList())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p) => {
        const m = p.new as Msg & { conversation_id: string };
        if (m.conversation_id === sel) setMsgs((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]));
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sel]);

  useEffect(() => {
    if (!sel) return;
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const { data } = await sb.from("chat_messages").select("*").eq("conversation_id", sel).order("created_at");
      setMsgs((data ?? []) as Msg[]);
      boxRef.current?.scrollTo({ top: 99999 });
    })();
  }, [sel]);

  const conv = list.find((c) => c.id === sel);

  const setStatus = async (status: Status) => {
    const sb = getSupabase();
    if (!sb || !sel) return;
    await sb.from("chat_conversations").update({ status, handoff_requested: status === "pending_human" }).eq("id", sel);
    if (status === "resolved" || status === "closed") {
      await sb.from("chat_handoff_requests").update({ handled: true }).eq("conversation_id", sel);
    }
    await logActivity("inbox.status", { conversation: sel, status });
    await loadList();
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    const text = reply.trim().slice(0, 4000);
    if (!sb || !sel || !text || sending) return;
    setSending(true);
    // Tomar el control automáticamente al responder
    await sb.from("chat_conversations").update({ status: "human", last_message_at: new Date().toISOString() }).eq("id", sel);
    await sb.from("chat_messages").insert({ conversation_id: sel, sender: "owner", body: text });
    await logActivity("inbox.reply", { conversation: sel });
    setReply("");
    setSending(false);
    await loadList();
  };

  const filtered = list.filter((c) =>
    (filter === "all" || c.status === filter) &&
    (!q || c.id.toLowerCase().includes(q.toLowerCase()) || (c.visitor_name ?? "").toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div>
      <h1 className="font-display mb-5 text-2xl font-bold text-white">Mactrio Inbox</h1>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button key={f.v} onClick={() => setFilter(f.v)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${filter === f.v ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white" : "bg-white/[0.05] text-slate-400 hover:text-white"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por id o nombre…"
            aria-label="Buscar conversaciones"
            className="mb-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/60" />
          <ul className="max-h-[52vh] space-y-1.5 overflow-y-auto">
            {filtered.length === 0 && <li className="p-4 text-center text-sm text-slate-600">Sin conversaciones.</li>}
            {filtered.map((c) => (
              <li key={c.id}>
                <button onClick={() => setSel(c.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left ${sel === c.id ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono2 text-xs text-slate-300">{c.id.slice(0, 8)}…</span>
                    {c.status === "pending_human" && <span className="h-2 w-2 rounded-full bg-amber-400" aria-label="nueva solicitud" />}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="rounded bg-white/10 px-1.5 py-0.5">{c.status}</span>
                    <span>{new Date(c.last_message_at).toLocaleString()}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-h-[50vh] flex-col rounded-2xl border border-white/10 bg-white/[0.02]">
          {!conv ? (
            <p className="m-auto p-8 text-center text-sm text-slate-500">Selecciona una conversación.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
                <span className="font-mono2 text-xs text-slate-400">{conv.id}</span>
                <span className="ml-auto flex flex-wrap gap-1.5">
                  {(["bot", "pending_human", "human", "resolved", "closed"] as Status[]).map((st) => (
                    <button key={st} onClick={() => setStatus(st)} disabled={conv.status === st}
                      className={`rounded-lg px-2 py-1 text-[11px] font-medium ${conv.status === st ? "bg-cyan-500/20 text-cyan-200" : "bg-white/[0.05] text-slate-400 hover:text-white"}`}>
                      {st === "bot" ? "Al bot" : st === "pending_human" ? "Pendiente" : st === "human" ? "Atender" : st === "resolved" ? "Resolver" : "Cerrar"}
                    </button>
                  ))}
                </span>
              </div>
              {conv.status !== "human" && conv.status !== "pending_human" && (
                <p className="border-b border-white/[0.07] px-4 py-2 text-xs text-slate-500">
                  {conv.status === "bot" ? "El bot responde automáticamente." : "Conversación finalizada. Cámbiala a “Atender” para retomarla."}
                </p>
              )}
              <div ref={boxRef} className="flex-1 space-y-2.5 overflow-y-auto p-4" aria-live="polite">
                {msgs.map((m) => (
                  <p key={m.id} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    m.sender === "visitor" ? "ml-auto bg-white/[0.06] text-slate-200"
                    : m.sender === "owner" ? "border border-emerald-400/25 bg-emerald-400/10 text-slate-100"
                    : "border border-white/10 bg-violet-500/10 text-slate-200"}`}>
                    <span className="font-mono2 mb-0.5 block text-[10px] uppercase tracking-widest text-slate-500">{m.sender}</span>
                    {m.body}
                  </p>
                ))}
              </div>
              <form onSubmit={sendReply} className="flex gap-2 border-t border-white/10 p-3">
                <label htmlFor="owner-reply" className="sr-only">Responder como Yisus</label>
                <input id="owner-reply" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000}
                  placeholder="Responder como Yisus…" autoComplete="off"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/60" />
                <button type="submit" disabled={sending || !reply.trim()} aria-label="Enviar respuesta"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
