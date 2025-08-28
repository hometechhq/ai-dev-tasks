# Create PRD (human-first, v2)

> **Agent mode:** Use `docs/prompts/create-prd.agent.md` for **JSON-only** output conforming to `/specs/Prd.schema.json`.

## What to include
1) **Context**: who/what/why; links to code areas touched.
2) **Goals**: bullet list; each goal testable.
3) **Non-goals**: explicitly out of scope.
4) **Constraints**: perf/SLOs, latency budgets, platform, data shape, 3P APIs.
5) **Users & UX**: primary user, scenarios, rough UX flow or API surface.
6) **Acceptance criteria**: numbered, unambiguous; “verifiable by tests.”
7) **Observability**: logs/metrics/traces required.
8) **Security/Privacy**: authn/z, PII handling, secret storage.
9) **I18n/A11y**: if applicable.
10) **Open questions**: what needs PO/tech lead input.

## Instructions for the AI (IDE usage)
- Ask at most 5 clarifying questions up front.
- Propose trade-offs when constraints conflict.
- Link each acceptance criterion to a test idea (“can be verified by …”).
- Keep it **short**; defer nice-to-haves to “Future work”.

## Output
A well-structured PRD in markdown with the headings above.
