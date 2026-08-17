export const WEEKS_PER_MONTH = 4.33;
export const SUPPORT_OPTIONS = [25, 50, 75] as const;

export type AiSupport = (typeof SUPPORT_OPTIONS)[number];
export type OpportunityBand = "small" | "pilot" | "strong";

export type CalculationInput = {
  frequency: number;
  minutes: number;
  support: AiSupport;
};

export type CalculationResult = {
  currentHours: number;
  recoverableHours: number;
  remainingHours: number;
  band: OpportunityBand;
};

function roundHours(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function getOpportunityBand(recoverableHours: number): OpportunityBand {
  if (!Number.isFinite(recoverableHours) || recoverableHours < 0) {
    throw new Error("As horas recuperáveis devem ser um número válido.");
  }

  if (recoverableHours < 4) return "small";
  if (recoverableHours <= 12) return "pilot";
  return "strong";
}

export function calculateRecoverableTime({ frequency, minutes, support }: CalculationInput): CalculationResult {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    throw new Error("A frequência deve ser maior que zero.");
  }

  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("Os minutos devem ser maiores que zero.");
  }

  if (!SUPPORT_OPTIONS.includes(support)) {
    throw new Error("O apoio esperado deve ser 25%, 50% ou 75%.");
  }

  const currentHours = (frequency * minutes * WEEKS_PER_MONTH) / 60;
  const recoverableHours = currentHours * (support / 100);
  const roundedRecoverableHours = roundHours(recoverableHours);

  return {
    currentHours: roundHours(currentHours),
    recoverableHours: roundedRecoverableHours,
    remainingHours: roundHours(currentHours - recoverableHours),
    band: getOpportunityBand(roundedRecoverableHours),
  };
}
