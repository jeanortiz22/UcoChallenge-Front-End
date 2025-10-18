// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
// Importamos las herramientas del SDK de Auth0
import { authGuard, useAuth0 } from '@auth0/auth0-vue'; 

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/login', 
      name: 'Login', 
      component: LoginView,
      // 🛑 GUARDIA: Bloquear el acceso a /login si ya está autenticado
      beforeEnter: (to, from, next) => {
        // Ejecutar useAuth0 dentro del hook de navegación
        const { isAuthenticated, isLoading } = useAuth0();
        
        // Espera a que el estado inicial de Auth0 se resuelva
        if (!isLoading.value && isAuthenticated.value) {
          // Si está logeado, redirige al Dashboard
          next({ name: 'Dashboard' }); 
        } else {
          // Permite el acceso si no está autenticado o si el estado está cargando
          next(); 
        }
      }
    },
    { 
      path: '/dashboard', 
      name: 'Dashboard', 
      component: DashboardView, 
      // 🛡️ Proteger el Dashboard: Si no está autenticado, lo envía al login.
      beforeEnter: authGuard 
    },
    // Redirección de la ruta raíz a /login
    { path: '/', redirect: '/login' } 
  ]
});

export default router;