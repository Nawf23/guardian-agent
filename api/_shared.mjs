import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { evaluateTrade, LIMITS } from "../lib/risk-engine.mjs";
import { scenarios } from "../lib/scenarios.mjs";
import { getBinanceMarketSnapshot } from "../lib/binance-market.mjs";

const DEMO_SECRET = process.env.APPROVAL_SECRET || "guardian-public-demo-no-real-execution";

export { LIMITS, scenarios };

export async function evaluateScenario(scenarioId) {
  const scenario = scenarios[scenarioId];
  if (!scenario) return null;
  let market = {
    symbol: scenario.symbol,
    price: null,
    priceChangePercent24h: null,
    spreadBps: scenario.spreadBps,
    volatilityPercent: scenario.volatilityPercent,
    dailyQuoteVolume: scenario.dailyQuoteVolume,
    source: scenario.marketMode === "stress" ? "Guardian stress-test fixture" : "Demo fallback fixture",
    observedAt: new Date().toISOString(),
  };
  if (scenario.marketMode === "live") {
    try { market = await getBinanceMarketSnapshot(scenario.symbol); }
    catch { /* The UI discloses the fallback source. */ }
  }
  const evaluatedScenario = { ...scenario, ...market };
  return { scenario: evaluatedScenario, market, evaluation: evaluateTrade(evaluatedScenario) };
}

export function createApprovalToken(scenario) {
  const payload = Buffer.from(JSON.stringify({
    jti: randomUUID(),
    scenarioId: scenario.id,
    orderValue: scenario.orderValue,
    exp: Date.now() + 5 * 60 * 1000,
  })).toString("base64url");
  const signature = createHmac("sha256", DEMO_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyApprovalToken(token) {
  if (typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", DEMO_SECRET).update(payload).digest();
  let supplied;
  try { supplied = Buffer.from(signature, "base64url"); } catch { return null; }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp < Date.now() || !scenarios[data.scenarioId]) return null;
    return data;
  } catch { return null; }
}

export function sendJson(response, status, body) {
  response.status(status).json(body);
}
