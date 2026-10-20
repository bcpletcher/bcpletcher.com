#!/bin/bash
#arrayStarted=true
# bcpletcher.com portfolio backup, written to run as an Unraid "User Scripts" job.
#
# Needs no Cloudflare credentials: every project record and image of the portfolio is already
# public through the site's own API, so this reads
#   GET /api/projects              all portfolio projects (JSON)
#   GET /api/archive/v1/projects   the preserved v1 archive (JSON)
#   GET /api/media/<key>           every image those records reference
# into a dated folder, verifies it, and keeps the newest KEEP folders.
#
# A SQL dump of D1 (including the schema) needs a Cloudflare token; for that, run
# cloudflare/scripts/backup-portfolio.mjs by hand or add the token flow later. D1 also keeps
# 7 days of automatic point-in-time recovery (Time Travel) on the Free plan.
#
# Environment overrides (all optional): PORTFOLIO_BASE_URL, PORTFOLIO_BACKUP_DIR,
# PORTFOLIO_BACKUP_KEEP, PORTFOLIO_BACKUP_NO_NOTIFY=1.
set -uo pipefail

BASE="${PORTFOLIO_BASE_URL:-https://bcpletcher.com}"
DEST="${PORTFOLIO_BACKUP_DIR:-/mnt/user/backups/bcpletcher-portfolio}"
KEEP="${PORTFOLIO_BACKUP_KEEP:-12}"
STAMP="$(date +%F)"
FINAL="$DEST/snapshot-$STAMP"
TMP="$DEST/.incoming-$STAMP-$$"
NOTIFY=/usr/local/emhttp/webGui/scripts/notify

notify() {
  [ -n "${PORTFOLIO_BACKUP_NO_NOTIFY:-}" ] && return 0
  [ -x "$NOTIFY" ] && "$NOTIFY" -e "Portfolio backup" -s "$1" -d "$2" -i "$3" >/dev/null 2>&1
  return 0
}
fail() {
  echo "FAILED: $1"
  rm -rf "$TMP"
  notify "Portfolio backup failed" "$1" alert
  exit 1
}

echo "=== $(date '+%F %T') portfolio backup start ($BASE -> $DEST) ==="
command -v curl >/dev/null || fail "curl not found"
command -v jq >/dev/null || fail "jq not found"
mkdir -p "$DEST" "$TMP/media" || fail "cannot create $DEST"

fetch() { curl -fsS --retry 3 --retry-delay 2 --connect-timeout 15 --max-time 90 -o "$2" "$1"; }

fetch "$BASE/api/projects" "$TMP/projects.json" || fail "could not fetch /api/projects"
fetch "$BASE/api/archive/v1/projects" "$TMP/archive-v1.json" || fail "could not fetch /api/archive/v1/projects"
jq -e '(.result | length) > 0' "$TMP/projects.json" >/dev/null || fail "projects.json is empty or invalid"
jq -e '(.result | length) > 0' "$TMP/archive-v1.json" >/dev/null || fail "archive-v1.json is empty or invalid"

# Image keys referenced anywhere in the records; only plain, safe paths are accepted.
KEYS="$(jq -r '.. | strings | select(test("^(Projects|Archive/v1/Projects)/[A-Za-z0-9._/-]+\\.(webp|gif|png|jpe?g|avif)$"))' \
  "$TMP/projects.json" "$TMP/archive-v1.json" | grep -vE '(^|/)\.\.?(/|$)|//' | sort -u)"
TOTAL="$(printf '%s\n' "$KEYS" | grep -c . || true)"
[ "$TOTAL" -gt 0 ] || fail "no image keys found in the records"

echo "Downloading $TOTAL images ..."
DONE=0
BAD=0
while IFS= read -r key; do
  [ -n "$key" ] || continue
  mkdir -p "$TMP/media/$(dirname "$key")"
  if ! fetch "$BASE/api/media/$key" "$TMP/media/$key" || [ ! -s "$TMP/media/$key" ]; then
    echo "  missing: $key"
    BAD=$((BAD + 1))
  fi
  DONE=$((DONE + 1))
  if [ $((DONE % 50)) -eq 0 ]; then echo "  $DONE/$TOTAL"; fi
done <<<"$KEYS"
[ "$BAD" -eq 0 ] || fail "$BAD of $TOTAL images could not be downloaded"

# Manifest: SHA-256 of every file, plus totals.
(cd "$TMP" && find . -type f ! -name manifest.sha256 ! -name manifest.json | sort | while IFS= read -r f; do sha256sum "$f"; done) >"$TMP/manifest.sha256"
FILES="$(grep -c . "$TMP/manifest.sha256")"
BYTES="$(du -sb "$TMP" | cut -f1)"
[ "$FILES" -eq $((TOTAL + 2)) ] || fail "file count $FILES does not match expected $((TOTAL + 2))"
jq -n --arg created "$(date -u +%FT%TZ)" --arg base "$BASE" --argjson images "$TOTAL" --argjson files "$FILES" --argjson bytes "$BYTES" \
  '{created_at:$created, source:$base, images:$images, files:$files, bytes:$bytes, kind:"public-api snapshot (no D1 SQL dump)"}' >"$TMP/manifest.json"

# Publish atomically, then fix ownership for SMB access and prune old snapshots.
rm -rf "$FINAL"
mv "$TMP" "$FINAL" || fail "could not publish snapshot"
chown -R nobody:users "$FINAL" 2>/dev/null || true
chmod -R u=rwX,g=rwX,o=rX "$FINAL" 2>/dev/null || true

COUNT="$(ls -1d "$DEST"/snapshot-????-??-?? 2>/dev/null | wc -l)"
if [ "$COUNT" -gt "$KEEP" ]; then
  ls -1d "$DEST"/snapshot-????-??-?? | sort | head -n $((COUNT - KEEP)) | while IFS= read -r old; do
    echo "Prune $old"
    rm -rf "$old"
  done
fi

MSG="$FILES files, $((BYTES / 1048576)) MB in $FINAL"
echo "=== $(date '+%F %T') portfolio backup OK: $MSG ==="
notify "Portfolio backup OK" "$MSG" normal
exit 0
