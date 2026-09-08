const $ = (selector) => document.querySelector(selector);
let bootstrap;
let currentApprovalToken;

const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

async function request(path, body) {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function renderScenarioButtons() {
  $("#scenario-list").innerHTML = Object.values(bootstrap.scenarios).map((scenario) => `
    <button class="scenario" data-id="${scenario.id}">
      <strong>${scenario.title}</strong><span>${scenario.subtitle}</span>
    </button>`).join("");
  document.querySelectorAll(".scenario").forEach((button) => button.addEventListener("click", () => evaluate(button.dataset.id)));
}

async function evaluate(scenarioId) {
  document.querySelectorAll(".scenario").forEach((button) => button.classList.toggle("active", button.dataset.id === scenarioId));
  const data = await request("/api/evaluate", { scenarioId });
  const { scenario, evaluation, approvalToken } = data;
  currentApprovalToken = approvalToken;
  $("#empty-state").classList.add("hidden");
  $("#result").classList.remove("hidden");
  $("#receipt").classList.add("hidden");
  $("#intent").textContent = `“${scenario.prompt}”`;
  $("#order-symbol").textContent = scenario.symbol;
  $("#order-details").textContent = `${scenario.side} · ${money(scenario.orderValue)}`;
  $("#market-source").textContent = `${data.market.source}${data.market.price ? ` · $${data.market.price.toLocaleString()}` : ""}`;
  const approved = evaluation.decision === "APPROVE";
  $("#decision-title").textContent = approved ? "Approved within mandate" : scenarioId === "volatility" ? "Execution paused" : "Trade rejected";
  $("#decision-title").style.color = approved ? "var(--green)" : "var(--red)";
  $("#explanation").textContent = evaluation.explanation;
  $("#decision-icon").className = `decision-icon ${approved ? "approve" : "reject"}`;
  $("#decision-icon").textContent = approved ? "✓" : "×";
  $("#checks").innerHTML = evaluation.checks.map((check) => `
    <div class="check ${check.pass ? "pass" : "fail"}">
      <div class="check-name"><strong>${check.label}</strong><span>${check.detail}</span></div>
      <div class="check-value"><strong>${check.pass ? "✓" : "×"} ${check.value}</strong><span>Limit ${check.limit}</span></div>
    </div>`).join("");
  $("#alternative").classList.toggle("hidden", !evaluation.saferAlternative);
  if (evaluation.saferAlternative) $("#alternative").innerHTML = `<strong>SAFER ALTERNATIVE</strong>${evaluation.saferAlternative.message}`;
  $("#execute").classList.toggle("hidden", !approved);
}

$("#execute").addEventListener("click", async () => {
  const button = $("#execute");
  button.disabled = true;
  button.textContent = "Validating policy and simulating…";
  try {
    const receipt = await request("/api/execute", { approvalToken: currentApprovalToken });
    $("#receipt").innerHTML = `<strong>✓ SIMULATED EXECUTION COMPLETE</strong><br>Receipt ${receipt.receiptId} · ${receipt.side} ${money(receipt.orderValue)} ${receipt.symbol}<br>Policy ${receipt.policyHash} · ${new Date(receipt.timestamp).toLocaleTimeString()}`;
    $("#receipt").classList.remove("hidden");
    button.classList.add("hidden");
  } catch (error) {
    button.textContent = error.message;
  } finally { button.disabled = false; }
});

bootstrap = await request("/api/bootstrap");
$("#mode").textContent = bootstrap.mode;
renderScenarioButtons();
