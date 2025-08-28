import fs from 'node:fs';

const ALLOWED = {
  Planned: ['InProgress', 'Blocked'],
  InProgress: ['Review', 'Blocked'],
  Review: ['Done', 'InProgress'],
  Blocked: ['InProgress'],
  Done: []
};

const FILE='state/tasks.jsonl';
const [,, id, to] = process.argv;

if (!id || !to) {
  console.error('usage: node scripts/state-transition.mjs <TASK_ID> <TO_STATUS>');
  process.exit(1);
}

const lines = fs.readFileSync(FILE, 'utf8').trim().split('\n').filter(Boolean);
const tasks = lines.map(JSON.parse);
const t = tasks.find(x => x.id===id);
if(!t) throw new Error(`Task ${id} not found`);
if(!ALLOWED[t.status]?.includes(to)) throw new Error(`Illegal ${t.status} -> ${to}`);
t.status = to;
fs.writeFileSync(FILE, tasks.map(x=>JSON.stringify(x)).join('\n')+'\n', 'utf8');
