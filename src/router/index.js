import { createRouter, createWebHistory } from 'vue-router';
import { authGuard } from '@auth0/auth0-vue';

import LoginView from '../views/LoginView.vue';
import RegisterUserView from '../views/RegisterUserView.vue';
import DashboardView from '../views/DashboardView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterUserView },
    { path: '/dashboard', name: 'dashboard', component: DashboardView, beforeEnter: authGuard }
  ]
});

export default router;
