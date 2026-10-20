-- Failed admin login tracking for the Worker's lockout (see handleLogin).
-- Keys are 'ip:<hash>' (SHA-256 prefix of the client IP, never the raw IP) and 'global'.
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL,
  locked_until INTEGER NOT NULL DEFAULT 0
);
