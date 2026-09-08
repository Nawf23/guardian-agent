import test from "node:test";
import assert from "node:assert/strict";
import { evaluateTrade } from "../lib/risk-engine.mjs";
import { scenarios } from "../lib/scenarios.mjs";

test("approves a trade within every mandate limit", () => {
  const result = evaluateTrade(scenarios.safe);
  assert.equal(result.decision, "APPROVE");
  assert.equal(result.checks.every((check) => check.pass), true);
});

test("rejects excessive risk and concentration with a safer size", () => {
  const result = evaluateTrade(scenarios.risky);
  assert.equal(result.decision, "REJECT");
  assert.deepEqual(result.checks.filter((check) => !check.pass).map((check) => check.key), ["risk", "concentration"]);
  assert.equal(result.saferAlternative.orderValue, 1250);
});

test("circuit breaker rejects abnormal volatility", () => {
  const result = evaluateTrade(scenarios.volatility);
  assert.equal(result.decision, "REJECT");
  assert.equal(result.checks.find((check) => check.key === "volatility").pass, false);
});
