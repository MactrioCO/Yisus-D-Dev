import { Copy, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { logActivity } from "../lib/owner-auth";
import { getSupabase } from "../lib/supabase";

/** Biblioteca de archivos: bucket portfolio-media (público). Máx 5 MB, solo imágenes. */

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const MAX = 5 * 1024 * 1024;

interface F { name: string; updated_at: string; url: string; }

export default function Media() {
  const [files, setFiles] = useState<F[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const sb = getSupabase();
    if (!sb) return;
    setLoading(true);
    const { data, error } = await sb.storage.from("portfolio-media").list("", { limit: 100, sortBy: { column: "updated_at", order: "desc" } });
    if (error) setError("No se pudo listar.");
    else {
      setFiles(((data ?? []) as { name: string; updated_at: string }[]).filter((f) => !f.name.startsWith(".")).map((f) => ({
        name: f.name, updated_at: f.updated_at,
        url: sb.storage.from("portfolio-media").getPublicUrl(f.name).data.publicUrl,
      })));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!ACCEPT.includes(file.type)) return setError("Tipo no permitido. Usa PNG, JPG, WEBP, SVG o GIF.");
    if (file.size > MAX) return setError("Máximo 5 MB por archivo.");
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await sb.storage.from("portfolio-media").upload(name, file, { contentType: file.type });
    if (error) setError("No se pudo subir.");
    else {
      await logActivity("media.upload", { name });
      await load();
    }
    setBusy(false);
  };

  const remove = async (name: string) => {
    if (!confirm(`¿Eliminar ${name}? Si algún proyecto/novedad lo usa, su imagen se romperá.`)) return;
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.storage.from("portfolio-media").remove([name]);
    if (!error) {
      await logActivity("media.delete", { name });
      await load();
    } else setError("No se pudo eliminar.");
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-white">Biblioteca</h1>
        <label className="btn-primary inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">
          <Upload size={16} /> {busy ? "Subiendo…" : "Subir imagen"}
          <input type="file" accept={ACCEPT.join(",")} onChange={upload} className="sr-only" />
        </label>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}
      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Cargando…</p>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-500">
          Sin archivos. Sube portadas para proyectos y novedades (luego pega la URL en el campo correspondiente).
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((f) => (
            <li key={f.name} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <img src={f.url} alt={f.name} loading="lazy" className="h-40 w-full bg-black/40 object-cover" />
              <div className="p-3">
                <p className="font-mono2 truncate text-xs text-slate-300" title={f.name}>{f.name}</p>
                <div className="mt-2 flex gap-1.5">
                  <button onClick={() => navigator.clipboard.writeText(f.url)} aria-label="Copiar URL"
                    className="btn-ghost inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-200">
                    <Copy size={13} /> Copiar URL
                  </button>
                  <button onClick={() => remove(f.name)} aria-label={`Eliminar ${f.name}`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-500/15 hover:text-red-300">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
