import { createRouter, createWebHistory } from 'vue-router';
import { authGuard } from '@auth0/auth0-vue';

import LoginView from '../views/LoginView.vue';
import RegisterUserView from '../views/RegisterUserView.vue';
import DashboardView from '../views/DashboardView.vue';
import { getAuth0Client } from '../auth/auth0Client';
import { AUTH0_ROLES_CLAIM, DASHBOARD_REQUIRED_ROLES, toRolesArray } from '../constants/authorization';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterUserView },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiredRoles: DASHBOARD_REQUIRED_ROLES },
      beforeEnter: [authGuard, async (to, from, next) => {
        const requiredRoles = to.meta?.requiredRoles || [];

        if (!requiredRoles.length) {
          return next();
        }

        const auth0Client = getAuth0Client();

        if (!auth0Client) {
          console.error('Auth0 client no disponible para validar roles.');
          return next({ path: '/' });
        }

        try {
          let claims = auth0Client.idTokenClaims?.value;

          if (!claims) {
            claims = await auth0Client.getIdTokenClaims();
          }

          const rolesFromClaims = toRolesArray(claims?.[AUTH0_ROLES_CLAIM]);
          const fallbackRoles = toRolesArray(auth0Client.user?.value?.[AUTH0_ROLES_CLAIM]);
          const roles = rolesFromClaims.length ? rolesFromClaims : fallbackRoles;

          const hasAllRoles = requiredRoles.every((role) => roles.includes(role));

          if (hasAllRoles) {
            return next();
          }

          console.warn('Acceso denegado. Roles requeridos:', requiredRoles, 'Roles del usuario:', roles);
          return next({ path: '/' });
        } catch (error) {
          console.error('Error al validar roles del usuario:', error);
          return next({ path: '/' });
        }
      }]
    }
  ]
});

export default router;
