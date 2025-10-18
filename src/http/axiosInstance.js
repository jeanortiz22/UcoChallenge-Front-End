import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8081', // Gateway
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setupAxiosInterceptor(auth) {
  axiosInstance.interceptors.request.use(async (config) => {
    if (auth.isAuthenticated.value) {
      try {
        const accessToken = await auth.getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://api.ucochallenge.com', // Tu API
          },
        });
        config.headers.Authorization = `Bearer ${accessToken}`;
      } catch (error) {
        console.error('Error al obtener el Access Token de Auth0:', error);
      }
    }
    return config;
  });
}

export default axiosInstance;
