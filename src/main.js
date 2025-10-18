import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createAuth0 } from '@auth0/auth0-vue';
import axiosInstance, { setupAxiosInterceptor } from './http/axiosInstance';

const app = createApp(App);

// 1️⃣ Configurar Auth0
const auth0Plugin = createAuth0({
  domain: 'dev-kkp1gdup1nvbr6qj.us.auth0.com',
  clientId: 'mcDe2B3YV3VBQ4Ucl38VoWMKLvIQdrIB',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: 'https://api.ucochallenge.com',
  },
});

// 2️⃣ Instalar plugins principales
app.use(auth0Plugin);
app.use(router);

// 3️⃣ Montar app
app.mount('#app');

// 4️⃣ Esperar a que Auth0 se inicialice y entonces configurar Axios
import { watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';

app.mixin({
  mounted() {
    // ✅ Usamos `useAuth0()` dentro de un contexto Válido (setup-reactivo)
    const auth = useAuth0();

    watch(
      () => auth.isAuthenticated.value,
      async (isAuth) => {
        if (isAuth) {
          try {
            const token = await auth.getAccessTokenSilently({
              authorizationParams: { audience: 'https://api.ucochallenge.com' },
            });

            console.log('🔐 Access Token obtenido correctamente:', token);
            setupAxiosInterceptor(auth);
          } catch (err) {
            console.error('❌ Error al obtener token:', err);
          }
        }
      },
      { immediate: true }
    );
  },
});
