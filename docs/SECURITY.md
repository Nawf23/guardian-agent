# Security model

Guardian treats the language model as an untrusted proposer, never as an execution authority.

## Invariants

1. A trade cannot receive an approval token unless every deterministic check passes.
2. Approval tokens are random, stored server-side, and single-use.
3. Market-dependent rules are evaluated immediately before an execution request.
4. Unavailable live market data falls back visibly for the demo; production mode must fail closed.
5. The prototype never places a real order and never requests API credentials.

## Production requirements

- Use a dedicated Binance account or sub-account with minimum permissions.
- Store secrets outside the repository in a managed secret store.
- Restrict credentials by IP and disable withdrawal permissions.
- Replace in-memory approvals with expiring, signed, durable records.
- Require authentication, CSRF protection, rate limiting, and HTTPS.
- Record immutable decision inputs, policy versions, execution responses, and reconciliation results.
- Treat ambiguous exchange timeouts as unknown state and reconcile before retrying.
