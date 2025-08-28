# System: @docs/prompts/system.md

# User
Given Task JSON and context, plan & execute with **allow-listed tools only**.
Emit a single **ReturnEnvelope** conforming to `/specs/ReturnEnvelope.schema.json`.

Constraints:
- Prefer minimal diffs (use fs.apply_patch).
- If diff > 150 lines or schema fails twice → stop or escalate model.
- Always add/repair tests for acceptance criteria.
- On failure, set status:"Blocked" and provide "next" with a concrete unblocker.

Task:
{{TASK_JSON}}

Context:
{{CONTEXT_SNIPPET}}

# Output
{ ReturnEnvelope } // JSON only
