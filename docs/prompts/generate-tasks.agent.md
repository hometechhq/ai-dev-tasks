# System: @docs/prompts/system.md

# User
You are given a **PRD as strict JSON** that conforms to the canonical schema at
`https://hometechhq.github.io/ai-dev-tasks/specs/Prd.schema.json`.
Produce a **JSON array** of Task objects that each conform to `/specs/Task.schema.json`.
**Do not output prose. Output only the JSON array.**

## Grounding rules (derive tasks deterministically from PRD)
- Use `featureSlug` to derive an **ID prefix**. Task `id` must be `SLUG_UPPER-###` (3 digits), e.g., `NOTIFICATIONS-001`.
  - Set every task `status` to `"Planned"`.
  - Set `priority` by impact: P0 = critical path for must-have FRs, P1 = core, P2 = supporting (docs/observability), P3 = polish.
  - Set `type` from: {Code, Test, Docs, Infra, Refactor, Research}.
- Use `functionalRequirements[]` to create **implementation** tasks (type `Code`) and **verification** tasks (type `Test`).
  - Map each FR’s `acceptanceCriteria[]` into corresponding task `acceptanceCriteria[]` (verifiable statements).
  - Add label `FR:<id>` (e.g., `FR:FR-001`) on tasks tied to that FR.
- Use `data.entities[]` to create schema/model tasks (type `Code` or `Refactor`) when fields or new entities are required.
- Use `apis[]` to create endpoint tasks (type `Code`) with acceptance criteria referencing method/path and sample req/resp.
- Use `observability` to add tasks for metrics/logs/traces (type `Code` or `Infra`).
- Use `security/privacy` to add tasks for auth, RBAC, secrets, PII handling as applicable.
- Use `rolloutPlan.flags/phases` to add a feature-flag task and rollout tasks.
- Use `repoPaths[]` to **ground file locations** in `inputs.paths` for each task.

## Dependencies (deps)
Create a DAG that reduces risk and makes CI pass early:
1) Data/model changes before API/logic tasks that depend on them.
2) API scaffolding before integration tests that call it.
3) Core implementation before docs/observability polish.
4) Feature flag/rollout tasks come last.
Represent dependencies by listing the **task ids** a task depends on in `deps`.

## Task shape requirements
For **every** task object:
- `id`: `SLUG_UPPER-###` (3 digits, zero-padded).
- `title`: short and imperative, e.g., `Add GET /api/notifications endpoint`.
- `status`: `"Planned"`.
- `priority`: one of P0, P1, P2, P3.
- `type`: one of Code, Test, Docs, Infra, Refactor, Research.
- `deps`: array of task ids that must complete first (may be empty).
- `labels`: include relevant tags like `FR:FR-001`, `risk`, `migration`, `external-api`.
- `inputs`: include `paths` (array of repo paths from PRD `repoPaths`), plus any `apis` or `entities` relevant to the task.
- `outputs`: optional; e.g., generated files.
- `artifacts`: for Test tasks, include `["junit.xml","coverage/*"]`.
- `acceptanceCriteria`: list of **atomic, testable** checks (mirror FR criteria where applicable).

## Output contract
- Return **only** a JSON array: `[ Task, Task, ... ]` with **no wrapper object and no text**.
- Each `Task` must validate against `/specs/Task.schema.json`.

PRD (JSON only; do not parse markdown):
{{PRD_JSON}}

# Output
[ Task, Task, ... ]  // JSON only
