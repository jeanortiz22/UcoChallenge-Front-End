const parseRoles = (value, fallback = []) => {
  if (!value) {
    return [...fallback];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);
  }

  return [...fallback];
};

export const AUTH0_ROLES_CLAIM = import.meta.env.VITE_AUTH0_ROLES_CLAIM || 'https://example.com/roles';

export const DASHBOARD_REQUIRED_ROLES = parseRoles(
  import.meta.env.VITE_AUTH0_DASHBOARD_ROLES,
  ['admin']
);
