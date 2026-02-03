/* eslint-disable no-undef */
import { readdir } from "node:fs/promises";
import { statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Finds the latest directory under firebase/emulator-data/firestore/
// and prints the absolute path. Intended for use in npm scripts.

const repoFirebaseDir = fileURLToPath(new URL("../..", import.meta.url));
const base = join(repoFirebaseDir, "emulator-data", "firestore");

if (!existsSync(base)) {
  console.error(`No emulator export directory found at: ${base}`);
  process.exit(1);
}

const entries = await readdir(base);
const dirs = entries
  .map((name) => join(base, name))
  .filter((p) => {
    try {
      return statSync(p).isDirectory();
    } catch {
      return false;
    }
  });

if (!dirs.length) {
  console.error(`No export subfolders found under: ${base}`);
  process.exit(1);
}

// Prefer lexicographically greatest folder name (your exports are timestamped),
// fall back to mtime for non-standard names.
dirs.sort((a, b) => {
  const an = a.split("/").pop() ?? a;
  const bn = b.split("/").pop() ?? b;
  if (an !== bn) return an.localeCompare(bn);
  return statSync(a).mtimeMs - statSync(b).mtimeMs;
});

console.log(dirs[dirs.length - 1]);
