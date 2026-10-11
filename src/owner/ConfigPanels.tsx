import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { logActivity } from "../lib/owner-auth";
import { getSupabase } from "../lib/supabase";

/** Ajustes del panel: site_settings + chatbot_settings + actividad/buzón. */

function KeyValueEditor({ table, title, hint, labels }: { table: string; title: string; hint: string; labels?: Record<string, string> }) {
  const [rows, setRows] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  const load = async () => {
    const sb = getSupabase();
    if (!sb) return;
    setLoading(true);
    const { data } = await sb.from(table).select("key,value").order("key");
    setRows(((data ?? []) as { key: string; value: unknown }[]).map((r) => ({ key: r.key, value: JSON.stringify(r.value) })));
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [table]);

  /** Guarda: si el texto no es JSON, se guarda tal cual como texto simple. */
  const save = async (key: string, raw: string) => {
    const sb = getSupabase();
    if (!sb) return;
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { parsed = raw; }
    const { error } = await sb.from(table).upsert({ key, value: parsed });
    if (error) setMsg(`No se pudo guardar "${key}".`);
    else {
      setMsg(`"${key}" guardado.`);
      await logActivity(`${table}.update`, { key });
    }
  };

  const addKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const k = newKey.trim();
    if (!k) return;
    await save(k, newVal);
    setNewKey("");
    setNewVal("");
    await load();
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="font-display font-semibold text-white">{title}</h2>
      <p className="mt-1 text-[13px] text-slate-500">{hint}</p>
      {msg && <p role="status" className="mt-3 rounded-xl bg-white/[0.05] px-3 py-2 text-[13px] text-slate-300">{msg}</p>}
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Cargando…</p>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {rows.map((r) => (
              <li key={r.key} className="rounded-xl bg-black/20 p-3">
                <p className="font-mono2 mb-1.5 text-xs text-cyan-300">{labels?.[r.key] ?? r.key}</p>
                <textarea defaultValue={r.value} rows={2} id={`kv-${table}-${r.key}`} aria-label={r.key}
                  className="font-mono2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400/60" />
                <button
                  onClick={() => save(r.key, (document.getElementById(`kv-${table}-${r.key}`) as HTMLTextAreaElement).value)}
                  className="btn-ghost mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white">
                  Guardar
                </button>
              </li>
            ))}
            {rows.length === 0 && <li className="text-sm text-slate-600">Sin claves todavía.</li>}
          </ul>
          <form onSubmit={addKey} className="mt-4 flex flex-wrap items-end gap-2 border-t border-white/[0.07] pt-4">
            <div className="min-w-32 flex-1">
              <label htmlFor={`kv-add-${table}`} className="mb-1 block text-[12px] text-slate-500">Nueva clave</label>
              <input id={`kv-add-${table}`} value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="clave"
                className="font-mono2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400/60" />
            </div>
            <div className="min-w-40 flex-[2]">
              <label htmlFor={`kv-addval-${table}`} className="mb-1 block text-[12px] text-slate-500">Valor</label>
              <input id={`kv-addval-${table}`} value={newVal} onChange={(e) => setNewVal(e.target.value)} placeholder="texto o JSON"
                className="font-mono2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400/60" />
            </div>
            <button type="submit" className="btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white">
              <Plus size={13} /> Añadir
            </button>
          </form>
        </>
      )}
    </section>
  );
}

const SITE_LABELS: Record<string, string> = {
  email: "Correo de contacto (se muestra en el sitio)",
  whatsapp: "WhatsApp (solo números con código de país, ej: 573001234567)",
};

export function SiteSettings() {
  return (
    <div>
      <h1 className="font-display mb-5 text-2xl font-bold text-white">Ajustes</h1>
      <KeyValueEditor table="site_settings" title="Contacto y configuración general"
        hint="Escribe el valor directamente (texto plano). Solo datos NO sensibles: nada de contraseñas ni claves."
        labels={SITE_LABELS} />
    </div>
  );
}

const BOT_LABELS: Record<string, string> = {
  enabled: "Bot activado (true/false)",
  welcome: "Mensaje de bienvenida",
  suggestions: "Respuestas sugeridas",
  handoff_enabled: "Atención humana disponible (true/false)",
  absence: "Mensaje de ausencia / handoff",
};

export function BotSettings() {
  const [unanswered, setUnanswered] = useState<{ id: string; question: string; created_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const { data } = await sb.from("chatbot_unanswered").select("id,question,created_at").eq("reviewed", false).order("created_at", { ascending: false }).limit(30);
      setUnanswered((data ?? []) as { id: string; question: string; created_at: string }[]);
    })();
  }, []);

  const markReviewed = async (id: string) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("chatbot_unanswered").update({ reviewed: true }).eq("id", id);
    setUnanswered((u) => u.filter((x) => x.id !== id));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <KeyValueEditor table="chatbot_settings" title="Mactrio Bot"
        hint="El bot responde con lo que publiques en el panel (proyectos, servicios, FAQs). Ajusta aquí su tono y disponibilidad."
        labels={BOT_LABELS} />
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="font-display font-semibold text-white">Preguntas sin respuesta ({unanswered.length})</h2>
        <p className="mt-1 text-[13px] text-slate-500">Revísalas y conviértelas en FAQs o novedades.</p>
        <ul className="mt-4 space-y-2">
          {unanswered.length === 0 && <li className="text-sm text-slate-600">Nada pendiente. Buen bot.</li>}
          {unanswered.map((u) => (
            <li key={u.id} className="rounded-xl bg-black/20 p-3 text-sm text-slate-300">
              {u.question}
              <button onClick={() => markReviewed(u.id)} className="btn-ghost ml-2 rounded-lg px-2 py-1 text-xs text-slate-300">Revisada</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function ActivityView() {
  const [logs, setLogs] = useState<{ id: string; action: string; details: unknown; created_at: string }[]>([]);
  const [contact, setContact] = useState<{ id: string; name: string; email: string; subject: string; message: string; created_at: string; read: boolean }[]>([]);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const { data: l } = await sb.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(100);
      setLogs((l ?? []) as { id: string; action: string; details: unknown; created_at: string }[]);
      const { data: c } = await sb.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50);
      setContact((c ?? []) as { id: string; name: string; email: string; subject: string; message: string; created_at: string; read: boolean }[]);
    })();
  }, []);

  const toggleRead = async (m: { id: string; read: boolean }) => {
    const sb = getSupabase();
    if (!sb) return;
    const next = !m.read;
    setContact((cs) => cs.map((c) => (c.id === m.id ? { ...c, read: next } : c)));
    await sb.from("contact_messages").update({ read: next }).eq("id", m.id);
    await logActivity("contact_messages.read", { id: m.id, read: next });
  };

  const removeMessage = async (m: { id: string; subject: string }) => {
    if (!window.confirm(`¿Borrar el mensaje "${m.subject}"? No se puede deshacer.`)) return;
    const sb = getSupabase();
    if (!sb) return;
    setContact((cs) => cs.filter((c) => c.id !== m.id));
    await sb.from("contact_messages").delete().eq("id", m.id);
    await logActivity("contact_messages.delete", { id: m.id });
  };

  const unread = contact.filter((c) => !c.read).length;

  return (
    <div>
      <h1 className="font-display mb-5 text-2xl font-bold text-white">Actividad y buzón</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="font-display font-semibold text-white">
            Buzón de contacto ({contact.length}{unread > 0 ? ` · ${unread} sin leer` : ""})
          </h2>
          <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
            {contact.length === 0 && (
              <li className="text-sm text-slate-600">Sin mensajes. Los enviados desde el formulario de la web aparecen aquí al instante.</li>
            )}
            {contact.map((m) => (
              <li key={m.id} className="rounded-xl bg-black/20 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold text-white">
                    {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" aria-label="Sin leer" />}
                    {m.subject}
                  </p>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => toggleRead(m)} className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-400 hover:text-white">
                      {m.read ? "Marcar sin leer" : "Marcar leído"}
                    </button>
                    <button type="button" onClick={() => removeMessage(m)} className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-500 hover:text-red-300">
                      Borrar
                    </button>
                  </div>
                </div>
                <p className="text-slate-400">
                  {m.name} ·{" "}
                  <a className="text-cyan-300 hover:text-white" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>
                    {m.email}
                  </a>
                </p>
                <p className="mt-1 whitespace-pre-line text-slate-300">{m.message}</p>
                <p className="font-mono2 mt-1 text-[11px] text-slate-600">{new Date(m.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="font-display font-semibold text-white">Bitácora administrativa</h2>
          <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto text-[13px]">
            {logs.length === 0 && <li className="text-sm text-slate-600">Sin actividad.</li>}
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2">
                <span className="font-mono2 truncate text-slate-300">{l.action}</span>
                <span className="shrink-0 text-xs text-slate-600">{new Date(l.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
