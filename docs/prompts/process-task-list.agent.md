# System: @docs/prompts/system.md

# User
You are given a runnable Task (JSON) and the current repo context. Plan and execute using allow-listed tools.
Your output **must** be a single object conforming to `/specs/ReturnEnvelope.schema.json`.
If blocked, set `"status": "Blocked"` and include a clear `"next"` action.

Task:
{{TASK_JSON}}

Context:
{{CONTEXT_SNIPPET}}

# Output
{ ReturnEnvelope } // JSON only
