import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import worker from "../src/index.js";

const ADMIN_EMAIL = "test-admin@example.test";
const ADMIN_PASSWORD = "test-password-not-production";
const ORIGIN = "https://next.bcpletcher.com";
const MIGRATION = readFileSync(new URL("../../migrations/0001_admin_login_attempts.sql", import.meta.url), "utf8");

// Minimal D1 adapter over a real in-memory SQLite database so the lockout SQL is exercised.
function sqliteD1({ migrate = true } = {}) {
  const db = new DatabaseSync(":memory:");
  if (migrate) db.exec(MIGRATION);
  const statement = (sql) => {
    const state = { sql, values: [] };
    state.bind = (...values) => {
      state.values = values;
      return state;
    };
    state.run = async () => {
      db.prepare(sql).run(...state.values);
      return { success: true };
    };
    state.all = async () => ({ results: db.prepare(sql).all(...state.values) });
    return state;
  };
  return {
    db,
    prepare: statement,
    async batch(statements) {
      db.exec("BEGIN");
      try {
        for (const item of statements) db.prepare(item.sql).run(...item.values);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return statements.map(() => ({ success: true }));
    },
  };
}

function makeEnv(DB) {
  return {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: "test-session-secret-not-production",
    ALLOWED_ORIGIN: ORIGIN,
    DB,
  };
}

function login(env, { password = "wrong-password", email = ADMIN_EMAIL, ip = "198.51.100.7" } = {}) {
  return worker.fetch(
    new Request(`${ORIGIN}/api/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN, "cf-connecting-ip": ip },
      body: JSON.stringify({ email, password }),
    }),
    env,
  );
}

async function withClock(startMs, fn) {
  const realNow = Date.now;
  let current = startMs;
  Date.now = () => current;
  try {
    await fn({ advance: (seconds) => { current += seconds * 1000; } });
  } finally {
    Date.now = realNow;
  }
}

test("fifth wrong password locks the address; even the right password is refused while locked", async () => {
  const env = makeEnv(sqliteD1());
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    assert.equal((await login(env)).status, 401, `attempt ${attempt}`);
  }
  const locked = await login(env);
  assert.equal(locked.status, 429);
  assert.equal(locked.headers.get("cache-control"), "no-store");
  assert.ok(Number(locked.headers.get("retry-after")) > 0 && Number(locked.headers.get("retry-after")) <= 900);
  assert.equal((await login(env, { password: ADMIN_PASSWORD })).status, 429);
});

test("lock expires after 15 minutes and a good login clears the failure count", async () => {
  await withClock(1_700_000_000_000, async ({ advance }) => {
    const env = makeEnv(sqliteD1());
    for (let i = 0; i < 5; i += 1) await login(env);
    assert.equal((await login(env, { password: ADMIN_PASSWORD })).status, 429);
    advance(15 * 60 + 1);
    const ok = await login(env, { password: ADMIN_PASSWORD });
    assert.equal(ok.status, 200);
    assert.ok((await ok.json()).token);
    const row = env.DB.db.prepare("SELECT COUNT(*) AS n FROM admin_login_attempts WHERE key LIKE 'ip:%'").get();
    assert.equal(row.n, 0);
  });
});

test("a successful login resets the per-address count", async () => {
  const env = makeEnv(sqliteD1());
  for (let i = 0; i < 4; i += 1) assert.equal((await login(env)).status, 401);
  assert.equal((await login(env, { password: ADMIN_PASSWORD })).status, 200);
  for (let i = 0; i < 4; i += 1) assert.equal((await login(env)).status, 401);
  assert.equal((await login(env)).status, 401);
  assert.equal((await login(env)).status, 429);
});

test("old failures outside the 15 minute window do not accumulate", async () => {
  await withClock(1_700_000_000_000, async ({ advance }) => {
    const env = makeEnv(sqliteD1());
    for (let i = 0; i < 4; i += 1) await login(env);
    advance(16 * 60);
    for (let i = 0; i < 4; i += 1) assert.equal((await login(env)).status, 401);
    assert.equal((await login(env)).status, 401);
    assert.equal((await login(env)).status, 429);
  });
});

test("one address being locked does not lock another address", async () => {
  const env = makeEnv(sqliteD1());
  for (let i = 0; i < 6; i += 1) await login(env, { ip: "198.51.100.1" });
  assert.equal((await login(env, { ip: "198.51.100.1" })).status, 429);
  assert.equal((await login(env, { ip: "198.51.100.2", password: ADMIN_PASSWORD })).status, 200);
});

test("the global brake locks every address after 30 failures in an hour", async () => {
  const env = makeEnv(sqliteD1());
  for (let i = 0; i < 30; i += 1) {
    const response = await login(env, { ip: `203.0.113.${i + 1}` });
    assert.equal(response.status, 401, `failure ${i + 1}`);
  }
  const blocked = await login(env, { ip: "203.0.113.200", password: ADMIN_PASSWORD });
  assert.equal(blocked.status, 429);
});

test("raw client addresses are never stored", async () => {
  const env = makeEnv(sqliteD1());
  await login(env, { ip: "198.51.100.77" });
  const keys = env.DB.db.prepare("SELECT key FROM admin_login_attempts").all().map((row) => row.key);
  assert.ok(keys.length >= 2);
  assert.ok(keys.every((key) => !key.includes("198.51.100.77")));
  assert.ok(keys.some((key) => /^ip:[0-9a-f]{32}$/.test(key)));
});

test("lockout fails open if the table has not been created yet", async () => {
  const env = makeEnv(sqliteD1({ migrate: false }));
  assert.equal((await login(env)).status, 401);
  const ok = await login(env, { password: ADMIN_PASSWORD });
  assert.equal(ok.status, 200);
});

test("wrong email or wrong password both fail the same way", async () => {
  const env = makeEnv(sqliteD1());
  const wrongEmail = await login(env, { email: "someone@example.test", password: ADMIN_PASSWORD });
  const wrongPassword = await login(env, { password: "nope" });
  assert.equal(wrongEmail.status, 401);
  assert.equal(wrongPassword.status, 401);
  assert.deepEqual(await wrongEmail.json(), await wrongPassword.json());
});
