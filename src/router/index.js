import { createRouter, createWebHistory } from 'vue-router';
import { authGuard } from '@auth0/auth0-vue';
import { roleGuard } from './roleGuard.js';

import LoginView from '../views/LoginView.vue';
import RegisterUserView from '../views/RegisterUserView.vue';
import DashboardView from '../views/DashboardView.vue';
import UnauthorizedView from '../views/UnauthorizedView.vue'; // 👈 nuevo

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'login', component: LoginView },

    // 👇 NUEVA ruta de no autorizado
    { path: '/unauthorized', name: 'unauthorized', component: UnauthorizedView },

    {
      path: '/register',
      name: 'register',
      component: RegisterUserView,
      beforeEnter: [authGuard, roleGuard(['admin:create'])]
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      beforeEnter: [authGuard, roleGuard(['admin:read'])]
    }
  ]
});

export default router;
