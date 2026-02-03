/* eslint-disable no-undef */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Prints the absolute path to the local Firestore import directory.
// Convention in this repo:
//   firebase/.databases/imports/firestore/
const repoFirebaseDir = fileURLToPath(new URL("../..", import.meta.url));
const importDir = join(repoFirebaseDir, ".databases", "imports", "firestore");

if (!existsSync(importDir)) {
  console.error(`No Firestore import directory found at: ${importDir}`);
  process.exit(1);
}

console.log(importDir);
