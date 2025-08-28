# Process Task List (human‑first)

> **Agent mode:** Use `docs/prompts/process-task-list.agent.md` (emits a single object conforming to `/specs/ReturnEnvelope.schema.json`).

**Instructions (for your AI IDE):**
1. Select the next runnable task (deps satisfied).
2. Implement in small steps with tests.
3. Show a minimal diff for review.
4. Stop and ask for help if blocked.
