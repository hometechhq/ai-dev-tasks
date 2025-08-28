// scripts/state-transition.mjs
import { readTasks, writeTasks, canTransition } from './state-common.mjs';

const [, , taskId, newStatus] = process.argv;
if (!taskId || !newStatus) {
  console.error('Usage: node scripts/state-transition.mjs <taskId> <newStatus>');
  process.exit(1);
}

const tasks = readTasks();
const idx = tasks.findIndex(t => t.id === taskId);
if (idx === -1) {
  console.error(`Task not found: ${taskId}`);
  process.exit(1);
}

const current = tasks[idx];
if (current.status === newStatus) {
  console.log(JSON.stringify({ taskId, status: newStatus, changed: false, reason: 'No-op' }));
  process.exit(0);
}

if (!canTransition(current.status, newStatus)) {
  console.error(`Illegal transition ${current.status} -> ${newStatus}`);
  process.exit(2);
}

tasks[idx] = { ...current, status: newStatus };
writeTasks(tasks);
console.log(JSON.stringify({ taskId, status: newStatus, changed: true }));
