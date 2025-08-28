// n8n Function node snippet: extract PRD JSON from Markdown
// Input: { prdMarkdown: "<full markdown string>" } OR { prdJson: {...} }
// Output: { prd: <object> }

const item = $json;

// If JSON already provided, pass through.
if (item.prdJson) {
  return [{ prd: item.prdJson }];
}

// Otherwise, extract fenced JSON (first well-formed block wins).
const md = item.prdMarkdown || '';
const fenceRegex = /```json[^\n]*\n([\s\S]*?)```/g;
let match, candidate = null;
while ((match = fenceRegex.exec(md)) !== null) {
  try {
    const obj = JSON.parse(match[1]);
    // Minimal sanity check: required top-level fields likely present
    if (obj && obj.featureName && obj.featureSlug && obj.functionalRequirements) {
      candidate = obj; break;
    }
  } catch (_) {/* ignore */}
}
if (!candidate) {
  throw new Error('No valid PRD JSON found in markdown appendix');
}
return [{ prd: candidate }];
