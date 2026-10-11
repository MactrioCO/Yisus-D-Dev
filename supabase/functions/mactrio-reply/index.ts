/**
 * Mactrio Bot · Edge Function (vía endurecida)
 * ────────────────────────────────────────────
 * Despliegue (requiere Supabase CLI + access token):
 *   supabase login
 *   supabase link --project-ref eecsygwrmnntfbssmdoi
 *   supabase secrets set AI_API_KEY=... AI_MODEL=... AI_BASE_URL=https://api.openai.com/v1
 *   supabase functions deploy mactrio-reply
 * Frontend: define VITE_MACTRIO_FUNCTION_URL=<.../functions/v1/mactrio-reply>
 * y el widget la usará automáticamente (con fallback al motor local).
 *
 * Seguridad: verifica el JWT del visitante, confirma que la conversación
 * es suya y está en estado 'bot', responde SOLO con contenido autorizado
 * y guarda el mensaje como 'bot'. La AI_API_KEY vive en Secrets, jamás
 * llega al navegador.
 */
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SYSTEM = `Eres Mactrio Bot, asistente del portafolio de Yisus D Dev (desarrollador de software).
Responde SOLO con la información de contexto proporcionada. Si no está en el contexto,
dilo honestamente y sugiere pedir atención humana. Nunca inventes proyectos, precios,
certificaciones, enlaces ni datos personales. Tono cordial, profesional y breve (español).`;

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userToken = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!userToken) return Response.json({ error: "unauthorized" }, { status: 401 });

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

    const { conversation_id, message } = await req.json();
    if (typeof message !== "string" || !message.trim() || message.length > 1000) {
      return Response.json({ error: "mensaje inválido" }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: conv } = await admin.from("chat_conversations")
      .select("id,visitor_user_id,status").eq("id", conversation_id).single();
    if (!conv || conv.visitor_user_id !== user.id || conv.status !== "bot") {
      return Response.json({ error: "conversación no disponible para el bot" }, { status: 403 });
    }

    // Contexto autorizado (solo publicado/activo)
    const [pj, nw, sv, sk, fq] = await Promise.all([
      admin.from("projects").select("title,tagline,problem,stack,status,type").eq("is_published", true),
      admin.from("news_posts").select("title,excerpt").eq("status", "published").limit(5),
      admin.from("services").select("title,description").eq("is_active", true),
      admin.from("skills").select("category,items"),
      admin.from("faqs").select("question,answer").eq("is_active", true),
    ]);
    const context = JSON.stringify({ projects: pj.data, news: nw.data, services: sv.data, skills: sk.data, faqs: fq.data }).slice(0, 12000);

    const apiKey = Deno.env.get("AI_API_KEY") ?? "";
    if (!apiKey) {
      // Sin IA configurada: respuesta honesta + la app ofrece handoff
      const reply = "Ahora mismo mi motor de IA no está configurado. Puedo registrar tu pregunta para que Yisus la responda personalmente: usa “Hablar con un humano”.";
      await admin.from("chat_messages").insert({ conversation_id, sender: "bot", body: reply });
      return Response.json({ reply, answered: false, suggestions: ["Hablar con un humano"] });
    }

    const base = Deno.env.get("AI_BASE_URL") ?? "https://api.openai.com/v1";
    const model = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
    const ai = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Contexto autorizado:\n${context}\n\nPregunta del visitante:\n${message}` },
        ],
      }),
    });
    if (!ai.ok) throw new Error(`AI provider ${ai.status}`);
    const j = await ai.json();
    const reply: string = j.choices?.[0]?.message?.content?.slice(0, 2000) ?? "";
    if (!reply) throw new Error("AI sin respuesta");

    await admin.from("chat_messages").insert({ conversation_id, sender: "bot", body: reply });
    return Response.json({ reply, answered: true, suggestions: [] });
  } catch (e) {
    // Error controlado: el widget usa el motor local como respaldo
    return Response.json({ error: "bot_error", detail: String(e).slice(0, 200) }, { status: 502 });
  }
});
