# ⚠️ IDE-ONLY PROMPT (Not for Agents)

> This file is for **human IDE workflows** (Cursor, Claude, etc.).  
> For orchestrated agents (n8n), use `/docs/prompts/planner.prd.md` which produces JSON conforming to `/specs/Prd.schema.json`.

---

## Create PRD

You are an AI coding assistant.  
Your task is to transform a feature idea into a Product Requirement Document (PRD).  
Ask clarifying questions first, then draft a PRD in Markdown for the human to review.


# Create PRD (human‑first, agent‑ready)

> **Who writes this?** A human or a larger model (e.g., GPT‑5).
>
> **Who consumes it next?** An autonomous pipeline using **gpt‑5‑nano**.  
> **Contract:** At the bottom, include a **Machine Appendix** that is **strict JSON** conforming to the single canonical schema:  
> `https://hometechhq.github.io/ai-dev-tasks/specs/Prd.schema.json`

---

## Quick start (Cursor/Claude)
Paste this to begin (or follow manually):
> Use @create-prd.md  
> Feature brief: [describe the feature succinctly]  
> Repo files to reference (optional): [@path/to/file1 @path/to/file2]

**Audience:** write so a **junior developer** can implement it unassisted.

---

## Process to generate the PRD

1. **Gather inputs** — feature brief, links to relevant files/areas, product intent.
2. **Questioning cycle** — run a structured interview (below) until ambiguity is minimized. Do **not** cap the number of questions; ask what’s needed for clarity.
3. **Draft PRD** — fill every section in “PRD (human‑readable)” using the answers.
4. **Tighten acceptance criteria** — make each functional requirement testable.
5. **Complete Machine Appendix** — add a strict JSON block that conforms to the canonical schema (link above). Nano consumes only this JSON.
6. **Validate** — run JSON schema validation; fix any errors.
7. **Review & revise** — product/tech review; update PRD + appendix together.
8. **Save** — `/tasks/prd-[feature-slug].md`. Signal it’s ready for tasking.

---

## Questioning cycle (no hard limit)

Work through these categories. Ask as many questions as needed to remove ambiguity. Include answers in the PRD body and reflect them in the Machine Appendix.

### 1) Product & Users
- Who is the primary user? What job are they trying to accomplish?
- What is the single most important outcome for the user?
- What existing flows does this change or replace?

### 2) Scope & Goals
- What must be in the first release? What can wait?
- What are **explicit non‑goals** for this iteration?

### 3) Success Metrics
- What metrics define success (leading indicators)? Baseline and target?
- Over what time window (e.g., 30d) should we measure?

### 4) Data & Entities
- What entities are involved (fields, types, constraints)?
- Which fields are required vs. optional? Any enums?

### 5) APIs & Integrations
- What endpoints/methods/paths do we need? Auth scheme? Rate limits?
- Example request/response for each new/changed endpoint?

### 6) UX/Design
- What are the states (loading/empty/error/success)? Accessibility needs?
- Any responsive or offline behavior?

### 7) Non‑Functional Requirements (NFRs)
- Performance targets (p95/p99)? Reliability (RTO/RPO, uptime)?
- Privacy/data retention? Internationalization/locales?

### 8) Security & Privacy
- Authn/z model (roles/permissions)? PII involved? Secrets handling?
- Compliance or audit requirements?

### 9) Risks & Edge Cases
- What are the riskiest assumptions? How do we mitigate them?
- Edge cases users hit often? How should the system behave?

### 10) Tech Constraints & Repo Boundaries
- Which files/dirs will change? Tech stack constraints?
- Any dependencies or feature flags we should plan for?

### 11) Rollout & Compatibility
- Phases (internal → beta → GA)? Backward‑compat or migrations?
- Rollback plan?

### 12) Open Questions
- What requires PO/tech‑lead decisions before implementation?

> **Exit criteria for questioning:** the PRD can fill every section below with **actionable, testable** detail. If unknowns remain, list them under **Open Questions** and reflect constraints/assumptions in the appendix.

---

## PRD (human‑readable)
1) **Overview** – Problem and audience.  
2) **Goals** – Numbered; each testable.  
3) **Non‑Goals** – Out of scope for *this* iteration.  
4) **Users & Personas** – Primary & secondary.  
5) **User Stories** – “As a <user>, I want <capability>, so that <benefit>.” Give IDs like `US-001`.  
6) **Functional Requirements** – Numbered “the system must …” with IDs like `FR-001`.  
7) **Non‑Functional Requirements (NFRs)** – Perf/latency, reliability, accessibility, i18n, privacy.  
8) **Data & APIs** – Entities (fields/types), CRUD, external API endpoints with example req/resp.  
9) **Design/UX** – States (empty/error/loading), navigation, responsive behavior; link to mocks.  
10) **Edge Cases & Risks** – Risk → mitigation table with IDs like `RISK-001`.  
11) **Security & Privacy** – AuthZ model, PII classification, secrets, retention.  
12) **Observability** – Logs/metrics/traces by **name** and success conditions.  
13) **Success Metrics** – Baseline → target by time window (e.g., 30 days).  
14) **Rollout Plan** – Flags, phases, migrations/backward‑compat.  
15) **Open Questions** – Decisions pending from PO/tech lead.

### Acceptance criteria (for FRs)
Each **FR** must have one or more **testable** acceptance criteria  
(e.g., “verified by unit test X and integration test Y; API returns 200 with schema …”).

---

## Output & Save
- Format: Markdown (`.md`) with a JSON appendix (below).  
- Location: `/tasks/`  
- Filename: `prd-[feature-slug].md`  (e.g., `prd-user-notifications.md`)

---

## Machine Appendix (strict JSON, canonical schema)
> Single fenced block with **only JSON**, no comments. Must conform to  
> `https://hometechhq.github.io/ai-dev-tasks/specs/Prd.schema.json`

```json
{
  "$schema": "https://hometechhq.github.io/ai-dev-tasks/specs/Prd.schema.json",
  "featureName": "RENAME_ME",
  "featureSlug": "rename-me",
  "summary": "One-paragraph summary for non-experts.",
  "context": "Key background and repo areas by path.",
  "goals": ["Goal 1", "Goal 2"],
  "nonGoals": ["What we will NOT do now"],
  "userStories": [
    { "id": "US-001", "story": "As a ... I want ... so that ...", "priority": "P2" }
  ],
  "functionalRequirements": [
    {
      "id": "FR-001",
      "text": "The system must ...",
      "acceptanceCriteria": [
        "API returns 200 with {...}",
        "Unit test X and integration test Y verify behavior"
      ]
    }
  ],
  "nfr": {
    "performance": { "p95_ms": 200, "p99_ms": 500 },
    "reliability": { "uptime_target": "99.9%", "rto_seconds": 60, "rpo_seconds": 300 },
    "security": { "requirements": ["JWT auth", "RBAC: admin, user"] },
    "privacy": { "dataClasses": ["email"], "retentionDays": 365 },
    "accessibility": { "wcag": "2.1 AA" },
    "internationalization": { "locales": ["en-US"] }
  },
  "data": {
    "entities": [
      {
        "name": "Notification",
        "fields": [
          { "name": "id", "type": "uuid", "required": true },
          { "name": "userId", "type": "uuid", "required": true },
          { "name": "status", "type": "enum(delivered|read)", "required": true }
        ]
      }
    ]
  },
  "apis": [
    {
      "name": "List notifications",
      "method": "GET",
      "path": "/api/notifications",
      "auth": "JWT",
      "rateLimitPerMin": 600,
      "request": { "query": ["limit:int=50", "cursor:string?"] },
      "response": { "schema": "Array<Notification>", "example": { "items": [] } }
    }
  ],
  "repoPaths": [
    { "path": "apps/web/src/pages/notifications.tsx", "purpose": "UI screen" },
    { "path": "services/notifications", "purpose": "backend service" }
  ],
  "techStack": ["Next.js", "Node", "Postgres"],
  "constraints": ["Must work on mobile", "No DB migrations > 30s"],
  "observability": {
    "metrics": [
      { "name": "notifications.sent.count", "unit": "count", "successCondition": ">= 1 per trigger" }
    ],
    "logs": [
      { "name": "notif.send", "level": "info" }
    ],
    "traces": ["notif.send"]
  },
  "successMetrics": [
    { "metric": "DAU_touch_rate", "baseline": 0.0, "target": 0.15, "window": "30d" }
  ],
  "rolloutPlan": { "flags": ["notif_enabled"], "phases": ["internal", "beta", "ga"] },
  "risks": [
    { "id": "RISK-001", "risk": "Push limits", "mitigation": "Backoff & retry" }
  ],
  "openQuestions": ["What is max payload size?"],
  "attachments": []
}
```

> **Stop here — no code yet.** After review/approval, the autonomous pipeline will consume only the JSON appendix.
