import { createApprovalToken, evaluateScenario, sendJson } from "./_shared.mjs";

export default async function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });
  const result = await evaluateScenario(request.body?.scenarioId);
  if (!result) return sendJson(response, 404, { error: "Unknown scenario" });
  const approvalToken = result.evaluation.decision === "APPROVE" ? createApprovalToken(result.scenario) : null;
  return sendJson(response, 200, { ...result, approvalToken });
}
