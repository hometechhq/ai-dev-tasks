# Process Task List (human-first, v2)

> **Agent mode:** Use `docs/prompts/process-task-list.agent.md` to output a **Return Envelope** JSON conforming to `/specs/ReturnEnvelope.schema.json`.

## Execution rules
- Work **one task at a time**; do the smallest viable change first.
- Always write/repair tests for the acceptance criteria before/with code.
- Show a minimal, reviewable diff. If the diff >150 lines, split the task.
- If blocked, stop and ask 1–3 crisp questions. Don’t guess.
- Commit message style: `feat|fix|docs|refactor(scope): summary (#TASK-ID)`.

## Definition of done
- All acceptance criteria pass via tests.
- No lints/build errors; coverage not lower than baseline.
- Log/metrics added if observable surface changed.
- Draft PR with summary, test notes, and follow-ups.
