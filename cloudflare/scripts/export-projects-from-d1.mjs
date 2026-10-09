#!/usr/bin/env node
/**
 * Export projects payload from Cloudflare D1 into JSON for frontend/runtime usage.
 *
 * Defaults:
 * - D1 database: bcpletcher-db
 * - output file: <repo>/frontend/public/projects.json
 *
 * Optional publish:
 * - PUBLISH_R2=1 with CLOUDFLARE_R2_BUCKET set
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const d1Database = process.env.CLOUDFLARE_D1_DATABASE || "bcpletcher-db";
const outJsonEnv = process.env.OUT_JSON || "";
const publishR2 = (process.env.PUBLISH_R2 ?? "0") === "1";
const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET || "";
const r2Key = process.env.R2_JSON_KEY || "projects.json";

if (publishR2 && !r2Bucket) {
  console.error("PUBLISH_R2=1 requires CLOUDFLARE_R2_BUCKET");
  process.exit(1);
}

const repoFirebaseDir = fileURLToPath(new URL("../..", import.meta.url));
const repoRoot = resolve(repoFirebaseDir, "..");
const outJson = outJsonEnv || resolve(repoRoot, "frontend", "public", "projects.json");

function runOrThrow(cmd, args, { capture = false } = {}) {
  const result = spawnSync(cmd, args, {
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const stderr = result.stderr ? `\n${result.stderr}` : "";
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}${stderr}`);
  }
  return result.stdout || "";
}

function extractJsonArray(text) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Unable to find JSON payload in wrangler output");
  }
  return JSON.parse(text.slice(start, end + 1));
}

console.log("\n[d1-export]");
console.log(" D1 database:", d1Database);
console.log(" Output file:", outJson);
console.log(" Publish to R2:", publishR2);

const sql = "SELECT id, data_json FROM projects ORDER BY id;";
const stdout = runOrThrow(
  "npx",
  ["wrangler", "d1", "execute", d1Database, "--remote", "--json", "--command", sql],
  { capture: true }
);
const payload = extractJsonArray(stdout);
const rows = payload?.[0]?.results || [];

const result = {};
for (const row of rows) {
  if (!row?.id || typeof row.data_json !== "string") continue;
  result[row.id] = JSON.parse(row.data_json);
}

await mkdir(dirname(outJson), { recursive: true });
await writeFile(outJson, JSON.stringify({ result }, null, 2) + "\n", "utf8");

if (publishR2) {
  runOrThrow("npx", [
    "wrangler",
    "r2",
    "object",
    "put",
    `${r2Bucket}/${r2Key}`,
    "--remote",
    "--file",
    outJson,
  ]);
}

console.log("[d1-export] Done.");
console.log(" Projects:", Object.keys(result).length);
