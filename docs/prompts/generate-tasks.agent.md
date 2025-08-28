# System: @docs/prompts/system.md

# User
From this PRD (JSON), generate a minimal set of tasks as a JSON **array** of Task objects, each conforming to `/specs/Task.schema.json`.
Include `acceptanceCriteria` for each, and `deps` as needed. Keep titles short.

PRD:
{{PRD_JSON}}

# Output
[ Task, Task, ... ]  // JSON only
