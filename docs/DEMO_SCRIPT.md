# Guardian demo script — 90 seconds

## 0:00–0:12 — Problem

“AI agents can place trades, but language-model confidence is not a risk control. Guardian is the deterministic control layer between an agent's intention and Binance execution.”

Show the landing page and point out the active mandate: 1% maximum loss, 35% maximum concentration, spread, liquidity, and volatility limits.

## 0:12–0:35 — Safe trade

Select **Disciplined BNB entry**.

“Guardian reads current Binance market data, compiles the proposed order, and tests it against every user-owned limit. The model cannot override these checks.”

Show five green checks, then click **Approve simulated execution** and show the single-use audit receipt.

## 0:35–0:58 — Unsafe trade

Select **Concentrated high-risk order**.

“This request sounds valid, but it risks 4% of the portfolio and creates 60% concentration. Guardian refuses to generate an approval token and calculates a policy-compliant maximum size of $1,250.”

Point out that there is no execution button.

## 0:58–1:15 — Conditions change

Select **Volatility circuit breaker**.

“Authorization is not permanent. Guardian re-evaluates conditions immediately before execution. In this reproducible stress test, abnormal volatility pauses the order.”

## 1:15–1:30 — Close

“Guardian makes agentic finance inspectable and bounded: live Binance data in, deterministic policy decision, explicit human approval, and an audit receipt out. Agents can move fast without users surrendering control.”

End on the project name and GitHub URL.
