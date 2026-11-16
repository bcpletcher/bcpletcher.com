#!/usr/bin/env node
/**
 * One-time import of a case study written in code (frontend/src/constants/caseStudyContent.js)
 * into the live site's storage: its images go to R2 (with the 480w / 960w variants) and the
 * text is saved on the project record in D1, exactly as the admin editor would.
 *
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *     node cloudflare/scripts/seed-case-study.mjs community-transit [--dry-run] [--force]
 *
 * Options:
 *   --dry-run   Print what would happen. Reads the public API only; uploads and writes nothing.
 *   --force     Replace a case study that is already saved on the project.
 *
 * Environment:
 *   PORTFOLIO_BASE_URL   defaults to https://www.bcpletcher.com
 *   ADMIN_EMAIL / ADMIN_PASSWORD   the admin login (not needed for --dry-run)
 *
 * Images are read from frontend/public/ (the paths the in-code content points at) and need
 * ImageMagick (`magick`) with WebP support to build the resized variants.
 */
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const BASE = (process.env.PORTFOLIO_BASE_URL || "https://www.bcpletcher.com").replace(/\/+$/, "");
const CACHE = "public,max-age=31536000,immutable";
const WIDTHS = [
  { width: 480, quality: 76 },
  { width: 960, quality: 78 },
];

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function parseArgs(argv) {
  const args = { slug: "", dryRun: false, force: false };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else if (!args.slug) args.slug = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  return args;
}

async function api(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON body: reported below.
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${data?.error || text.slice(0, 200)}`);
  }
  return data;
}

async function login() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (or use --dry-run).");
  const { token } = await api("/api/admin/login", { method: "POST", body: { email, password } });
  if (!token) throw new Error("Login did not return a token.");
  return token;
}

async function webpVariant(file, width, quality, tmp, name) {
  const out = join(tmp, name);
  await run("magick", [file, "-resize", `${width}x>`, "-quality", String(quality), out]);
  return readFile(out);
}

/** Upload one local image as Projects/<id>/<uuid>.webp plus its 480w / 960w variants. */
async function uploadImage(token, projectId, localPath, tmp) {
  const file = join(REPO, "frontend", "public", localPath.replace(/^\/+/, ""));
  const original = await readFile(file);
  const uuid = randomUUID();
  const canonical = `Projects/${projectId}/${uuid}.webp`;

  const objects = [
    { key: canonical, contentType: "image/webp", cacheControl: CACHE, base64: original.toString("base64") },
  ];
  for (const { width, quality } of WIDTHS) {
    const bytes = await webpVariant(file, width, quality, tmp, `${uuid}_${width}.webp`);
    objects.push({
      key: `Projects/${projectId}/resized/${uuid}_${width}x9999.webp`,
      contentType: "image/webp",
      cacheControl: CACHE,
      base64: bytes.toString("base64"),
    });
  }

  await api("/api/admin/images/upload", { method: "POST", token, body: { objects } });
  return { path: canonical };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.slug) {
    console.log("Usage: node cloudflare/scripts/seed-case-study.mjs <slug> [--dry-run] [--force]");
    return;
  }

  const contentModule = await import(
    pathToFileURL(join(REPO, "frontend", "src", "constants", "caseStudyContent.js")).href
  );
  const content = contentModule.CASE_STUDY_CONTENT[args.slug];
  if (!content) throw new Error(`No in-code case study for "${args.slug}".`);

  const { result } = await api("/api/projects");
  const entry = Object.entries(result || {}).find(
    ([, project]) => slugify(project?.projectName || project?.title) === args.slug,
  );
  if (!entry) throw new Error(`No project on ${BASE} matches the slug "${args.slug}".`);
  const [projectId, project] = entry;

  if (project.caseStudy && !args.force) {
    throw new Error(`"${projectId}" already has a case study saved. Use --force to replace it.`);
  }

  const order = ["The problem", "My role", "Process", "Outcome"];
  const titles = order.filter((title) => content.sections?.[title]);
  const localImages = titles.flatMap((title) =>
    (content.sections[title].figures || []).flatMap((figure) =>
      figure.kind === "compare" ? [figure.before, figure.after] : [figure.src],
    ),
  );

  console.log(`Project:   ${projectId} (${project.projectName})`);
  console.log(`Sections:  ${titles.join(", ")}`);
  console.log(`Images:    ${localImages.length} to upload (each with 480w and 960w variants)`);
  if (args.dryRun) {
    localImages.forEach((image) => console.log(`  - ${image}`));
    console.log("Dry run: nothing was uploaded or saved.");
    return;
  }

  const token = await login();
  const tmp = await mkdtemp(join(tmpdir(), "seed-case-study-"));
  try {
    const uploaded = new Map();
    for (const image of localImages) {
      if (uploaded.has(image)) continue;
      process.stdout.write(`Uploading ${image} ... `);
      uploaded.set(image, await uploadImage(token, projectId, image, tmp));
      console.log("ok");
    }

    const caseStudy = {
      published: true,
      summary: content.summary || "",
      role: content.role || contentModule.DEFAULT_ROLE,
      roleNote: content.roleNote || "",
      focus: content.focus || "",
      industry: content.industry || "",
      stack: content.stack || [],
      sections: titles.map((title) => {
        const section = content.sections[title];
        return {
          title,
          body: section.body || [],
          points: section.points || [],
          figures: (section.figures || []).map((figure) =>
            figure.kind === "compare"
              ? {
                  kind: "compare",
                  before: uploaded.get(figure.before),
                  after: uploaded.get(figure.after),
                  beforeAlt: figure.beforeAlt || "",
                  afterAlt: figure.afterAlt || "",
                  caption: figure.caption || "",
                }
              : {
                  kind: "image",
                  image: uploaded.get(figure.src),
                  alt: figure.alt || "",
                  caption: figure.caption || "",
                },
          ),
        };
      }),
    };

    await api("/api/admin/projects/upsert", {
      method: "POST",
      token,
      body: { mode: "update", document: { id: projectId, data: { ...project, caseStudy } } },
    });
    console.log(`Saved the case study on "${projectId}".`);
    console.log("The project list cache refreshes within the site's cache window (or add ?nocache=1).");
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
