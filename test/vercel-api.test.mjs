import test from "node:test";
import assert from "node:assert/strict";
import bootstrap from "../api/bootstrap.mjs";
import evaluate from "../api/evaluate.mjs";
import execute from "../api/execute.mjs";

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("Vercel bootstrap exposes scenarios", () => {
  const response = responseRecorder();
  bootstrap({ method: "GET" }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(Object.keys(response.body.scenarios).length, 3);
});

test("Vercel stress scenario rejects without an approval token", async () => {
  const response = responseRecorder();
  await evaluate({ method: "POST", body: { scenarioId: "volatility" } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.evaluation.decision, "REJECT");
  assert.equal(response.body.approvalToken, null);
});

test("Vercel execution rejects an unsigned token", () => {
  const response = responseRecorder();
  execute({ method: "POST", body: { approvalToken: "not-signed" } }, response);
  assert.equal(response.statusCode, 403);
});
