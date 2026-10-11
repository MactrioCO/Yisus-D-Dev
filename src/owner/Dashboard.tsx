import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

interface Stats {
  projPub: number; projDraft: number; newsPub: number;
  convTotal: number; convPending: number; convHuman: number; convResolved: number;
  messages: number; contact: number; unanswered: number;
}

export default function Dashboard({ go }: { go: (hash: string) => void }) {
  const [s, setS] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<{ action: string; created_at: string; details: unknown }[]>([]);
  const [recent, setRecent] = useState<{ id: string; status: string; last_message_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const cnt = async (table: string, col: string, val: string | boolean) => {
        const { count } = await sb.from(table).select("id", { count: "exact", head: true }).eq(col, val);
        return count ?? 0;
      };
      const total = async (table: string) => {
        const { count } = await sb.from(table).select("id", { count: "exact", head: true });
        return count ?? 0;
      };
      const [projPub, projDraft, newsPub, convTotal, convPending, convHuman, convResolved, messages, contact, unanswered] = await Promise.all([
        cnt("projects", "is_published", true),
        cnt("projects", "is_published", false),
        cnt("news_posts", "status", "published"),
        total("chat_conversations"),
        cnt("chat_conversations", "status", "pending_human"),
        cnt("chat_conversations", "status", "human"),
        cnt("chat_conversations", "status", "resolved"),
        total("chat_messages"),
        total("contact_messages"),
        cnt("chatbot_unanswered", "reviewed", false),
      ]);
      setS({ projPub, projDraft, newsPub, convTotal, convPending, convHuman, convResolved, messages, contact, unanswered });
      const { data: act } = await sb.from("admin_activity_logs").select("action,created_at,details").order("created_at", { ascending: false }).limit(8);
      setActivity((act ?? []) as { action: string; created_at: string; details: unknown }[]);
      const { data: rc } = await sb.from("chat_conversations").select("id,status,last_message_at").order("last_message_at", { ascending: false }).limit(5);
      setRecent((rc ?? []) as { id: string; status: string; last_message_at: string }[]);
    })();
  }, []);

  const cards: { label: string; value: number; target: string; accent?: boolean }[] = s
    ? [
        { label: "Proyectos publicados", value: s.projPub, target: "#/owner/proyectos" },
        { label: "Proyectos en borrador", value: s.projDraft, target: "#/owner/proyectos" },
        { label: "Novedades publicadas", value: s.newsPub, target: "#/owner/novedades" },
        { label: "Conversaciones totales", value: s.convTotal, target: "#/owner/inbox" },
        { label: "Pendientes de humano", value: s.convPending, target: "#/owner/inbox", accent: s.convPending > 0 },
        { label: "En atención humana", value: s.convHuman, target: "#/owner/inbox" },
        { label: "Resueltas", value: s.convResolved, target: "#/owner/inbox" },
        { label: "Mensajes del buzón", value: s.contact, target: "#/owner/actividad" },
        { label: "Preguntas sin respuesta", value: s.unanswered, target: "#/owner/bot" },
      ]
    : [];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Datos reales de Supabase. Sin cifras ficticias: vacío es vacío.</p>

      {!s ? (
        <p className="py-10 text-center text-sm text-slate-500">Cargando indicadores…</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <button key={c.label} onClick={() => go(c.target)}
              className={`rounded-2xl border p-5 text-left transition-colors hover:border-cyan-400/40 ${c.accent ? "border-amber-400/40 bg-amber-400/[0.06]" : "border-white/10 bg-white/[0.02]"}`}>
              <p className="font-display text-3xl font-bold text-white">{c.value}</p>
              <p className="mt-1 text-[13px] text-slate-400">{c.label}</p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="font-display font-semibold text-white">Conversaciones recientes</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Aún no hay conversaciones. Aparecerán cuando alguien use el chat.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recent.map((r) => (
                <li key={r.id}>
                  <button onClick={() => go("#/owner/inbox")} className="flex w-full items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-left text-[13px] hover:bg-white/[0.06]">
                    <span className="font-mono2 text-slate-400">{r.id.slice(0, 8)}…</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-300">{r.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="font-display font-semibold text-white">Actividad administrativa</h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Sin actividad registrada todavía.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-[13px]">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3.5 py-2.5">
                  <span className="font-mono2 truncate text-slate-300">{a.action}</span>
                  <span className="shrink-0 text-xs text-slate-600">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
