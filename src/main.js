import { createApp } from 'vue';
import { createAuth0 } from '@auth0/auth0-vue';
import App from './App.vue';
import router from './router';
import { setAuth0Client } from './auth/auth0Client';

const app = createApp(App);

const auth0Plugin = createAuth0({
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI
  }
});

app.use(auth0Plugin);
setAuth0Client(app.config.globalProperties.$auth0);

app.use(router);
app.mount('#app');
