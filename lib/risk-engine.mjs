const round = (value, digits = 2) => Number(value.toFixed(digits));

export const LIMITS = Object.freeze({
  maxRiskPercent: 1,
  maxConcentrationPercent: 35,
  maxSpreadBps: 20,
  maxVolatilityPercent: 6,
  minLiquidityRatio: 100,
});

export function evaluateTrade(input, limits = LIMITS) {
  const {
    portfolioValue,
    currentAssetValue,
    orderValue,
    stopDistancePercent,
    spreadBps,
    volatilityPercent,
    dailyQuoteVolume,
  } = input;

  const lossAtStop = orderValue * (stopDistancePercent / 100);
  const riskPercent = (lossAtStop / portfolioValue) * 100;
  const concentrationPercent = ((currentAssetValue + orderValue) / portfolioValue) * 100;
  const liquidityRatio = dailyQuoteVolume / orderValue;

  const checks = [
    {
      key: "risk",
      label: "Loss at stop",
      value: `${round(riskPercent)}%`,
      limit: `\u2264 ${limits.maxRiskPercent}%`,
      pass: riskPercent <= limits.maxRiskPercent,
      detail: `$${round(lossAtStop).toLocaleString()} estimated maximum loss`,
    },
    {
      key: "concentration",
      label: "Asset concentration",
      value: `${round(concentrationPercent)}%`,
      limit: `\u2264 ${limits.maxConcentrationPercent}%`,
      pass: concentrationPercent <= limits.maxConcentrationPercent,
      detail: "Share of portfolio after execution",
    },
    {
      key: "spread",
      label: "Market spread",
      value: `${round(spreadBps)} bps`,
      limit: `\u2264 ${limits.maxSpreadBps} bps`,
      pass: spreadBps <= limits.maxSpreadBps,
      detail: "Estimated entry friction",
    },
    {
      key: "volatility",
      label: "Short-term volatility",
      value: `${round(volatilityPercent)}%`,
      limit: `\u2264 ${limits.maxVolatilityPercent}%`,
      pass: volatilityPercent <= limits.maxVolatilityPercent,
      detail: "Execution pauses during abnormal conditions",
    },
    {
      key: "liquidity",
      label: "Liquidity coverage",
      value: `${round(liquidityRatio)}\u00d7`,
      limit: `\u2265 ${limits.minLiquidityRatio}\u00d7`,
      pass: liquidityRatio >= limits.minLiquidityRatio,
      detail: "24h quote volume relative to order",
    },
  ];

  const failed = checks.filter((check) => !check.pass);
  const maxByRisk = (portfolioValue * limits.maxRiskPercent / 100) / (stopDistancePercent / 100);
  const maxByConcentration = Math.max(0, portfolioValue * limits.maxConcentrationPercent / 100 - currentAssetValue);
  const suggestedOrderValue = Math.max(0, Math.min(orderValue, maxByRisk, maxByConcentration));

  return {
    decision: failed.length === 0 ? "APPROVE" : "REJECT",
    confidence: 1,
    checks,
    metrics: {
      lossAtStop: round(lossAtStop),
      riskPercent: round(riskPercent),
      concentrationPercent: round(concentrationPercent),
    },
    explanation: failed.length === 0
      ? `All ${checks.length} policy checks passed. The proposed trade risks ${round(riskPercent)}% of the portfolio.`
      : `Rejected because ${failed.map((item) => item.label.toLowerCase()).join(" and ")} exceeded the mandate.`,
    saferAlternative: failed.length === 0 || suggestedOrderValue <= 0
      ? null
      : {
          orderValue: round(suggestedOrderValue),
          message: `Reduce the order to $${round(suggestedOrderValue).toLocaleString()} or less, then reassess market conditions.`,
        },
    evaluatedAt: new Date().toISOString(),
  };
}
