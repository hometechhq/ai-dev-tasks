#!/usr/bin/env node
/**
 * run-summary.mjs
 * Aggregate /state/runs/<run-id>/task-*.json into a single summary.json
 *
 * Features:
 *  - Summarizes task outcomes (completed/failed/blocked/skipped/in_progress)
 *  - Aggregates tests (runs, pass/fail), costs (tokens/$), and file ops
 *  - Derives started_at/finished_at/duration_ms
 *  - Attempts to infer PRD/plan references when present
 *
 * Usage examples:
 *  node scripts/run-summary.mjs --state-dir ./state --run-id 2025-08-29T12-34-56Z --confirm
 *  node scripts/run-summary.mjs --state-dir ./state --all --confirm
 *  node scripts/run-summary.mjs --state-dir ./state --run-id <id> --stdout
 *
 * Flags:
 *  --state-dir <path>    : defaults to ./state
 *  --run-id <id>         : process a single run directory under /state/runs/<id>
 *  --all                 : process all run directories under /state/runs
 *  --out <filename>      : override output filename (default: summary.json inside each run dir)
 *  --stdout              : print summary JSON to stdout instead of writing file
 *  --confirm             : actually write files (without this, it will dry-run unless --stdout)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- CLI ----------------

const args = process.argv.slice(2);
const getArg = (flag, dflt = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : dflt;
};
const hasFlag = (flag) => args.includes(flag);

const STATE_DIR = getArg("--state-dir", "./state");
const RUN_ID = getArg("--run-id", null);
const PROCESS_ALL = hasFlag("--all");
const OUT_NAME = getArg("--out", "summary.json");
const TO_STDOUT = hasFlag("--stdout");
const CONFIRM = hasFlag("--confirm");

if (!RUN_ID && !PROCESS_ALL) {
  console.error("Usage: --run-id <id> OR --all (see header for examples)");
  process.exit(2);
}

const RUNS_DIR = path.join(STATE_DIR, "runs");

// ---------------- Utils ----------------

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function listFiles(p, filterFn = () => true) {
  try {
    return fs
      .readdirSync(p, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => path.join(p, d.name))
      .filter(filterFn);
  } catch {
    return [];
  }
}

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function sum(arr) {
  return arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

function minDateISO(dates) {
  const ts = dates.map((d) => Date.parse(d)).filter((n) => Number.isFinite(n));
  if (!ts.length) return null;
  return new Date(Math.min(...ts)).toISOString();
}

function maxDateISO(dates) {
  const ts = dates.map((d) => Date.parse(d)).filter((n) => Number.isFinite(n));
  if (!ts.length) return null;
  return new Date(Math.max(...ts)).toISOString();
}

// ---------------- Core aggregation ----------------

function aggregateRun(runDir) {
  const taskFiles = listFiles(runDir, (f) => /task-.*\.json$/i.test(f));
  if (taskFiles.length === 0) {
    return {
      ok: false,
      message: `No task-*.json envelopes found in ${runDir}`,
    };
  }

  const envelopes = taskFiles
    .map(readJsonSafe)
    .filter(Boolean)
    .filter((env) => typeof env === "object");

  const byStatus = { completed: 0, failed: 0, blocked: 0, skipped: 0, in_progress: 0, other: 0 };
  const taskIndex = [];
  const testsRuns = [];
  const testsPassedBools = [];
  const models = [];
  const costsInput = [];
  const costsOutput = [];
  const costsUsd = [];
  const toolCalls = [];
  const created = [];
  const updated = [];
  const deleted = [];
  const renamed = [];
  const taskTimes = [];

  // attempt to infer run_id / plan_ref / prd_ref (via plan)
  let run_id = null;
  let plan_ref = null;
  let planObj = null;
  let prd_ref = null;
  let branch = null;

  for (const env of envelopes) {
    // status
    const s = String(env.status || "").toLowerCase();
    if (byStatus.hasOwnProperty(s)) byStatus[s] += 1;
    else byStatus.other += 1;

    // task index
    taskIndex.push({
      task_id: env.task_id ?? null,
      status: env.status ?? null,
      message: env?.commit?.message ?? null,
    });

    // tests
    if (env.tests) {
      testsRuns.push(env.tests);
      if (typeof env.tests.passed === "boolean") testsPassedBools.push(env.tests.passed);
    }

    // costs
    if (env.costs) {
      models.push(env.costs.model ?? null);
      costsInput.push(Number(env.costs.input_tokens ?? 0));
      costsOutput.push(Number(env.costs.output_tokens ?? 0));
      costsUsd.push(Number(env.costs.usd_estimate ?? 0));
      toolCalls.push(Number(env.costs.tool_calls ?? 0));
    }

    // files ops
    if (Array.isArray(env.files)) {
      for (const f of env.files) {
        switch (f.op) {
          case "create":
            created.push(f.path);
            break;
          case "update":
            updated.push(f.path);
            break;
          case "delete":
            deleted.push(f.path);
            break;
          case "rename":
            renamed.push({ from: f.prev_path, to: f.path });
            break;
        }
      }
    }

    // timing
    if (env?.metadata?.created_at) {
      taskTimes.push(env.metadata.created_at);
    }

    // refs
    if (!run_id && env.run_id) run_id = env.run_id;
    if (!plan_ref && env?.metadata?.plan_ref) plan_ref = env.metadata.plan_ref;
    if (!branch && env?.commit?.branch) branch = env.commit.branch;
  }

  // Try to read plan to discover PRD ref (if plan_ref is a local path)
  if (plan_ref && isFile(plan_ref)) {
    planObj = readJsonSafe(plan_ref);
    prd_ref = planObj?.prd_ref ?? null;
  }

  const started_at = minDateISO(taskTimes);
  const finished_at = maxDateISO(taskTimes);
  const duration_ms =
    started_at && finished_at
      ? Date.parse(finished_at) - Date.parse(started_at)
      : null;

  const totalTasks = envelopes.length;
  const tests_total = testsRuns.length;
  const tests_passed = testsPassedBools.filter(Boolean).length;
  const tests_failed = tests_total - tests_passed;

  const modelsUsed = uniq(models.filter(Boolean));
  const byModel = Object.fromEntries(
    modelsUsed.map((m) => [
      m,
      {
        count: models.filter((x) => x === m).length,
        input_tokens: sum(
          envelopes
            .filter((e) => e?.costs?.model === m)
            .map((e) => Number(e.costs.input_tokens ?? 0))
        ),
        output_tokens: sum(
          envelopes
            .filter((e) => e?.costs?.model === m)
            .map((e) => Number(e.costs.output_tokens ?? 0))
        ),
        usd_estimate: sum(
          envelopes
            .filter((e) => e?.costs?.model === m)
            .map((e) => Number(e.costs.usd_estimate ?? 0))
        ),
      },
    ])
  );

  const summary = {
    schema_version: "1.0.0",
    run_id: run_id ?? path.basename(runDir),
    branch,
    plan_ref: plan_ref ?? null,
    prd_ref: prd_ref ?? null,

    started_at,
    finished_at,
    duration_ms,

    tasks: {
      total: totalTasks,
      completed: byStatus.completed,
      failed: byStatus.failed,
      blocked: byStatus.blocked,
      skipped: byStatus.skipped,
      in_progress: byStatus.in_progress,
      other: byStatus.other,
      index: taskIndex, // small per-task index for quick inspection
    },

    tests: {
      runs: tests_total,
      passed: tests_passed,
      failed: tests_failed,
      pass_rate: tests_total ? +(tests_passed / tests_total).toFixed(3) : null,
    },

    costs: {
      input_tokens: sum(costsInput),
      output_tokens: sum(costsOutput),
      usd_estimate: sum(costsUsd),
      tool_calls: sum(toolCalls),
      by_model: byModel,
    },

    files: {
      created: uniq(created).length,
      updated: uniq(updated).length,
      deleted: uniq(deleted).length,
      renamed: renamed.length,
      created_paths: uniq(created).slice(0, 50), // cap lists to keep summary compact
      updated_paths: uniq(updated).slice(0, 50),
      deleted_paths: uniq(deleted).slice(0, 50),
      renamed_paths: renamed.slice(0, 50),
    },
  };

  return { ok: true, summary };
}

// ---------------- Main ----------------

function processOneRun(runDir) {
  const res = aggregateRun(runDir);
  if (!res.ok) {
    console.warn(`[run-summary] ${res.message}`);
    return 0;
  }

  const outPath = path.join(runDir, OUT_NAME);

  if (TO_STDOUT) {
    process.stdout.write(JSON.stringify(res.summary, null, 2) + "\n");
    return 1;
  }

  if (!CONFIRM) {
    console.log(`[run-summary] Dry-run. Would write: ${outPath}`);
    console.log(JSON.stringify(res.summary, null, 2));
    return 0;
  }

  try {
    fs.writeFileSync(outPath, JSON.stringify(res.summary, null, 2), "utf8");
    console.log(`[run-summary] Wrote ${outPath}`);
    return 1;
  } catch (err) {
    console.error(`[run-summary] Failed to write ${outPath}:`, err?.message || err);
    return 0;
  }
}

function main() {
  if (!isDir(STATE_DIR)) {
    console.error(`[run-summary] Missing state dir: ${STATE_DIR}`);
    process.exit(1);
  }
  if (!isDir(RUNS_DIR)) {
    console.error(`[run-summary] Missing runs dir: ${RUNS_DIR}`);
    process.exit(1);
  }

  if (RUN_ID) {
    const runDir = path.join(RUNS_DIR, RUN_ID);
    if (!isDir(runDir)) {
      console.error(`[run-summary] Run not found: ${runDir}`);
      process.exit(1);
    }
    processOneRun(runDir);
    return;
  }

  // --all
  const runDirs = fs
    .readdirSync(RUNS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(RUNS_DIR, d.name));

  let wrote = 0;
  for (const rd of runDirs) {
    wrote += processOneRun(rd);
  }
  if (!TO_STDOUT && !CONFIRM) {
    console.log(
      `[run-summary] Dry-run complete. Re-run with --confirm to write ${OUT_NAME} into each run dir.`
    );
  }
}

main();
