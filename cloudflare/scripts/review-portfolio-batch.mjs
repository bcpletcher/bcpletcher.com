// Usage: node cloudflare/scripts/review-portfolio-batch.mjs <drafts.json> [--dry-run | --apply <backup-directory>]
import { randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

const origin = "https://www.bcpletcher.com";
const repo = fileURLToPath(new URL("../../", import.meta.url));
const imageKey = /^Projects\/([a-zA-Z0-9][\w.-]*)\/([0-9a-f-]{36})\.webp$/;
const projectId = /^[a-zA-Z0-9][\w.-]{0,127}$/;

async function request(path, { body, token } = {}) {
  return fetch(new URL(path, origin), {
    method: body === undefined ? "GET" : "POST",
    redirect: "error",
    cache: "no-store",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30_000),
  });
}

async function api(path, options) {
  const response = await request(path, options);
  if (!response.ok) throw new Error(`${path.split("?")[0]} returned HTTP ${response.status}`);
  return response.json();
}

export async function readProjects() {
  const { result } = await api(`/api/projects?nocache=${randomUUID()}`);
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Unexpected projects response");
  }
  return result;
}

const slug = (name) => name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function reviseGallery(id, mode, data, live, gallery) {
  if (mode !== "update" || Object.hasOwn(data, "images") ||
      !Array.isArray(gallery.before) || !Array.isArray(gallery.after) ||
      gallery.after.length < 3 || new Set(gallery.after).size !== gallery.after.length ||
      gallery.before.some((path) =>
        typeof path !== "string" || !path.startsWith(`Projects/${id}/`) ||
        !/^[\w.-]+\.webp$/.test(path.slice(`Projects/${id}/`.length)),
      ) ||
      gallery.after.some((path) => !gallery.before.includes(path) && imageKey.exec(path)?.[1] !== id)) {
    throw new Error(`Invalid gallery revision for ${id}`);
  }
  const current = (live?.images || []).map(({ path }) => path);
  if (!isDeepStrictEqual(current, gallery.before) && !isDeepStrictEqual(current, gallery.after)) {
    throw new Error(`Gallery changed since review for ${id}`);
  }
  return gallery.after.map((path) => ({ path }));
}

export function planProjects(live, manifest) {
  const ids = new Set();
  const projects = { ...live };
  return manifest.records.map(({ id, mode, data, gallery }) => {
    if (!projectId.test(id) || Object.hasOwn(Object.prototype, id) || ids.has(id) ||
        !["create", "update"].includes(mode)) {
      throw new Error(`Invalid or duplicate target: ${id}`);
    }
    ids.add(id);
    if (!data || Object.hasOwn(data, "id") ||
        (Object.hasOwn(data, "caseStudy") && data.caseStudy?.published !== false)) {
      throw new Error(`Invalid draft data for ${id}`);
    }
    const before = Object.hasOwn(live, id) ? live[id] : null;
    const after = mode === "create" ? data : { ...before, ...data };
    if (gallery) after.images = reviseGallery(id, mode, data, before, gallery);
    const unchanged = isDeepStrictEqual(before, after);
    if ((mode === "create" && before && !unchanged) || (mode === "update" && !before)) {
      throw new Error(`Live record does not match ${mode} precondition for ${id}`);
    }
    if (mode === "update" && before.caseStudy && !isDeepStrictEqual(before.caseStudy, after.caseStudy)) {
      throw new Error(`An existing case study would be overwritten for ${id}`);
    }
    const nameSlug = slug(after.projectName);
    if (!nameSlug || Object.entries(projects).some(([otherId, other]) =>
      otherId !== id && slug(other.projectName || "") === nameSlug)) {
      throw new Error(`Duplicate or invalid project name for ${id}`);
    }
    projects[id] = after;
    return { id, mode, before, after, unchanged };
  });
}

function mediaKeys(key) {
  const match = imageKey.exec(key);
  if (!match) throw new Error(`Invalid media key: ${key}`);
  const [, id, uuid] = match;
  return [key, ...[480, 960].map((width) => `Projects/${id}/resized/${uuid}_${width}x9999.webp`)];
}

function mediaReferences(row) {
  const { data, gallery } = row;
  const figures = (data.caseStudy?.sections || []).flatMap(({ figures }) => figures);
  return [
    ...(data.images || []),
    ...(gallery?.after || []).filter((path) => !gallery.before.includes(path)).map((path) => ({ path })),
    ...figures.flatMap((figure) => figure.kind === "compare" ? [figure.before, figure.after] : [figure.image]),
  ].map(({ path }) => {
    if (imageKey.exec(path)?.[1] !== row.id) throw new Error(`Media path does not belong to ${row.id}`);
    return path;
  });
}

async function loadMedia(manifest, directory) {
  const expected = new Set(manifest.records.flatMap(mediaReferences));
  if (manifest.media.length !== expected.size || new Set(manifest.media).size !== expected.size ||
      manifest.media.some((key) => !expected.has(key))) {
    throw new Error("Media manifest does not match draft references");
  }
  return Promise.all(manifest.media.map(async (key) => Promise.all(mediaKeys(key).map(async (asset) => {
    const bytes = await readFile(join(directory, "media", asset));
    if (bytes.length > 8 * 1024 * 1024 || bytes.subarray(0, 4).toString() !== "RIFF" ||
        bytes.subarray(8, 12).toString() !== "WEBP") throw new Error(`Invalid WebP: ${asset}`);
    return { key: asset, bytes };
  }))));
}

async function upload(group, token) {
  const present = await Promise.all(group.map(async ({ key, bytes }) => {
    const response = await request(`/api/media/${key}`);
    if (response.status === 404) return false;
    if (!response.ok || !Buffer.from(await response.arrayBuffer()).equals(bytes)) {
      throw new Error(`Media already exists with different content or could not be read: ${key}`);
    }
    return true;
  }));
  if (present.every(Boolean)) return;
  if (present.some(Boolean)) throw new Error(`Incomplete media group: ${group[0].key}`);
  const objects = group.map(({ key, bytes }) => ({
    key, contentType: "image/webp", cacheControl: "public,max-age=31536000,immutable",
    base64: bytes.toString("base64"),
  }));
  await api("/api/admin/images/upload", { body: { objects }, token });
}

async function applyPlan(plan, media, backupDirectory) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment");

  const target = await realpath(backupDirectory);
  const backupRelativePath = relative(await realpath(repo), target);
  if (!isAbsolute(backupRelativePath) && backupRelativePath !== ".." && !backupRelativePath.startsWith("../")) {
    throw new Error("Choose an existing backup directory outside the repository");
  }
  const pending = plan.filter((item) => !item.unchanged);
  if (!pending.length) return;
  const { token } = await api("/api/admin/login", { body: { email, password } });
  if (typeof token !== "string" || !token) throw new Error("Admin login did not return a session");

  const current = await readProjects();
  for (const { id, before } of pending) {
    if (!isDeepStrictEqual(current[id] ?? null, before)) throw new Error(`Project changed since planning: ${id}`);
  }
  const backup = join(target, `portfolio-before-${randomUUID()}`);
  await mkdir(backup, { mode: 0o700 });
  await writeFile(join(backup, "records.json"), JSON.stringify(
    Object.fromEntries(pending.map(({ id, before }) => [id, before])), null, 2,
  ) + "\n", { mode: 0o600, flag: "wx" });
  console.log(`Backup: ${backup}`);

  for (const { id, mode, before, after } of pending) {
    for (const group of media.filter(([asset]) => imageKey.exec(asset.key)?.[1] === id)) {
      await upload(group, token);
    }
    const latest = (await readProjects())[id] ?? null;
    if (!isDeepStrictEqual(latest, before)) throw new Error(`Project changed during apply: ${id}`);
    await api("/api/admin/projects/upsert", { body: { mode, document: { id, data: after } }, token });
    const saved = (await readProjects())[id];
    if (!isDeepStrictEqual(saved, after)) throw new Error(`Saved record differs from the plan: ${id}`);
    console.log(`Verified ${mode}: ${id}`);
  }
}

async function main([file, mode = "--dry-run", backupDirectory, ...extras]) {
  if (!file || extras.length || !["--dry-run", "--apply"].includes(mode) ||
      (mode === "--apply") !== Boolean(backupDirectory)) {
    throw new Error("Usage: review-portfolio-batch.mjs <drafts.json> [--dry-run | --apply <backup-directory>]");
  }
  const manifest = JSON.parse(await readFile(file, "utf8"));
  const media = await loadMedia(manifest, dirname(resolve(file)));
  const plan = planProjects(await readProjects(), manifest);
  if (mode === "--dry-run") {
    console.log(JSON.stringify({ mode: "dry-run", records: plan, media: manifest.media }, null, 2));
    return;
  }
  await applyPlan(plan, media, backupDirectory);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
