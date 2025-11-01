// src/router/roleGuard.js
import { getMergedUserRoles } from '../utils/auth/mergedAuthz.js';
import { hasAnyRole } from '../utils/auth/roles.js';
import { useAuth0 } from '@auth0/auth0-vue';

/**
 * Uso: beforeEnter: [authGuard, roleGuard(['admin:read'])]
 * Si no cumple, redirige a /unauthorized mostrando lo requerido.
 */
export const roleGuard = (requiredRoles = []) => {
  return async (to, from, next) => {
    // En rutas protegidas, el authGuard ya corrió y garantizó sesión.
    try {
      const { user, idTokenClaims, getAccessTokenSilently, isAuthenticated } = useAuth0();

      if (!isAuthenticated.value) {
        // Por seguridad: si no hay sesión, deja que authGuard se encargue.
        return next(false);
      }

      const merged = await getMergedUserRoles(
        { getAccessTokenSilently, getUser: async () => user.value, user, idTokenClaims },
        import.meta.env.VITE_AUTH0_AUDIENCE
      );

      if (hasAnyRole(merged, requiredRoles)) {
        return next();
      }

      // 👉 No autorizado: ir a la pantalla dedicada
      return next({
        name: 'unauthorized',
        query: {
          from: to.fullPath,
          need: (requiredRoles || []).join(',')
        }
      });
    } catch (e) {
      // En caso de error inesperado, también redirigimos a unauthorized
      return next({
        name: 'unauthorized',
        query: {
          from: to.fullPath,
          need: (requiredRoles || []).join(',')
        }
      });
    }
  };
};
