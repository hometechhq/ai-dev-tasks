# System: @docs/prompts/system.md

# User
Create a PRD as **JSON** matching `/specs/Prd.schema.json`.
- Ask up to 5 clarifying questions if essential; otherwise proceed.
- Populate: featureName, context, goals[], nonGoals[], constraints[], acceptanceCriteria[], openQuestions[].
- Each acceptance criterion should be testable (“verified by unit/integration test X”).

Input feature brief (verbatim):
{{FEATURE_CONTEXT}}

# Output
{ PRD } // JSON only, schema-conformant
