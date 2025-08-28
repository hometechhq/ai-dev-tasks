// scripts/state-resume.mjs
import { readTasks, depsSatisfied } from './state-common.mjs';

const tasks = readTasks();

const prioRank = { P0: 0, P1: 1, P2: 2, P3: 3 };
function rank(t) { return prioRank[t.priority] ?? 99; }

const candidates = tasks
  .filter(t => t.status === 'Planned')
  .filter(t => depsSatisfied(tasks, t))
  .sort((a, b) => rank(a) - rank(b));

if (candidates.length === 0) {
  console.log(JSON.stringify({ message: 'No runnable tasks. Either none Planned or deps unmet.' }));
  process.exit(0);
}

console.log(JSON.stringify(candidates[0], null, 2));
