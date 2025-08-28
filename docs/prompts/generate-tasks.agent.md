# System: @docs/prompts/system.md

# User
From this PRD, produce a **JSON array** of Task objects conforming to `/specs/Task.schema.json`.
Rules:
- Keep tasks ≤ ~2h each.
- Include acceptanceCriteria[] and deps[].
- Type ∈ {Code, Test, Docs, Infra, Refactor, Research}.
- Add labels for risk, migration, or external-API calls.

PRD:
{{PRD_JSON}}

# Output
[ Task, Task, ... ] // JSON only, schema-conformant
