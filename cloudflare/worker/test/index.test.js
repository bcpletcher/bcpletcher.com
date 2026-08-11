import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import worker from "../src/index.js";

const ADMIN_EMAIL = "test-admin@example.test";
const ADMIN_PASSWORD = "test-password-not-production";
const ADMIN_SESSION_SECRET = "test-session-secret-not-production";
const PRODUCTION_ORIGIN = "https://next.bcpletcher.com";
const LOCAL_ORIGIN = "http://localhost:5173";

class StatefulD1 {
  constructor({ projects = [], children = [], failAt = null } = {}) {
    this.projects = new Map(projects.map((row) => [row.id, { ...row }]));
    this.children = new Map(
      children.map((row) => [`${row.project_id}:${row.image_index}`, { ...row }]),
    );
    this.failAt = failAt;
    this.batchCalls = 0;
  }

  prepare(sql) {
    const statement = {
      sql,
      values: [],
      bind: (...values) => {
        statement.values = values;
        return statement;
      },
      all: async () => {
        if (!sql.startsWith("SELECT id, data_json")) {
          throw new Error(`Unexpected D1 query: ${sql}`);
        }
        return {
          results: [...this.projects.values()]
            .sort((left, right) => left.id.localeCompare(right.id))
            .map(({ id, data_json }) => ({ id, data_json })),
        };
      },
    };
    return statement;
  }

  async batch(statements) {
    this.batchCalls += 1;
    const nextProjects = new Map(
      [...this.projects].map(([key, value]) => [key, { ...value }]),
    );
    const nextChildren = new Map(
      [...this.children].map(([key, value]) => [key, { ...value }]),
    );

    for (let index = 0; index < statements.length; index += 1) {
      if (index === this.failAt) throw new Error("Injected D1 batch failure");

      const statement = statements[index];
      if (statement.sql.startsWith("INSERT INTO projects")) {
        const [id, hidden, imageCount, dataJson, migratedAt] = statement.values;
        nextProjects.set(id, {
          id,
          hidden,
          image_count: imageCount,
          data_json: dataJson,
          migrated_at: migratedAt,
        });
      } else if (statement.sql.startsWith("DELETE FROM project_images")) {
        const [projectId] = statement.values;
        for (const [key, row] of nextChildren) {
          if (row.project_id === projectId) nextChildren.delete(key);
        }
      } else if (statement.sql.startsWith("INSERT INTO project_images")) {
        const [projectId, imageIndex, storagePath, r2Key, publicUrl] = statement.values;
        nextChildren.set(`${projectId}:${imageIndex}`, {
          project_id: projectId,
          image_index: imageIndex,
          storage_path: storagePath,
          r2_key: r2Key,
          public_url: publicUrl,
        });
      } else {
        throw new Error(`Unexpected D1 batch query: ${statement.sql}`);
      }
    }

    this.projects = nextProjects;
    this.children = nextChildren;
    return statements.map(() => ({ success: true }));
  }
}

class StatefulR2 {
  constructor({ objects = new Map(), failPutAt = null, failDeleteKeys = [] } = {}) {
    this.objects = new Map(
      [...objects].map(([key, value]) => [key, { ...value }]),
    );
    this.failPutAt = failPutAt;
    this.failDeleteKeys = new Set(failDeleteKeys);
    this.putCount = 0;
    this.deleteCalls = [];
  }

  async head(key) {
    return this.objects.has(key) ? { key } : null;
  }

  async get(key) {
    const object = this.objects.get(key);
    if (!object) return null;

    return {
      body: new Response(object.body ?? "image-bytes").body,
      httpMetadata: { contentType: object.contentType || "image/webp" },
      customMetadata: {
        cacheControl: object.cacheControl || "public,max-age=60",
      },
    };
  }

  async put(key, bytes, options = {}) {
    const putIndex = this.putCount;
    this.putCount += 1;
    if (putIndex === this.failPutAt) throw new Error("Injected R2 put failure");

    this.objects.set(key, {
      body: Uint8Array.from(bytes),
      contentType: options.httpMetadata?.contentType,
      cacheControl: options.customMetadata?.cacheControl,
    });
  }

  async delete(key) {
    this.deleteCalls.push(key);
    if (this.failDeleteKeys.has(key)) throw new Error("Injected R2 delete failure");
    this.objects.delete(key);
  }
}

function makeProjectData(id, imagePaths = []) {
  return {
    id,
    companyName: "Example Company",
    projectName: "Example Project",
    date: "2024-01-01",
    summary: "A valid project summary.",
    description: "A valid project description.",
    featured: false,
    hidden: false,
    technology: ["Vue"],
    url: "https://example.test",
    meta: null,
    images: imagePaths.map((path) => ({ path })),
  };
}

function makeDbProject(id, data = makeProjectData(id)) {
  return {
    id,
    hidden: data.hidden ? 1 : 0,
    image_count: data.images.length,
    data_json: JSON.stringify(data),
    migrated_at: "2024-01-01T00:00:00.000Z",
  };
}

function makeEnv(overrides = {}) {
  return {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET,
    ALLOWED_ORIGIN: `${PRODUCTION_ORIGIN},${LOCAL_ORIGIN}`,
    DB: new StatefulD1(),
    ARTWORK: new StatefulR2(),
    ...overrides,
  };
}

function makeRequest(path, options = {}) {
  return new Request(`https://next.bcpletcher.com${path}`, options);
}

async function readJson(response) {
  return response.json();
}

async function login(env, origin = PRODUCTION_ORIGIN) {
  const response = await worker.fetch(
    makeRequest("/api/admin/login", {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    }),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  return (await readJson(response)).token;
}

function authenticatedOptions(token, options = {}) {
  return {
    ...options,
    headers: {
      Origin: PRODUCTION_ORIGIN,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  };
}

function upsertRequest(token, document) {
  return makeRequest(
    "/api/admin/projects/upsert",
    authenticatedOptions(token, {
      method: "POST",
      body: JSON.stringify({ mode: "update", document }),
    }),
  );
}

test("projects route returns 200 projects and allows the requesting production origin", async () => {
  const rows = Array.from({ length: 200 }, (_, index) => {
    const id = `project-${index}`;
    return makeDbProject(id, makeProjectData(id));
  });
  const env = makeEnv({ DB: new StatefulD1({ projects: rows }) });
  const response = await worker.fetch(
    makeRequest("/api/projects", { headers: { Origin: PRODUCTION_ORIGIN } }),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), PRODUCTION_ORIGIN);
  assert.equal(Object.keys((await readJson(response)).result).length, 200);
});

test("CORS allows configured local development and rejects unknown origins without ACAO", async () => {
  const env = makeEnv();
  const allowedPreflight = await worker.fetch(
    makeRequest("/api/projects", {
      method: "OPTIONS",
      headers: { Origin: LOCAL_ORIGIN, "Access-Control-Request-Method": "GET" },
    }),
    env,
  );
  assert.equal(allowedPreflight.status, 204);
  assert.equal(allowedPreflight.headers.get("access-control-allow-origin"), LOCAL_ORIGIN);

  const disallowedPreflight = await worker.fetch(
    makeRequest("/api/projects", {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "GET" },
    }),
    env,
  );
  assert.equal(disallowedPreflight.status, 403);
  assert.equal(disallowedPreflight.headers.get("access-control-allow-origin"), null);

  const disallowedGet = await worker.fetch(
    makeRequest("/api/projects", { headers: { Origin: "https://evil.example" } }),
    env,
  );
  assert.equal(disallowedGet.status, 200);
  assert.equal(disallowedGet.headers.get("access-control-allow-origin"), null);
});

test("production routing disables workers.dev and frontend uses same-origin API without fallback", () => {
  const wrangler = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");
  const readme = readFileSync(new URL("../../../README.md", import.meta.url), "utf8");
  const frontendFiles = [
    "../../../frontend/src/utils/cloudflareApi.js",
    "../../../frontend/src/utils/mediaStorageImages.js",
    "../../../frontend/src/stores/actions/data/dataGetCollection.js",
    "../../../frontend/.env.example",
  ].map((relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8"));

  assert.match(wrangler, /workers_dev\s*=\s*false/);
  assert.doesNotMatch(wrangler, /workers_dev\s*=\s*true/);
  assert.match(wrangler, /www\.bcpletcher\.com\/api\/\*/);
  assert.match(wrangler, /bcpletcher\.com\/api\/\*/);
  assert.match(wrangler, /next\.bcpletcher\.com\/api\/\*/);
  frontendFiles.forEach((source) => {
    assert.doesNotMatch(source, /VITE_API_BASE_URL_FALLBACK|VITE_CLOUDFLARE_PROJECTS_API_URL/);
    assert.doesNotMatch(source, /bcpletcher-api\.bcpletcher\.workers\.dev/);
  });
  assert.match(frontendFiles[1], /const src = buildMediaUrl\(originalStoragePath\)/);
  assert.match(frontendFiles[1], /VITE_ENABLE_RESPONSIVE_SRCSET === "true"/);
  assert.match(frontendFiles[3], /VITE_ENABLE_RESPONSIVE_SRCSET=false/);
  assert.match(readme, /isolated staging D1\/R2 environment/i);
  assert.doesNotMatch(readme, /VITE_API_BASE_URL_FALLBACK|bcpletcher-api\.bcpletcher\.workers\.dev/);
});

test("configured auth has no-store login/session responses and does not expose secrets", async () => {
  const env = makeEnv();
  const token = await login(env);
  assert.equal(token.includes(ADMIN_PASSWORD), false);
  assert.equal(token.includes(ADMIN_SESSION_SECRET), false);

  const sessionResponse = await worker.fetch(
    makeRequest("/api/admin/session", {
      headers: { Origin: PRODUCTION_ORIGIN, Authorization: `Bearer ${token}` },
    }),
    env,
  );
  assert.equal(sessionResponse.status, 200);
  assert.equal(sessionResponse.headers.get("cache-control"), "no-store");
  assert.deepEqual((await readJson(sessionResponse)).user, {
    uid: "admin",
    email: ADMIN_EMAIL,
  });

  const badLoginResponse = await worker.fetch(
    makeRequest("/api/admin/login", {
      method: "POST",
      headers: { Origin: PRODUCTION_ORIGIN, "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: "wrong" }),
    }),
    env,
  );
  assert.equal(badLoginResponse.status, 401);
  assert.equal(badLoginResponse.headers.get("cache-control"), "no-store");
  assert.equal((await badLoginResponse.text()).includes(ADMIN_PASSWORD), false);

  const malformedLoginResponse = await worker.fetch(
    makeRequest("/api/admin/login", {
      method: "POST",
      headers: { Origin: PRODUCTION_ORIGIN, "Content-Type": "application/json" },
      body: "not-json",
    }),
    env,
  );
  assert.equal(malformedLoginResponse.status, 400);
  assert.equal(malformedLoginResponse.headers.get("cache-control"), "no-store");
});

test("all known admin mutation/session routes reject unauthorized requests with no-store", async () => {
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
        headers: {
          Origin: PRODUCTION_ORIGIN,
          "Content-Type": "application/json",
        },
        body: method === "POST" ? "{}" : undefined,
      }),
      makeEnv(),
    );
    assert.equal(response.status, 401, path);
    assert.equal(response.headers.get("cache-control"), "no-store", path);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      PRODUCTION_ORIGIN,
      path,
    );
  }

  const malformedTokenResponse = await worker.fetch(
    makeRequest("/api/admin/session", {
      headers: {
        Origin: PRODUCTION_ORIGIN,
        Authorization: "Bearer not-a-valid-token",
      },
    }),
    makeEnv(),
  );
  assert.equal(malformedTokenResponse.status, 401);
  assert.equal(malformedTokenResponse.headers.get("cache-control"), "no-store");
});

test("successful project upsert commits parent and child rows in one D1 batch", async () => {
  const id = "demo";
  const initial = makeProjectData(id, ["Projects/demo/old.webp"]);
  const db = new StatefulD1({
    projects: [makeDbProject(id, initial)],
    children: [
      {
        project_id: id,
        image_index: 0,
        storage_path: "Projects/demo/old.webp",
        r2_key: "Projects/demo/old.webp",
        public_url: null,
      },
    ],
  });
  const env = makeEnv({ DB: db });
  const token = await login(env);
  const nextData = makeProjectData(id, [
    "Projects/demo/new.webp",
    "Projects/demo/second.webp",
  ]);

  const response = await worker.fetch(
    upsertRequest(token, { id, data: nextData }),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(db.batchCalls, 1);
  assert.deepEqual(JSON.parse(db.projects.get(id).data_json), nextData);
  assert.deepEqual(
    [...db.children.values()].map((row) => row.storage_path),
    ["Projects/demo/new.webp", "Projects/demo/second.webp"],
  );
});

test("D1 batch failure leaves the original project and child rows unchanged", async () => {
  const id = "demo";
  const initial = makeProjectData(id, ["Projects/demo/old.webp"]);
  const db = new StatefulD1({
    projects: [makeDbProject(id, initial)],
    children: [
      {
        project_id: id,
        image_index: 0,
        storage_path: "Projects/demo/old.webp",
        r2_key: "Projects/demo/old.webp",
        public_url: null,
      },
    ],
    failAt: 2,
  });
  const beforeProject = JSON.stringify(db.projects.get(id));
  const beforeChildren = JSON.stringify([...db.children]);
  const env = makeEnv({ DB: db });
  const token = await login(env);

  const response = await worker.fetch(
    upsertRequest(token, {
      id,
      data: makeProjectData(id, ["Projects/demo/new.webp", "Projects/demo/second.webp"]),
    }),
    env,
  );

  assert.equal(response.status, 500);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("access-control-allow-origin"), PRODUCTION_ORIGIN);
  assert.equal(db.batchCalls, 1);
  assert.equal(JSON.stringify(db.projects.get(id)), beforeProject);
  assert.equal(JSON.stringify([...db.children]), beforeChildren);
});

test("invalid project ids, data, and image paths return 400 before D1 side effects", async () => {
  const cases = [
    { id: "demo", data: [] },
    { id: "../demo", data: makeProjectData("../demo") },
    { id: " demo", data: makeProjectData(" demo") },
    {
      id: "demo",
      data: makeProjectData("demo", ["Projects/other/not-owned.webp"]),
    },
  ];

  for (const { id, data } of cases) {
    const db = new StatefulD1();
    const env = makeEnv({ DB: db });
    const token = await login(env);
    const response = await worker.fetch(
      upsertRequest(token, { id, data }),
      env,
    );
    assert.equal(response.status, 400);
    assert.equal(db.batchCalls, 0);
  }
});

test("successful upload and delete cover canonical media, variants, and cache headers", async () => {
  const artwork = new StatefulR2();
  const env = makeEnv({ ARTWORK: artwork });
  const token = await login(env);
  const canonical = "Projects/demo/new.webp";
  const objects = [
    {
      key: canonical,
      contentType: "image/webp",
      cacheControl: "public,max-age=31536000,immutable",
      base64: "aW1hZ2U=",
    },
    {
      key: "Projects/demo/resized/new_480x9999.webp",
      contentType: "image/webp",
      cacheControl: "public,max-age=31536000,immutable",
      base64: "aW1hZ2U=",
    },
    {
      key: "Projects/demo/resized/new_960x9999.webp",
      contentType: "image/webp",
      cacheControl: "public,max-age=31536000,immutable",
      base64: "aW1hZ2U=",
    },
  ];

  const uploadResponse = await worker.fetch(
    makeRequest(
      "/api/admin/images/upload",
      authenticatedOptions(token, {
        method: "POST",
        body: JSON.stringify({ objects }),
      }),
    ),
    env,
  );
  assert.equal(uploadResponse.status, 200);
  assert.equal(uploadResponse.headers.get("cache-control"), "no-store");
  assert.equal(artwork.objects.size, 3);

  const mediaResponse = await worker.fetch(
    makeRequest(`/api/media/${canonical}`, { headers: { Origin: PRODUCTION_ORIGIN } }),
    env,
  );
  assert.equal(mediaResponse.status, 200);
  assert.equal(mediaResponse.headers.get("content-type"), "image/webp");
  assert.equal(await mediaResponse.text(), "image");

  const deleteResponse = await worker.fetch(
    makeRequest(
      "/api/admin/images/delete",
      authenticatedOptions(token, {
        method: "POST",
        body: JSON.stringify({ path: canonical }),
      }),
    ),
    env,
  );
  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteResponse.headers.get("cache-control"), "no-store");
  assert.equal(artwork.objects.size, 0);
});

test("malformed uploads are rejected before R2 puts", async () => {
  const artwork = new StatefulR2();
  const env = makeEnv({ ARTWORK: artwork });
  const token = await login(env);
  const validObject = {
    key: "Projects/demo/new.webp",
    contentType: "image/webp",
    base64: "aW1hZ2U=",
  };
  const cases = [
    {},
    { objects: [] },
    { objects: [{ ...validObject, key: "../../unsafe.webp" }] },
    { objects: [{ ...validObject, base64: "" }] },
    { objects: [{ ...validObject, base64: "!!!" }] },
    { objects: [{ ...validObject, contentType: "text/plain" }] },
    { objects: Array.from({ length: 13 }, (_, index) => ({
      ...validObject,
      key: `Projects/demo/${index}.webp`,
    })) },
  ];

  for (const body of cases) {
    const response = await worker.fetch(
      makeRequest(
        "/api/admin/images/upload",
        authenticatedOptions(token, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
      env,
    );
    assert.equal(response.status, 400);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }

  assert.equal(artwork.putCount, 0);
  assert.equal(artwork.deleteCalls.length, 0);
  assert.equal(artwork.objects.size, 0);
});

test("partial R2 upload cleans only this attempt and reports incomplete cleanup honestly", async () => {
  const canonical = "Projects/demo/new.webp";
  const variant = "Projects/demo/resized/new_480x9999.webp";
  const existing = "Projects/demo/existing.webp";
  const artwork = new StatefulR2({
    objects: new Map([[existing, { body: "pre-existing" }]]),
    failPutAt: 1,
    failDeleteKeys: [canonical],
  });
  const env = makeEnv({ ARTWORK: artwork });
  const token = await login(env);
  const response = await worker.fetch(
    makeRequest(
      "/api/admin/images/upload",
      authenticatedOptions(token, {
        method: "POST",
        body: JSON.stringify({
          objects: [
            {
              key: canonical,
              contentType: "image/webp",
              base64: "aW1hZ2U=",
            },
            {
              key: variant,
              contentType: "image/webp",
              base64: "aW1hZ2U=",
            },
          ],
        }),
      }),
    ),
    env,
  );

  assert.equal(response.status, 500);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await readJson(response)).cleanup, "incomplete");
  assert.equal(artwork.objects.has(existing), true);
  assert.equal(artwork.objects.has(canonical), true);
  assert.equal(artwork.objects.has(variant), false);
  assert.deepEqual(artwork.deleteCalls, [canonical, variant]);
});

test("media missing and unsafe paths return 404/400, while unexpected public errors retain CORS", async () => {
  const env = makeEnv({
    ARTWORK: new StatefulR2({
      objects: new Map([["Projects/demo/image.webp", { body: "image-data" }]]),
    }),
  });
  const missingResponse = await worker.fetch(
    makeRequest("/api/media/Projects/demo/missing.webp", {
      headers: { Origin: PRODUCTION_ORIGIN },
    }),
    env,
  );
  assert.equal(missingResponse.status, 404);
  assert.equal(missingResponse.headers.get("access-control-allow-origin"), PRODUCTION_ORIGIN);

  const invalidResponse = await worker.fetch(
    makeRequest("/api/media/Projects/demo/%2e%2e/unsafe.webp", {
      headers: { Origin: PRODUCTION_ORIGIN },
    }),
    env,
  );
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidResponse.headers.get("access-control-allow-origin"), PRODUCTION_ORIGIN);

  const failingDb = {
    prepare() {
      return { all: async () => { throw new Error("Injected public D1 failure"); } };
    },
  };
  const publicError = await worker.fetch(
    makeRequest("/api/projects", { headers: { Origin: PRODUCTION_ORIGIN } }),
    makeEnv({ DB: failingDb }),
  );
  assert.equal(publicError.status, 500);
  assert.equal(publicError.headers.get("access-control-allow-origin"), PRODUCTION_ORIGIN);
});
