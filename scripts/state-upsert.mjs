// scripts/state-upsert.mjs
import { readTasks, writeTasks, upsertTasks } from './state-common.mjs';

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

const raw = await readStdin();
if (!raw.trim()) {
  console.error('No input on stdin. Provide a JSON task or array of tasks.');
  process.exit(1);
}

let incoming;
try {
  const parsed = JSON.parse(raw);
  incoming = Array.isArray(parsed) ? parsed : [parsed];
} catch (e) {
  console.error('Input is not valid JSON:', e.message);
  process.exit(1);
}

const existing = readTasks();
const next = upsertTasks(existing, incoming);
writeTasks(next);
console.log(JSON.stringify({ updated: incoming.length, total: next.length }));
