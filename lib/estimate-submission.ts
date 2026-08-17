import {
  calculateRecoverableTime,
  SUPPORT_OPTIONS,
  type AiSupport,
  type CalculationResult,
} from "./calculator.ts";

export type EstimateSubmission = {
  name: string;
  email: string;
  task: string;
  frequency: number;
  minutes: number;
  support: AiSupport;
  consent: true;
};

export type ValidatedEstimateSubmission = EstimateSubmission & {
  calculation: CalculationResult;
};

type SubmissionParseResult =
  | { success: true; data: ValidatedEstimateSubmission }
  | { success: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_TASK_LENGTH = 300;
const MAX_FREQUENCY = 10_000;
const MAX_MINUTES = 1_440;

function readText(value: unknown, fieldName: string, maxLength: number) {
  if (typeof value !== "string") {
    return { success: false as const, error: `Informe ${fieldName}.` };
  }

  const normalized = value.trim();
  if (!normalized) {
    return { success: false as const, error: `Informe ${fieldName}.` };
  }

  if (normalized.length > maxLength) {
    return { success: false as const, error: `${fieldName} deve ter no máximo ${maxLength} caracteres.` };
  }

  return { success: true as const, value: normalized };
}

export function validateEstimateSubmission(value: unknown): SubmissionParseResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: false, error: "Dados da estimativa inválidos." };
  }

  const input = value as Record<string, unknown>;
  const name = readText(input.name, "seu nome", MAX_NAME_LENGTH);
  if (!name.success) return name;

  const rawEmail = readText(input.email, "seu e-mail", MAX_EMAIL_LENGTH);
  if (!rawEmail.success) return rawEmail;
  const email = rawEmail.value.toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, error: "Informe um e-mail válido." };
  }

  const task = readText(input.task, "a tarefa repetitiva", MAX_TASK_LENGTH);
  if (!task.success) return task;

  const frequency = input.frequency;
  if (typeof frequency !== "number" || !Number.isFinite(frequency) || frequency <= 0 || frequency > MAX_FREQUENCY) {
    return { success: false, error: "Informe uma frequência semanal maior que zero." };
  }

  const minutes = input.minutes;
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0 || minutes > MAX_MINUTES) {
    return { success: false, error: "Informe uma quantidade de minutos maior que zero." };
  }

  const support = input.support;
  if (!SUPPORT_OPTIONS.includes(support as AiSupport)) {
    return { success: false, error: "Escolha 25%, 50% ou 75% de apoio esperado." };
  }

  if (input.consent !== true) {
    return { success: false, error: "Confirme que autoriza o registro dos seus dados e desta estimativa." };
  }

  const normalizedSupport = support as AiSupport;

  return {
    success: true,
    data: {
      name: name.value,
      email,
      task: task.value,
      frequency,
      minutes,
      support: normalizedSupport,
      consent: true,
      calculation: calculateRecoverableTime({ frequency, minutes, support: normalizedSupport }),
    },
  };
}
