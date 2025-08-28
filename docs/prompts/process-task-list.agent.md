# System: @docs/prompts/system.md

# User
You are given a **Task** (JSON) and the **PRD** (JSON). Your job is to advance this task with the **smallest viable change** and emit a single **Return Envelope** object that conforms to `/specs/ReturnEnvelope.schema.json`.

Inputs:
- PRD (canonical JSON, validated): 
  {{PRD_JSON}}
- Task (validated Task object):
  {{TASK_JSON}}
- Context snippets (optional; may be empty). Prefer reading files when in doubt:
  {{CONTEXT_SNIPPET}}

## Hard rules
1. **Output JSON only** — exactly one object that validates against `/specs/ReturnEnvelope.schema.json`. No prose outside JSON.
2. **Allowed tools only:** `fs.read`, `fs.write`, `fs.apply_patch`, `test.run`, `eval.semantic`, `github.pr_create`, `github.comment_create`.
3. **Minimize diffs:** Prefer `fs.apply_patch` with a **unified diff**. Avoid whole‑file rewrites.
4. **Test first/with:** Add or repair tests to satisfy **acceptanceCriteria** in the Task. Run `test.run`. Do not open a PR unless tests pass.
5. **Ground your work:** Use `repoPaths`, `apis`, `data.entities`, `nfr`, and `observability` from the PRD to determine file locations, API shapes, and test expectations.
6. **Status discipline:**
   - Use `"InProgress"` if changes are staged but tests haven’t passed yet.
   - Use `"Review"` if changes and tests complete successfully.
   - Use `"Blocked"` if you need missing info/permissions; include a concrete `"next"` action.
   - Use `"Done"` only if the task’s acceptance criteria are unquestionably met and the PR is ready.
7. **Branch & PR naming:** For PR creation, set `title` like `feat({{PRD.featureSlug}}): {TASK.id} {TASK.title}` and use `head` branch `feat/{{PRD.featureSlug}}-{{TASK.id | lower}}` (draft). The orchestrator will create the branch if necessary.
8. **Budgets:** Keep changes small and token‑frugal. If you cannot proceed safely without more context, stop with `"Blocked"` and a precise `"next"`.

## Typical action sequence
- Read only the files you need (`fs.read`).
- Apply a minimal patch (`fs.apply_patch`) to implement or adjust code/tests.
- Run tests (`test.run`).
- Optionally run a semantic check (`eval.semantic`) if applicable.
- If tests pass, open a **draft PR** (`github.pr_create`).
- Add a focused PR comment summarizing what changed (`github.comment_create`).

## Output contract
Emit exactly one object with fields:
- `taskId`: the Task `id`.
- `status`: `"InProgress" | "Review" | "Blocked" | "Done"`.
- `actions`: an array of tool invocations with `tool`, `args`, and a unique `resultRef` (e.g., `"r1"`, `"d1"`, `"t1"`, `"pr1"`). Keep `args` minimal.
- `artifacts`: paths produced (e.g., `["junit.xml","coverage/lcov.info"]`) when applicable.
- `notes`: short machine‑readable summary (no markdown).
- `next`: if Blocked, the single, crisp action needed to proceed (e.g., `"Need API key X"`).

## Example (for structure only — **DO NOT COPY VERBATIM**)
{
  "taskId": "NOTIFICATIONS-001",
  "status": "Review",
  "actions": [
    { "tool": "fs.read", "args": { "path": "services/notifications/api.ts" }, "resultRef": "r1" },
    { "tool": "fs.apply_patch", "args": { "path": "services/notifications/api.ts", "unifiedDiff": "--- a/services/notifications/api.ts\n+++ b/services/notifications/api.ts\n@@\n+export async function listNotifications(limit = 50) {\n+  // implementation...\n+}\n" }, "resultRef": "p1" },
    { "tool": "fs.apply_patch", "args": { "path": "apps/web/src/pages/notifications.test.ts", "unifiedDiff": "--- a/apps/web/src/pages/notifications.test.ts\n+++ b/apps/web/src/pages/notifications.test.ts\n@@\n+it('returns <= 50 items newest first', async () => { /* ... */ });\n" }, "resultRef": "p2" },
    { "tool": "test.run", "args": {}, "resultRef": "t1" },
    { "tool": "github.pr_create", "args": { "title": "feat(notifications): NOTIFICATIONS-001 list endpoint", "head": "feat/notifications-notifications-001", "base": "main", "body": "Implements FR-001; adds tests." }, "resultRef": "pr1" },
    { "tool": "github.comment_create", "args": { "owner": "{{REPO_OWNER}}", "repo": "{{REPO_NAME}}", "number": 123, "body": "Implements FR-001; tests added; p95 target considered." }, "resultRef": "c1" }
  ],
  "artifacts": ["junit.xml", "coverage/lcov.info"],
  "notes": "Implements FR-001 with minimal diff; adds unit test; opens draft PR.",
  "next": "None"
}
