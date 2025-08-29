#!/usr/bin/env node
/**
 * gc-runs.mjs
 * Safe garbage-collection for /state/runs/* artifacts.
 *
 * Features:
 *  - Dry-run by default (prints what would be removed).
 *  - Prune by age (e.g., older than N days).
 *  - Prune by PRD id prefix (e.g., PRD-2025-08-login).
 *  - Optional: keep the most-recent K runs regardless of age.
 *
 * Usage:
 *  node scripts/gc-runs.mjs \
 *    --state-dir ./state \
 *    --older-than-days 30 \
 *    --prd-id PRD-2025-08-login \
 *    --keep-latest 2 \
 *    --confirm
 *
 * Defaults:
 *  --state-dir ./state
 *  --older-than-days 0 (disabled)
 *  --keep-latest 0
 *  dry-run unless --confirm is set
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- CLI args --------------------------------------------------------------

const args = process.argv.slice(2);
function getArg(flag, fallback = null) {
  const i = args.indexOf(flag);
  if (i >= 0 && i + 1 < args.length) return args[i + 1];
  return fallback;
}
function hasFlag(flag) {
  return args.includes(flag);
}

const stateDir = getArg("--state-dir", "./state");
const runsDir = path.join(stateDir, "runs");
const olderThanDays = parseInt(getArg("--older-than-days", "0"), 10);
const prdIdFilter = getArg("--prd-id", "");
const keepLatest = parseInt(getArg("--keep-latest", "0"), 10);
const confirm = hasFlag("--confirm");

// ---- Helpers ---------------------------------------------------------------

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function listDirs(p) {
  try {
    return fs
      .readdirSync(p, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(p, d.name));
  } catch {
    return [];
  }
}

function dirMtimeMs(p) {
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}

function humanDate(ms) {
  return new Date(ms).toISOString();
}

function rmDirRecursive(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

// ---- Main ------------------------------------------------------------------

(function main() {
  if (!isDir(stateDir)) {
    console.error(`[gc-runs] Missing state dir: ${stateDir}`);
    process.exit(1);
  }
  if (!isDir(runsDir)) {
    console.log(`[gc-runs] Nothing to do: ${runsDir} not found.`);
    process.exit(0);
  }

  const nowMs = Date.now();
  const ageMs = olderThanDays > 0 ? olderThanDays * 24 * 60 * 60 * 1000 : 0;

  // Collect run directories
  let runDirs = listDirs(runsDir).sort((a, b) => dirMtimeMs(b) - dirMtimeMs(a)); // newest first

  // Optional filter by PRD id (assumes run directory names embed PRD id or we have summary.json)
  if (prdIdFilter) {
    // If a run dir contains a summary.json with prd_id, prefer that; otherwise, fallback to name contains
    runDirs = runDirs.filter((rd) => {
      const summaryPath = path.join(rd, "summary.json");
      try {
        if (fs.existsSync(summaryPath)) {
          const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
          if (summary?.prd_id && String(summary.prd_id).includes(prdIdFilter)) return true;
        }
      } catch {
        // ignore JSON errors, fallback to name contains
      }
      return path.basename(rd).includes(prdIdFilter);
    });
  }

  // Keep the most recent K runs if requested
  let keepSet = new Set();
  if (keepLatest > 0) {
    runDirs.slice(0, keepLatest).forEach((rd) => keepSet.add(rd));
  }

  // Age filter
  const toConsider = runDirs.filter((rd) => !keepSet.has(rd));
  const candidates = toConsider.filter((rd) => {
    if (ageMs === 0) return true; // age filter disabled; consider all
    const mtime = dirMtimeMs(rd);
    return nowMs - mtime > ageMs;
  });

  if (candidates.length === 0) {
    console.log("[gc-runs] No candidates to prune.");
    process.exit(0);
  }

  console.log(`[gc-runs] Candidate runs to prune: ${candidates.length}`);
  for (const rd of candidates) {
    const mtime = dirMtimeMs(rd);
    console.log(` - ${rd} (last modified ${humanDate(mtime)})`);
  }

  if (!confirm) {
    console.log(
      "\n[gc-runs] Dry-run complete. Re-run with --confirm to delete the above directories."
    );
    process.exit(0);
  }

  // Delete
  let deleted = 0;
  for (const rd of candidates) {
    try {
      rmDirRecursive(rd);
      deleted++;
      console.log(`[gc-runs] Deleted: ${rd}`);
    } catch (err) {
      console.error(`[gc-runs] Failed to delete ${rd}:`, err?.message || err);
    }
  }

  console.log(`[gc-runs] Done. Deleted ${deleted} of ${candidates.length} candidate run(s).`);
})();
