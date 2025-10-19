// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import { authGuard } from '@auth0/auth0-vue'; 
import RegisterUser from '../views/RegisterUserView.vue'; // 👈 importamos tu vista

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
    { 
      path: '/register',      // 👈 NUEVA RUTA
      name: 'RegisterUser',   // nombre que puedes usar con router.push({ name: 'RegisterUser' })
      component: RegisterUser, // el componente que mostraste
      // Nota: no lleva authGuard, así cualquier usuario puede registrarse
    },

    // Redirección de la raíz a /login
    { path: '/', redirect: '/login' } 
  ]
});

export default router;