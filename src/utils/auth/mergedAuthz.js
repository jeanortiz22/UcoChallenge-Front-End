// src/utils/auth/mergedAuthz.js
import { extractUserRoles } from './roles';

const decodeJwt = (jwt) => {
  try {
    const payload = jwt.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
};

export const getAccessTokenPayload = async (auth0Client, audience) => {
  try {
    const token = await auth0Client.getAccessTokenSilently({
      authorizationParams: { audience }
    });
    return decodeJwt(token); // { permissions: [...], scope: "..." }
  } catch {
    return null;
  }
};

/**
 * Une roles del usuario, claims del ID Token y permissions del Access Token.
 * Devuelve un array de “roles” normalizados (compatibles con hasAnyRole/userHasRole).
 */
export const getMergedUserRoles = async (auth0Client, audience) => {
  const user = typeof auth0Client.getUser === 'function'
    ? await auth0Client.getUser()
    : (auth0Client.user?.value ?? auth0Client.user ?? null);

  let idTokenClaims = null;
  try { idTokenClaims = await auth0Client.getIdTokenClaims(); } catch {}

  const accessPayload = await getAccessTokenPayload(auth0Client, audience);
  const extra = accessPayload ? { permissions: accessPayload.permissions, scopes: accessPayload.scope } : null;

  return extractUserRoles(user, idTokenClaims, extra);
};
