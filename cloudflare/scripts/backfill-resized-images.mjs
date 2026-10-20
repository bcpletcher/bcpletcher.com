#!/usr/bin/env node
/**
 * Generate (and optionally upload) the 480w / 960w WebP variants the site's responsive
 * `srcset` expects, for every portfolio image that does not have them yet.
 *
 *   node cloudflare/scripts/backfill-resized-images.mjs [--out DIR] [--originals DIR] [--upload]
 *
 * Default is generate-only: variants are written to DIR (default
 * ~/bcpletcher-backups/resized-variants) mirroring the R2 keys, nothing is sent to Cloudflare.
 * With --upload each variant is written to R2 (new keys only; existing keys are never
 * overwritten) using the `wrangler` you are logged in with.
 *
 * Key convention (see cloudflare/worker `buildResizedStoragePath` and the frontend
 * `mediaStorageImages.js`):   Projects/<id>/<name>.webp
 *                          -> Projects/<id>/resized/<name>_480x9999.webp  and  _960x9999.webp
 *
 * The original list comes from the public API; originals are read from --originals (a
 * backup's `media/` folder) when present, otherwise downloaded from the public media route.
 * Needs ImageMagick (`magick`) with WebP support.
 */
import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const BASE = process.env.PORTFOLIO_BASE_URL || "https://bcpletcher.com";
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET || "bcpletcher-artwork";
const WIDTHS = [
  { width: 480, quality: 76 },
  { width: 960, quality: 78 },
];

function parseArgs(argv) {
  const args = { out: join(homedir(), "bcpletcher-backups", "resized-variants"), originals: "", upload: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") args.out = resolve(argv[++i] || "");
    else if (argv[i] === "--originals") args.originals = resolve(argv[++i] || "");
    else if (argv[i] === "--upload") args.upload = true;
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

const safeKey = (key) =>
  typeof key === "string" &&
  /^Projects\/[A-Za-z0-9._/-]+\.webp$/.test(key) &&
  !key.split("/").includes("..") &&
  !key.split("/").includes("resized");

function variantKey(key, width) {
  const parts = key.split("/");
  const file = parts.pop();
  const dot = file.lastIndexOf(".");
  return `${parts.join("/")}/resized/${file.slice(0, dot)}_${width}x9999${file.slice(dot)}`;
}

async function fetchBytes(url) {
  const response = await fetch(url, { headers: { "user-agent": "bcpletcher-backfill" } });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function exists(path) {
  return stat(path).then((s) => s.size > 0, () => false);
}

async function publicExists(key) {
  // The Worker serves media on GET only (HEAD returns 404), so probe with a 1-byte range request.
  const response = await fetch(`${BASE}/api/media/${key}`, {
    headers: { "user-agent": "bcpletcher-backfill", range: "bytes=0-0" },
  });
  return response.status === 200 || response.status === 206;
}

function collectKeys(value, keys) {
  if (typeof value === "string") {
    if (value.startsWith("Projects/") && !value.includes("/resized/")) keys.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectKeys(item, keys));
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node cloudflare/scripts/backfill-resized-images.mjs [--out DIR] [--originals DIR] [--upload]");
    return;
  }
  const projects = JSON.parse((await fetchBytes(`${BASE}/api/projects`)).toString("utf8"));
  const keys = new Set();
  collectKeys(projects.result, keys);
  const list = [...keys].filter(safeKey).sort();
  console.log(`${list.length} originals; variants -> ${args.out}${args.upload ? " (UPLOAD to R2)" : " (generate only)"}`);

  const work = join(args.out, ".originals");
  await mkdir(work, { recursive: true });
  const report = { generated: 0, skippedExisting: 0, uploaded: 0, failed: [], originalBytes: 0, variantBytes: 0 };

  for (const key of list) {
    try {
      const wanted = WIDTHS.map((w) => ({ ...w, key: variantKey(key, w.width) }));
      const missing = [];
      for (const variant of wanted) {
        if (args.upload && (await publicExists(variant.key))) report.skippedExisting += 1;
        else missing.push(variant);
      }
      if (missing.length === 0) continue;

      let source = args.originals ? join(args.originals, key) : "";
      if (!source || !(await exists(source))) {
        source = join(work, key);
        if (!(await exists(source))) {
          await mkdir(dirname(source), { recursive: true });
          await writeFile(source, await fetchBytes(`${BASE}/api/media/${key}`));
        }
      }
      report.originalBytes += (await stat(source)).size;

      for (const variant of missing) {
        const target = join(args.out, variant.key);
        await mkdir(dirname(target), { recursive: true });
        await run("magick", [source, "-resize", `${variant.width}x>`, "-strip", "-quality", String(variant.quality), "-define", "webp:method=6", target]);
        report.variantBytes += (await stat(target)).size;
        report.generated += 1;
        if (args.upload) {
          await run("wrangler", ["r2", "object", "put", `${BUCKET}/${variant.key}`, "--file", target, "--content-type", "image/webp", "--cache-control", "public,max-age=31536000,immutable", "--remote"], { maxBuffer: 64 * 1024 * 1024 });
          report.uploaded += 1;
        }
      }
    } catch (error) {
      report.failed.push({ key, error: String(error.message || error).split("\n")[0].slice(0, 160) });
    }
  }

  await writeFile(join(args.out, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`generated ${report.generated}, uploaded ${report.uploaded}, already in R2 ${report.skippedExisting}, failed ${report.failed.length}`);
  console.log(`variant bytes ${(report.variantBytes / 1048576).toFixed(1)} MB (originals read: ${(report.originalBytes / 1048576).toFixed(1)} MB)`);
  for (const item of report.failed.slice(0, 8)) console.log(`  FAILED ${item.key}: ${item.error}`);
  if (report.failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
