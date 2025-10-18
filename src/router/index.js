// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import { authGuard } from '@auth0/auth0-vue'; 

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/login', 
      name: 'Login', 
      component: LoginView,
      // Sin guardia aquí - dejamos que el componente maneje la redirección
    },
    { 
      path: '/dashboard', 
      name: 'Dashboard', 
      component: DashboardView, 
      // 🛡️ Proteger el Dashboard con authGuard
      beforeEnter: authGuard 
    },
    // Redirección de la raíz a /login
    { path: '/', redirect: '/login' } 
  ]
});

export default router;