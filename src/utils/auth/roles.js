// src/utils/auth/roles.js
const FALLBACK_NAMESPACE = 'https://api.ucochallenge.com';

const toLowerCaseUnique = (values = []) =>
  Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : null))
        .filter((value) => value && value.length)
    )
  );

// Alias raíz de administración
const adminRootAliases = ['admin', 'superadmin', 'admin:all', 'admin:*', 'all:admin'];

// Alias tipo "manage:*"
const managementAliases = [
  'manage:users',
  'users:manage',
  'manage:user',
  'user:manage',
];

// ------- Aliases equivalentes --------
const createAliases = toLowerCaseUnique([
  ...adminRootAliases,
  ...managementAliases,
  'create:users','users:create','create:user','user:create',
  'write:users','users:write','write:user','user:write',
  'create:delegates','delegates:create','create:delegate','delegate:create',
  // Español
  'usuarios:crear','crear:usuarios'
]);

const readAliases = toLowerCaseUnique([
  ...adminRootAliases,
  ...managementAliases,
  'read:users','users:read','read:user','user:read',
  'view:users','users:view','view:user','user:view',
  'read:delegates','delegates:read','read:delegate','delegate:read',
  'view:delegates','delegates:view','view:delegate','delegate:view',
  'read:delegados','delegados:read','view:delegados','delegados:view',
  'consultar:usuarios','usuarios:consultar',
  // Español
  'usuarios:leer','leer:usuarios'
]);

export const roleAliases = {
  'admin:create': createAliases,
  'admin:read': readAliases
};

// Claves anidadas que inspeccionamos
const nestedClaimKeys = [
  'roles',
  'permissions',
  'permission',
  'scopes',
  'scope',
  'values',
  'value',
  'items',
  'entries'
];

// Namespace para custom claims
export const resolveAuthNamespace = () =>
  (import.meta.env.VITE_AUTH0_NAMESPACE || import.meta.env.VITE_AUTH0_AUDIENCE || FALLBACK_NAMESPACE).replace(/\/$/, '');

// Utilidad para acceder por path "a.b.c"
const getValueAtPath = (source, path) => {
  if (!source || !path) return undefined;
  const segments = path.split('.');
  let current = source;
  for (const segment of segments) {
    if (current === null || typeof current === 'undefined') return undefined;
    current = current?.[segment];
  }
  return current;
};

// Recolector genérico (arrays, objetos, strings)
const collectClaimValues = (value, into, depth = 0) => {
  if (!value || depth > 5) return;

  if (Array.isArray(value)) {
    for (const entry of value) collectClaimValues(entry, into, depth + 1);
    return;
  }

  if (typeof value === 'object') {
    for (const key of nestedClaimKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        collectClaimValues(value[key], into, depth + 1);
      }
    }
    if (typeof value.name === 'string') {
      const trimmed = value.name.trim();
      if (trimmed) into.add(trimmed);
    }
    if (typeof value.id === 'string') {
      const trimmed = value.id.trim();
      if (trimmed) into.add(trimmed);
    }
    return;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean);
    for (const part of parts) into.add(part);
  }
};

const normalizeSources = (sources) => {
  const normalized = [];
  for (const source of sources) {
    if (!source) continue;
    if (Array.isArray(source)) {
      normalized.push(...source.filter(Boolean));
      continue;
    }
    normalized.push(source);
  }
  return normalized;
};

// Ignorar scopes OAuth comunes
const IGNORED = new Set(['openid', 'profile', 'email', 'offline_access']);

// Normalizador con filtro de ignorados
const normalizeRoleName = (role) => {
  const v = typeof role === 'string' ? role.trim().toLowerCase() : '';
  return IGNORED.has(v) ? '' : v;
};

export const extractUserRoles = (...rawSources) => {
  const sources = normalizeSources(rawSources);
  if (!sources.length) return [];

  const namespace = resolveAuthNamespace();

  const claimPaths = Array.from(
    new Set([
      `${namespace}/roles`,
      `${namespace}/permissions`,
      `${namespace}/user_authorization`,
      `${namespace}/user_authorization.roles`,
      `${namespace}/user_authorization.permissions`,
      `${namespace}/authorization.roles`,
      `${namespace}/authorization.permissions`,
      'roles',
      'permissions',
      'user_authorization',
      'user_authorization.roles',
      'user_authorization.permissions',
      'app_metadata.roles',
      'app_metadata.permissions',
      'app_metadata.authorization.roles',
      'app_metadata.authorization.permissions'
    ])
  );

  const collected = new Set();
  for (const source of sources) {
    for (const path of claimPaths) {
      const value = getValueAtPath(source, path);
      collectClaimValues(value, collected);
    }
  }

  return Array.from(collected).map(normalizeRoleName).filter(Boolean);
};

export const userHasRole = (userRoles, requiredRole) => {
  const normalizedRoles = new Set(userRoles.map(normalizeRoleName).filter(Boolean));
  const normalizedRequired = normalizeRoleName(requiredRole);
  if (!normalizedRequired) return false;

  if (normalizedRoles.has(normalizedRequired)) return true;

  const aliases = roleAliases[normalizedRequired] || roleAliases[requiredRole] || [];
  return aliases.some((alias) => normalizedRoles.has(normalizeRoleName(alias)));
};

export const hasAnyRole = (userRoles, candidates = []) => {
  if (!candidates.length) return false;
  const roleSet = new Set(userRoles.map(normalizeRoleName).filter(Boolean));

  return candidates.some((role) => {
    const normalizedRole = normalizeRoleName(role);
    if (roleSet.has(normalizedRole)) return true;

    const aliases = roleAliases[normalizedRole] || roleAliases[role] || [];
    return aliases.some((alias) => roleSet.has(normalizeRoleName(alias)));
  });
};
