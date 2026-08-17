import { saveEstimate } from "@/lib/database";
import { validateEstimateSubmission } from "@/lib/estimate-submission";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Envie dados válidos para a estimativa." }, { status: 400 });
  }

  const validation = validateEstimateSubmission(body);
  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  try {
    await saveEstimate(validation.data);
  } catch {
    return Response.json(
      { error: "Não foi possível registrar sua estimativa agora. Tente novamente em instantes." },
      { status: 503 },
    );
  }

  return Response.json(
    {
      ok: true,
      estimate: {
        task: validation.data.task,
        support: validation.data.support,
        ...validation.data.calculation,
      },
    },
    { status: 201 },
  );
}
