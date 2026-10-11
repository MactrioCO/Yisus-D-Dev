import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";

/** Autenticación del OWNER: Supabase Auth + verificación de rol contra owner_profiles. */

interface AuthState {
  ready: boolean;
  session: Session | null;
  isOwner: boolean;
  checkingRole: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
}

const Ctx = createContext<AuthState | null>(null);

// Anti fuerza bruta en cliente (además del rate limit de Supabase Auth)
const FAIL_KEY = "ydd_owner_fails";
function fails(): number[] {
  try {
    return JSON.parse(localStorage.getItem(FAIL_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function registerFail() {
  const now = Date.now();
  const recent = [...fails().filter((t) => now - t < 5 * 60_000), now].slice(-8);
  localStorage.setItem(FAIL_KEY, JSON.stringify(recent));
}
function blockedSeconds(): number {
  const recent = fails().filter((t) => Date.now() - t < 5 * 60_000);
  if (recent.length < 5) return 0;
  return Math.ceil((5 * 60_000 - (Date.now() - recent[0])) / 1000);
}

export function OwnerAuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const authError = isSupabaseConfigured
    ? null
    : "Supabase no configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.";

  const checkRole = useCallback(async (s: Session | null) => {
    setSession(s);
    setIsOwner(false);
    if (!s) return;
    const sb = getSupabase();
    if (!sb) return;
    setCheckingRole(true);
    try {
      // RLS solo deja ver la fila propia: si existe con role=owner ⇒ es OWNER.
      const { data, error } = await sb.from("owner_profiles").select("role").eq("user_id", s.user.id).maybeSingle();
      setIsOwner(!error && data?.role === "owner");
    } catch {
      setIsOwner(false);
    } finally {
      setCheckingRole(false);
    }
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setReady(true);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      checkRole(data.session).finally(() => setReady(true));
    });
    const { data: sub } = sb.auth.onAuthStateChange((_ev, s) => checkRole(s));
    return () => sub.subscription.unsubscribe();
  }, [checkRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return "Supabase no configurado.";
    const wait = blockedSeconds();
    if (wait > 0) return `Demasiados intentos. Espera ${Math.ceil(wait / 60)} min.`;
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      registerFail();
      return "Credenciales incorrectas o cuenta inexistente.";
    }
    localStorage.removeItem(FAIL_KEY);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase()?.auth.signOut();
    setSession(null);
    setIsOwner(false);
  }, []);

  // Registro desde el propio login. Seguro por diseño: crear cuenta NO da
  // permisos — sin fila en owner_profiles (solo vía SQL administrativo) la
  // app muestra "Sin permisos". La autorización nunca depende del cliente.
  const signUp = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return "Supabase no configurado.";
    if (password.length < 10) return "La contraseña debe tener mínimo 10 caracteres.";
    const wait = blockedSeconds();
    if (wait > 0) return `Demasiados intentos. Espera ${Math.ceil(wait / 60)} min.`;
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
    if (error) {
      registerFail();
      return "No se pudo crear la cuenta (¿correo ya registrado o inválido?).";
    }
    localStorage.removeItem(FAIL_KEY);
    if (!data.session) return "CONFIRM";
    return null;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) return "Supabase no configurado.";
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${window.location.pathname}#/owner/login`,
    });
    return error ? "No se pudo enviar el correo de recuperación." : null;
  }, []);

  const value = useMemo(
    () => ({ ready, session, isOwner, checkingRole, authError, signIn, signUp, signOut, resetPassword }),
    [ready, session, isOwner, checkingRole, authError, signIn, signUp, signOut, resetPassword],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOwnerAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOwnerAuth fuera del provider");
  return v;
}

/** Bitácora: registra acciones administrativas (solo OWNER puede insertar por RLS). */
export async function logActivity(action: string, details: Record<string, unknown> = {}): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb.auth.getUser();
  await sb.from("admin_activity_logs").insert({ actor: data.user?.id ?? null, action, details });
}
