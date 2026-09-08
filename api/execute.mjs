import { randomUUID } from "node:crypto";
import { scenarios, sendJson, verifyApprovalToken } from "./_shared.mjs";

const usedTokens = new Set();

export default function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });
  const token = request.body?.approvalToken;
  const approval = verifyApprovalToken(token);
  if (!approval || usedTokens.has(approval.jti)) return sendJson(response, 403, { error: "Missing, invalid, or expired approval" });
  usedTokens.add(approval.jti);
  const scenario = scenarios[approval.scenarioId];
  return sendJson(response, 200, {
    receiptId: `GRD-${randomUUID().slice(0, 8).toUpperCase()}`,
    status: "SIMULATED",
    symbol: scenario.symbol,
    side: scenario.side,
    orderValue: approval.orderValue,
    policyHash: randomUUID().replaceAll("-", "").slice(0, 12),
    timestamp: new Date().toISOString(),
  });
}
