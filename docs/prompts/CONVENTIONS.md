# Prompt Conventions

These conventions apply to all agent prompts in this folder.

## Input Handling

- Each agent receives structured inputs from the orchestrator (n8n).  
- Inputs are described in each prompt under **Inputs Provided by Orchestrator**.  
- Agents must not assume hidden memory; everything needed is provided explicitly.

## Output Format

- Always output **exactly one fenced JSON block** with language `json`.  
- Output must conform to the relevant schema in `/specs`.  
- No commentary, markdown lists, or explanations outside the fenced JSON.  
- Prefer concise, correct JSON to verbose natural language.

## Idempotency

- If a task is already satisfied, implementor should set `status="skipped"` with notes.  
- Never re-apply identical changes; orchestrator will detect completed tasks.  

## Security & Compliance

- Do not include secrets in output.  
- Default to safe libraries and parameterized inputs.  
- For auth/data tasks, include security criteria in acceptance.  

## Model Routing

- Planner PRD/Tasks → `gpt-5` (large model).  
- Implementor tasks → `gpt-5-nano` by default.  
- Escalation to `gpt-5-mini` if tasks fail gates.  
- Reviewer/Manager may use smaller models to save cost.  

## Testing & Gates

- Implementor must run tests/lint/build commands as provided.  
- Reviewer must block if tests fail or acceptance unmet.  
- Manager ensures plan-level gates satisfied before marking completed.  

---

Following these conventions ensures **reliability, repeatability, and auditability** across all agents.
