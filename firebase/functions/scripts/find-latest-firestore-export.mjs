/* eslint-disable no-undef */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Prints the absolute path to the latest local Firestore export directory.
// Convention in this repo:
//   firebase/.databases/imports/firestore/<exportName>/
// The emulator --import expects the directory that contains
//   <exportName>.overall_export_metadata
const repoFirebaseDir = fileURLToPath(new URL("../..", import.meta.url));
const importsRoot = join(repoFirebaseDir, ".databases", "imports", "firestore");

if (!existsSync(importsRoot)) {
  console.error(`No Firestore imports directory found at: ${importsRoot}`);
  process.exit(1);
}

const subdirs = readdirSync(importsRoot)
  .map((name) => join(importsRoot, name))
  .filter((p) => {
    try {
      return statSync(p).isDirectory();
    } catch {
      return false;
    }
  });

if (!subdirs.length) {
  console.error(`No Firestore export directories found under: ${importsRoot}`);
  process.exit(1);
}

function hasOverallMetadata(dir) {
  try {
    return readdirSync(dir).some((f) => f.endsWith(".overall_export_metadata"));
  } catch {
    return false;
  }
}

const candidates = subdirs.filter(hasOverallMetadata);
const usable = candidates.length ? candidates : subdirs;

// Pick most recently modified directory.
usable.sort((a, b) => {
  const am = statSync(a).mtimeMs;
  const bm = statSync(b).mtimeMs;
  return bm - am;
});

console.log(usable[0]);
