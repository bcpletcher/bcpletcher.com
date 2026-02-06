// Canonical project date utilities.
//
// Canonical storage format: YYYY-MM-DD (date-only, no timezone)
// Legacy format (migration only): MM/DD/YYYY

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isValidYMD(y, m, d) {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
  if (y < 1900 || y > 2100) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;

  // Real calendar validation.
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * Normalize any incoming date string to canonical ISO date-only (YYYY-MM-DD) or null.
 *
 * Accepts:
 * - YYYY-MM-DD (canonical)
 * - MM/DD/YYYY (legacy)
 */
export function normalizeProjectDate(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // Canonical: YYYY-MM-DD
  const iso = /^\d{4}-\d{2}-\d{2}$/.exec(raw);
  if (iso) {
    const y = Number(raw.slice(0, 4));
    const m = Number(raw.slice(5, 7));
    const d = Number(raw.slice(8, 10));
    if (!isValidYMD(y, m, d)) return null;
    return raw;
  }

  // Legacy: MM/DD/YYYY
  const legacy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (legacy) {
    const m = Number(legacy[1]);
    const d = Number(legacy[2]);
    const y = Number(legacy[3]);
    if (!isValidYMD(y, m, d)) return null;
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  return null;
}

/**
 * Get YYYY as a number from a canonical or legacy date string.
 */
export function getYearFromProjectDate(value) {
  const iso = normalizeProjectDate(value);
  if (!iso) return null;
  const y = Number(iso.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

