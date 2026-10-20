#!/usr/bin/env node
/**
 * Back up the portfolio's Cloudflare data to a local folder (read-only against Cloudflare).
 *
 *   node cloudflare/scripts/backup-portfolio.mjs [--out DIR] [--no-media]
 *
 * Writes (default DIR: ~/bcpletcher-backups/portfolio-YYYY-MM-DD):
 *   d1.sql          full D1 export (schema + data) from `wrangler d1 export --remote`
 *   media/<key>     every R2 object referenced by the database (project images, v1 archive
 *                   images) plus projects.json, downloaded with `wrangler r2 object get`
 *   manifest.json   counts, sizes and SHA-256 of every file, plus anything that failed
 *
 * Needs `wrangler` (or `npx wrangler`) logged in to the Cloudflare account. It never writes to Cloudflare.
 * D1 itself also keeps 7 days of automatic point-in-time recovery (Time Travel) on the Free plan.
 * R2 has no listing command in wrangler, so object keys come from the database.
 */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const workerDir = join(repoRoot, "cloudflare", "worker");

const DB_NAME = process.env.CLOUDFLARE_D1_DATABASE || "bcpletcher-db";
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET || "bcpletcher-artwork";
const EXTRA_KEYS = ["projects.json"];

function parseArgs(argv) {
  const args = { out: "", media: true };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") args.out = argv[++i] || "";
    else if (argv[i] === "--no-media") args.media = false;
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

// Prefer the wrangler already installed and logged in on this machine (override with
// WRANGLER_BIN); fall back to `npx wrangler` only when none is installed.
let wranglerCommand = null;
async function wrangler(args, options = {}) {
  const base = { cwd: workerDir, maxBuffer: 256 * 1024 * 1024, ...options };
  if (!wranglerCommand) {
    const candidate = process.env.WRANGLER_BIN || "wrangler";
    try {
      await run(candidate, ["--version"], { cwd: workerDir });
      wranglerCommand = [candidate];
    } catch {
      wranglerCommand = ["npx", "wrangler"];
    }
  }
  const [command, ...prefix] = wranglerCommand;
  return run(command, [...prefix, ...args], base);
}

function safeKey(key) {
  return (
    typeof key === "string" &&
    key.length > 0 &&
    key.length <= 512 &&
    !key.startsWith("/") &&
    key.split("/").every((part) => part && part !== "." && part !== ".." && !/[\\\0-\x1f]/.test(part))
  );
}

async function queryRows(sql) {
  const { stdout } = await wrangler(["d1", "execute", DB_NAME, "--remote", "--json", "--command", sql]);
  const start = stdout.indexOf("[");
  const parsed = JSON.parse(stdout.slice(start));
  return parsed?.[0]?.results ?? [];
}

function collectArchiveKeys(value, keys) {
  if (typeof value === "string") {
    // Only real object keys (they end in a file extension); records also hold folder prefixes.
    if (value.startsWith("Archive/") && !value.endsWith("/") && /\.[A-Za-z0-9]{2,5}$/.test(value)) keys.add(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectArchiveKeys(item, keys);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectArchiveKeys(item, keys);
  }
}

async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node cloudflare/scripts/backup-portfolio.mjs [--out DIR] [--no-media]");
    return;
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const out = resolve(args.out || join(homedir(), "bcpletcher-backups", `portfolio-${stamp}`));
  await mkdir(join(out, "media"), { recursive: true });

  console.log(`Backup folder: ${out}`);
  console.log("Exporting D1 ...");
  const sqlPath = join(out, "d1.sql");
  await wrangler(["d1", "export", DB_NAME, "--remote", "--output", sqlPath]);
  const sqlBytes = (await stat(sqlPath)).size;
  if (sqlBytes < 200) throw new Error("D1 export looks empty; aborting");
  console.log(`  d1.sql ${sqlBytes} bytes`);

  const manifest = { created_at: new Date().toISOString(), database: DB_NAME, bucket: BUCKET, files: [], failed: [] };
  manifest.files.push({ path: "d1.sql", bytes: sqlBytes, sha256: await sha256(sqlPath) });

  if (args.media) {
    const keys = new Set(EXTRA_KEYS);
    for (const row of await queryRows("SELECT DISTINCT r2_key FROM project_images")) keys.add(row.r2_key);
    for (const row of await queryRows("SELECT data_json FROM archive_projects")) {
      try {
        collectArchiveKeys(JSON.parse(row.data_json), keys);
      } catch {
        manifest.failed.push({ key: "(archive_projects row)", error: "unparseable data_json" });
      }
    }
    const list = [...keys].filter((key) => {
      if (safeKey(key)) return true;
      manifest.failed.push({ key, error: "unsafe key skipped" });
      return false;
    });
    console.log(`Downloading ${list.length} R2 objects ...`);
    let done = 0;
    for (const key of list) {
      const target = join(out, "media", key);
      try {
        await mkdir(dirname(target), { recursive: true });
        const existing = await stat(target).catch(() => null);
        // Resume: keep files already downloaded into this folder (delete a file to refetch it).
        if (!existing || existing.size === 0) {
          await wrangler(["r2", "object", "get", `${BUCKET}/${key}`, "--file", target, "--remote"]);
        }
        const bytes = (await stat(target)).size;
        manifest.files.push({ path: `media/${key}`, bytes, sha256: await sha256(target) });
      } catch (error) {
        manifest.failed.push({ key, error: String(error.message || error).split("\n")[0].slice(0, 200) });
      }
      done += 1;
      if (done % 25 === 0 || done === list.length) console.log(`  ${done}/${list.length}`);
    }
  }

  manifest.totals = {
    files: manifest.files.length,
    bytes: manifest.files.reduce((sum, file) => sum + file.bytes, 0),
    failed: manifest.failed.length,
  };
  await writeFile(join(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Done: ${manifest.totals.files} files, ${manifest.totals.bytes} bytes, ${manifest.totals.failed} failed.`);
  if (manifest.failed.length) {
    for (const item of manifest.failed.slice(0, 10)) console.log(`  FAILED ${item.key}: ${item.error}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
