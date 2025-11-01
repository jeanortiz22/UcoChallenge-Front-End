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

// --- 🔽 Interceptor de respuesta robusto 🔽
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

    // Helper para parsear data a objeto JS
    const parsePayload = async (raw) => {
      try {
        if (raw == null) return null;

        // Caso Blob (HTML, problem+json, etc.)
        if (typeof Blob !== 'undefined' && raw instanceof Blob) {
          const text = await raw.text();
          try { return JSON.parse(text); } catch { return { _rawText: text }; }
        }

        // Caso string plano
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); } catch { return { _rawText: raw }; }
        }

        // Ya es objeto
        if (typeof raw === 'object') return raw;

        return { _rawText: String(raw) };
      } catch {
        return null;
      }
    };

    const payload = await parsePayload(data);
    const contentType = headers?.['content-type'] ?? '';

    // Extraer campos comunes
    const pickFirst = (...vals) => vals.find((v) => v != null && v !== '') ?? undefined;

    // Mapeos posibles:
    // - Tu ApiExceptionHandler: { message, messageCode, parameters, path, timestamp }
    // - Spring problem+json: { title, detail, status, type, instance }
    // - Spring default error: { error, message, errors[], path, timestamp, status }
    // - HTML/text del WAF: payload?._rawText
    let message;
    let messageCode;
    let parameters;
    let path;
    let timestamp;

    if (payload && typeof payload === 'object' && !payload._rawText) {
      // message
      message = pickFirst(
        payload.message,
        payload.detail,        // problem+json
        payload.error,         // Spring default
        Array.isArray(payload.errors) ? payload.errors.map(e => e.defaultMessage || e.message).join(' | ') : undefined,
      );

      // messageCode
      messageCode = pickFirst(
        payload.messageCode,
        payload.code,
        payload.errorCode,
        payload.type,          // a veces usan 'type' como code semántico
        'UNKNOWN_ERROR'
      );

      parameters = payload.parameters ?? payload.args ?? undefined;
      path = payload.path ?? payload.instance ?? undefined;
      timestamp = payload.timestamp ?? undefined;
    } else {
      // Llega HTML o texto
      const maybeHtml = payload?._rawText ?? '';
      // Intenta sacar un título/primera línea legible
      const firstLine = maybeHtml.split('\n').map(s => s.trim()).find(Boolean);
      message = firstLine || statusText || 'Ocurrió un error en el servidor';
      messageCode = 'NON_JSON_ERROR';
    }

    // Si sigue sin mensaje y el content-type es problem+json, usa statusText/estatus
    if (!message && contentType.includes('application/problem+json')) {
      message = statusText || `Error ${status}`;
    }

    // Último recurso
    if (!message) message = 'Ocurrió un error en el servidor';

    const normalized = {
      status,
      message,
      messageCode,
      parameters: parameters ?? [],
      path,
      timestamp,
    };

    // (opcional) Log detallado para depurar
    // console.debug('🔎 Error normalizado:', normalized, 'payload:', payload, 'headers:', headers);

    return Promise.reject(normalized);
  }
);

export default apiClient;
