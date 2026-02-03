/* eslint-disable no-undef */
import { execSync } from "node:child_process";

// Kills any processes listening on the standard Firebase emulator ports and
// removes the project hub locator file. This prevents the common "port taken"
// issue when an emulator crashes or is left running.
//
// Ports (firebase.json):
// - Hub: 4420
// - UI: 4020
// - Logging: 4510
// - Functions: 5002
// - Firestore: 8080
// - Firestore WS: 9150
// - Eventarc: 9299 (reserved)
// - Tasks: 9499 (reserved)

const ports = [4420, 4020, 4510, 5002, 8080, 9150, 9299, 9499];

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const pidOutput = sh(`lsof -nP -iTCP:${ports.join(",")} -sTCP:LISTEN -t 2>/dev/null | sort -u`);
const pids = pidOutput.split(/\s+/).filter(Boolean);

if (pids.length) {
  // Try graceful then force.
  sh(`kill ${pids.join(" ")} 2>/dev/null || true`);
  const remaining = sh(`lsof -nP -iTCP:${ports.join(",")} -sTCP:LISTEN -t 2>/dev/null | sort -u`)
    .split(/\s+/)
    .filter(Boolean);
  if (remaining.length) {
    sh(`kill -9 ${remaining.join(" ")} 2>/dev/null || true`);
  }
}

// Remove stale hub locator(s) for this project.
// Using `find` avoids zsh glob failures on "no matches".
sh(`find /var/folders -name "hub-pletcher-portfolio-app.json" -delete 2>/dev/null || true`);
sh(`rm -f /tmp/hub-pletcher-portfolio-app.json 2>/dev/null || true`);

process.stdout.write("Emulator ports cleared.\n");
