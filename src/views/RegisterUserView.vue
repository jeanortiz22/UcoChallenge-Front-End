<template>
  <div class="dashboard-shell">
    <div class="background-visuals" aria-hidden="true">
      <div class="orb orb-one"></div>
      <div class="orb orb-two"></div>
    </div>

    <header class="dashboard-hero">
      <div class="hero-copy">
        <p class="eyebrow">Panel de control</p>
        <h1>Gestiona y verifica a tus delegados con claridad</h1>
        <p>
          Visualiza el estado de autenticación de cada usuario, confirma canales
          pendientes y mantén tu organización sincronizada en tiempo real.
        </p>
        <div class="hero-actions">
          <button @click="goToRegister" class="btn btn-primary">
            + Registrar nuevo usuario
          </button>
          <button @click="logout" class="btn btn-ghost">
            Cerrar sesión
          </button>
        </div>
      </div>
      <div class="hero-summary">
        <div class="summary-card">
          <p class="summary-label">Usuarios totales</p>
          <p class="summary-value">{{ totalUsers }}</p>
        </div>
        <div class="summary-card">
          <p class="summary-label">Autenticados</p>
          <p class="summary-value positive">{{ verifiedUsers }}</p>
          <span class="summary-foot">{{ verifiedRate }}% del total</span>
        </div>
        <div class="summary-card">
          <p class="summary-label">Pendientes</p>
          <p class="summary-value warning">{{ pendingUsers }}</p>
          <span class="summary-foot">{{ partialUsers }} con avances</span>
        </div>
      </div>
    </header>

    <section v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>Cargando usuarios…</p>
    </section>

    <section v-else-if="apiError" class="state-card error">
      <div>
        <h2>Hubo un problema al conectar</h2>
        <p>{{ apiError }}</p>
      </div>
      <button @click="fetchData" class="btn btn-primary">Reintentar</button>
    </section>

    <section v-else-if="users.length === 0" class="state-card empty">
      <h2>Aún no tienes usuarios registrados</h2>
      <p>Comienza registrando a tu primer delegado en la plataforma.</p>
      <button @click="goToRegister" class="btn btn-primary">
        Registrar primer usuario
      </button>
    </section>

    <section v-else class="data-section">
      <div class="data-header">
        <div>
          <h2>Usuarios registrados</h2>
          <p>Visualiza rápidamente el estado de autenticación de cada persona.</p>
        </div>
        <button @click="fetchData" class="btn btn-ghost">Actualizar</button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tipo de identificación</th>
              <th>Número</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Ciudad</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id">
              <td><span class="chip">{{ user.idTypeName }}</span></td>
              <td>{{ user.idNumber || 'N/A' }}</td>
              <td class="name-cell"><p class="primary">{{ formatNames(user) }}</p></td>
              <td><p class="primary">{{ formatSurnames(user) }}</p></td>
              <td>
                <p class="primary">{{ user.cityName }}</p>
                <p class="secondary" v-if="user.departmentName">{{ user.departmentName }}</p>
              </td>
              <td>
                <p class="primary">{{ user.email }}</p>
                <p class="secondary">{{ user.emailConfirmed ? 'Verificado' : 'Pendiente' }}</p>
              </td>
              <td>
                <p class="primary">{{ user.mobileNumber || 'N/A' }}</p>
                <p class="secondary">
                  {{ user.mobileNumber ? (user.mobileNumberConfirmed ? 'Verificado' : 'Pendiente') : 'Sin teléfono' }}
                </p>
              </td>
              <td>
                <span :class="getStatusClass(user)">{{ getStatusText(user) }}</span>
              </td>
              <td class="actions">
                <button
                  @click="confirmEmail(user.id)"
                  class="btn-action email"
                  title="Confirmar email"
                  :disabled="user.emailConfirmed"
                >
                  {{ user.emailConfirmed ? 'Email verificado' : 'Confirmar email' }}
                </button>
                <button
                  @click="confirmPhone(user.id)"
                  class="btn-action phone"
                  title="Confirmar teléfono"
                  :disabled="!user.mobileNumber || user.mobileNumberConfirmed"
                >
                  <template v-if="!user.mobileNumber">Sin teléfono</template>
                  <template v-else>{{ user.mobileNumberConfirmed ? 'Teléfono verificado' : 'Confirmar teléfono' }}</template>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pagination">
        <button @click="previousPage" :disabled="currentPage === 1" class="btn btn-ghost">← Anterior</button>
        <div class="page-info">
          Página {{ currentPage }} de {{ totalPages }}
          <span class="range">({{ rangeStart }} - {{ rangeEnd }} de {{ users.length }})</span>
        </div>
        <button @click="nextPage" :disabled="currentPage === totalPages" class="btn btn-ghost">Siguiente →</button>
      </footer>
    </section>

    <transition name="toast">
      <div v-if="successMessage" class="toast">
        {{ successMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';
import axiosInstance from '../http/axiosInstance';

const router = useRouter();
const { logout: auth0Logout, getAccessTokenSilently, isAuthenticated, user } = useAuth0();

/* ==================== Utils compartidos (idénticos al registro) ==================== */
const unwrapCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const candidateKeys = ['data', 'content', 'results', 'items', 'value', 'values'];
    for (const key of candidateKeys) {
      if (Array.isArray(payload?.[key])) return payload[key];
    }
  }
  return [];
};

const toDisplayString = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const pickFirstAvailable = (item, keys = []) => {
  for (const key of keys) {
    const label = toDisplayString(item?.[key]);
    if (label) return label;
  }
  return '';
};

const pickIdValue = (item, keys = []) => {
  const defaultKeys = ['id', 'uuid', 'codigo', 'code', 'value', 'valor'];
  for (const key of [...keys, ...defaultKeys]) {
    const raw = item?.[key];
    if (raw !== undefined && raw !== null && raw !== '') return String(raw);
  }
  return undefined;
};

const normalizeCatalog = (payload, { labelKeys = [], idKeys = [] } = {}) => {
  const collection = unwrapCollection(payload);
  return collection
    .map((entry) => {
      const id = pickIdValue(entry, idKeys);
      if (!id) return null;
      const label = pickFirstAvailable(entry, [
        ...labelKeys,
        'nombre','name','descripcion','description','detalle','label'
      ]) || id;
      return { id, label, raw: entry };
    })
    .filter(Boolean);
};

// Detecta UUID v1–v5
const isLikelyId = (v) =>
  typeof v === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);

/* ==================== Catálogos en memoria ==================== */
const idTypeCatalog = new Map();
const cityCatalog = new Map();

/* ==================== Carga catálogos ==================== */
const ensureIdentificationTypesCatalog = async () => {
  if (idTypeCatalog.size) return idTypeCatalog;
  try {
    const response = await axiosInstance.get('/api/v1/catalogo/tipos-documento');
    const catalog = normalizeCatalog(response.data, {
      labelKeys: ['name','nombre','descripcion','descripcionCorta','abreviatura','tipoDocumento'],
      idKeys: ['id','uuid','codigo','code']
    });
    catalog.forEach((item) => idTypeCatalog.set(item.id, item));
  } catch (error) {
    console.error('❌ Error catálogo tipos identificación:', error);
  }
  return idTypeCatalog;
};

const pickValueForDepartment = (rawCity) => {
  if (!rawCity || typeof rawCity !== 'object') return null;

  const departmentId = pickIdValue(rawCity, [
    'departamentoId','departmentId','departamento.id','departamento',
    'department.id','department'
  ]);
  if (!departmentId) return null;

  const departmentLabel = pickFirstAvailable(rawCity, [
    'departamentoNombre','departmentName','departamento',
    'department.nombre','department.name','department'
  ]) || departmentId;

  const departmentRaw = rawCity.departamento || rawCity.department || rawCity;
  return { id: departmentId, label: departmentLabel, raw: departmentRaw };
};

const ensureCitiesCatalog = async (cityIds, usersContext = []) => {
  const missingIds = cityIds.filter((id) => id && !cityCatalog.has(id));
  if (!missingIds.length) return cityCatalog;

  const registerEntries = (entries) => {
    entries.forEach((item) => {
      if (!item || cityCatalog.has(item.id)) return;
      const departmentData = pickValueForDepartment(item.raw);
      cityCatalog.set(item.id, { ...item, department: departmentData });
    });
  };

  const labelKeysCity = [
    'name','nombre','descripcion','ciudad','ciudadNombre','city',
    'nombreCiudad','nombre_ciudad','cityName','nombreOficial','nombre_oficial'
  ];
  const idKeysCity = ['id','uuid','codigo','code','ciudadId','cityId'];

  // 1) Intento por batch ?ids=
  try {
    const response = await axiosInstance.get('/api/v1/catalogo/ciudades', {
      params: { ids: missingIds.join(',') }
    });
    const catalog = normalizeCatalog(response.data, { labelKeys: labelKeysCity, idKeys: idKeysCity });
    if (catalog.length) registerEntries(catalog);
  } catch (error) {
    console.warn('⚠️ Batch ciudades por ids falló (ok si no existe):', error);
  }

  // 2) Por departamento (plan principal como en registro)
  const groupedByDepartment = new Map();
  usersContext.forEach((u) => {
    if (!u.departmentId) return;
    if (!missingIds.includes(u.cityId)) return;
    if (!groupedByDepartment.has(u.departmentId)) {
      groupedByDepartment.set(u.departmentId, new Set());
    }
    groupedByDepartment.get(u.departmentId).add(u.cityId);
  });

  for (const [departmentId] of groupedByDepartment) {
    try {
      const response = await axiosInstance.get('/api/v1/catalogo/ciudades', {
        params: { departamentoId: departmentId }
      });
      const catalog = normalizeCatalog(response.data, { labelKeys: labelKeysCity, idKeys: idKeysCity });
      if (catalog.length) registerEntries(catalog);
    } catch (deptError) {
      console.error(`❌ Ciudades por departamento ${departmentId} falló:`, deptError);
    }
  }

  // 3) Fallback: detalle por id
  const stillMissing = missingIds.filter((id) => !cityCatalog.has(id));
  for (const id of stillMissing) {
    try {
      const detail = await axiosInstance.get(`/api/v1/catalogo/ciudades/${id}`);
      const payload = Array.isArray(detail.data) ? detail.data : [detail.data];
      const catalog = normalizeCatalog(payload, { labelKeys: labelKeysCity, idKeys: idKeysCity });
      registerEntries(catalog);
    } catch (oneErr) {
      console.warn(`⚠️ No pude cargar la ciudad ${id} por detalle:`, oneErr);
    }
  }

  return cityCatalog;
};

/* ==================== Estado y derivadas ==================== */
const users = ref([]);
const isLoading = ref(false);
const apiError = ref(null);
const successMessage = ref(null);
const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => Math.max(1, Math.ceil(users.value.length / itemsPerPage)));
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return users.value.slice(start, end);
});

const rangeStart = computed(() => users.value.length === 0 ? 0 : (currentPage.value - 1) * itemsPerPage + 1);
const rangeEnd = computed(() => Math.min(currentPage.value * itemsPerPage, users.value.length));

const totalUsers = computed(() => users.value.length);
const verifiedUsers = computed(() =>
  users.value.filter(u => u.emailConfirmed && u.mobileNumberConfirmed).length
);
const partialUsers = computed(() =>
  users.value.filter(u =>
    (u.emailConfirmed && !u.mobileNumberConfirmed) ||
    (!u.emailConfirmed && u.mobileNumberConfirmed)
  ).length
);
const pendingUsers = computed(() =>
  users.value.filter(u => !u.emailConfirmed && !u.mobileNumberConfirmed).length
);
const verifiedRate = computed(() => totalUsers.value === 0 ? 0 : Math.round((verifiedUsers.value / totalUsers.value) * 100));

/* ==================== Navegación y helpers UI ==================== */
const logout = () => {
  auth0Logout({ logoutParams: { returnTo: window.location.origin } });
};
const goToRegister = () => router.push({ name: 'register' });
const formatNames = (u) => [u.firstName, u.secondName].filter(Boolean).join(' ') || 'N/A';
const formatSurnames = (u) => [u.firstSurname, u.secondSurname].filter(Boolean).join(' ') || 'N/A';

const getStatusText = (u) => {
  if (u.emailConfirmed && u.mobileNumberConfirmed) return '✓ Autenticado';
  if (u.emailConfirmed || u.mobileNumberConfirmed) return '⚠ Verificación parcial';
  return '✗ Pendiente';
};
const getStatusClass = (u) => {
  if (u.emailConfirmed && u.mobileNumberConfirmed) return 'status-badge authenticated';
  if (u.emailConfirmed || u.mobileNumberConfirmed) return 'status-badge partial';
  return 'status-badge pending';
};
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const previousPage = () => { if (currentPage.value > 1) currentPage.value--; };

/* ==================== Normalización de usuarios ==================== */
const pickTextValue = (source, keys = []) => {
  for (const key of keys) {
    const segs = key.split('.');
    let cur = source;
    for (const s of segs) { if (cur == null) break; cur = cur?.[s]; }
    const val = toDisplayString(cur);
    if (val) return val;
  }
  return null;
};

const resolveIdValue = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') return pickIdValue(value);
  return null;
};

const pickIdFromPaths = (source, paths = []) => {
  for (const path of paths) {
    const segs = path.split('.');
    let cur = source;
    for (const s of segs) { if (cur == null) break; cur = cur?.[s]; }
    const val = resolveIdValue(cur);
    if (val) return val;
  }
  return null;
};

const normalizeUserData = (raw) => {
  const emailConfirmed = raw.emailConfirmed ?? raw.emailConfirmado ?? raw.email_confirmation ?? false;
  const mobileNumberConfirmed = raw.mobileNumberConfirmed ?? raw.telefonoMovilConfirmado ?? raw.mobile_number_confirmed ?? false;

  const idTypeId = pickIdFromPaths(raw, ['idTypeId','idType','tipoIdentificacionId','tipoIdentificacion']) || null;
  const cityId = pickIdFromPaths(raw, [
    'homeCityId','homeCity','ciudadResidenciaId','ciudadResidencia','cityId','homeCity.cityId'
  ]) || null;
  const departmentId = pickIdFromPaths(raw, [
    'departmentId','department','departamentoId','departamento','homeDepartmentId','homeDepartment',
    'homeCity.departamento','homeCity.department'
  ]) || null;
  const countryId = pickIdFromPaths(raw, [
    'countryId','country','paisId','pais','homeCountryId','homeCountry',
    'homeCity.departamento.pais','homeCity.department.country'
  ]) || null;

  const idTypeName = pickTextValue(raw, [
    'idTypeName','tipoIdentificacionNombre','tipoDocumento','tipoIdentificacion','idType'
  ]) || 'N/A';

  const cityName = pickTextValue(raw, [
    'homeCityName','ciudadResidenciaNombre','ciudadResidencia','cityName','homeCity'
  ]) || 'N/A';

  const departmentName = pickTextValue(raw, [
    'homeDepartmentName','departamentoResidencia','departmentName','homeCity.departamento','homeCity.department'
  ]) || null;

  return {
    id: raw.id,
    idTypeId, idTypeName,
    idNumber: raw.idNumber ?? raw.numeroIdentificacion ?? null,
    firstName: raw.firstName ?? raw.primerNombre ?? null,
    secondName: raw.secondName ?? raw.segundoNombre ?? null,
    firstSurname: raw.firstSurname ?? raw.primerApellido ?? null,
    secondSurname: raw.secondSurname ?? raw.segundoApellido ?? null,
    cityId, cityName,
    departmentId, departmentName,
    countryId,
    email: raw.email ?? '—',
    mobileNumber: raw.mobileNumber ?? raw.telefonoMovil ?? null,
    emailConfirmed, mobileNumberConfirmed
  };
};

/* ==================== Carga y enriquecimiento ==================== */
const populateCatalogData = async (list) => {
  const needsIdTypeLabel = (u) =>
    (!u.idTypeName || u.idTypeName === 'N/A' || u.idTypeName === u.idTypeId || isLikelyId(u.idTypeName));
  const needsCityLabel = (u) =>
    (!u.cityName || u.cityName === 'N/A' || u.cityName === u.cityId || isLikelyId(u.cityName));

  // Tipos de identificación
  const missingIdTypeIds = [...new Set(list.filter(u => needsIdTypeLabel(u) && u.idTypeId).map(u => u.idTypeId))];
  if (missingIdTypeIds.length) {
    await ensureIdentificationTypesCatalog();
    list.forEach((u) => {
      if (needsIdTypeLabel(u) && u.idTypeId) {
        const entry = idTypeCatalog.get(u.idTypeId);
        if (entry?.label) u.idTypeName = entry.label;
      }
    });
  }

  // Ciudades
  const missingCityIds = [...new Set(list.filter(u => needsCityLabel(u) && u.cityId).map(u => u.cityId))];
  if (missingCityIds.length) {
    await ensureCitiesCatalog(missingCityIds, list);
    list.forEach((u) => {
      if (needsCityLabel(u) && u.cityId) {
        const entry = cityCatalog.get(u.cityId);
        if (entry?.label) u.cityName = entry.label;
        const dept = entry?.department ?? pickValueForDepartment(entry?.raw);
        if (dept) {
          u.departmentId = u.departmentId || dept.id;
          if (!u.departmentName || u.departmentName === 'N/A') u.departmentName = dept.label;
        }
      }
    });
  }

  // Fallbacks visuales (no mostrar UUIDs)
  list.forEach((u) => {
    if (!u.idTypeName || u.idTypeName === 'N/A' || isLikelyId(u.idTypeName)) u.idTypeName = '—';
    if (!u.cityName || u.cityName === 'N/A' || isLikelyId(u.cityName)) u.cityName = '—';
    if (!u.departmentName || u.departmentName === 'N/A') u.departmentName = u.departmentId || null;
  });
};

const fetchData = async () => {
  isLoading.value = true;
  apiError.value = null;
  successMessage.value = null;

  try {
    const response = await axiosInstance.get('/api/v1/usuarios');
    const rawUsers = Array.isArray(response.data) ? response.data : [];
    users.value = rawUsers.map(normalizeUserData);
    await populateCatalogData(users.value);
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
  } catch (error) {
    apiError.value = error.response ? `Error ${error.response.status}` : 'Error de conexión';
  } finally {
    isLoading.value = false;
  }
};

/* ==================== Acciones ==================== */
const confirmEmail = async (userId) => {
  try {
    await axiosInstance.patch(`/api/v1/usuarios/${userId}/confirm-email`);
    successMessage.value = 'Email confirmado exitosamente';
    const u = users.value.find(x => x.id === userId);
    if (u) u.emailConfirmed = true;
    setTimeout(() => successMessage.value = null, 3000);
  } catch {
    apiError.value = 'Error al confirmar email';
  }
};

const confirmPhone = async (userId) => {
  try {
    await axiosInstance.patch(`/api/v1/usuarios/${userId}/confirm-phone`);
    successMessage.value = 'Teléfono confirmado exitosamente';
    const u = users.value.find(x => x.id === userId);
    if (u) u.mobileNumberConfirmed = true;
    setTimeout(() => successMessage.value = null, 3000);
  } catch {
    apiError.value = 'Error al confirmar teléfono';
  }
};

/* ==================== Montaje ==================== */
onMounted(async () => {
  try {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
    });
    console.log('🔐 Access Token:', token);
    console.log('👤 User:', user.value);
    console.log('✅ isAuthenticated:', isAuthenticated.value);
    await fetchData();
  } catch (error) {
    console.error('Error obteniendo token en dashboard:', error);
  }
});
</script>

<style scoped>
.dashboard-shell {
  position: relative;
  padding: 3rem 1.5rem 4rem;
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.background-visuals {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: radial-gradient(circle at top right, rgba(79, 70, 229, 0.08), transparent 55%),
    radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.06), transparent 50%);
}
.orb { position: absolute; border-radius: 50%; filter: blur(0.5px); opacity: 0.7; }
.orb-one { width: 420px; height: 420px; top: -160px; right: -120px; background: radial-gradient(circle, rgba(79, 70, 229, 0.18), transparent 70%); }
.orb-two { width: 340px; height: 340px; bottom: -120px; left: -80px; background: radial-gradient(circle, rgba(16, 185, 129, 0.16), transparent 70%); animation: breathe 16s ease-in-out infinite; }
@keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
.dashboard-hero { background: rgba(255, 255, 255, 0.88); border-radius: 24px; padding: 2.5rem; display: grid; grid-template-columns: minmax(0,1.35fr) minmax(0,1fr); gap: 2.5rem; box-shadow: 0 30px 80px -40px rgba(15,42,90,0.35); border: 1px solid rgba(255,255,255,0.55); backdrop-filter: blur(12px); }
.hero-copy { display: flex; flex-direction: column; gap: 1rem; }
.eyebrow { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.24em; color: #7c3aed; font-weight: 700; margin: 0; }
.dashboard-hero h1 { margin: 0; font-size: clamp(2rem, 3.5vw, 2.6rem); color: #15294a; line-height: 1.2; }
.dashboard-hero p { margin: 0; color: #4f5b72; line-height: 1.6; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 0.85rem; margin-top: 0.5rem; }
.btn { border: none; border-radius: 999px; padding: 0.75rem 1.4rem; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
.btn:hover { transform: translateY(-1px); }
.btn-primary { background: linear-gradient(120deg, #7c3aed, #4f46e5); color: #fff; box-shadow: 0 16px 36px -22px rgba(76, 29, 149, 0.65); }
.btn-primary:hover { box-shadow: 0 20px 45px -20px rgba(79, 70, 229, 0.6); }
.btn-ghost { background: rgba(79,70,229,0.08); color: #4f46e5; }
.btn-ghost:hover { background: rgba(79,70,229,0.12); }
.hero-summary { display: grid; gap: 1rem; align-content: start; }
.summary-card { background: rgba(255,255,255,0.9); border-radius: 18px; padding: 1.5rem; border: 1px solid rgba(21,41,74,0.08); box-shadow: 0 15px 40px -30px rgba(15,42,90,0.4); }
.summary-label { margin: 0; font-size: 0.85rem; text-transform: uppercase; color: #6b7b95; letter-spacing: 0.12em; }
.summary-value { margin: 0.35rem 0 0; font-size: 2.1rem; font-weight: 700; color: #15294a; }
.summary-value.positive { color: #059669; }
.summary-value.warning { color: #d97706; }
.summary-foot { display: block; margin-top: 0.35rem; font-size: 0.85rem; color: #6b7b95; }
.state-card { background: rgba(255,255,255,0.85); border-radius: 20px; padding: 2rem; display: flex; align-items: center; justify-content: center; gap: 1rem; border: 1px solid rgba(21,41,74,0.08); box-shadow: 0 20px 60px -40px rgba(15,42,90,0.4); backdrop-filter: blur(8px); text-align: center; flex-direction: column; }
.state-card.error { color: #b91c1c; }
.state-card.empty h2 { margin: 0; color: #15294a; }
.state-card.empty p { margin: 0 0 1rem; color: #4f5b72; }
.spinner { width: 2rem; height: 2rem; border-radius: 50%; border: 3px solid rgba(79,70,229,0.2); border-top-color: #4f46e5; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.data-section { background: rgba(255,255,255,0.9); border-radius: 26px; border: 1px solid rgba(21,41,74,0.08); box-shadow: 0 24px 60px -38px rgba(15,42,90,0.35); overflow: hidden; }
.data-header { padding: 2rem 2.2rem 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; }
.data-header h2 { margin: 0; color: #15294a; font-size: 1.5rem; }
.data-header p { margin: 0.35rem 0 0; color: #6b7b95; }
.table-wrapper { overflow-x: auto; }
.table-wrapper table { width: 100%; border-collapse: collapse; min-width: 960px; }
th { text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.12em; color: #7c8ba7; padding: 0 2.2rem 1rem; }
td { padding: 1.25rem 2.2rem; border-top: 1px solid rgba(21,41,74,0.06); color: #2f3e57; vertical-align: top; }
.name-cell .primary { margin: 0; font-weight: 600; color: #15294a; }
.primary { margin: 0; font-weight: 500; }
.secondary { margin: 0.2rem 0 0; color: #6b7b95; font-size: 0.9rem; }
.chip { display: inline-flex; align-items: center; border-radius: 999px; background: rgba(79,70,229,0.1); color: #4f46e5; padding: 0.2rem 0.6rem; font-size: 0.8rem; margin-right: 0.45rem; }
.status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.75rem; border-radius: 999px; font-weight: 600; font-size: 0.85rem; }
.status-badge.authenticated { background: rgba(16,185,129,0.12); color: #047857; }
.status-badge.partial { background: rgba(234,179,8,0.14); color: #92400e; }
.status-badge.pending { background: rgba(239,68,68,0.12); color: #b91c1c; }
.actions { display: flex; flex-direction: column; gap: 0.45rem; }
.btn-action { border: none; border-radius: 0.75rem; padding: 0.55rem 0.95rem; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: background 0.2s ease, transform 0.2s ease; text-align: left; }
.btn-action:hover { transform: translateY(-1px); }
.btn-action:disabled { cursor: not-allowed; opacity: 0.6; transform: none; }
.btn-action:disabled:hover { background: inherit; transform: none; }
.btn-action.email { background: rgba(59,130,246,0.12); color: #1d4ed8; }
.btn-action.email:hover { background: rgba(59,130,246,0.18); }
.btn-action.phone { background: rgba(244,114,182,0.12); color: #be185d; }
.btn-action.phone:hover { background: rgba(244,114,182,0.18); }
.pagination { padding: 1.5rem 2.2rem 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; background: rgba(248,250,252,0.6); }
.page-info { font-size: 0.95rem; color: #4f5b72; }
.range { color: #7c8ba7; font-size: 0.85rem; margin-left: 0.4rem; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }
.toast { position: fixed; top: 20px; right: 20px; background: rgba(16,185,129,0.95); color: #ecfdf5; padding: 1rem 1.4rem; border-radius: 16px; box-shadow: 0 18px 38px -22px rgba(16,185,129,0.55); z-index: 20; font-weight: 600; }
@media (max-width: 1024px) {
  .dashboard-hero { grid-template-columns: 1fr; }
  .hero-summary { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); display: grid; }
}
@media (max-width: 720px) {
  .dashboard-shell { padding: 2.5rem 1.2rem 3rem; }
  .data-header { padding: 1.6rem 1.5rem 1.2rem; }
  th, td { padding-left: 1.5rem; padding-right: 1.5rem; }
  .pagination { padding: 1.4rem 1.5rem 1.6rem; }
}
@media (max-width: 600px) {
  .table-wrapper table { min-width: 720px; }
  .dashboard-hero { padding: 2rem; }
}
</style>
