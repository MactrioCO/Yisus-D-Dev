/**
 * YISUS D DEV · Runner de migraciones Supabase
 * ─────────────────────────────────────────────
 * Aplica los .sql de supabase/migrations/ DIRECTO a tu proyecto
 * Supabase usando la Management API (endpoint /database/query).
 *
 * Uso:
 *   npm run migrate            → aplica pendientes y registra
 *   npm run migrate -- --dry-run → muestra qué aplicaría sin ejecutar
 *
 * Credenciales (variables de entorno, NUNCA al frontend):
 *   SUPABASE_PROJECT_REF  → ej. "abcdefghijklmnop" (está en tu SUPABASE_URL)
 *   SUPABASE_ACCESS_TOKEN → token personal: dashboard → Account → Access Tokens
 *
 * Cómo funciona:
 *   1. Crea la tabla libro `public._migrations` si no existe.
 *   2. Lee los archivos *.sql ordenados alfabéticamente.
 *   3. Salta los ya registrados; ejecuta cada pendiente como un lote.
 *   4. Registra el nombre del archivo solo si tuvo éxito.
 *
 * Convención: nombra los archivos 0002_xxx.sql, 0003_xxx.sql…
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "..", "supabase", "migrations");

// Carga .env local (raíz del proyecto) solo para las vars que falten.
// No pisa variables de entorno reales ya definidas.
try {
  const envText = await readFile(path.join(__dirname, "..", ".env"), "utf8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* sin .env: se usan las variables de entorno tal cual */
}

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const dryRun = process.argv.includes("--dry-run");

if (!ref || !token) {
  console.error("❌ Faltan credenciales.");
  console.error("   Define SUPABASE_PROJECT_REF y SUPABASE_ACCESS_TOKEN como variables de entorno.");
  console.error("   Ejemplo (PowerShell):  $env:SUPABASE_PROJECT_REF='turef'; $env:SUPABASE_ACCESS_TOKEN='sbp_...'; npm run migrate");
  console.error("   O cópialas en un archivo .env (solo local, jamás lo subas con el token).");
  process.exit(1);
}

/** La Management API solo acepta `query` plano (sin params): se escapa el literal. */
function literal(value) {
  if (typeof value !== "string") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

async function query(sql, params = []) {
  let finalSql = sql;
  params.forEach((p, i) => {
    finalSql = finalSql.replace(`$${i + 1}`, literal(p));
  });
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: finalSql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase API ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : [];
}

async function main() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.log("Sin migraciones en supabase/migrations/.");
    return;
  }

  await query(`create table if not exists public._migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  );`);

  const appliedRows = await query(`select name from public._migrations;`);
  const applied = new Set(appliedRows.map((r) => r.name));
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log(`✅ Todo al día. ${files.length} migración(es) aplicadas.`);
    return;
  }

  console.log(`Pendientes (${pending.length}): ${pending.join(", ")}`);
  if (dryRun) {
    console.log("— dry-run: nada ejecutado —");
    return;
  }

  for (const file of pending) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    if (!sql.trim()) {
      console.log(`⏭️  ${file}: vacío, se omite.`);
      continue;
    }
    console.log(`▶️  Aplicando ${file}…`);
    await query(sql);
    await query(`insert into public._migrations (name) values ($1);`, [file]);
    console.log(`✅ ${file} aplicada y registrada.`);
  }
  console.log("🎉 Migraciones al día.");
}

main().catch((err) => {
  console.error("❌ Falló la migración:", err.message);
  process.exit(1);
});
