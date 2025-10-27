import { computed, ref, watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { AUTH0_ROLES_CLAIM, toRolesArray } from '../constants/authorization';

export const useAuthorization = () => {
  const { isAuthenticated, idTokenClaims, user, getIdTokenClaims } = useAuth0();

  const hasLoadedClaims = ref(false);
  const isLoadingClaims = ref(false);
  const lastError = ref(null);
  const claimsCache = ref();

  const loadClaims = async () => {
    if (isLoadingClaims.value || hasLoadedClaims.value || !isAuthenticated.value) {
      return;
    }

    isLoadingClaims.value = true;
    lastError.value = null;

    try {
      const claims = await getIdTokenClaims();

      if (claims) {
        claimsCache.value = claims;
      }

      hasLoadedClaims.value = true;
    } catch (error) {
      hasLoadedClaims.value = false;
      lastError.value = error;
      console.error('Error al obtener los claims del ID token:', error);
    } finally {
      isLoadingClaims.value = false;
    }
  };

  watch(
    () => isAuthenticated.value,
    (authenticated) => {
      if (authenticated) {
        hasLoadedClaims.value = false;
        claimsCache.value = undefined;
        loadClaims();
      } else {
        hasLoadedClaims.value = false;
        claimsCache.value = undefined;
        lastError.value = null;
      }
    },
    { immediate: true },
  );

  watch(
    () => user.value?.sub,
    () => {
      if (isAuthenticated.value) {
        hasLoadedClaims.value = false;
        claimsCache.value = undefined;
        loadClaims();
      }
    },
  );

  const userRoles = computed(() => {
    const claims = idTokenClaims.value ?? claimsCache.value ?? {};
    const claimRoles = claims[AUTH0_ROLES_CLAIM] ?? user.value?.[AUTH0_ROLES_CLAIM];

    return toRolesArray(claimRoles);
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
    hasAnyRole,
    loadClaims,
    isLoadingClaims,
    lastError,
  };
};
