# Generate Tasks (human-first, v2)

> **Agent mode:** Use `docs/prompts/generate-tasks.agent.md` to emit a **JSON array** of Task objects (no prose) conforming to `/specs/Task.schema.json`.

## Tasking rules
- Split by **deliverable**: code, tests, docs, observability, rollout.
- Keep tasks under ~2h of work; prefer more small tasks to fewer big ones.
- Each task must include **acceptanceCriteria** and **deps** as needed.
- Mark risks (e.g., migrations, prod config, unknown APIs).
- Label tasks by type: Code, Test, Docs, Infra, Refactor, Research.

## Output
- A numbered markdown task list (for humans) **and** a JSON list (for agents).
- JSON must include: id, title, type, priority, deps[], acceptanceCriteria[].
