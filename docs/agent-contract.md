# Agent Contract

- **Schemas**: `/specs/*.json` are the source of truth.
- **States**: `Planned → InProgress/Blocked`; `InProgress → Review/Blocked`; `Review → Done/InProgress`; `Blocked → InProgress`; `Done → ∅`.
- **Return Envelope**: Single-object response per execution step; `actions[].resultRef` enables provenance.
- **Idempotency**: `state-upsert`, `state-resume`, `state-transition` ensure safe retries.
- **Budgets**: Enforce caps; escalate model when thresholds trip (see `/config/budget.json`).
- **Security**: Tools only, no shell; draft PRs; least-privilege PAT.
- **Failure semantics**: When blocked, set `"status":"Blocked"`, include `"next"` with a concrete unblocking step.
