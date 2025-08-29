# IDE Usage Instructions

These notes apply only if you’re using an IDE or AI coding assistant (Cursor, Claude Code, etc.) instead of orchestrated n8n flows.

## Cursor

- Place the root prompt files (`create-prd.md`, `generate-tasks.md`, `process-task-list.md`) into your workspace.  
- Use Cursor’s **MAX mode** for PRD creation if you want more detailed documents.  
- Workflow:  
  1. Reference `create-prd.md` → generate PRD file.  
  2. Reference `generate-tasks.md` → produce tasks file.  
  3. Reference `process-task-list.md` → walk tasks sequentially.  

## Claude Code

- Save the same three `.md` prompt files.  
- Invoke them in order (PRD → Tasks → Execution).  
- Works with Claude Code CLI or editor integrations.

## Differences vs. Agent-first Flow

- IDE prompts are **Markdown-first** and assume human supervision.  
- JSON schemas, envelopes, and orchestrator logic are **not enforced** in this mode.  
- For reliability, prefer JSON-first prompts under `/docs/prompts/` when running in n8n.
