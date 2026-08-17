import { TimeCalculator } from "@/components/time-calculator";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#16161c] px-5 py-6 text-[#f9f9f9] sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/15 pb-5">
          <a className="flex items-center gap-2.5 font-bold tracking-[-0.04em]" href="#calculadora">
            <span className="grid size-8 place-items-center bg-[#c8ff00] font-mono text-[11px] font-medium tracking-[-0.1em] text-[#22222a]">
              ST
            </span>
            <span>
              SaveTime<span className="text-[#c8ff00]">ForME</span>
            </span>
          </a>
          <span className="font-mono text-[10px] tracking-[0.08em] text-[#c2c8ce]">VERSÃO 01</span>
        </header>

        <section className="relative max-w-4xl py-15 sm:py-22" aria-labelledby="titulo-principal">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-0 opacity-20 [background-image:radial-gradient(#c2c8ce_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_right,transparent,black_25%,black_65%,transparent)]"
          />
          <p className="relative z-10 flex items-center gap-2 font-mono text-[11px] tracking-[0.07em] text-[#c2c8ce]">
            <span className="h-px w-4 bg-[#c8ff00]" />
            CALCULADORA DE TEMPO RECUPERÁVEL
          </p>
          <h1 id="titulo-principal" className="relative z-10 mt-4 max-w-3xl text-5xl leading-[0.95] font-bold tracking-[-0.07em] sm:text-7xl">
            Enxergue tempo para <span className="text-[#c8ff00]">construir</span> mais<span className="text-[#c8ff00]">_</span>
          </h1>
          <p className="relative z-10 mt-6 max-w-xl text-base leading-relaxed text-[#c2c8ce] sm:text-lg">
            Descubra uma estimativa inicial de tempo que a IA pode apoiar você a recuperar para o seu negócio — sem promessas, com teste e revisão humana.
          </p>
        </section>

        <TimeCalculator />

        <footer className="mt-12 flex flex-col gap-2 border-t border-white/15 pt-5 text-xs text-[#c2c8ce] sm:flex-row sm:justify-between">
          <span className="font-semibold text-[#f9f9f9]">SaveTimeForME</span>
          <span>Estimativa inicial para orientar seu primeiro experimento com IA.</span>
        </footer>
      </div>
    </main>
  );
}
