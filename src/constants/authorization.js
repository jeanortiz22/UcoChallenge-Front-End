const sanitizeRoles = (roles = []) =>
  Array.from(
    new Set(
      roles
        .filter((role) => typeof role === 'string')
        .map((role) => role.trim())
        .filter(Boolean)
    )
  );

export const toRolesArray = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return sanitizeRoles(value);
  }

  if (typeof value === 'string') {
    return sanitizeRoles(value.split(','));
  }

  if (value && typeof value === 'object') {
    try {
      return sanitizeRoles(Array.from(value));
    } catch (error) {
      console.warn('No se pudieron normalizar los roles del claim recibido:', error);
    }
  }

  return sanitizeRoles(fallback);
};

export const AUTH0_ROLES_CLAIM =
  import.meta.env.VITE_AUTH0_ROLES_CLAIM || 'https://example.com/roles';

export const DASHBOARD_REQUIRED_ROLES = Object.freeze(
  toRolesArray(import.meta.env.VITE_AUTH0_DASHBOARD_ROLES, ['admin'])
);
