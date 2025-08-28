// scripts/state-common.mjs
import fs from 'node:fs';
import path from 'node:path';

export const STATE_FILE = process.env.STATE_FILE ?? path.resolve(process.cwd(), 'state', 'tasks.jsonl');

export const VALID_STATUSES = ['Planned','InProgress','Review','Done','Blocked'];

export const ALLOWED_TRANSITIONS = {
  'Planned':    new Set(['InProgress','Blocked']),
  'InProgress': new Set(['Review','Blocked']),
  'Review':     new Set(['Done','InProgress']),
  'Blocked':    new Set(['InProgress']),
  'Done':       new Set([]),
};

export function ensureStateFile() {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) fs.writeFileSync(STATE_FILE, '');
}

export function readTasks() {
  ensureStateFile();
  const text = fs.readFileSync(STATE_FILE, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const tasks = lines.map((l, idx) => {
    try { return JSON.parse(l); }
    catch (e) {
      throw new Error(`Failed to parse JSON on line ${idx+1}: ${e.message}`);
    }
  });
  return tasks;
}

export function writeTasks(tasks) {
  ensureStateFile();
  const lines = tasks.map(t => JSON.stringify(t));
  fs.writeFileSync(STATE_FILE, lines.join('\n') + (lines.length ? '\n' : ''));
}

export function upsertTasks(existing, incoming) {
  const byId = new Map(existing.map(t => [t.id, t]));
  for (const t of incoming) {
    if (!t || typeof t !== 'object') continue;
    if (!t.id) throw new Error('Task missing id');
    byId.set(t.id, { ...(byId.get(t.id) ?? {}), ...t });
  }
  return Array.from(byId.values());
}

export function canTransition(fromStatus, toStatus) {
  if (!VALID_STATUSES.includes(toStatus)) return false;
  if (!ALLOWED_TRANSITIONS[fromStatus]) return false;
  return ALLOWED_TRANSITIONS[fromStatus].has(toStatus);
}

export function depsSatisfied(tasks, task) {
  const done = new Set(tasks.filter(t => t.status === 'Done').map(t => t.id));
  const deps = Array.isArray(task.deps) ? task.deps : [];
  return deps.every(d => done.has(d));
}
