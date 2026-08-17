import type { AiSupport, CalculationResult } from "@/lib/calculator";

export type EstimateSummary = CalculationResult & {
  task: string;
  support: AiSupport;
};

export const PILOT_PLAN = [
  ["Dia 1", "Defina qualidade e revisor", "Liste o que uma boa entrega precisa ter e quem fará a revisão humana."],
  ["Dia 2", "Delimite o teste", "Escolha uma etapa de baixo risco, defina o tempo de referência e proteja dados sensíveis."],
  ["Dia 3", "Prepare o uso da IA", "Monte o comando, exemplos e critérios que serão usados nos casos reais."],
  ["Dia 4", "Teste os 5 primeiros casos", "Registre tempo, qualidade percebida e retrabalho necessário."],
  ["Dia 5", "Complete 10 casos reais", "Teste mais 5 casos, totalizando 10, sempre com revisão humana."],
  ["Dia 6", "Compare as evidências", "Compare tempo, qualidade e retrabalho nas duas formas de executar a rotina."],
  ["Dia 7", "Decida o próximo passo", "Com base nos registros, escolha entre parar, ajustar ou repetir o piloto."],
] as const;

const formatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatHours(hours: number) {
  return formatter.format(hours);
}

export function createEstimateSummary(estimate: EstimateSummary) {
  const plan = PILOT_PLAN.map(([day, title, description]) => `${day} — ${title}: ${description}`).join("\n");

  return [
    "SaveTimeForME — estimativa de tempo",
    `Tarefa: ${estimate.task}`,
    `Horas atuais/mês: ${formatHours(estimate.currentHours)}`,
    `Horas recuperáveis/mês: ${formatHours(estimate.recoverableHours)}`,
    "",
    "Piloto de 7 dias:",
    plan,
    "",
    "Estimativa inicial: resultados enviados a clientes, ligados a dinheiro, decisões sensíveis ou dados confidenciais exigem revisão humana.",
  ].join("\n");
}
