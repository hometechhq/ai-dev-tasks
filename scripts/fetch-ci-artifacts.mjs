#!/usr/bin/env node
/**
 * fetch-ci-artifacts.mjs
 * Resolve the latest completed GitHub Actions run for a branch and print a JSON payload
 * with artifact download URL(s) for the "ci-artifacts" bundle.
 *
 * Usage:
 *   GH_TOKEN=ghp_xxx node scripts/fetch-ci-artifacts.mjs --owner hometechhq --repo ai-dev-tasks --branch feat/login-2025-08
 *
 * Output JSON (example):
 * {
 *   "owner": "hometechhq",
 *   "repo": "ai-dev-tasks",
 *   "branch": "feat/login-2025-08",
 *   "run_id": 123456789,
 *   "artifact": {
 *     "id": 111222333,
 *     "name": "ci-artifacts",
 *     "download_url": "https://api.github.com/..."   // short-lived
 *   }
 * }
 */

import https from "https";
import { URL } from "url";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) {
      const k = cur.replace(/^--/, "");
      const v = arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true;
      acc.push([k, v]);
    }
    return acc;
  }, [])
);

const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const owner = args.owner;
const repo = args.repo;
const branch = args.branch || "";

if (!GH_TOKEN) {
  console.error("Missing GH_TOKEN env");
  process.exit(2);
}
if (!owner || !repo) {
  console.error("Usage: --owner <owner> --repo <repo> [--branch <branch>]");
  process.exit(2);
}

function ghGet(path) {
  const opts = {
    method: "GET",
    headers: {
      "User-Agent": "ai-dev-tasks/1.0",
      "Authorization": `Bearer ${GH_TOKEN}`,
      "Accept": "application/vnd.github+json"
    }
  };
  const url = new URL(`https://api.github.com${path}`);
  return new Promise((resolve, reject) => {
    const req = https.request(url, opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        } else if (res.statusCode === 302 && res.headers.location) {
          resolve({ redirect: res.headers.location });
        } else {
          reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

(async function main() {
  // 1) Latest completed run for branch (or latest overall if branch omitted)
  const q = new URLSearchParams({ per_page: "10", status: "completed", ...(branch ? { branch } : {}) });
  const runs = await ghGet(`/repos/${owner}/${repo}/actions/runs?${q.toString()}`);
  const run = runs?.workflow_runs?.[0];
  if (!run) {
    console.error("No completed runs found");
    process.exit(1);
  }

  // 2) Artifacts for that run
  const arts = await ghGet(`/repos/${owner}/${repo}/actions/runs/${run.id}/artifacts`);
  const ci = (arts?.artifacts || []).find(a => a.name === "ci-artifacts");
  if (!ci) {
    console.error("No 'ci-artifacts' artifact found for latest run");
    process.exit(1);
  }

  // 3) Short-lived download URL
  const dl = await ghGet(`/repos/${owner}/${repo}/actions/artifacts/${ci.id}/zip`);
  const out = {
    owner, repo, branch: branch || run.head_branch, run_id: run.id,
    artifact: { id: ci.id, name: ci.name, download_url: dl?.redirect || null }
  };
  process.stdout.write(JSON.stringify(out, null, 2));
})().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

