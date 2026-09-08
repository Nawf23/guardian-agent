import { LIMITS, scenarios, sendJson } from "./_shared.mjs";

export default function handler(request, response) {
  if (request.method !== "GET") return sendJson(response, 405, { error: "Method not allowed" });
  return sendJson(response, 200, { scenarios, limits: LIMITS, mode: "DEMO / DRY RUN" });
}
