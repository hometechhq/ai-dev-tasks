import fs from 'node:fs';
import path from 'node:path';
const FILE = path.resolve('state/tasks.jsonl');

export function upsertTasks(tasks) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const existing = fs.existsSync(FILE)
    ? fs.readFileSync(FILE, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
    : [];
  const map = new Map(existing.map(t => [t.id, t]));
  for (const t of tasks) map.set(t.id, { ...(map.get(t.id) || {}), ...t });
  const out = Array.from(map.values()).map(t => JSON.stringify(t)).join('\n') + '\n';
  fs.writeFileSync(FILE, out, 'utf8');
}

if (process.argv[2]) {
  const tasks = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  upsertTasks(tasks);
}
