import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-vue';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use(
  async (config) => {
    const { isAuthenticated, getAccessTokenSilently } = useAuth0();

    if (isAuthenticated.value) {
      try {
        const token = await getAccessTokenSilently({
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
