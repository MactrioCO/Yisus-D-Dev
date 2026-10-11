import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { logActivity } from "../lib/owner-auth";
import { getSupabase } from "../lib/supabase";

/** CRUD genérico del OWNER PANEL: tabla + buscador + formulario modal + borrado con confirmación. */

export type FieldType = "text" | "textarea" | "select" | "chips" | "picker" | "bool" | "number" | "color" | "image";
export interface Field {
  key: string; label: string; type: FieldType;
  options?: { value: string; label: string }[] | (() => Promise<{ value: string; label: string }[]>);
  placeholder?: string; rows?: number; required?: boolean;
}
export interface EntityConfig {
  table: string; label: string; singular: string;
  fields: Field[];
  columns: { key: string; label: string }[];
  orderBy: { column: string; ascending?: boolean };
  searchKeys: string[];
  /** Si existe, el campo `slug` vacío se genera automáticamente desde esta columna (p. ej. "title"). */
  slugFrom?: string;
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default function EntityManager({ config }: { config: EntityConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | null | undefined>(undefined); // undefined=cerrado, null=nuevo
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const sb = getSupabase();
    if (!sb) return;
    setLoading(true);
    setError(null);
    const { data, error } = await sb.from(config.table).select("*").order(config.orderBy.column, { ascending: config.orderBy.ascending ?? true }).limit(200);
    if (error) setError("No se pudo cargar. Revisa tu sesión.");
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [config.table]);

  const filtered = rows.filter((r) =>
    !q || config.searchKeys.some((k) => str(r[k]).toLowerCase().includes(q.toLowerCase())),
  );

  const save = async (values: Row) => {
    const sb = getSupabase();
    if (!sb) return;
    setSaving(true);
    try {
      if (editing && editing.id) {
        const { id, created_at, updated_at, ...rest } = values;
        void id; void created_at; void updated_at;
        const { error } = await sb.from(config.table).update(rest).eq("id", editing.id);
        if (error) throw error;
        await logActivity(`${config.table}.update`, { id: editing.id });
      } else {
        const { id, created_at, updated_at, ...rest } = values;
        void id; void created_at; void updated_at;
        let payload = rest;
        let { error } = await sb.from(config.table).insert(payload);
        // Slug duplicado: reintenta con sufijo en lugar de fallar
        if (error && error.code === "23505" && typeof payload.slug === "string" && payload.slug) {
          payload = { ...rest, slug: `${payload.slug}-${Date.now().toString(36).slice(-4)}` };
          ({ error } = await sb.from(config.table).insert(payload));
        }
        if (error) throw error;
        await logActivity(`${config.table}.create`, {});
      }
      setEditing(undefined);
      await load();
    } catch {
      setError("No se pudo guardar. Verifica los campos e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const sb = getSupabase();
    if (!sb || !confirmDel) return;
    const { error } = await sb.from(config.table).delete().eq("id", confirmDel.id);
    if (!error) {
      await logActivity(`${config.table}.delete`, { id: confirmDel.id });
      setConfirmDel(null);
      await load();
    } else setError("No se pudo eliminar.");
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
          <label htmlFor={`search-${config.table}`} className="sr-only">Buscar {config.label}</label>
          <input id={`search-${config.table}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar ${config.label}…`}
            className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/60" />
        </div>
        <button onClick={() => setEditing(null)} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
          <p className="font-display font-semibold text-white">Sin registros</p>
          <p className="mt-1 text-sm text-slate-500">Crea el primero con “Nuevo”. Nada aquí es ficticio: lo que publiques aparece en el sitio.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500">
                {config.columns.map((c) => <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>)}
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={String(r.id)} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                  {config.columns.map((c) => (
                    <td key={c.key} className="max-w-72 truncate px-4 py-3 text-slate-300">{renderCell(r[c.key])}</td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => setEditing(r)} aria-label="Editar" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><Pencil size={16} /></button>
                    <button onClick={() => setConfirmDel(r)} aria-label="Eliminar" className="rounded-lg p-2 text-slate-400 hover:bg-red-500/15 hover:text-red-300"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== undefined && (
        <EntityForm config={config} initial={editing ?? {}} saving={saving} onClose={() => setEditing(undefined)} onSave={save} />
      )}
      {confirmDel && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4" role="alertdialog" aria-modal="true" aria-label="Confirmar eliminación">
          <div className="glass w-full max-w-sm rounded-2xl p-6">
            <h3 className="font-display font-bold text-white">¿Eliminar?</h3>
            <p className="mt-2 text-sm text-slate-400">Esta acción no se puede deshacer. El elemento dejará de mostrarse en el portafolio.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="btn-ghost flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">Cancelar</button>
              <button onClick={remove} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCell(v: unknown): string {
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (Array.isArray(v)) return v.join(", ");
  return str(v).slice(0, 90);
}

function EntityForm({ config, initial, saving, onClose, onSave }: {
  config: EntityConfig; initial: Row; saving: boolean; onClose: () => void; onSave: (v: Row) => void;
}) {
  const [values, setValues] = useState<Row>(() => {
    const v: Row = {};
    for (const f of config.fields) {
      const cur = initial[f.key];
      if (f.type === "chips") v[f.key] = Array.isArray(cur) ? (cur as string[]).join(", ") : str(cur);
      else if (f.type === "picker") v[f.key] = Array.isArray(cur) ? (cur as string[]) : str(cur).split(",").map((s) => s.trim()).filter(Boolean);
      else v[f.key] = cur ?? defaultFor(f);
    }
    return v;
  });
  const [dynOptions, setDynOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  useEffect(() => {
    config.fields.forEach(async (f) => {
      if (typeof f.options === "function") {
        try {
          setDynOptions((d) => ({ ...d, [f.key]: [] }));
          const opts = await f.options();
          setDynOptions((d) => ({ ...d, [f.key]: opts }));
        } catch { /* sin opciones */ }
      }
    });
  }, [config]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Row = { ...initial };
    for (const f of config.fields) {
      const val = values[f.key];
      if (f.type === "chips") out[f.key] = str(val).split(",").map((s) => s.trim()).filter(Boolean);
      else if (f.type === "picker") out[f.key] = (Array.isArray(val) ? (val as unknown[]).map(str) : str(val).split(",")).map((s) => s.trim()).filter(Boolean);
      else if (f.type === "bool") out[f.key] = Boolean(val);
      else if (f.type === "number") out[f.key] = Number(val) || 0;
      else out[f.key] = typeof val === "string" ? val.trim() : val;
    }
    // Referencias vacías → null (columnas uuid, p. ej. project_id)
    for (const k of Object.keys(out)) {
      if (k.endsWith("_id") && out[k] === "") out[k] = null;
    }
    // Slug automático desde la columna configurada (title) si quedó vacío
    if (config.slugFrom && !str(out.slug).trim()) {
      const base = str(out[config.slugFrom])
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
      out.slug = base || `${config.table}-${Date.now().toString(36)}`;
    }
    onSave(out);
  };

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/60";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={initial.id ? "Editar" : "Crear"}>
      <form onSubmit={submit} className="glass max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-white">{initial.id ? `Editar ${config.singular}` : `Nuevo ${config.singular}`}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="btn-ghost grid h-9 w-9 place-items-center rounded-xl text-slate-300"><X size={18} /></button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {config.fields.map((f) => (
            <div key={f.key} className={f.type === "textarea" || f.type === "picker" ? "sm:col-span-2" : ""}>
              <label htmlFor={`f-${config.table}-${f.key}`} className="mb-1.5 block text-[13px] font-medium text-slate-300">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea id={`f-${config.table}-${f.key}`} rows={f.rows ?? 3} required={f.required} value={str(values[f.key])}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder} className={`${inputCls} resize-y`} />
              ) : f.type === "select" ? (
                <select id={`f-${config.table}-${f.key}`} value={str(values[f.key])}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className={inputCls}>
                  {(typeof f.options === "function" ? dynOptions[f.key] ?? [] : f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
                  ))}
                </select>
              ) : f.type === "bool" ? (
                <button type="button" role="switch" aria-checked={Boolean(values[f.key])} onClick={() => setValues((v) => ({ ...v, [f.key]: !v[f.key]}))}
                  className={`relative h-7 w-12 rounded-full transition-colors ${values[f.key] ? "bg-emerald-500" : "bg-white/15"}`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${values[f.key] ? "left-6" : "left-1"}`} />
                </button>
              ) : f.type === "color" ? (
                <div className="flex gap-2">
                  <input type="color" value={str(values[f.key]) || "#8b5cf6"} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent" aria-label={f.label} />
                  <input value={str(values[f.key])} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className={inputCls} />
                </div>
              ) : f.type === "image" ? (
                <ImageField value={str(values[f.key])} onChange={(url) => setValues((v) => ({ ...v, [f.key]: url }))} />
              ) : f.type === "picker" ? (
                <PickerField
                  options={Array.isArray(f.options) ? f.options : []}
                  value={Array.isArray(values[f.key]) ? (values[f.key] as string[]) : []}
                  onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                  label={f.label}
                />
              ) : (
                <input id={`f-${config.table}-${f.key}`} type={f.type === "number" ? "number" : "text"} required={f.required}
                  value={str(values[f.key])} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder ?? (f.type === "chips" ? "separados por comas" : "")} className={inputCls} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function defaultFor(f: Field): unknown {
  switch (f.type) {
    case "bool": return false;
    case "number": return 0;
    case "select": {
      const o = f.options;
      return typeof o === "function" ? "" : (o?.[0]?.value ?? "");
    }
    default: return "";
  }
}

/**
 * Selector con botones-chulo: muestra el catálogo completo (`options`) y el usuario
 * solo marca las que quiera (✓). Las técnicas ajenas al catálogo también se pueden
 * agregar y se muestran marcadas. Valor: `string[]`.
 */
function PickerField({ options, value, onChange, label }: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  label: string;
}) {
  const [custom, setCustom] = useState("");
  const known = new Set(options.map((o) => o.value));
  const selected = new Set(value);
  const extras = value.filter((v) => !known.has(v));

  const toggle = (v: string) =>
    onChange(selected.has(v) ? value.filter((x) => x !== v) : [...value, v]);

  const addCustom = () => {
    const t = custom.trim();
    if (!t) return;
    if (!selected.has(t)) onChange([...value, t]);
    setCustom("");
  };

  const chipCls = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
      on
        ? "border-cyan-400/50 bg-gradient-to-r from-violet-600/40 to-cyan-600/30 text-white shadow-md shadow-violet-950/50"
        : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/30 hover:text-white"
    }`;

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
          {value.length} seleccionada{value.length === 1 ? "" : "s"}
        </span>
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-[11px] text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline">
            Limpiar todo
          </button>
        )}
      </div>
      <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={selected.has(o.value)} onClick={() => toggle(o.value)} className={chipCls(selected.has(o.value))}>
            {selected.has(o.value) && <Check size={12} className="text-cyan-300" aria-hidden />}
            {o.label}
          </button>
        ))}
        {extras.map((v) => (
          <button key={v} type="button" aria-pressed onClick={() => toggle(v)} className={chipCls(true)}>
            <Check size={12} className="text-cyan-300" aria-hidden />
            {v}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Agregar una que no esté en la lista…"
          aria-label={`Agregar tecnología a ${label}`}
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/60"
        />
        <button type="button" onClick={addCustom} className="btn-ghost rounded-lg px-3 py-2 text-xs font-semibold text-white">
          Agregar
        </button>
      </div>
    </div>
  );
}

const IMG_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const IMG_MAX_BYTES = 5 * 1024 * 1024;

/** Sube la imagen directo a la Biblioteca (Storage) y guarda la URL pública. Sin copiar/pegar URLs. */
function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const sb = getSupabase();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = IMG_ACCEPT;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !sb) return;
      if (file.size > IMG_MAX_BYTES) { setErr("La imagen supera 5 MB."); return; }
      setErr(null);
      setBusy(true);
      try {
        const path = `${Date.now()}-${file.name.replace(/[^\w.-]+/g, "-")}`;
        const { error } = await sb.storage.from("portfolio-media").upload(path, file, { upsert: false });
        if (error) throw error;
        const { data } = sb.storage.from("portfolio-media").getPublicUrl(path);
        onChange(data.publicUrl);
      } catch {
        setErr("No se pudo subir la imagen.");
      } finally {
        setBusy(false);
      }
    };
    input.click();
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={pick} disabled={busy || !sb}
          className="btn-ghost rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Subiendo…" : value ? "Cambiar imagen" : "Subir imagen"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-xs text-slate-500 hover:text-red-300">Quitar</button>
        )}
      </div>
      {err && <p role="alert" className="mt-1.5 text-xs text-red-300">{err}</p>}
      {value ? (
        <img src={value} alt="" className="mt-2 h-24 w-full max-w-xs rounded-lg border border-white/10 object-cover" />
      ) : (
        <p className="font-mono2 mt-2 text-[11px] text-slate-600">Sin imagen · se sube directo a la Biblioteca</p>
      )}
    </div>
  );
}
