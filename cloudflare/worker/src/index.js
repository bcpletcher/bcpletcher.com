const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.bcpletcher.com",
  "https://bcpletcher.com",
  "https://next.bcpletcher.com",
];

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function corsHeaders(origin = null) {
  const headers = {
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    "vary": "Origin",
  };
  if (origin) headers["access-control-allow-origin"] = origin;
  return headers;
}

function getConfiguredOrigins(env) {
  const configured = String(env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => /^https?:\/\/[^\s/]+(?::\d+)?$/.test(v));

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

function toBoolInt(value) {
  return value ? 1 : 0;
}

function normalizeProjectDoc(input) {
  const data = input && typeof input === "object" ? { ...input } : {};
  const images = Array.isArray(data.images)
    ? data.images
      .filter((img) => img && typeof img === "object" && typeof img.path === "string")
      .map((img) => ({ ...img, path: String(img.path) }))
    : [];

  return {
    ...data,
    summary: data.summary == null ? "" : String(data.summary),
    description: data.description == null ? "" : String(data.description),
    featured: Boolean(data.featured),
    hidden: Boolean(data.hidden),
    images,
  };
}

function buildResizedStoragePath(originalStoragePath, width, height = 9999) {
  if (!originalStoragePath || typeof originalStoragePath !== "string") return null;
  if (!originalStoragePath.startsWith("Projects/")) return null;

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
    ["sign"]
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
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payloadJson));
  const sig = await hmacSign(env.ADMIN_SESSION_SECRET, payloadB64);
  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

async function verifySessionToken(env, token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    if (!payloadB64 || !sigB64) return null;

    const expectedSig = await hmacSign(env.ADMIN_SESSION_SECRET, payloadB64);
    const providedSig = base64UrlDecode(sigB64);
    const expected = new Uint8Array(expectedSig);
    if (providedSig.length !== expected.length) return null;

    let diff = 0;
    for (let i = 0; i < expected.length; i += 1) {
      diff |= expected[i] ^ providedSig[i];
    }
    if (diff !== 0) return null;

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadJson);
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
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
  if (missing.length) {
    throw new Error(`Missing auth env vars: ${missing.join(", ")}`);
  }
}

async function requireAdmin(request, env) {
  requireEnvAuthConfig(env);
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  const payload = await verifySessionToken(env, token);
  if (!payload) return null;
  return payload;
}

async function handleProjects(env) {
  const rows = await env.DB.prepare("SELECT id, data_json FROM projects ORDER BY id").all();
  const result = {};
  (rows?.results || []).forEach((row) => {
    try {
      result[row.id] = JSON.parse(row.data_json);
    } catch {
      // ignore malformed rows
    }
  });
  return json({ result });
}

async function handleLogin(request, env) {
  requireEnvAuthConfig(env);
  const body = await request.json().catch(() => ({}));
  const email = (body?.email || "").toString().trim().toLowerCase();
  const password = (body?.password || "").toString();

  if (email !== String(env.ADMIN_EMAIL).trim().toLowerCase() || password !== String(env.ADMIN_PASSWORD)) {
    return json(
      { error: "Invalid credentials" },
      { status: 401, headers: { "cache-control": "no-store" } }
    );
  }

  const user = { uid: "admin", email };
  const token = await createSessionToken(env, user);
  return json({ token, user }, { headers: { "cache-control": "no-store" } });
}

async function handleSession(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  return json({ user: { uid: user.uid, email: user.email } });
}

async function upsertProject(env, docId, data) {
  const docData = normalizeProjectDoc(data);
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO projects (id, hidden, image_count, data_json, migrated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       hidden = excluded.hidden,
       image_count = excluded.image_count,
       data_json = excluded.data_json,
       migrated_at = excluded.migrated_at`
  )
    .bind(docId, toBoolInt(docData.hidden), docData.images.length, JSON.stringify(docData), now)
    .run();

  await env.DB.prepare("DELETE FROM project_images WHERE project_id = ?").bind(docId).run();

  for (let i = 0; i < docData.images.length; i += 1) {
    const img = docData.images[i];
    await env.DB.prepare(
      "INSERT INTO project_images (project_id, image_index, storage_path, r2_key, public_url) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(docId, i, img.path, img.path, buildPublicUrl(env, img.path))
      .run();
  }
}

async function handleProjectUpsert(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const document = body?.document || {};
  const data = document?.data;
  const docId = (document?.id || data?.id || "").toString().trim();
  if (!docId || !data) return json({ error: "Missing document payload" }, { status: 400 });

  await upsertProject(env, docId, data);
  return json({ success: true, id: docId });
}

function decodeBase64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function handleImageUpload(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const objects = Array.isArray(body?.objects) ? body.objects : [];
  if (!objects.length) return json({ error: "No objects to upload" }, { status: 400 });

  for (const obj of objects) {
    const key = (obj?.key || "").toString();
    const base64 = (obj?.base64 || "").toString();
    if (!key || !base64) continue;
    const bytes = decodeBase64ToBytes(base64);
    await env.ARTWORK.put(key, bytes, {
      httpMetadata: {
        contentType: obj?.contentType || "application/octet-stream",
      },
      customMetadata: {
        cacheControl: obj?.cacheControl || "public,max-age=31536000,immutable",
      },
    });
  }

  const canonical = objects.find((o) => !String(o?.key || "").includes("/resized/"));
  const canonicalUrl = canonical?.key ? buildPublicUrl(env, canonical.key) : null;
  return json({ success: true, canonicalUrl });
}

async function handleImageDelete(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const path = (body?.path || "").toString();
  if (!path) return json({ error: "Missing image path" }, { status: 400 });

  const keys = [path, 480, 960]
    .map((w, i) => (i === 0 ? w : buildResizedStoragePath(path, w, 9999)))
    .filter(Boolean);

  await Promise.all(keys.map((key) => env.ARTWORK.delete(key)));
  return json({ success: true });
}

async function handleImageGet(pathname, env) {
  const prefix = "/api/media/";
  if (!pathname.startsWith(prefix)) return json({ error: "Not found" }, { status: 404 });
  const rawPath = pathname.slice(prefix.length);
  let key;
  try {
    key = decodeURIComponent(rawPath || "").replace(/^\/+/, "");
  } catch {
    return json({ error: "Invalid media path" }, { status: 400 });
  }
  if (!key) return json({ error: "Missing media path" }, { status: 400 });

  const object = await env.ARTWORK.get(key);
  if (!object) return json({ error: "Not found" }, { status: 404 });

  const headers = new Headers();
  headers.set("cache-control", object.customMetadata?.cacheControl || "public,max-age=31536000,immutable");
  if (object.httpMetadata?.contentType) headers.set("content-type", object.httpMetadata.contentType);
  return new Response(object.body, { status: 200, headers });
}

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request, env);
    if (request.method === "OPTIONS") {
      if (request.headers.get("origin") && !origin) {
        return json(
          { error: "Origin not allowed" },
          { status: 403, headers: corsHeaders(null) }
        );
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

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
        response = json({ error: "Not found" }, { status: 404 });
      }

      return withCors(response, origin);
    } catch (error) {
      return withCors(json({ error: "Internal error" }, { status: 500 }), origin);
    }
  },
};
