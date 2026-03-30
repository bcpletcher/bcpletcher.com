#!/usr/bin/env node
/**
 * Snapshot projects data from the production Firebase callable endpoint
 * without requiring Firebase admin credentials.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectId = process.env.FIREBASE_PROJECT_ID || "pletcher-portfolio-app";
const callableUrl =
  process.env.CALLABLE_URL ||
  `https://us-central1-${projectId}.cloudfunctions.net/getProjectsCollection`;
const outPathEnv = process.env.OUT_JSON || "";

const repoFirebaseDir = fileURLToPath(new URL("../..", import.meta.url));
const repoRoot = resolve(repoFirebaseDir, "..");
const stamp = new Date().toISOString().replace(/[:.]/g, "").replace(/[-]/g, "").slice(0, 15);
const outPath =
  outPathEnv || join(repoRoot, ".backups", "cloudflare-migration", stamp, "projects-from-callable.json");

console.log("\n[callable-snapshot]");
console.log(" URL:", callableUrl);
console.log(" Out:", outPath);

const response = await fetch(callableUrl, {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8",
    origin: "https://www.bcpletcher.com",
  },
  body: JSON.stringify({ data: {} }),
});

if (!response.ok) {
  console.error(`Request failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const payload = await response.json();
if (!payload?.result || typeof payload.result !== "object") {
  console.error("Unexpected callable payload: missing result object");
  process.exit(1);
}

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log("[callable-snapshot] Done.");
console.log(" Projects:", Object.keys(payload.result).length);
