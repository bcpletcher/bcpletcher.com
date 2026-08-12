const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.bcpletcher.com",
  "https://bcpletcher.com",
  "https://next.bcpletcher.com",
];

const MAX_PROJECT_ID_LENGTH = 128;
const MAX_PROJECT_DATA_BYTES = 512 * 1024;
const MAX_PROJECT_IMAGES = 200;
const MAX_STORAGE_PATH_LENGTH = 512;
const MAX_UPLOAD_OBJECTS = 12;
const MAX_UPLOAD_OBJECT_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_TOTAL_BYTES = 24 * 1024 * 1024;
const MAX_UPLOAD_BASE64_CHARS = Math.ceil(MAX_UPLOAD_OBJECT_BYTES / 3) * 4 + 4;
const NO_STORE_HEADERS = { "cache-control": "no-store" };

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function adminJson(data, init = {}) {
  return json(data, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...NO_STORE_HEADERS,
    },
  });
}

function corsHeaders(origin = null) {
  const headers = {
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    vary: "Origin",
  };
  if (origin) headers["access-control-allow-origin"] = origin;
  return headers;
}

function getConfiguredOrigins(env) {
  const configured = String(env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^https?:\/\/[^\s/]+(?::\d+)?$/.test(value));

  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function getAllowedOrigin(request, env) {
  const requestOrigin = (request.headers.get("origin") || "").trim();
  if (!requestOrigin) return null;
  return getConfiguredOrigins(env).includes(requestOrigin) ? requestOrigin : null;
}

function withCors(response, origin) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin)).forEach(([key, value]) => headers.set(key, value));
  if (!origin) headers.delete("access-control-allow-origin");
  return new Response(response.body, { status: response.status, headers });
}

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isValidProjectId(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_PROJECT_ID_LENGTH &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
  );
}

function isValidStoragePath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_STORAGE_PATH_LENGTH ||
    !value.startsWith("Projects/")
  ) {
    return false;
  }

  const segments = value.split("/");
  return (
    segments.length >= 3 &&
    segments.every(
      (segment) =>
        segment.length > 0 &&
        segment !== "." &&
        segment !== ".." &&
        !/[\\\0-\x1f\x7f]/.test(segment),
    )
  );
}

function isResizedStoragePath(value) {
  return value.split("/").slice(2).includes("resized");
}

function toBoolInt(value) {
  return value ? 1 : 0;
}

function validateProjectData(input, docId) {
  if (!isPlainObject(input)) {
    throw new ValidationError("Project data must be a plain object");
  }

  const data = { ...input };
  if (data.id != null && (typeof data.id !== "string" || data.id !== docId)) {
    throw new ValidationError("Project data id does not match document id");
  }

  for (const field of ["companyName", "projectName", "date", "summary", "description", "url"]) {
    if (data[field] != null && typeof data[field] !== "string") {
      throw new ValidationError(`Project field ${field} must be a string`);
    }
  }

  if (data.technology != null) {
    if (!Array.isArray(data.technology) || data.technology.some((item) => typeof item !== "string")) {
      throw new ValidationError("Project technology must be an array of strings");
    }
  }

  for (const field of ["featured", "hidden"]) {
    if (data[field] != null && typeof data[field] !== "boolean") {
      throw new ValidationError(`Project field ${field} must be a boolean`);
    }
  }

  if (data.images != null && !Array.isArray(data.images)) {
    throw new ValidationError("Project images must be an array");
  }

  const rawImages = data.images || [];
  if (rawImages.length > MAX_PROJECT_IMAGES) {
    throw new ValidationError(`Project cannot contain more than ${MAX_PROJECT_IMAGES} images`);
  }

  const images = rawImages.map((image) => {
    if (!isPlainObject(image) || !isValidStoragePath(image.path)) {
      throw new ValidationError("Project image path is invalid");
    }

    const pathProjectId = image.path.split("/")[1];
    if (pathProjectId !== docId || isResizedStoragePath(image.path)) {
      throw new ValidationError("Project image path does not match the document");
    }

    return { path: image.path };
  });

  const normalized = {
    ...data,
    summary: data.summary == null ? "" : data.summary,
    description: data.description == null ? "" : data.description,
    featured: Boolean(data.featured),
    hidden: Boolean(data.hidden),
    images,
  };

  if (new TextEncoder().encode(JSON.stringify(normalized)).byteLength > MAX_PROJECT_DATA_BYTES) {
    throw new ValidationError("Project data is too large");
  }

  return normalized;
}

function buildResizedStoragePath(originalStoragePath, width, height = 9999) {
  if (!isValidStoragePath(originalStoragePath) || isResizedStoragePath(originalStoragePath)) {
    return null;
  }

  const parts = originalStoragePath.split("/");
  const filename = parts.pop();
  if (!filename) return null;
  const dot = filename.lastIndexOf(".");
  const base = dot === -1 ? filename : filename.slice(0, dot);
  const ext = dot === -1 ? "" : filename.slice(dot);
  return `${parts.join("/")}/resized/${base}_${width}x${height}${ext}`;
}

function encodePathSegments(pathValue) {
  return String(pathValue)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildPublicUrl(env, objectPath) {
  if (!env.MEDIA_BASE_URL || !objectPath) return null;
  const base = String(env.MEDIA_BASE_URL).replace(/\/+$/, "");
  return `${base}/${encodePathSegments(objectPath)}`;
}

function base64UrlEncode(bytes) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSign(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", key, enc.encode(message));
}

async function createSessionToken(env, user) {
  const payload = {
    uid: user.uid,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sigB64 = base64UrlEncode(await hmacSign(env.ADMIN_SESSION_SECRET, payloadB64));
  return `${payloadB64}.${sigB64}`;
}

async function verifySessionToken(env, token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    if (!payloadB64 || !sigB64) return null;

    const expected = new Uint8Array(await hmacSign(env.ADMIN_SESSION_SECRET, payloadB64));
    const provided = base64UrlDecode(sigB64);
    if (provided.length !== expected.length) return null;

    let diff = 0;
    for (let i = 0; i < expected.length; i += 1) diff |= expected[i] ^ provided[i];
    if (diff !== 0) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof payload?.uid !== "string" ||
      !payload.uid.trim() ||
      typeof payload?.email !== "string" ||
      !payload.email.trim() ||
      !Number.isSafeInteger(payload.exp) ||
      payload.exp <= now
    ) {
      return null;
    }
    if (
      payload.iat !== undefined &&
      (!Number.isSafeInteger(payload.iat) ||
        payload.iat <= 0 ||
        payload.iat > now ||
        payload.iat >= payload.exp)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function requireEnvAuthConfig(env) {
  const missing = [];
  if (!env.ADMIN_EMAIL) missing.push("ADMIN_EMAIL");
  if (!env.ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");
  if (!env.ADMIN_SESSION_SECRET) missing.push("ADMIN_SESSION_SECRET");
  if (missing.length) throw new Error(`Missing auth env vars: ${missing.join(", ")}`);
}

async function requireAdmin(request, env) {
  requireEnvAuthConfig(env);
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  return verifySessionToken(env, token);
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }
}

async function handleProjects(env) {
  const rows = await env.DB.prepare("SELECT id, data_json FROM projects ORDER BY id").all();
  const result = {};
  (rows?.results || []).forEach((row) => {
    try {
      result[row.id] = JSON.parse(row.data_json);
    } catch {
      // Ignore malformed legacy rows so one bad row does not hide the collection.
    }
  });
  return json({ result });
}

async function handleLogin(request, env) {
  requireEnvAuthConfig(env);
  const body = await readJsonBody(request);
  if (!isPlainObject(body)) throw new ValidationError("Login payload must be an object");

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email !== String(env.ADMIN_EMAIL).trim().toLowerCase() || password !== String(env.ADMIN_PASSWORD)) {
    return adminJson({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = { uid: "admin", email };
  const token = await createSessionToken(env, user);
  return adminJson({ token, user });
}

async function handleSession(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return adminJson({ error: "Unauthorized" }, { status: 401 });
  return adminJson({ user: { uid: user.uid, email: user.email } });
}

async function upsertProject(env, docId, data) {
  const docData = validateProjectData(data, docId);
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare(
      `INSERT INTO projects (id, hidden, image_count, data_json, migrated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         hidden = excluded.hidden,
         image_count = excluded.image_count,
         data_json = excluded.data_json,
         migrated_at = excluded.migrated_at`,
    ).bind(
      docId,
      toBoolInt(docData.hidden),
      docData.images.length,
      JSON.stringify(docData),
      now,
    ),
    env.DB.prepare("DELETE FROM project_images WHERE project_id = ?").bind(docId),
    ...docData.images.map((image, index) =>
      env.DB.prepare(
        "INSERT INTO project_images (project_id, image_index, storage_path, r2_key, public_url) VALUES (?, ?, ?, ?, ?)",
      ).bind(docId, index, image.path, image.path, buildPublicUrl(env, image.path)),
    ),
  ];

  // D1 batch statements are a transaction: any failure rolls back the full batch.
  await env.DB.batch(statements);
}

async function handleProjectUpsert(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return adminJson({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonBody(request);
  if (!isPlainObject(body) || !isPlainObject(body.document)) {
    throw new ValidationError("Missing document payload");
  }

  const document = body.document;
  const data = document.data;
  const rawId = document.id ?? (isPlainObject(data) ? data.id : null);
  const docId = typeof rawId === "string" ? rawId : "";
  if (!isValidProjectId(docId)) throw new ValidationError("Project id is invalid");
  if (data == null) throw new ValidationError("Missing project data");

  await upsertProject(env, docId, data);
  return adminJson({ success: true, id: docId });
}

function decodeBase64ToBytes(base64) {
  if (
    typeof base64 !== "string" ||
    base64.length === 0 ||
    base64.length > MAX_UPLOAD_BASE64_CHARS ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64) ||
    base64.length % 4 === 1
  ) {
    throw new ValidationError("Upload base64 is invalid");
  }

  try {
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    if (bytes.length === 0 || bytes.length > MAX_UPLOAD_OBJECT_BYTES) {
      throw new ValidationError("Upload object is empty or too large");
    }
    return bytes;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Upload base64 is invalid");
  }
}

function validateUploadObjects(objects) {
  if (!Array.isArray(objects) || objects.length === 0) {
    throw new ValidationError("No objects to upload");
  }
  if (objects.length > MAX_UPLOAD_OBJECTS) {
    throw new ValidationError(`Upload cannot contain more than ${MAX_UPLOAD_OBJECTS} objects`);
  }

  const keys = new Set();
  let totalBytes = 0;
  const prepared = objects.map((object) => {
    if (!isPlainObject(object)) throw new ValidationError("Upload object is invalid");
    const key = object.key;
    if (!isValidStoragePath(key) || keys.has(key)) {
      throw new ValidationError("Upload object key is invalid");
    }
    keys.add(key);

    const bytes = decodeBase64ToBytes(object.base64);
    totalBytes += bytes.length;
    if (totalBytes > MAX_UPLOAD_TOTAL_BYTES) {
      throw new ValidationError("Upload payload is too large");
    }

    const contentType = object.contentType;
    if (typeof contentType !== "string" || !/^image\/[A-Za-z0-9.+-]+$/.test(contentType)) {
      throw new ValidationError("Upload content type is invalid");
    }

    const cacheControl = object.cacheControl || "public,max-age=31536000,immutable";
    if (
      typeof cacheControl !== "string" ||
      cacheControl.length > 256 ||
      /[\r\n]/.test(cacheControl)
    ) {
      throw new ValidationError("Upload cache control is invalid");
    }

    return { key, bytes, contentType, cacheControl };
  });

  const canonical = prepared.filter((object) => !isResizedStoragePath(object.key));
  if (canonical.length !== 1) {
    throw new ValidationError("Upload must contain exactly one canonical object");
  }

  return prepared;
}

async function cleanupR2Keys(env, keys) {
  const results = await Promise.allSettled(keys.map((key) => env.ARTWORK.delete(key)));
  return results
    .map((result, index) => (result.status === "rejected" ? { key: keys[index] } : null))
    .filter(Boolean);
}

async function handleImageUpload(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return adminJson({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonBody(request);
  if (!isPlainObject(body)) throw new ValidationError("Upload payload must be an object");
  const prepared = validateUploadObjects(body.objects);

  // Never overwrite an existing key: cleanup is therefore limited to this attempt.
  const existing = await Promise.all(prepared.map((object) => env.ARTWORK.head(object.key)));
  if (existing.some(Boolean)) throw new ValidationError("Upload object already exists");

  const uploadedKeys = [];
  try {
    for (const object of prepared) {
      uploadedKeys.push(object.key);
      await env.ARTWORK.put(object.key, object.bytes, {
        httpMetadata: { contentType: object.contentType },
        customMetadata: { cacheControl: object.cacheControl },
      });
    }
  } catch {
    const cleanupFailures = await cleanupR2Keys(env, uploadedKeys);
    return adminJson(
      {
        error: "Image upload failed",
        cleanup: cleanupFailures.length ? "incomplete" : "complete",
      },
      { status: 500 },
    );
  }

  const canonical = prepared.find((object) => !isResizedStoragePath(object.key));
  return adminJson({ success: true, canonicalUrl: buildPublicUrl(env, canonical.key) });
}

async function handleImageDelete(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return adminJson({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonBody(request);
  if (!isPlainObject(body) || !isValidStoragePath(body.path) || isResizedStoragePath(body.path)) {
    throw new ValidationError("Image path is invalid");
  }

  const path = body.path;
  const keys = [path, buildResizedStoragePath(path, 480), buildResizedStoragePath(path, 960)].filter(Boolean);
  const cleanupFailures = await cleanupR2Keys(env, keys);
  if (cleanupFailures.length) {
    return adminJson(
      { error: "Image delete failed", cleanup: "incomplete" },
      { status: 500 },
    );
  }
  return adminJson({ success: true });
}

async function handleImageGet(pathname, env) {
  const prefix = "/api/media/";
  if (!pathname.startsWith(prefix)) return json({ error: "Not found" }, { status: 404 });

  let key;
  try {
    key = decodeURIComponent(pathname.slice(prefix.length) || "").replace(/^\/+/, "");
  } catch {
    throw new ValidationError("Invalid media path");
  }
  if (!isValidStoragePath(key)) throw new ValidationError("Invalid media path");

  const object = await env.ARTWORK.get(key);
  if (!object) return json({ error: "Not found" }, { status: 404 });

  const headers = new Headers();
  headers.set("cache-control", object.customMetadata?.cacheControl || "public,max-age=31536000,immutable");
  if (object.httpMetadata?.contentType) headers.set("content-type", object.httpMetadata.contentType);
  return new Response(object.body, { status: 200, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const isAdminRequest = path === "/api/admin" || path.startsWith("/api/admin/");
    const origin = getAllowedOrigin(request, env);

    if (request.method === "OPTIONS") {
      if (request.headers.get("origin") && !origin) {
        return json(
          { error: "Origin not allowed" },
          { status: 403, headers: isAdminRequest ? { ...NO_STORE_HEADERS, ...corsHeaders(null) } : corsHeaders(null) },
        );
      }
      const headers = corsHeaders(origin);
      if (isAdminRequest) Object.assign(headers, NO_STORE_HEADERS);
      return new Response(null, { status: 204, headers });
    }

    try {
      let response;
      if (request.method === "GET" && path === "/api/projects") {
        response = await handleProjects(env);
      } else if (request.method === "POST" && path === "/api/admin/login") {
        response = await handleLogin(request, env);
      } else if (request.method === "GET" && path === "/api/admin/session") {
        response = await handleSession(request, env);
      } else if (request.method === "POST" && path === "/api/admin/projects/upsert") {
        response = await handleProjectUpsert(request, env);
      } else if (request.method === "POST" && path === "/api/admin/images/upload") {
        response = await handleImageUpload(request, env);
      } else if (request.method === "POST" && path === "/api/admin/images/delete") {
        response = await handleImageDelete(request, env);
      } else if (request.method === "GET" && path.startsWith("/api/media/")) {
        response = await handleImageGet(path, env);
      } else {
        response = isAdminRequest
          ? adminJson({ error: "Not found" }, { status: 404 })
          : json({ error: "Not found" }, { status: 404 });
      }

      return withCors(response, origin);
    } catch (error) {
      const status = error instanceof ValidationError ? 400 : 500;
      const body = status === 400 ? { error: error.message } : { error: "Internal error" };
      const init = { status };
      if (isAdminRequest) init.headers = NO_STORE_HEADERS;
      return withCors(json(body, init), origin);
    }
  },
};
