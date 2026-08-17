"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  calculateRecoverableTime,
  type AiSupport,
  type CalculationResult,
  type OpportunityBand,
} from "@/lib/calculator";
import { createEstimateSummary, formatHours, PILOT_PLAN } from "@/lib/summary";

type Estimate = CalculationResult & {
  task: string;
  support: AiSupport;
};

type SavedCalculator = {
  task: string;
  frequency: string;
  minutes: string;
  support: AiSupport;
  estimate: Estimate | null;
};

const STORAGE_KEY = "savetimeforme-calculator-v1";

const supportOptions: Array<{ value: AiSupport; label: string; description: string }> = [
  { value: 25, label: "25%", description: "apoio inicial" },
  { value: 50, label: "50%", description: "copiloto prático" },
  { value: 75, label: "75%", description: "processo bem definido" },
];

const bandContent: Record<OpportunityBand, { title: string; description: string }> = {
  small: {
    title: "Ganho pequeno",
    description: "Menos de 4 horas na estimativa mensal. Comece por uma etapa simples e de baixo risco.",
  },
  pilot: {
    title: "Bom piloto",
    description: "De 4 a 12 horas na estimativa mensal. Há base para testar o processo com controle.",
  },
  strong: {
    title: "Prioridade forte",
    description: "Mais de 12 horas na estimativa mensal. Vale priorizar o experimento e medir o resultado.",
  },
};

function isAiSupport(value: unknown): value is AiSupport {
  return value === 25 || value === 50 || value === 75;
}

function isEstimate(value: unknown): value is Estimate {
  if (!value || typeof value !== "object") return false;

  const estimate = value as Partial<Estimate>;
  return (
    typeof estimate.task === "string" &&
    isAiSupport(estimate.support) &&
    typeof estimate.currentHours === "number" &&
    typeof estimate.recoverableHours === "number" &&
    typeof estimate.remainingHours === "number" &&
    (estimate.band === "small" || estimate.band === "pilot" || estimate.band === "strong")
  );
}

function loadSavedCalculator(): SavedCalculator {
  const fallback: SavedCalculator = { task: "", frequency: "1", minutes: "60", support: 50, estimate: null };
  if (typeof window === "undefined") return fallback;

  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!value || typeof value !== "object") return fallback;
    const saved = value as Partial<SavedCalculator>;

    return {
      task: typeof saved.task === "string" ? saved.task : fallback.task,
      frequency: typeof saved.frequency === "string" ? saved.frequency : fallback.frequency,
      minutes: typeof saved.minutes === "string" ? saved.minutes : fallback.minutes,
      support: isAiSupport(saved.support) ? saved.support : fallback.support,
      estimate: isEstimate(saved.estimate) ? saved.estimate : null,
    };
  } catch {
    return fallback;
  }
}

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Some browsers expose the modern API but deny the permission. Use the local fallback below.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("Não foi possível copiar o resumo.");
}

export function TimeCalculator() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [task, setTask] = useState("");
  const [frequency, setFrequency] = useState("1");
  const [minutes, setMinutes] = useState("60");
  const [support, setSupport] = useState<AiSupport>(50);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [saveFeedback, setSaveFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [storageCleared, setStorageCleared] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const taskInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = loadSavedCalculator();
      setTask(saved.task);
      setFrequency(saved.frequency);
      setMinutes(saved.minutes);
      setSupport(saved.support);
      setEstimate(saved.estimate);
      setStorageReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!storageReady || storageCleared) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ task, frequency, minutes, support, estimate }));
  }, [task, frequency, minutes, support, estimate, storageCleared, storageReady]);

  function updateDraft(update: () => void) {
    update();
    setEstimate(null);
    setCopyFeedback("");
    setSaveFeedback("");
    setStorageCleared(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedTask = task.trim();
    const parsedFrequency = Number(frequency);
    const parsedMinutes = Number(minutes);

    if (!normalizedName) {
      setEstimate(null);
      setError("Informe seu nome para registrar a estimativa.");
      nameInput.current?.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEstimate(null);
      setError("Informe um e-mail válido para registrar a estimativa.");
      return;
    }

    if (!normalizedTask) {
      setEstimate(null);
      setError("Conte qual tarefa repetitiva está consumindo seu tempo.");
      taskInput.current?.focus();
      return;
    }

    if (!Number.isFinite(parsedFrequency) || parsedFrequency <= 0) {
      setEstimate(null);
      setError("Informe uma frequência semanal maior que zero.");
      return;
    }

    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
      setEstimate(null);
      setError("Informe uma quantidade de minutos maior que zero.");
      return;
    }

    if (!consent) {
      setEstimate(null);
      setError("Confirme que autoriza o registro dos seus dados e desta estimativa.");
      return;
    }

    setError("");
    setCopyFeedback("");
    setSaveFeedback("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          task: normalizedTask,
          frequency: parsedFrequency,
          minutes: parsedMinutes,
          support,
          consent,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Não foi possível registrar sua estimativa agora. Tente novamente em instantes.";
        throw new Error(message);
      }

      setEstimate({
        task: normalizedTask,
        support,
        ...calculateRecoverableTime({ frequency: parsedFrequency, minutes: parsedMinutes, support }),
      });
      setSaveFeedback("Estimativa registrada. Você pode copiar o resumo ou iniciar outra análise.");
    } catch (submissionError) {
      setEstimate(null);
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível registrar sua estimativa agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function restart() {
    setName("");
    setEmail("");
    setConsent(false);
    setTask("");
    setFrequency("1");
    setMinutes("60");
    setSupport(50);
    setEstimate(null);
    setError("");
    setCopyFeedback("");
    setSaveFeedback("");
    setStorageCleared(false);
    requestAnimationFrame(() => nameInput.current?.focus());
  }

  function eraseAll() {
    window.localStorage.removeItem(STORAGE_KEY);
    setName("");
    setEmail("");
    setConsent(false);
    setTask("");
    setFrequency("");
    setMinutes("");
    setSupport(50);
    setEstimate(null);
    setError("");
    setCopyFeedback("Rascunho e estimativa apagados deste navegador.");
    setSaveFeedback("");
    setStorageCleared(true);
    requestAnimationFrame(() => nameInput.current?.focus());
  }

  async function handleCopy() {
    if (!estimate) return;

    try {
      await copyToClipboard(createEstimateSummary(estimate));
      setCopyFeedback("Resumo copiado para a área de transferência.");
    } catch {
      setCopyFeedback("Não foi possível copiar agora. Selecione o resumo manualmente.");
    }
  }

  return (
    <section id="calculadora" className="overflow-hidden rounded-2xl border border-white/15 bg-[#22222a] shadow-2xl shadow-black/20" aria-label="Calculadora de tempo recuperável">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(410px,.92fr)]">
        <form className="p-5 sm:p-8 lg:p-10" onSubmit={handleSubmit} noValidate>
          <div className="mb-8 flex items-start gap-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#c8ff00] font-mono text-[11px] font-medium text-[#22222a]">01</span>
            <div>
              <p className="font-mono text-[11px] tracking-[0.07em] text-[#c2c8ce]">SUA ROTINA, EM QUATRO PASSOS</p>
              <h2 className="mt-1 text-3xl leading-none font-bold tracking-[-0.05em]">Onde a IA pode apoiar?</h2>
            </div>
          </div>

          <div className="grid gap-5">
            <fieldset className="rounded-xl border border-white/15 bg-white/3 p-4">
              <legend className="px-1 text-sm font-semibold">Para registrar sua estimativa</legend>
              <p className="mt-1 text-xs leading-relaxed text-[#c2c8ce]">Usaremos estes dados para contato e acompanhamento. Não inclua informações confidenciais na tarefa.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block" htmlFor="name">
                  <span className="text-sm font-semibold">Nome</span>
                  <input
                    ref={nameInput}
                    id="name"
                    name="name"
                    autoComplete="name"
                    maxLength={120}
                    value={name}
                    onChange={(event) => updateDraft(() => setName(event.target.value))}
                    placeholder="Como podemos chamar você?"
                    required
                    className="mt-2 h-14 w-full rounded-xl border border-white/20 bg-white/5 px-4 text-base text-[#f9f9f9] placeholder:text-[#c2c8ce]/65 focus:border-[#c8ff00] focus:bg-white/8 focus:outline-none"
                    aria-invalid={Boolean(error && !name.trim())}
                  />
                </label>
                <label className="block" htmlFor="email">
                  <span className="text-sm font-semibold">E-mail</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    onChange={(event) => updateDraft(() => setEmail(event.target.value))}
                    placeholder="voce@empresa.com"
                    required
                    className="mt-2 h-14 w-full rounded-xl border border-white/20 bg-white/5 px-4 text-base text-[#f9f9f9] placeholder:text-[#c2c8ce]/65 focus:border-[#c8ff00] focus:bg-white/8 focus:outline-none"
                    aria-invalid={Boolean(error && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))}
                  />
                </label>
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#c2c8ce]">
                <input
                  className="mt-0.5 size-4 shrink-0 accent-[#c8ff00]"
                  type="checkbox"
                  name="consent"
                  checked={consent}
                  onChange={(event) => updateDraft(() => setConsent(event.target.checked))}
                  required
                  aria-invalid={Boolean(error && !consent)}
                />
                <span>Autorizo o registro do meu nome, e-mail e desta estimativa para contato e acompanhamento.</span>
              </label>
            </fieldset>

            <label className="block" htmlFor="task">
              <span className="flex items-center gap-2 text-sm font-semibold"><span className="font-mono text-xs text-[#c8ff00]">1.</span>Tarefa repetitiva</span>
              <input
                ref={taskInput}
                id="task"
                name="task"
                value={task}
                onChange={(event) => updateDraft(() => setTask(event.target.value))}
                placeholder="Ex.: checklist de planejamento semanal"
                required
                className="mt-2 h-14 w-full rounded-xl border border-white/20 bg-white/5 px-4 text-base text-[#f9f9f9] placeholder:text-[#c2c8ce]/65 focus:border-[#c8ff00] focus:bg-white/8 focus:outline-none"
                aria-invalid={Boolean(error && !task.trim())}
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block" htmlFor="frequency">
                <span className="flex items-center gap-2 text-sm font-semibold"><span className="font-mono text-xs text-[#c8ff00]">2.</span>Vezes por semana</span>
                <input
                  id="frequency"
                  name="frequency"
                  type="number"
                  min="0.1"
                  max="10000"
                  step="0.1"
                  inputMode="decimal"
                  value={frequency}
                  onChange={(event) => updateDraft(() => setFrequency(event.target.value))}
                  required
                  className="mt-2 h-14 w-full rounded-xl border border-white/20 bg-white/5 px-4 text-base text-[#f9f9f9] focus:border-[#c8ff00] focus:bg-white/8 focus:outline-none"
                  aria-invalid={Boolean(error && Number(frequency) <= 0)}
                />
              </label>
              <label className="block" htmlFor="minutes">
                <span className="flex items-center gap-2 text-sm font-semibold"><span className="font-mono text-xs text-[#c8ff00]">3.</span>Minutos por ocorrência</span>
                <input
                  id="minutes"
                  name="minutes"
                  type="number"
                  min="1"
                  max="1440"
                  step="1"
                  inputMode="numeric"
                  value={minutes}
                  onChange={(event) => updateDraft(() => setMinutes(event.target.value))}
                  required
                  className="mt-2 h-14 w-full rounded-xl border border-white/20 bg-white/5 px-4 text-base text-[#f9f9f9] focus:border-[#c8ff00] focus:bg-white/8 focus:outline-none"
                  aria-invalid={Boolean(error && Number(minutes) <= 0)}
                />
              </label>
            </div>

            <fieldset>
              <legend className="flex items-center gap-2 text-sm font-semibold"><span className="font-mono text-xs text-[#c8ff00]">4.</span>Quanto apoio da IA você espera?</legend>
              <p className="mt-1 text-xs leading-relaxed text-[#c2c8ce]">Escolha uma expectativa inicial. A IA apoia; você continua responsável pela revisão.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {supportOptions.map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      className="peer sr-only"
                      type="radio"
                      name="support"
                      value={option.value}
                      checked={support === option.value}
                      onChange={() => updateDraft(() => setSupport(option.value))}
                    />
                    <span className="flex min-h-24 flex-col justify-center rounded-xl border border-white/20 bg-white/3 px-4 py-3 transition hover:border-white/40 peer-checked:border-[#c8ff00] peer-checked:bg-[#c8ff00]/10">
                      <strong className="font-mono text-2xl tracking-[-0.07em] text-[#f9f9f9] peer-checked:text-[#c8ff00]">{option.label}</strong>
                      <small className="mt-1 text-xs text-[#c2c8ce]">{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {error ? (
            <p className="mt-5 rounded-lg border-l-4 border-[#ff780a] bg-[#ff780a]/10 px-3 py-2 text-sm text-[#ffe0c2]" role="alert">{error}</p>
          ) : null}

          <button className="mt-7 flex h-14 w-full items-center justify-between rounded-xl bg-[#c8ff00] px-5 text-base font-bold text-[#22222a] transition hover:bg-[#dcff55] active:scale-[.99] disabled:cursor-wait disabled:opacity-70" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registrando estimativa..." : "Salvar e ver estimativa de tempo"} <span aria-hidden="true">→</span>
          </button>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#c2c8ce]">
            <span>Rascunho da rotina salvo neste navegador.</span>
            <button className="min-h-11 rounded-lg border border-white/20 px-3 font-semibold text-[#f9f9f9] transition hover:border-[#ff780a] hover:text-[#ffb47b]" type="button" onClick={eraseAll}>
              Apagar rascunho local
            </button>
          </div>
          {copyFeedback && !estimate ? <p className="mt-3 text-xs text-[#c8ff00]" role="status">{copyFeedback}</p> : null}
        </form>

        <aside className="bg-[#f9f9f9] p-5 text-[#22222a] sm:p-8 lg:p-10" aria-live="polite">
          {estimate ? <EstimateResult estimate={estimate} onRestart={restart} onCopy={handleCopy} copyFeedback={copyFeedback} saveFeedback={saveFeedback} /> : <EmptyResult />}
        </aside>
      </div>
    </section>
  );
}

function EmptyResult() {
  return (
    <div className="mx-auto flex min-h-105 max-w-sm flex-col justify-center text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full border border-[#22222a]/30 font-mono text-2xl">↗</span>
      <p className="mt-6 font-mono text-[11px] tracking-[0.07em] text-[#4a465e]">ESTIMATIVA INICIAL</p>
      <h2 className="mt-3 text-3xl leading-[1.02] font-bold tracking-[-0.05em]">Transforme uma rotina em tempo para construir.</h2>
      <p className="mt-4 text-sm leading-relaxed text-[#4a465e]">Informe seus dados e os quatro passos ao lado. Você verá uma estimativa de tempo e um piloto prático para testar com segurança.</p>
      <p className="mt-5 rounded-lg bg-[#e9e9e4] px-4 py-3 text-xs leading-relaxed text-[#4a465e]">A calculadora traz uma estimativa inicial — não uma promessa de economia garantida.</p>
    </div>
  );
}

function EstimateResult({
  estimate,
  onRestart,
  onCopy,
  copyFeedback,
  saveFeedback,
}: {
  estimate: Estimate;
  onRestart: () => void;
  onCopy: () => void;
  copyFeedback: string;
  saveFeedback: string;
}) {
  const band = bandContent[estimate.band];

  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center justify-between border-b border-[#22222a]/15 pb-4 font-mono text-[10px] tracking-[0.07em] text-[#4a465e]">
        <span>ESTIMATIVA DE TEMPO</span>
        <span>{estimate.support}% DE APOIO</span>
      </div>
      <h2 className="mt-5 text-3xl leading-[1.02] font-bold tracking-[-0.05em]">{estimate.task}</h2>
      {saveFeedback ? <p className="mt-3 rounded-lg bg-[#e2f7b0] px-3 py-2 text-xs font-medium text-[#355000]" role="status">{saveFeedback}</p> : null}

      <div className="mt-6 rounded-2xl bg-[#22222a] p-5 text-[#f9f9f9] shadow-lg shadow-black/10">
        <p className="font-mono text-[10px] tracking-[0.07em] text-[#c2c8ce]">HORAS RECUPERÁVEIS POR MÊS</p>
        <div className="mt-2 flex items-end gap-2">
          <strong className="font-mono text-7xl leading-none tracking-[-0.1em] text-[#c8ff00]">{formatHours(estimate.recoverableHours)}</strong>
          <span className="mb-1 text-sm text-[#c2c8ce]">horas</span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 py-6">
        <div className="rounded-xl bg-[#eeeeea] p-3">
          <dt className="font-mono text-[10px] tracking-[0.07em] text-[#4a465e]">HORAS ATUAIS</dt>
          <dd className="mt-1 font-mono text-2xl tracking-[-0.07em]">{formatHours(estimate.currentHours)}</dd>
          <span className="text-xs text-[#4a465e]">por mês</span>
        </div>
        <div className="rounded-xl bg-[#eeeeea] p-3">
          <dt className="font-mono text-[10px] tracking-[0.07em] text-[#4a465e]">CONTINUAM COM VOCÊ</dt>
          <dd className="mt-1 font-mono text-2xl tracking-[-0.07em]">{formatHours(estimate.remainingHours)}</dd>
          <span className="text-xs text-[#4a465e]">por mês</span>
        </div>
      </dl>

      <section className="rounded-xl border-l-4 border-[#c8ff00] bg-[#eeeeea] p-4" aria-label="Faixa de oportunidade">
        <p className="font-mono text-[10px] tracking-[0.07em] text-[#4a465e]">FAIXA DA ESTIMATIVA</p>
        <h3 className="mt-1 text-base font-bold">{band.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#4a465e]">{band.description}</p>
      </section>

      <p className="mt-4 text-xs leading-relaxed text-[#4a465e]">Esta é uma estimativa inicial, não uma promessa de economia garantida. O resultado depende do processo, da qualidade dos dados e da revisão humana.</p>

      <section className="mt-7 border-t border-[#22222a]/15 pt-5" aria-labelledby="pilot-title">
        <p className="font-mono text-[10px] tracking-[0.07em] text-[#4a465e]">PRÓXIMO PASSO</p>
        <h3 id="pilot-title" className="mt-1 text-xl font-bold tracking-[-0.04em]">Plano seguro de 7 dias</h3>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {PILOT_PLAN.map(([day, title, description]) => (
            <li key={day} className="rounded-lg border border-[#22222a]/12 p-3">
              <p className="font-mono text-[10px] tracking-[0.06em] text-[#4a465e]">{day}</p>
              <h4 className="mt-0.5 text-sm font-bold leading-tight">{title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-[#4a465e]">{description}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-lg border border-[#ff780a]/45 bg-[#ff780a]/10 p-3 text-xs leading-relaxed text-[#4a465e]">
          <strong className="text-[#22222a]">Revisão humana obrigatória.</strong> Todo conteúdo enviado a cliente, que envolva dinheiro, uma decisão sensível ou informação confidencial exige revisão humana antes do uso.
        </p>
      </section>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button className="min-h-13 rounded-xl bg-[#22222a] px-4 text-sm font-bold text-[#f9f9f9] transition hover:bg-[#363641]" type="button" onClick={onCopy}>
          Copiar resumo
        </button>
        <button className="min-h-13 rounded-xl border border-[#22222a]/25 px-4 text-sm font-bold text-[#22222a] transition hover:border-[#22222a]" type="button" onClick={onRestart}>
          Recomeçar
        </button>
      </div>
      {copyFeedback ? <p className="mt-3 text-center text-xs font-medium text-[#4a465e]" role="status">{copyFeedback}</p> : null}
    </div>
  );
}
