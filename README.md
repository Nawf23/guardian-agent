# Guardian Agent

Guardian is a deterministic pre-trade risk layer for agentic finance. It turns natural-language trading intent into an inspectable proposal, evaluates that proposal against a user mandate, blocks unsafe execution, and issues an audit receipt for approved actions.

> **Agents propose. Guardian disposes.** The language model never receives direct execution authority.

Built as a Track A prototype for the Binance Agent OS Mini Hackathon. Guardian reads live Binance Spot market data for price, spread, liquidity, and short-horizon volatility while keeping execution in a safe simulated mode.

## Try Guardian now

### [Open the live Guardian Agent →](http://5.180.151.120:4173)

No installation, account, wallet, or API key is required. The public prototype uses live Binance Spot market data and simulated order execution, so visitors can safely explore every decision path without risking funds.

## How to use the agent

1. Open the [live application](http://5.180.151.120:4173).
2. Read the active mandate shown on the left: maximum portfolio risk, concentration, spread, volatility, and minimum liquidity coverage.
3. Select **Disciplined BNB entry** to evaluate a safe order using live Binance market data.
4. Review all five policy checks, then choose **Approve simulated execution** to generate a single-use audit receipt.
5. Select **Concentrated high-risk order** to see Guardian reject an unsafe proposal and calculate a safer maximum position size.
6. Select **Volatility circuit breaker** to see execution pause when market conditions breach the mandate.

### What the labels mean

- **Binance Spot API · live** — the decision used current Binance price, spread, liquidity, and candle data.
- **Guardian stress-test fixture** — a reproducible adverse-market simulation used to demonstrate the circuit breaker.
- **Demo / dry run** — orders and receipts are simulated; no real funds move.

## Run locally for development

Requires Node.js 20 or later. There are no third-party runtime dependencies.

```bash
npm start
```

Open <http://localhost:4173>. This address is only for developers running their own copy; normal visitors should use the [public application](http://5.180.151.120:4173).

```bash
npm test
```

## Safety model

- The risk decision is deterministic; an LLM cannot override it.
- Rejected proposals never receive an approval token.
- Approval tokens are single-use.
- Execution is simulated in this prototype and is visibly labelled as such.
- Production execution must remain behind explicit human confirmation, scoped Binance permissions, and a dedicated account.

## Architecture

```text
User intent → proposal → policy engine → approve/reject → human approval → Binance adapter → audit receipt
```

| Layer | Responsibility |
| --- | --- |
| Proposal | Convert user intent into a typed candidate order |
| Binance market adapter | Read live price, best bid/ask, liquidity and candles |
| Policy engine | Apply deterministic portfolio and market limits |
| Approval gate | Issue a single-use token only when every check passes |
| Execution adapter | Simulate today; authenticated test execution is the next milestone |
| Audit | Return a decision and execution receipt with policy identity |

The prototype uses Binance's public Spot market-data API through the Agent OS API toolkit for the live scenarios. Its next integration step is an authenticated Binance MCP/account adapter and test-environment order execution. The risk engine remains unchanged and sits in front of that adapter.

### Data modes

- **Live:** safe and high-risk scenarios request current price, best bid/ask, 24-hour quote volume, and thirty 1-minute candles from Binance. If Binance is unavailable, Guardian fails visibly to the bundled fallback fixture rather than breaking the demo.
- **Stress test:** the volatility circuit-breaker scenario uses a labelled deterministic fixture so judges can reproduce the safety response every time.

## Demo narrative

1. Run **Disciplined BNB entry** to show a safe proposal and simulated execution receipt.
2. Run **Concentrated high-risk order** to show deterministic rejection and a safer order size.
3. Run **Volatility circuit breaker** to show a valid-looking order being stopped when market conditions deteriorate.

The complete 90-second narration is in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md). The threat model is documented in [`docs/SECURITY.md`](docs/SECURITY.md).

## Why Guardian

Most trading agents optimize the decision to trade. Guardian solves the equally important control problem: whether an agent should be permitted to execute a particular proposal under the user's mandate and current market conditions. Its decision path is inspectable, reproducible, and independent of model confidence.

## Disclaimer

This is a hackathon prototype, not financial advice or production trading software. Digital assets are volatile. The app does not place real orders.
