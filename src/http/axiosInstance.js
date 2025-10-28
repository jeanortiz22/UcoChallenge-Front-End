import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

let auth0Client = null;

export const setAuth0Client = (client) => {
  auth0Client = client;
};

apiClient.interceptors.request.use(
  async (config) => {
    if (auth0Client?.isAuthenticated?.value) {
      try {
        const token = await auth0Client.getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE
          }
        });

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
