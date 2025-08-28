# State Helpers (JSONL)

These Node.js scripts manage the JSONL task store at `state/tasks.jsonl`. They are agent-friendly and idempotent.

## Prereqs
- Node.js 18+
- Optional: set `STATE_FILE` env var to override the default path.

## Files
- `state-common.mjs` — shared utilities
- `state-upsert.mjs` — upsert tasks from stdin (single object or array)
- `state-transition.mjs` — enforce valid status transitions
- `state-resume.mjs` — print next runnable task (Planned + deps satisfied)

## Usage

### Upsert
```bash
# Insert/update a single task
echo '{ "id":"TASK-001","title":"Hello","status":"Planned","priority":"P2","type":"Docs","inputs":{},"acceptanceCriteria":["ok"] }' \  | node scripts/state-upsert.mjs

# Insert/update multiple tasks
cat tasks.json | node scripts/state-upsert.mjs
```

### Transition
```bash
node scripts/state-transition.mjs TASK-001 InProgress
node scripts/state-transition.mjs TASK-001 Review
node scripts/state-transition.mjs TASK-001 Done
```

### Resume
```bash
node scripts/state-resume.mjs
# → prints the next runnable task JSON or a message when none available
```

## Notes
- Transitions allowed:
  - Planned → InProgress, Blocked
  - InProgress → Review, Blocked
  - Review → Done, InProgress
  - Blocked → InProgress
  - Done → (no transitions)
- Dependencies are satisfied when **all** listed task IDs have `status: "Done"`.
- The JSONL format is **one task per line**; scripts keep order stable.
