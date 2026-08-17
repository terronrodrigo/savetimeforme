import assert from "node:assert/strict";
import test from "node:test";
import { calculateRecoverableTime, getOpportunityBand } from "../lib/calculator.ts";
import { validateEstimateSubmission } from "../lib/estimate-submission.ts";
import { createEstimateSummary } from "../lib/summary.ts";

test("calcula a estimativa com uma casa decimal", () => {
  assert.deepEqual(calculateRecoverableTime({ frequency: 1, minutes: 60, support: 50 }), {
    currentHours: 4.3,
    recoverableHours: 2.2,
    remainingHours: 2.2,
    band: "small",
  });
});

test("aplica os três percentuais de apoio esperado", () => {
  assert.equal(calculateRecoverableTime({ frequency: 1, minutes: 60, support: 25 }).recoverableHours, 1.1);
  assert.equal(calculateRecoverableTime({ frequency: 1, minutes: 60, support: 50 }).recoverableHours, 2.2);
  assert.equal(calculateRecoverableTime({ frequency: 1, minutes: 60, support: 75 }).recoverableHours, 3.2);
});

test("classifica os limites das faixas usando horas recuperáveis arredondadas", () => {
  assert.equal(getOpportunityBand(0), "small");
  assert.equal(getOpportunityBand(3.9), "small");
  assert.equal(getOpportunityBand(4), "pilot");
  assert.equal(getOpportunityBand(12), "pilot");
  assert.equal(getOpportunityBand(12.1), "strong");
});

test("aceita extremos válidos sem perder a precisão finita", () => {
  const lowResult = calculateRecoverableTime({ frequency: 0.1, minutes: 1, support: 25 });
  const result = calculateRecoverableTime({ frequency: 1000, minutes: 1440, support: 75 });

  assert.deepEqual(lowResult, {
    currentHours: 0,
    recoverableHours: 0,
    remainingHours: 0,
    band: "small",
  });
  assert.equal(result.currentHours, 103920);
  assert.equal(result.recoverableHours, 77940);
  assert.equal(result.remainingHours, 25980);
  assert.equal(result.band, "strong");
});

test("rejeita frequência, minutos e apoio inválidos", () => {
  assert.throws(() => calculateRecoverableTime({ frequency: 0, minutes: 60, support: 50 }));
  assert.throws(() => calculateRecoverableTime({ frequency: -1, minutes: 60, support: 50 }));
  assert.throws(() => calculateRecoverableTime({ frequency: 1, minutes: 0, support: 50 }));
  assert.throws(() => calculateRecoverableTime({ frequency: 1, minutes: -1, support: 50 }));
  assert.throws(() => calculateRecoverableTime({ frequency: Number.NaN, minutes: 60, support: 50 }));
  assert.throws(() => calculateRecoverableTime({ frequency: Number.POSITIVE_INFINITY, minutes: 60, support: 50 }));
  assert.throws(() => calculateRecoverableTime({ frequency: 1, minutes: 60, support: 10 }));
});

test("monta um resumo copiável com a tarefa, horas e os sete dias", () => {
  const summary = createEstimateSummary({
    task: "Checklist semanal",
    support: 50,
    currentHours: 4.3,
    recoverableHours: 2.2,
    remainingHours: 2.2,
    band: "small",
  });

  assert.match(summary, /Tarefa: Checklist semanal/);
  assert.match(summary, /Horas atuais\/mês: 4,3/);
  assert.match(summary, /Horas recuperáveis\/mês: 2,2/);
  assert.match(summary, /Dia 1/);
  assert.match(summary, /Dia 7/);
});

test("valida e normaliza o contato antes de salvar a estimativa", () => {
  const validation = validateEstimateSubmission({
    name: "  Ana Souza  ",
    email: "ANA@EXEMPLO.COM ",
    task: "  Checklist semanal  ",
    frequency: 1,
    minutes: 60,
    support: 50,
    consent: true,
  });

  assert.equal(validation.success, true);
  if (!validation.success) return;

  assert.equal(validation.data.name, "Ana Souza");
  assert.equal(validation.data.email, "ana@exemplo.com");
  assert.equal(validation.data.task, "Checklist semanal");
  assert.equal(validation.data.calculation.recoverableHours, 2.2);
});

test("rejeita contato, consentimento e limites inválidos", () => {
  const validInput = {
    name: "Ana",
    email: "ana@exemplo.com",
    task: "Checklist semanal",
    frequency: 1,
    minutes: 60,
    support: 50,
    consent: true,
  };

  assert.equal(validateEstimateSubmission({ ...validInput, name: "" }).success, false);
  assert.equal(validateEstimateSubmission({ ...validInput, email: "invalido" }).success, false);
  assert.equal(validateEstimateSubmission({ ...validInput, consent: false }).success, false);
  assert.equal(validateEstimateSubmission({ ...validInput, frequency: 10001 }).success, false);
  assert.equal(validateEstimateSubmission({ ...validInput, minutes: 1441 }).success, false);
});
