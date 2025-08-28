import fs from 'node:fs';
const FILE = 'state/tasks.jsonl';

function nextRunnable() {
  if (!fs.existsSync(FILE)) return null;
  const tasks = fs.readFileSync(FILE, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  const done = new Set(tasks.filter(t => t.status === 'Done').map(t => t.id));
  const blockedDeps = t => (t.deps || []).some(d => !done.has(d));
  return tasks.find(t => t.status === 'Planned' && !blockedDeps(t)) || null;
}

const t = nextRunnable();
process.stdout.write(JSON.stringify({ task: t }, null, 2));
