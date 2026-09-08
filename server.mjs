import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { randomUUID } from "node:crypto";
import { evaluateTrade, LIMITS } from "./lib/risk-engine.mjs";
import { scenarios } from "./lib/scenarios.mjs";
import { getBinanceMarketSnapshot } from "./lib/binance-market.mjs";

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_DIR = join(process.cwd(), "public");
const receipts = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      return json(response, 200, { scenarios, limits: LIMITS, mode: "DEMO / DRY RUN" });
    }

    if (request.method === "POST" && url.pathname === "/api/evaluate") {
      const { scenarioId } = await readBody(request);
      const scenario = scenarios[scenarioId];
      if (!scenario) return json(response, 404, { error: "Unknown scenario" });
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
        catch (error) { console.warn(`Live market fallback for ${scenario.symbol}: ${error.message}`); }
      }
      const evaluatedScenario = { ...scenario, ...market };
      const evaluation = evaluateTrade(evaluatedScenario);
      const approvalToken = evaluation.decision === "APPROVE" ? randomUUID() : null;
      if (approvalToken) receipts.set(approvalToken, { scenario: evaluatedScenario, evaluation, used: false });
      return json(response, 200, { scenario: evaluatedScenario, evaluation, market, approvalToken });
    }

    if (request.method === "POST" && url.pathname === "/api/execute") {
      const { approvalToken } = await readBody(request);
      const record = receipts.get(approvalToken);
      if (!record || record.used) return json(response, 403, { error: "Missing, invalid, or expired approval" });
      record.used = true;
      const receipt = {
        receiptId: `GRD-${randomUUID().slice(0, 8).toUpperCase()}`,
        status: "SIMULATED",
        symbol: record.scenario.symbol,
        side: record.scenario.side,
        orderValue: record.scenario.orderValue,
        policyHash: randomUUID().replaceAll("-", "").slice(0, 12),
        timestamp: new Date().toISOString(),
      };
      return json(response, 200, receipt);
    }

    if (request.method !== "GET") return json(response, 405, { error: "Method not allowed" });
    const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const path = normalize(join(PUBLIC_DIR, requested));
    if (!path.startsWith(PUBLIC_DIR)) return json(response, 403, { error: "Forbidden" });
    const contents = await readFile(path);
    response.writeHead(200, { "content-type": mimeTypes[extname(path)] || "application/octet-stream" });
    response.end(contents);
  } catch (error) {
    if (error.code === "ENOENT") return json(response, 404, { error: "Not found" });
    console.error(error);
    json(response, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, HOST, () => console.log(`Guardian Agent running at http://${HOST}:${PORT}`));
