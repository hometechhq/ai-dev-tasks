# AI Dev Tasks — Agent-Aligned (n8n + OpenAI GPT-5)

A lightweight, repeatable workflow for **planning, executing, and shipping** features with AI—usable by **humans in AI IDEs** _and_ by **autonomous agents** (n8n + OpenAI GPT-5).

- Human flow: `create-prd.md → generate-tasks.md → process-task-list.md`
- Agent flow: Same stages, plus **machine-readable tasks**, **state**, **tool contracts**, **quality gates**, and **budgets**

> This README describes the agent-aligned architecture. Some files/dirs are added in follow-up commits (see “Repository Layout” and “Roadmap”).

---

## Why this exists

Large, single prompts are brittle. This repo enforces **small, checkable steps** with clear success criteria. For agents, we add:
- A **Task JSON Schema** the model must output
- A **Return Envelope** for every agent action
- **State & transitions** so runs are resumable/idempotent
- **Tool contracts** (OpenAPI) for GitHub, filesystem, tests, etc.
- **Quality gates** (tests/linters/static + semantic eval) before merge
- **Budgets/rate-limits** to keep costs safe and predictable

---

## Repository layout

_Current (human-first) files are already present; agent files are introduced in next steps._

```
/
├─ create-prd.md
├─ generate-tasks.md
├─ process-task-list.md
├─ specs/
│  └─ Task.schema.json                # canonical task schema (added next)
├─ docs/
│  ├─ agent-contract.md               # states, envelopes, error semantics
│  └─ prompts/                        # system/dev/user split versions
├─ tools/                             # OpenAPI specs the agent can call
│  ├─ github.yaml
│  ├─ fs.yaml
│  ├─ test.yaml
│  └─ eval.yaml
├─ n8n/                               # ready-to-import workflows
│  ├─ 01_ingest_prd.json
│  ├─ 02_plan_tasks.json
│  ├─ 03_execute_next_task.json
│  ├─ 04_quality_gates.json
│  └─ 05_human_review.json
├─ state/                             # runtime (gitignored)
│  └─ tasks.jsonl
├─ .github/
│  └─ workflows/agent-checks.yml      # CI gates for PRs
└─ LICENSE, README.md
```

---

## Quickstart

### Requirements
- **n8n** (cloud or self-hosted), Node 18+
- **OpenAI** API key with access to GPT-5 models
- **GitHub** repo + PAT (scopes: `repo`, `workflow` recommended)

### 1) Human-in-the-loop (any AI IDE)
1. Open your IDE agent (Cursor, Claude Code, etc.).
2. Reference the prompts:
   - Create PRD with `@create-prd.md`
   - Plan with `@generate-tasks.md`
   - Execute with `@process-task-list.md`
3. Approve/iterate task-by-task.

### 2) Agent-mode (n8n)
1. Import `/n8n/*.json` (workflows).
2. Set credentials:
   - `OPENAI_API_KEY`
   - `GITHUB_TOKEN`, `REPO_OWNER`, `REPO_NAME`, `DEFAULT_BRANCH`
3. Run `02_plan_tasks` to generate/validate tasks (JSON) and upsert into `/state/tasks.jsonl`.
4. Run `03_execute_next_task` to implement the next runnable task:
   - The agent returns a **Return Envelope** (below) and opens a **draft PR**.
5. `04_quality_gates` runs CI (tests/linters/semantic eval). On pass → move to **Review**. On fail → **Blocked** with diagnostics.
6. Approve the PR → `05_human_review` transitions to **Done** and merges.

---

## Task JSON Schema (canonical)

All agent-generated tasks must conform to `/specs/Task.schema.json`:

```json
{
  "$id": "https://example.com/specs/Task.schema.json",
  "type": "object",
  "required": ["id", "title", "status", "priority", "type", "inputs"],
  "properties": {
    "id": { "type": "string" },
    "parentId": { "type": ["string", "null"] },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "status": { "enum": ["Planned", "InProgress", "Review", "Done", "Blocked"] },
    "priority": { "enum": ["P0", "P1", "P2", "P3"] },
    "type": { "enum": ["Code", "Docs", "Test", "Design", "Infra", "Research", "Refactor"] },
    "deps": { "type": "array", "items": { "type": "string" } },
    "assignee": { "type": "string" },
    "labels": { "type": "array", "items": { "type": "string" } },
    "inputs": { "type": "object" },
    "outputs": { "type": "object" },
    "artifacts": { "type": "array", "items": { "type": "string" } },
    "acceptanceCriteria": { "type": "array", "items": { "type": "string" } },
    "checklist": { "type": "array", "items": { "type": "string" } }
  }
}
```

### Example
```json
{
  "id": "TASK-001",
  "title": "Add /health endpoint",
  "description": "Expose GET /health returning {status:'ok'}",
  "status": "Planned",
  "priority": "P2",
  "type": "Code",
  "deps": [],
  "labels": ["backend", "api"],
  "inputs": { "path": "/health" },
  "outputs": {},
  "acceptanceCriteria": ["200 OK", "JSON body includes status:'ok'"],
  "checklist": ["unit test added", "route registered"]
}
```

---

## States & transitions

| From         | Allowed To                      |
|--------------|---------------------------------|
| Planned      | InProgress, Blocked             |
| InProgress   | Review, Blocked                 |
| Review       | Done, InProgress                |
| Blocked      | InProgress                      |
| Done         | —                               |

> Transitions are enforced by small helper scripts and/or the n8n nodes.

---

## Agent Return Envelope

Every task execution returns a single JSON object the orchestrator can parse:

```json
{
  "taskId": "TASK-001",
  "status": "InProgress | Review | Blocked | Done",
  "actions": [
    { "tool": "fs.write", "args": { "path": "src/health.ts", "contents": "..." }, "resultRef": "w1" },
    { "tool": "github.pr.create", "args": { "title": "feat: health endpoint", "branch": "feat/TASK-001-health", "draft": true }, "resultRef": "pr1" }
  ],
  "artifacts": ["coverage/coverage.xml", "junit.xml"],
  "notes": "Implemented route, added tests.",
  "next": "If tests fail, add dependency injection to server."
}
```

- `status` reflects **post-action** state for this task.
- `actions[].resultRef` lets later steps fetch tool outputs.

---

## Tool contracts (OpenAPI)

The agent doesn’t shell out. It calls **allow-listed tools** described in `/tools/*.yaml`.

### Example: minimal GitHub PR (excerpt)

```yaml
openapi: 3.1.0
info: { title: GitHub Minimal, version: 1.0.0 }
paths:
  /repos/{owner}/{repo}/pulls:
    post:
      operationId: pr_create
      parameters:
        - in: path; name: owner; required: true; schema: { type: string }
        - in: path; name: repo; required: true; schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title, head, base]
              properties:
                title: { type: string }
                head:  { type: string }    # branch
                base:  { type: string }    # DEFAULT_BRANCH
                body:  { type: string }
                draft: { type: boolean }
      responses:
        "201": { description: "Created" }
        "422": { description: "Validation failed" }
```

Ship similar specs for `fs`, `test`, and `eval` tools.

---

## State store

- Location: `/state/tasks.jsonl` (newline-delimited JSON, **.gitignored**)
- Helpers:
  - `state-upsert`: idempotently upserts tasks
  - `state-resume`: yields the next runnable task (no unmet `deps`)
  - `state-transition`: enforces valid moves (see table above)

---

## Quality gates (CI)

- `.github/workflows/agent-checks.yml` runs on PRs from agent branches
  - **Unit tests** (produce JUnit)
  - **Linters/formatters**
  - **Coverage** (produce Cobertura/LCOV)
  - **Static checks** (regex/AST)
  - **Semantic eval** (LLM rubric; returns strict JSON)

Branch protection requires all checks to pass before merge.

---

## Budgets & rate limits

- `/config/budget.json` defines **caps per model & per task**
- Retry policy: **exponential backoff + jitter**
- Agents must stop or downgrade model when caps are exceeded

---

## Security & compliance

- Allow-listed tools only; no arbitrary shell
- Draft PRs + feature branches by default
- Least-privilege GitHub PAT scopes
- Secrets managed in n8n credentials vault
- Provenance: actions + results logged per task

---

## Human-first prompts (still here!)

Keep using:
- `create-prd.md` → generate a PRD
- `generate-tasks.md` → produce **JSON tasks** (schema above)
- `process-task-list.md` → execute tasks and emit a **Return Envelope**

> The prompts are being made **agent-consumable** (system/dev/user separation and tool-use rules). See `/docs/prompts/` once added.

---

## Roadmap

1. Add `/specs/Task.schema.json` and update prompts to **output JSON only**
2. Commit `/tools/*.yaml` and `/n8n/*.json`
3. Add `.github/workflows/agent-checks.yml`
4. Provide a small `/sample-app/` so gates are meaningful on day one
5. Add `/docs/agent-contract.md` with full semantics and examples

---

## Contributing

PRs welcome—especially for tool specs, tests, and evals. Open issues for discussion.

## License

Apache-2.0
