import { Pool } from "pg";
import type { ValidatedEstimateSubmission } from "@/lib/estimate-submission";

type DatabaseGlobal = typeof globalThis & {
  savetimeformePool?: Pool;
  savetimeformeSchemaReady?: Promise<void>;
};

const databaseGlobal = globalThis as DatabaseGlobal;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não está configurada.");
  }

  if (!databaseGlobal.savetimeformePool) {
    databaseGlobal.savetimeformePool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 5_000,
    });
  }

  return databaseGlobal.savetimeformePool;
}

async function ensureSchema() {
  if (!databaseGlobal.savetimeformeSchemaReady) {
    databaseGlobal.savetimeformeSchemaReady = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS estimates (
          id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          name VARCHAR(120) NOT NULL,
          email VARCHAR(254) NOT NULL,
          task VARCHAR(300) NOT NULL,
          frequency DOUBLE PRECISION NOT NULL CHECK (frequency > 0),
          minutes DOUBLE PRECISION NOT NULL CHECK (minutes > 0),
          support SMALLINT NOT NULL CHECK (support IN (25, 50, 75)),
          current_hours NUMERIC(14, 1) NOT NULL,
          recoverable_hours NUMERIC(14, 1) NOT NULL,
          remaining_hours NUMERIC(14, 1) NOT NULL,
          band VARCHAR(10) NOT NULL CHECK (band IN ('small', 'pilot', 'strong')),
          consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS estimates_created_at_idx ON estimates (created_at DESC);
      `)
      .then(() => undefined)
      .catch((error: unknown) => {
        databaseGlobal.savetimeformeSchemaReady = undefined;
        throw error;
      });
  }

  return databaseGlobal.savetimeformeSchemaReady;
}

export async function saveEstimate(submission: ValidatedEstimateSubmission) {
  await ensureSchema();

  const { calculation } = submission;
  await getPool().query(
    `
      INSERT INTO estimates (
        name, email, task, frequency, minutes, support,
        current_hours, recoverable_hours, remaining_hours, band
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      submission.name,
      submission.email,
      submission.task,
      submission.frequency,
      submission.minutes,
      submission.support,
      calculation.currentHours,
      calculation.recoverableHours,
      calculation.remainingHours,
      calculation.band,
    ],
  );
}
