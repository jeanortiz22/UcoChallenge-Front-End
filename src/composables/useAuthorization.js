import { computed, watchEffect, ref } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { AUTH0_ROLES_CLAIM } from '../constants/authorization';

const normalizeRoles = (roles) => {
  if (!roles) {
    return [];
  }

  if (Array.isArray(roles)) {
    return roles;
  }

  if (typeof roles === 'string') {
    return roles.split(',').map((role) => role.trim()).filter(Boolean);
  }

  return [];
};

export const useAuthorization = () => {
  const { isAuthenticated, idTokenClaims, user, getIdTokenClaims } = useAuth0();
  const hasLoadedClaims = ref(false);

  watchEffect(async () => {
    if (isAuthenticated.value && !hasLoadedClaims.value) {
      try {
        await getIdTokenClaims();
      } catch (error) {
        console.error('Error al obtener los claims del ID token:', error);
      } finally {
        hasLoadedClaims.value = true;
      }
    }

    if (!isAuthenticated.value) {
      hasLoadedClaims.value = false;
    }
  });

  const userRoles = computed(() => {
    const claims = idTokenClaims.value || {};
    const claimRoles = claims[AUTH0_ROLES_CLAIM] ?? user.value?.[AUTH0_ROLES_CLAIM];

    return normalizeRoles(claimRoles);
  });

  const hasAllRoles = (requiredRoles = []) => {
    if (!requiredRoles.length) {
      return true;
    }

    const roles = userRoles.value;

    return requiredRoles.every((role) => roles.includes(role));
  };

  const hasAnyRole = (requiredRoles = []) => {
    if (!requiredRoles.length) {
      return true;
    }

    const roles = userRoles.value;

    return requiredRoles.some((role) => roles.includes(role));
  };

  return {
    isAuthenticated,
    userRoles,
    hasAllRoles,
    hasAnyRole
  };
};
