# AI Agent Prompts

This folder contains the **JSON-first prompts** used by agents in the AI-Dev-Tasks workflow.  
Each prompt instructs an agent role to output **only valid JSON** conforming to the schemas in `/specs`.

## Active Prompts

1. **planner.prd.md**  
   Creates a Product Requirement Document (PRD) JSON conforming to `/specs/Prd.schema.json`.

2. **planner.tasks.md**  
   Expands a PRD into a full Task Plan JSON conforming to `/specs/Plan.schema.json`.

3. **implementor.task.md**  
   Executes a single task, produces a ReturnEnvelope JSON conforming to `/specs/ReturnEnvelope.schema.json`.

4. **reviewer.task.md**  
   Reviews an implementor’s ReturnEnvelope, produces a lightweight verdict JSON.

5. **manager.cycle.md**  
   Supervises an entire PRD→Plan→Implement→Review cycle, chooses next action, updates state.

## Rules

- Agents must output **only fenced JSON blocks** (` ```json ... ``` `).  
- No commentary outside the JSON.  
- All JSON must validate against its corresponding schema in `/specs`.  
- Orchestrator (n8n) is responsible for feeding context (PRD excerpt, plan, repo snippets).

## See Also

- `/specs` — authoritative JSON schemas.  
- `/docs/prompts/CONVENTIONS.md` — shared conventions for all prompts.  
