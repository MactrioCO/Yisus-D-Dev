import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase (solo clave PÚBLICA anon — seguro exponerla en frontend).
 * Si no hay credenciales, todo devuelve null y la UI usa el fallback
 * honesto (mailto) sin fingir envíos.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) client = createClient(url!, anonKey!);
  return client;
}

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const RATE_KEY = "ydd_last_contact_at";
const RATE_MS = 60_000; // 1 mensaje por minuto por navegador (anti-spam básico)

/** Guarda el mensaje en public.contact_messages. Lanza Error con mensaje legible si falla. */
export async function saveContactMessage(payload: ContactPayload): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase no configurado.");

  const last = Number(localStorage.getItem(RATE_KEY) ?? 0);
  const wait = RATE_MS - (Date.now() - last);
  if (wait > 0) throw new Error(`Espera ${Math.ceil(wait / 1000)} s antes de enviar otro mensaje.`);

  const { error } = await sb.from("contact_messages").insert({
    name: payload.name.trim().slice(0, 100),
    email: payload.email.trim().slice(0, 320),
    subject: payload.subject.trim().slice(0, 150),
    message: payload.message.trim().slice(0, 5000),
  });

  if (error) throw new Error("No se pudo guardar el mensaje. Intenta de nuevo o usa el correo directo.");
  localStorage.setItem(RATE_KEY, String(Date.now()));
}
