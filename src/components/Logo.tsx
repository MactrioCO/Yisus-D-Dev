/** Marca Yisus D Dev — logo oficial en /logo.png + wordmark. */
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="group inline-flex items-center gap-2.5" aria-label="Yisus D Dev — inicio">
      <span className="relative h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-400 p-[2px] shadow-[0_8px_24px_-8px_rgba(139,92,246,0.7)]">
        <img
          src="/logo.png"
          alt="Logo de Yisus D Dev"
          width={40}
          height={40}
          className="h-full w-full rounded-full bg-black object-cover"
          loading="eager"
        />
        <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
      </span>
      {!compact && (
        <span className="font-display flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-[0.18em] text-white">
            YISUS <span className="text-gradient">D DEV</span>
          </span>
          <span className="font-mono2 mt-1 text-[10px] tracking-[0.28em] text-slate-500">DESARROLLADOR · SOLUCIONES</span>
        </span>
      )}
    </span>
  );
}
