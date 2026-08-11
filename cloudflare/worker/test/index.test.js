import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

const ADMIN_EMAIL = "test-admin@example.test";
const ADMIN_PASSWORD = "test-password-not-production";
const ADMIN_SESSION_SECRET = "test-session-secret-not-production";
const PRODUCTION_ORIGIN = "https://next.bcpletcher.com";

function makeDb(rows = []) {
  return {
    prepare(sql) {
      if (sql.startsWith("SELECT id, data_json")) {
        return { all: async () => ({ results: rows }) };
      }

      return {
        bind() {
          return {
            run: async () => ({ success: true }),
          };
        },
      };
    },
  };
}

function makeR2(objects = new Map()) {
  return {
    async get(key) {
      const object = objects.get(key);
      if (!object) return null;

      return {
        body: new Response(object.body || "image-bytes").body,
        httpMetadata: { contentType: object.contentType || "image/webp" },
        customMetadata: { cacheControl: "public,max-age=60" },
      };
    },
    async put() {},
    async delete() {},
  };
}

function makeEnv(overrides = {}) {
  return {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET,
    ALLOWED_ORIGIN: [
      "https://www.bcpletcher.com",
      "https://bcpletcher.com",
      "https://next.bcpletcher.com",
    ].join(","),
    DB: makeDb(),
    ARTWORK: makeR2(),
    ...overrides,
  };
}

function makeRequest(path, options = {}) {
  return new Request(`https://api.example.test${path}`, options);
}

async function readJson(response) {
  return response.json();
}

test("projects route returns a 200-project D1 collection", async () => {
  const rows = Array.from({ length: 200 }, (_, index) => ({
    id: `project-${index}`,
    data_json: JSON.stringify({ id: `project-${index}`, hidden: false }),
  }));
  const response = await worker.fetch(
    makeRequest("/api/projects", {
      headers: { Origin: PRODUCTION_ORIGIN },
    }),
    makeEnv({ DB: makeDb(rows) }),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), PRODUCTION_ORIGIN);
  const payload = await readJson(response);
  assert.equal(Object.keys(payload.result).length, 200);
});

test("CORS allows configured local development and denies unknown origins", async () => {
  const localOrigin = "http://localhost:5173";
  const env = makeEnv({
    ALLOWED_ORIGIN: `${PRODUCTION_ORIGIN},${localOrigin}`,
  });

  const allowedPreflight = await worker.fetch(
    makeRequest("/api/projects", {
      method: "OPTIONS",
      headers: { Origin: localOrigin, "Access-Control-Request-Method": "GET" },
    }),
    env,
  );
  assert.equal(allowedPreflight.status, 204);
  assert.equal(allowedPreflight.headers.get("access-control-allow-origin"), localOrigin);

  const disallowedPreflight = await worker.fetch(
    makeRequest("/api/projects", {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example" },
    }),
    env,
  );
  assert.equal(disallowedPreflight.status, 403);
  assert.equal(disallowedPreflight.headers.get("access-control-allow-origin"), null);

  const disallowedGet = await worker.fetch(
    makeRequest("/api/projects", {
      headers: { Origin: "https://evil.example" },
    }),
    env,
  );
  assert.equal(disallowedGet.status, 200);
  assert.equal(disallowedGet.headers.get("access-control-allow-origin"), null);
});

test("admin routes reject unauthenticated requests and malformed tokens with 401", async () => {
  const protectedRoutes = [
    ["/api/admin/session", "GET"],
    ["/api/admin/projects/upsert", "POST"],
    ["/api/admin/images/upload", "POST"],
    ["/api/admin/images/delete", "POST"],
  ];

  for (const [path, method] of protectedRoutes) {
    const response = await worker.fetch(
      makeRequest(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? "{}" : undefined,
      }),
      makeEnv(),
    );
    assert.equal(response.status, 401, path);
  }

  const malformedTokenResponse = await worker.fetch(
    makeRequest("/api/admin/session", {
      headers: { Authorization: "Bearer not-a-valid-token" },
    }),
    makeEnv(),
  );
  assert.equal(malformedTokenResponse.status, 401);
});

test("configured auth issues a session without exposing fixture secrets", async () => {
  const env = makeEnv();
  const loginResponse = await worker.fetch(
    makeRequest("/api/admin/login", {
      method: "POST",
      headers: {
        Origin: PRODUCTION_ORIGIN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    }),
    env,
  );

  assert.equal(loginResponse.status, 200);
  const loginPayload = await readJson(loginResponse);
  assert.equal(loginPayload.user.email, ADMIN_EMAIL);
  assert.equal(typeof loginPayload.token, "string");
  assert.equal(loginPayload.token.includes(ADMIN_PASSWORD), false);
  assert.equal(loginPayload.token.includes(ADMIN_SESSION_SECRET), false);

  const sessionResponse = await worker.fetch(
    makeRequest("/api/admin/session", {
      headers: {
        Origin: PRODUCTION_ORIGIN,
        Authorization: `Bearer ${loginPayload.token}`,
      },
    }),
    env,
  );
  assert.equal(sessionResponse.status, 200);
  assert.deepEqual((await readJson(sessionResponse)).user, {
    uid: "admin",
    email: ADMIN_EMAIL,
  });

  const badLoginResponse = await worker.fetch(
    makeRequest("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: "wrong" }),
    }),
    env,
  );
  assert.equal(badLoginResponse.status, 401);
  assert.equal((await badLoginResponse.text()).includes(ADMIN_PASSWORD), false);
});

test("media route serves an R2 object and returns 404 for a missing key", async () => {
  const key = "Projects/demo/image.webp";
  const env = makeEnv({
    ARTWORK: makeR2(new Map([[key, { body: "image-data" }]])),
  });

  const foundResponse = await worker.fetch(
    makeRequest(`/api/media/${key}`, {
      headers: { Origin: PRODUCTION_ORIGIN },
    }),
    env,
  );
  assert.equal(foundResponse.status, 200);
  assert.equal(foundResponse.headers.get("content-type"), "image/webp");
  assert.equal(await foundResponse.text(), "image-data");

  const missingResponse = await worker.fetch(
    makeRequest("/api/media/Projects/demo/missing.webp"),
    env,
  );
  assert.equal(missingResponse.status, 404);
});
