import { getAuth0Client } from '../http/axiosInstance';

const baseNamespace = (import.meta.env.VITE_AUTH0_NAMESPACE || import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.ucochallenge.com').replace(/\/$/, '');
const rolesClaimKey = `${baseNamespace}/roles`;

const waitForCondition = (predicate, { timeout = 10000, interval = 50 } = {}) =>
  new Promise((resolve) => {
    const start = Date.now();

    const check = () => {
      if (predicate()) {
        resolve(true);
        return;
      }

      if (Date.now() - start >= timeout) {
        resolve(false);
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });

const waitForAuth0Client = async () => {
  let client = getAuth0Client();
  if (client) return client;

  await waitForCondition(() => {
    client = getAuth0Client();
    return Boolean(client);
  });

  return client;
};

const waitForAuthInitialization = async (auth0Client) => {
  const isLoadingRef = auth0Client?.isLoading;

  if (!isLoadingRef) return;

  const resolveValue = () =>
    typeof isLoadingRef === 'boolean'
      ? isLoadingRef
      : typeof isLoadingRef?.value !== 'undefined'
        ? isLoadingRef.value
        : isLoadingRef;

  if (!resolveValue()) return;

  await waitForCondition(() => !resolveValue());
};

const getRolesFromUser = (user) => {
  if (!user) return [];

  const claim = user[rolesClaimKey];
  if (Array.isArray(claim)) return claim;
  if (typeof claim === 'string' && claim.trim().length) return [claim.trim()];
  return [];
};

export const roleGuard = (requiredRoles = []) => async (to, from, next) => {
  if (!requiredRoles.length) {
    next();
    return;
  }

  try {
    const auth0Client = await waitForAuth0Client();

    if (!auth0Client) {
      console.warn('No se pudo obtener la instancia de Auth0 para validar roles.');
      next({ path: '/' });
      return;
    }

    await waitForAuthInitialization(auth0Client);

    const rawIsAuthenticated = auth0Client.isAuthenticated;
    const isAuthenticated = typeof rawIsAuthenticated === 'function'
      ? await rawIsAuthenticated.call(auth0Client)
      : rawIsAuthenticated?.value ?? rawIsAuthenticated ?? false;

    if (!isAuthenticated) {
      next({ path: '/' });
      return;
    }

    let currentUser = null;

    if (typeof auth0Client.getUser === 'function') {
      currentUser = await auth0Client.getUser();
    }

    if (!currentUser) {
      const userRef = auth0Client.user;
      currentUser = userRef?.value ?? userRef ?? null;
    }

    const userRoles = getRolesFromUser(currentUser);
    const missingRole = requiredRoles.find((role) => !userRoles.includes(role));

    if (missingRole) {
      console.warn(`El usuario autenticado no cuenta con el rol requerido: ${missingRole}`);
      next({ path: '/' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error evaluando roles de usuario en roleGuard:', error);
    next({ path: '/' });
  }
};

export default roleGuard;