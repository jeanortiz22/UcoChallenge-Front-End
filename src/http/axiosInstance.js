import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Se setea desde main.js tras instalar el plugin de Auth0
let auth0Client = null;

export const setAuth0Client = (client) => {
  auth0Client = client;
};

apiClient.interceptors.request.use(
  async (config) => {
    if (auth0Client && auth0Client.getAccessTokenSilently) {
      try {
        // isAuthenticated a veces viene como ref
        const isAuth = auth0Client.isAuthenticated?.value ?? auth0Client.isAuthenticated ?? false;
        if (isAuth) {
          const token = await auth0Client.getAccessTokenSilently();
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
