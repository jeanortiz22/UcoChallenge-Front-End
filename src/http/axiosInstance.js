import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const defaultTokenParams = import.meta.env.VITE_AUTH0_AUDIENCE
  ? { authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } }
  : undefined;

let auth0Client = null;

export const setAuth0Client = (client) => {
  auth0Client = client;
};

export const getAuth0Client = () => auth0Client;

apiClient.interceptors.request.use(
  async (config) => {
    if (auth0Client && auth0Client.getAccessTokenSilently) {
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
      } catch (error) {
        console.error('❌ Error obteniendo token en axios interceptor:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
