// src/http/axiosInstance.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json, application/problem+json;q=0.9, */*;q=0.1',
  },
});

const defaultTokenParams = import.meta.env.VITE_AUTH0_AUDIENCE
  ? { authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } }
  : undefined;

let auth0Client = null;
export const setAuth0Client = (client) => { auth0Client = client; };
export const getAuth0Client = () => auth0Client;

/* ===========================
   Resolver de mensajes humanos
   =========================== */

// Ideal: rutea messages-service por el Gateway (mismo origen/CORS)
const MESSAGES_BASE_URL =
  import.meta.env.VITE_MESSAGES_BASE_URL || import.meta.env.VITE_API_BASE_URL;

// Cliente separado para evitar recursión de interceptores
const messagesClient = axios.create({
  baseURL: MESSAGES_BASE_URL,
  timeout: 8000,
  headers: { Accept: 'application/json' },
});

// Caché en memoria para el catálogo ya resuelto
const messageCache = new Map(); // key -> template renderizado por params

const isCodeLike = (val) =>
  typeof val === 'string' &&
  /^[a-z0-9]+(?:\.[a-z0-9]+)+$/i.test(val);

// Extrae un code válido desde un string con ruido (ej. "[user.register.x]")
function extractCodeFromString(s) {
  if (typeof s !== 'string') return null;
  const cleaned = s.trim();
  if (isCodeLike(cleaned)) return cleaned;
  const m = cleaned.match(/\[?\s*([a-z0-9]+(?:\.[a-z0-9]+)+)\s*\]?/i);
  return m ? m[1] : null;
}

async function resolveMessageFromCatalog(code, params = []) {
  if (!code) return null;

  const cacheKey = `${code}::${JSON.stringify(params)}`;
  if (messageCache.has(cacheKey)) return messageCache.get(cacheKey);

  try {
    // GET /api/v1/messages/{key}?p=...&p=...
    const resp = await messagesClient.get(`/api/v1/messages/${encodeURIComponent(code)}`, {
      params: { p: params }, // axios genera múltiples p=
    });

    const human = resp?.data?.message;
    if (human && typeof human === 'string') {
      messageCache.set(cacheKey, human);
      return human;
    }
  } catch {
    // silencioso: fallback al code si falla
  }
  return null;
}

/* ===========================
   Interceptor de autorización
   =========================== */
apiClient.interceptors.request.use(
  async (config) => {
    if (auth0Client?.getAccessTokenSilently) {
      try {
        const rawIsAuthenticated = auth0Client.isAuthenticated;
        const isAuth = typeof rawIsAuthenticated === 'function'
          ? await rawIsAuthenticated.call(auth0Client)
          : rawIsAuthenticated?.value ?? rawIsAuthenticated ?? false;

        if (isAuth) {
          const token = await auth0Client.getAccessTokenSilently(defaultTokenParams);
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (e) {
        console.error('❌ Error obteniendo token en axios interceptor:', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ==========================================
   Interceptor de respuesta + resolución catálogo
   ========================================== */
apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    // 1) Timeout explícito de Axios
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        status: 0,
        message: 'Tiempo de espera agotado al conectar con el servidor.',
        messageCode: 'NETWORK_TIMEOUT',
      });
    }

    // 2) Sin respuesta (CORS, red, servidor caído)
    if (!error.response) {
      return Promise.reject({
        status: 0,
        message: 'Error de conexión. Verifica que el backend esté corriendo.',
        messageCode: 'NETWORK_ERROR',
      });
    }

    // 3) Hay respuesta HTTP con status
    const { status, data, headers, statusText } = error.response;

    const parsePayload = async (raw) => {
      try {
        if (raw == null) return null;
        if (typeof Blob !== 'undefined' && raw instanceof Blob) {
          const text = await raw.text();
          try { return JSON.parse(text); } catch { return { _rawText: text }; }
        }
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); } catch { return { _rawText: raw }; }
        }
        if (typeof raw === 'object') return raw;
        return { _rawText: String(raw) };
      } catch {
        return null;
      }
    };

    const payload = await parsePayload(data);
    const contentType = headers?.['content-type'] ?? '';
    const pickFirst = (...vals) => vals.find((v) => v != null && v !== '') ?? undefined;

    let message;
    let messageCode;
    let parameters;
    let path;
    let timestamp;

    if (payload && typeof payload === 'object' && !payload._rawText) {
      message = pickFirst(
        payload.message,
        payload.detail,
        payload.error,
        Array.isArray(payload.errors) ? payload.errors.map(e => e.defaultMessage || e.message).join(' | ') : undefined,
      );
      messageCode = pickFirst(
        payload.messageCode,
        payload.code,
        payload.errorCode,
        payload.type,
        'UNKNOWN_ERROR'
      );
      parameters = payload.parameters ?? payload.args ?? undefined;
      path = payload.path ?? payload.instance ?? undefined;
      timestamp = payload.timestamp ?? undefined;
    } else {
      const maybeHtml = payload?._rawText ?? '';
      const firstLine = maybeHtml.split('\n').map(s => s.trim()).find(Boolean);
      message = firstLine || statusText || 'Ocurrió un error en el servidor';
      messageCode = 'NON_JSON_ERROR';
    }

    if (!message && contentType.includes('application/problem+json')) {
      message = statusText || `Error ${status}`;
    }
    if (!message) message = 'Ocurrió un error en el servidor';

    const normalized = {
      status,
      message,
      messageCode,
      parameters: Array.isArray(parameters) ? parameters : [],
      path,
      timestamp,
    };

    // === Resolver mensaje humano si estamos mostrando un code (con o sin corchetes)
    try {
      let code =
        extractCodeFromString(normalized.messageCode) ||
        extractCodeFromString(normalized.message);

      if (code) {
        const resolved = await resolveMessageFromCatalog(code, normalized.parameters);
        if (resolved) {
          normalized.message = resolved;
        } else {
          // fallback: deja el code limpio (sin brackets) si no resolvió
          normalized.message = normalized.message || code;
        }
      }
    } catch {
      // si falla, deja tal cual
    }

    return Promise.reject(normalized);
  }
);

export default apiClient;
