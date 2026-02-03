#!/usr/bin/env zsh
# Repo-local dev environment for Firebase emulators (Functions/Firestore)
# - Forces Homebrew OpenJDK 21 (Firebase emulators require Java 11+)
# - Uses Node version from .nvmrc (22)

set -euo pipefail

# Java (Homebrew)
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Node (nvm)
if [[ -n "${NVM_DIR:-}" && -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "$NVM_DIR/nvm.sh"
  nvm use >/dev/null
fi

echo "node: $(node -v)"
echo "java: $(java -version 2>&1 | head -n 1)"
