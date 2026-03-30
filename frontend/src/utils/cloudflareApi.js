const TOKEN_KEY = "bp_admin_token";
const USER_KEY = "bp_admin_user";

function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL || "";
  return String(raw).replace(/\/+$/, "");
}

export function getApiFallbackBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL_FALLBACK || "";
  return String(raw).replace(/\/+$/, "");
}

export function toApiUrl(path) {
  const base = getApiBaseUrl();
  return `${base}${path}`;
}

function toApiUrlWithBase(base, path) {
  return `${base || ""}${path}`;
}

export function getStoredAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getStoredAdminUser() {
  if (typeof window === "undefined") return {};
  return safeJsonParse(localStorage.getItem(USER_KEY) || "{}", {});
}

export function setStoredAdminSession({ token, user }) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = { Accept: "application/json" };
  let payload = body;

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = getStoredAdminToken();
    if (!token) throw new Error("Not authenticated");
    headers.Authorization = `Bearer ${token}`;
  }

  const requestOnce = async (baseUrl) => {
    const response = await fetch(toApiUrlWithBase(baseUrl, path), {
      method,
      headers,
      body: payload,
    });

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const text = await response.text();
    const json = text ? safeJsonParse(text, null) : null;

    if (!response.ok) {
      const message = json?.error || `Request failed: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }
    if (!contentType.includes("application/json")) {
      throw new Error("API did not return JSON");
    }
    if (!json || typeof json !== "object") {
      throw new Error("API returned invalid JSON payload");
    }
    return json;
  };

  const primaryBase = getApiBaseUrl();
  const fallbackBase = getApiFallbackBaseUrl();

  try {
    return await requestOnce(primaryBase);
  } catch (error) {
    if (!fallbackBase || fallbackBase === primaryBase) throw error;
    return requestOnce(fallbackBase);
  }
}
