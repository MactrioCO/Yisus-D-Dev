import { Bell, FolderKanban, Images, Inbox as InboxIcon, LayoutDashboard, LogOut, Newspaper, ScrollText, Settings, Shapes, Users, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { asset } from "../lib/assets";
import { logActivity, OwnerAuthProvider, useOwnerAuth } from "../lib/owner-auth";
import { isSupabaseConfigured } from "../lib/supabase";
import { ActivityView, BotSettings, SiteSettings } from "./ConfigPanels";
import Dashboard from "./Dashboard";
import EntityManager, { type EntityConfig } from "./crud";
import { EntityView, experiencesConfig, faqsConfig, newsConfig, projectsConfig, servicesConfig, skillsConfig, socialsConfig } from "./Entities";
import Inbox from "./Inbox";
import Media from "./Media";

const SECTIONS = [
  { id: "", label: "Dashboard", icon: LayoutDashboard },
  { id: "proyectos", label: "Proyectos", icon: FolderKanban },
  { id: "novedades", label: "Novedades", icon: Newspaper },
  { id: "servicios", label: "Servicios", icon: Wrench },
  { id: "habilidades", label: "Habilidades", icon: Shapes },
  { id: "trayectoria", label: "Perfil y experiencia", icon: Users },
  { id: "redes", label: "Redes y FAQs", icon: ScrollText },
  { id: "biblioteca", label: "Biblioteca", icon: Images },
  { id: "inbox", label: "Mactrio Inbox", icon: InboxIcon },
  { id: "ajustes", label: "Ajustes", icon: Settings },
  { id: "actividad", label: "Actividad y buzón", icon: Bell },
];

function sectionOf(hash: string): string {
  const m = hash.match(/^#\/owner(?:\/([a-z]+))?/);
  return m ? (m[1] ?? "") : "";
}

function Login() {
  const { signIn, signUp, resetPassword } = useOwnerAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [info, setInfo] = useState<string | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05070d] p-5">
        <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
          <h1 className="font-display text-xl font-bold text-white">Configuración pendiente</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            El OWNER PANEL necesita Supabase. Crea el proyecto, ejecuta <code>npm run migrate</code> y
            sigue <code>docs/OWNER_PANEL.md</code> para crear el primer OWNER. No hay cuentas por defecto.
          </p>
          <a href="#/" className="btn-ghost mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white">Volver al sitio</a>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    if (mode === "forgot") {
      const msg = await resetPassword(email);
      setInfo(msg ?? "Si el correo existe, recibirás un enlace de recuperación.");
    } else if (mode === "up") {
      const msg = await signUp(email, pw);
      if (msg === "CONFIRM") {
        setInfo("Cuenta creada. Revisa tu correo para confirmarla y vuelve a iniciar sesión.");
        setMode("in");
      } else if (msg) setErr(msg);
      else setInfo("Cuenta creada. Ya puedes iniciar sesión (y el SQL de OWNER te da permisos).");
    } else {
      const msg = await signIn(email, pw);
      if (msg) setErr(msg);
    }
    setBusy(false);
  };

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60";

  return (
    <div className="grid min-h-screen place-items-center bg-[#05070d] p-5">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-2xl p-8" aria-label="Acceso del propietario">
        <img src={asset("logo.png")} alt="Yisus D Dev" width={56} height={56} className="mx-auto rounded-full" />
        <h1 className="font-display mt-4 text-center text-xl font-bold text-white">OWNER PANEL</h1>
        <p className="font-mono2 mt-1 text-center text-[11px] uppercase tracking-[0.3em] text-slate-500">
          {mode === "in" ? "acceso privado" : mode === "up" ? "crear cuenta" : "recuperar acceso"}
        </p>
        <label htmlFor="owner-email" className="mb-1.5 mt-6 block text-[13px] font-medium text-slate-300">Correo</label>
        <input id="owner-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        {mode !== "forgot" && (
          <>
            <label htmlFor="owner-pw" className="mb-1.5 mt-4 block text-[13px] font-medium text-slate-300">
              Contraseña {mode === "up" && <span className="text-slate-500">(mín. 10 caracteres)</span>}
            </label>
            <input id="owner-pw" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} required minLength={mode === "up" ? 10 : undefined}
              value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} />
          </>
        )}
        {err && <p role="alert" className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{err}</p>}
        {info && <p role="status" className="mt-3 rounded-xl bg-white/[0.05] px-4 py-2.5 text-sm text-slate-300">{info}</p>}
        <button type="submit" disabled={busy} className="btn-primary mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Verificando…" : mode === "in" ? "Entrar" : mode === "up" ? "Crear cuenta" : "Enviar recuperación"}
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <div className="flex gap-3">
            <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(null); setInfo(null); }} className="text-cyan-300 hover:text-white">
              {mode === "in" ? "Crear cuenta" : "Ya tengo cuenta"}
            </button>
            <button type="button" onClick={() => { setMode(mode === "forgot" ? "in" : "forgot"); setErr(null); setInfo(null); }} className="text-slate-400 hover:text-white">
              {mode === "forgot" ? "Volver" : "¿Olvidaste tu acceso?"}
            </button>
          </div>
          <a href="#/" className="text-slate-500 hover:text-white">Ver sitio</a>
        </div>
        <p className="font-mono2 mt-4 border-t border-white/[0.07] pt-3 text-[11px] leading-relaxed text-slate-600">
          Crear una cuenta no da permisos: el rol OWNER se otorga solo con el SQL administrativo (docs/OWNER_PANEL.md).
        </p>
      </form>
    </div>
  );
}

function Shell() {
  const { session, isOwner, checkingRole, signOut } = useOwnerAuth();
  const section = sectionOf(window.location.hash);
  const go = (h: string) => { window.location.hash = h; };
  const [, force] = useState(0);

  // Re-render al cambiar el hash
  useEffect(() => {
    const onHash = () => force((n) => n + 1);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (!session) return <Login />;
  if (checkingRole) {
    return <div className="grid min-h-screen place-items-center bg-[#05070d] text-sm text-slate-500">Verificando permisos…</div>;
  }
  if (!isOwner) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05070d] p-5">
        <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
          <h1 className="font-display text-xl font-bold text-white">Sin permisos</h1>
          <p className="mt-3 text-sm text-slate-400">Esta cuenta está autenticada pero no es OWNER. El rol solo se otorga por procedimiento administrativo.</p>
          <button onClick={() => { signOut(); logActivity("security.denied", {}); }} className="btn-ghost mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-200 lg:flex">
      <aside className="border-b border-white/10 bg-[#04060b] p-4 lg:min-h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <a href="#/" className="flex items-center gap-2.5">
          <img src={asset("logo.png")} alt="Yisus D Dev" width={36} height={36} className="rounded-full" />
          <span className="font-display text-sm font-bold tracking-widest text-white">OWNER <span className="text-gradient">PANEL</span></span>
        </a>
        <nav className="mt-5 flex gap-1.5 overflow-x-auto lg:flex-col" aria-label="Administración">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <a key={s.id} href={`#/owner${s.id ? `/${s.id}` : ""}`}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium ${active ? "bg-gradient-to-r from-violet-600/30 to-cyan-500/15 text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}>
                <Icon size={17} aria-hidden /> {s.label}
              </a>
            );
          })}
        </nav>
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="font-mono2 truncate text-xs text-slate-500">{session.user.email}</p>
          <button onClick={signOut} className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        {section === "" && <Dashboard go={go} />}
        {section === "proyectos" && <EntityView config={projectsConfig} />}
        {section === "novedades" && <EntityView config={newsConfig} />}
        {section === "servicios" && <EntityView config={servicesConfig} />}
        {section === "habilidades" && <EntityView config={skillsConfig} />}
        {section === "trayectoria" && <EntityView config={experiencesConfig} />}
        {section === "redes" && (
          <div className="grid gap-8">
            <div><h1 className="font-display mb-5 text-2xl font-bold text-white">Redes sociales</h1><EntityManagerView config={socialsConfig} /></div>
            <div><h1 className="font-display mb-5 text-2xl font-bold text-white">Preguntas frecuentes</h1><EntityManagerView config={faqsConfig} /></div>
          </div>
        )}
        {section === "biblioteca" && <Media />}
        {section === "inbox" && <Inbox />}
        {section === "ajustes" && (
          <div className="grid gap-8">
            <SiteSettings />
            <BotSettings />
          </div>
        )}
        {section === "actividad" && <ActivityView />}
      </main>
    </div>
  );
}

// Vista combinada de redes + FAQs
function EntityManagerView({ config }: { config: EntityConfig }) {
  return <EntityManager config={config} />;
}

export default function OwnerApp() {
  return (
    <OwnerAuthProvider>
      <Shell />
    </OwnerAuthProvider>
  );
}
