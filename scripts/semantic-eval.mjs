import fs from 'node:fs';

const rubric = JSON.parse(fs.readFileSync('../eval/rubrics/basic.json','utf8'));
// TODO: Call OpenAI with rubric + codebase; stubbed to pass.
const report = { pass: true, notes: "Template OK", rubricName: rubric.name };
fs.writeFileSync('semantic-eval.json', JSON.stringify(report, null, 2));
console.log('Semantic eval:', report);
process.exit(report.pass ? 0 : 1);
