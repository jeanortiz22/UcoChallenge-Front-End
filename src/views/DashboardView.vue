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
              <td>
                <span class="chip">{{ user.idTypeName }}</span>
              </td>
              <td>
                {{ user.idNumber || 'N/A' }}
              </td>
              <td class="name-cell">
                <p class="primary">{{ formatNames(user) }}</p>
              </td>
              <td>
                <p class="primary">{{ formatSurnames(user) }}</p>
              </td>
              <td>
                <p class="primary">{{ user.cityName }}</p>
                <p class="secondary" v-if="user.departmentName">{{ user.departmentName }}</p>
              </td>
              <td>
                <p class="primary">{{ user.email }}</p>
                <p class="secondary">
                  {{ user.emailConfirmed ? 'Verificado' : 'Pendiente' }}
                </p>
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
                  :disabled="user.emailConfirmed || user.confirmingEmail"
                >
                  <template v-if="user.confirmingEmail">Enviando…</template>
                  <template v-else>{{ user.emailConfirmed ? 'Email verificado' : 'Confirmar email' }}</template>
                </button>
                <button
                  @click="confirmPhone(user.id)"
                  class="btn-action phone"
                  title="Confirmar teléfono"
                  :disabled="!user.mobileNumber || user.mobileNumberConfirmed || user.confirmingMobile"
                >
                  <template v-if="!user.mobileNumber">Sin teléfono</template>
                  <template v-else-if="user.confirmingMobile">Enviando…</template>
                  <template v-else>{{ user.mobileNumberConfirmed ? 'Teléfono verificado' : 'Confirmar teléfono' }}</template>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pagination">
        <button @click="previousPage" :disabled="currentPage === 1" class="btn btn-ghost">
          ← Anterior
        </button>
        <div class="page-info">
          Página {{ currentPage }} de {{ totalPages }}
          <span class="range">({{ rangeStart }} - {{ rangeEnd }} de {{ users.length }})</span>
        </div>
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="btn btn-ghost"
        >
          Siguiente →
        </button>
      </footer>
    </section>

    <ConfirmationModal
      v-model="confirmationDialog.visible"
      :title="confirmationDialog.title"
      :description="confirmationDialog.description"
      :input-label="confirmationDialog.inputLabel"
      :input-placeholder="confirmationDialog.inputPlaceholder"
      :submit-label="confirmationDialog.submitLabel"
      :pending="confirmationDialog.submitting"
      :error="confirmationDialog.error"
      :code="confirmationDialog.code"
      @update:code="(value) => (confirmationDialog.code = value)"
      @submit="submitConfirmationCode"
      @cancel="handleDialogCancel"
    />

    <transition name="toast">
      <div v-if="toast.message" :class="['toast', toast.tone]">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';
import axiosInstance from '../http/axiosInstance';
import ConfirmationModal from '../components/ConfirmationModal.vue';

const router = useRouter();
const { logout: auth0Logout, getAccessTokenSilently, isAuthenticated, user } = useAuth0();

const defaultIdKeys = ['id', 'uuid', 'codigo', 'code', 'value', 'valor'];
const defaultLabelKeys = ['nombre', 'name', 'descripcion', 'description', 'detalle', 'label'];

// ✅ Detecta UUID v1–v5
const isLikelyId = (v) =>
  typeof v === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);

const getValueAtPath = (source, path) => {
  if (!path) return undefined;
  const segments = path.split('.');
  let current = source;
  for (const segment of segments) {
    if (current === undefined || current === null) return undefined;
    current = current?.[segment];
  }
  return current;
};

const toDisplayString = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
};

const resolveTextValue = (value) => {
  const direct = toDisplayString(value);
  if (direct !== null) return direct;

  if (value && typeof value === 'object') {
    for (const key of defaultLabelKeys) {
      const nested = value?.[key];
      const resolved = resolveTextValue(nested);
      if (resolved !== null) return resolved;
    }
  }

  return null;
};

const resolveIdValue = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  if (typeof value === 'object') {
    for (const key of defaultIdKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const nested = resolveIdValue(value[key]);
        if (nested) return nested;
      }
    }
  }

  return null;
};

const pickTextValue = (source, keys = []) => {
  for (const key of keys) {
    const candidate = key.includes('.') ? getValueAtPath(source, key) : source?.[key];
    const resolved = resolveTextValue(candidate);
    if (resolved !== null) return resolved;
  }
  return null;
};

const pickIdValue = (source, keys = []) => {
  for (const key of keys) {
    const candidate = key.includes('.') ? getValueAtPath(source, key) : source?.[key];
    const resolved = resolveIdValue(candidate);
    if (resolved) return resolved;
  }
  return null;
};

const unwrapCollection = (payload) => {
  const seen = new WeakSet();

  const visit = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    if (typeof value === 'object') {
      if (seen.has(value)) return [];
      seen.add(value);

      const candidateKeys = [
        'data', 'datos', 'content', 'results', 'result', 'items', 'item',
        'value', 'values', 'records', 'rows', 'collection', 'entries', 'lista', 'list',
        'usuarios', 'users'
      ];

      for (const key of candidateKeys) {
        const candidate = value?.[key];
        if (Array.isArray(candidate)) return candidate;
        if (candidate && typeof candidate === 'object') {
          const nested = visit(candidate);
          if (nested.length) return nested;
        }
      }

      for (const nestedValue of Object.values(value)) {
        const resolved = visit(nestedValue);
        if (resolved.length) return resolved;
      }
    }
    return [];
  };

  return visit(payload);
};

const normalizeCatalog = (payload, { labelKeys = [], idKeys = [] } = {}) => {
  const collection = unwrapCollection(payload) || [];
  return collection
    .map((entry) => {
      const id = pickIdValue(entry, [...idKeys, ...defaultIdKeys]);
      if (!id) return null;

      const label =
        pickTextValue(entry, [...labelKeys, ...defaultLabelKeys]) || id;

      return {
        id,
        label,
        raw: entry
      };
    })
    .filter(Boolean);
};

const pickValueForDepartment = (rawCity) => {
  if (!rawCity || typeof rawCity !== 'object') return null;

  const departmentId = pickIdValue(rawCity, ['departamentoId', 'departmentId', 'departamento.id', 'departamento']);
  if (!departmentId) return null;

  const departmentLabel =
    pickTextValue(rawCity, ['departamentoNombre', 'departmentName', 'departamento']) || departmentId;

  const departmentRaw = rawCity.departamento || rawCity.department || rawCity;

  return {
    id: departmentId,
    label: departmentLabel,
    raw: departmentRaw
  };
};

const deriveCityLabelFromUser = (user) =>
  pickTextValue(user?.raw ?? user, [
    'homeCityName',
    'ciudadResidenciaNombre',
    'ciudadResidencia',
    'cityName',
    'ciudadNombre',
    'ciudadDescripcion',
    'homeCity.nombre',
    'homeCity.name',
    'homeCity.descripcion',
    'homeCity.label',
    'ciudad',
    'city'
  ]);

const deriveDepartmentFromUser = (user) => {
  const rawSource = user?.raw ?? user;
  const departmentFromCity = pickValueForDepartment(rawSource?.homeCity || rawSource?.ciudadResidencia);
  if (departmentFromCity) return departmentFromCity;

  const departmentId =
    pickIdValue(rawSource, [
      'departmentId',
      'departamentoId',
      'departamento.id',
      'departamento',
      'homeCity.departamento',
      'homeCity.department'
    ]) || user?.departmentId || null;

  if (!departmentId) return null;

  const departmentLabel =
    pickTextValue(rawSource, [
      'homeDepartmentName',
      'departamentoResidencia',
      'departmentName',
      'departamento',
      'department',
      'homeCity.departmentName'
    ]) || user?.departmentName || departmentId;

  const departmentRaw =
    rawSource?.departamento ||
    rawSource?.department ||
    rawSource?.homeCity?.departamento ||
    rawSource?.homeCity?.department ||
    null;

  return {
    id: departmentId,
    label: departmentLabel,
    raw: departmentRaw
  };
};

const idTypeCatalog = new Map();
const cityCatalog = new Map();

const CITY_CATALOG_CONFIG = {
  labelKeys: ['name', 'nombre', 'descripcion', 'ciudad', 'ciudadNombre', 'city'],
  idKeys: ['id', 'uuid', 'codigo', 'code']
};


const ensureIdentificationTypesCatalog = async () => {
  if (idTypeCatalog.size) return idTypeCatalog;
  try {
    const response = await axiosInstance.get('/api/v1/catalogo/tipos-documento');
    const catalog = normalizeCatalog(response.data, {
      // Incluimos 'name' para payloads { id, name }
      labelKeys: ['name', 'nombre', 'descripcion', 'descripcionCorta', 'abreviatura', 'tipoDocumento'],
      idKeys: ['id', 'uuid', 'codigo', 'code']
    });
    catalog.forEach((item) => {
      idTypeCatalog.set(item.id, item);
    });
  } catch (error) {
    console.error('❌ Error al cargar catálogo de tipos de identificación en dashboard:', error);
  }
  return idTypeCatalog;
};

const ensureCitiesCatalog = async (cityIds, usersContext = []) => {
  let missingIds = cityIds.filter((id) => id && !cityCatalog.has(id));
  if (!missingIds.length) return cityCatalog;

  const registerEntries = (entries) => {
    entries.forEach((item) => {
      if (!item || cityCatalog.has(item.id)) return;
      const departmentData = pickValueForDepartment(item.raw);
      cityCatalog.set(item.id, {
        ...item,
        department: departmentData
      });
    });
  };

  const tryFetchCatalog = async (params) => {
    if (!params?.departamentoId) return;
    try {
      const response = await axiosInstance.get('/api/v1/catalogo/ciudades', { params });
      const catalog = normalizeCatalog(response.data, CITY_CATALOG_CONFIG);
      registerEntries(catalog);
    } catch (error) {
      throw error;
    }
  };

  // 1) Agrupar por departamento (si se puede inferir desde los usuarios)
  const groupedByDepartment = new Map();
  usersContext.forEach((user) => {
    if (!user || !missingIds.includes(user.cityId)) return;
    const departmentData = deriveDepartmentFromUser(user);
    const departmentId = departmentData?.id;
    if (!departmentId) return;
    if (!groupedByDepartment.has(departmentId)) {
      groupedByDepartment.set(departmentId, new Set());
    }
    groupedByDepartment.get(departmentId).add(user.cityId);
  });

  for (const [departmentId] of groupedByDepartment) {
    try {
      await tryFetchCatalog({ departamentoId: departmentId });
    } catch (deptError) {
      console.error(`❌ Error al cargar ciudades para el departamento ${departmentId}:`, deptError);
    }
  }

  // Recalcular faltantes
  missingIds = missingIds.filter((id) => id && !cityCatalog.has(id));
  if (!missingIds.length) return cityCatalog

  // Intentar cargar cada ciudad mediante el nuevo endpoint individual
  if (missingIds.length) {
    for (const cityId of [...missingIds]) {
      if (!cityId || cityCatalog.has(cityId)) continue;
      try {
        const response = await axiosInstance.get(`/api/v1/catalogo/ciudades/${cityId}`);
        const payloadCandidates = [response.data, response.data?.data, [response.data]];
        let registered = false;
        for (const candidate of payloadCandidates) {
          if (!candidate) continue;
          const entries = normalizeCatalog(candidate, CITY_CATALOG_CONFIG);
          if (entries.length) {
            registerEntries(entries);
            registered = true;
            break;
          }
        }

        if (!registered) {
          const rawCity = response.data?.data ?? response.data ?? null;
          const derivedId = pickIdValue(rawCity, CITY_CATALOG_CONFIG.idKeys) || cityId;
          if (derivedId) {
            const derivedLabel =
              pickTextValue(rawCity, CITY_CATALOG_CONFIG.labelKeys) || derivedId;
            cityCatalog.set(derivedId, {
              id: derivedId,
              label: derivedLabel,
              raw: rawCity,
              department: pickValueForDepartment(rawCity)
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ No se pudo cargar la ciudad ${cityId} de forma individual.`, error);
      }
    }

    missingIds = missingIds.filter((id) => id && !cityCatalog.has(id));
  }

  // 3) Fallback: aprovechar la información almacenada en el usuario crudo
  if (missingIds.length) {
    usersContext.forEach((user) => {
      if (!user || !missingIds.includes(user.cityId)) return;
      const label = deriveCityLabelFromUser(user);
      if (!label) return;
      const departmentData = deriveDepartmentFromUser(user);

      cityCatalog.set(user.cityId, {
        id: user.cityId,
        label,
        raw: user.raw?.homeCity || null,
        department: departmentData
      });
    });
  }

  return cityCatalog;
};


const populateCatalogData = async (userList) => {
  // ✅ Helpers para decidir si falta label
  const needsIdTypeLabel = (u) =>
    (!u.idTypeName || u.idTypeName === 'N/A' || u.idTypeName === u.idTypeId || isLikelyId(u.idTypeName));

  const needsCityLabel = (u) =>
    (!u.cityName || u.cityName === 'N/A' || u.cityName === u.cityId || isLikelyId(u.cityName));

  // === Tipos de identificación ===
  const missingIdTypeIds = [...new Set(
    userList
      .filter((u) => needsIdTypeLabel(u) && u.idTypeId)
      .map((u) => u.idTypeId)
  )];

  if (missingIdTypeIds.length) {
    await ensureIdentificationTypesCatalog();
    userList.forEach((user) => {
      if (needsIdTypeLabel(user) && user.idTypeId) {
        const catalogEntry = idTypeCatalog.get(user.idTypeId);
        if (catalogEntry?.label) {
          user.idTypeName = catalogEntry.label;
        }
      }
    });
  }

  // === Ciudades ===
  const missingCityIds = [...new Set(
    userList
      .filter((u) => needsCityLabel(u) && u.cityId)
      .map((u) => u.cityId)
  )];

  if (missingCityIds.length) {
    await ensureCitiesCatalog(missingCityIds, userList);
    userList.forEach((user) => {
      if (needsCityLabel(user) && user.cityId) {
        const cityEntry = cityCatalog.get(user.cityId);
        if (cityEntry?.label) {
          user.cityName = cityEntry.label;
        }
        const departmentEntry = cityEntry?.department ?? pickValueForDepartment(cityEntry?.raw);
        if (departmentEntry) {
          user.departmentId = user.departmentId || departmentEntry.id;
          if (!user.departmentName || user.departmentName === 'N/A') {
            user.departmentName = departmentEntry.label;
          }
        }
      }
    });
  }

  // === Fallbacks sin mostrar UUIDs ===
  userList.forEach((user) => {
    if (!user.idTypeName || user.idTypeName === 'N/A' || isLikelyId(user.idTypeName)) {
      user.idTypeName = '—';
    }

    if (needsCityLabel(user)) {
      const fallbackCity = deriveCityLabelFromUser(user);
      if (fallbackCity && !isLikelyId(fallbackCity)) {
        user.cityName = fallbackCity;
      }
    }

    if (!user.cityName || user.cityName === 'N/A' || isLikelyId(user.cityName)) {
      user.cityName = '—';
    }

    const departmentData = deriveDepartmentFromUser(user);
    if (departmentData?.id && !user.departmentId) {
      user.departmentId = departmentData.id;
    }

    if (!user.departmentName || user.departmentName === 'N/A') {
      if (departmentData?.label) {
        user.departmentName = departmentData.label;
      } else {
        user.departmentName = user.departmentId || null;
      }
    }
  });
};

const users = ref([]);
const isLoading = ref(false);
const apiError = ref(null);
const toast = reactive({ message: null, tone: 'info' });
let toastTimeout = null;
const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => Math.max(1, Math.ceil(users.value.length / itemsPerPage)));
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return users.value.slice(start, end);
});

const rangeStart = computed(() => {
  if (users.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage + 1;
});

const rangeEnd = computed(() => {
  const end = currentPage.value * itemsPerPage;
  return end > users.value.length ? users.value.length : end;
});

const totalUsers = computed(() => users.value.length);
const verifiedUsers = computed(() =>
  users.value.filter(user => user.emailConfirmed && user.mobileNumberConfirmed).length
);
const partialUsers = computed(() =>
  users.value.filter(user =>
    (user.emailConfirmed && !user.mobileNumberConfirmed) ||
    (!user.emailConfirmed && user.mobileNumberConfirmed)
  ).length
);
const pendingUsers = computed(() =>
  users.value.filter(user => !user.emailConfirmed && !user.mobileNumberConfirmed).length
);
const verifiedRate = computed(() => {
  if (totalUsers.value === 0) return 0;
  return Math.round((verifiedUsers.value / totalUsers.value) * 100);
});

const showToast = (message, tone = 'info') => {
  toast.message = message;
  toast.tone = tone;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  if (message) {
    toastTimeout = setTimeout(() => {
      toast.message = null;
      toastTimeout = null;
    }, 4000);
  }
};

const clearMessages = () => {
  apiError.value = null;
  showToast(null);
};

const logout = () => {
  auth0Logout({
    logoutParams: {
      returnTo: window.location.origin
    }
  });
};

const goToRegister = () => {
  router.push({ name: 'register' });
};

const formatNames = (user) => {
  return [user.firstName, user.secondName].filter(Boolean).join(' ') || 'N/A';
};

const formatSurnames = (user) => {
  return [user.firstSurname, user.secondSurname].filter(Boolean).join(' ') || 'N/A';
};

const confirmationDialog = reactive({
  visible: false,
  user: null,
  userId: null,
  channel: null,
  title: '',
  description: '',
  successMessageText: '',
  cancelMessage: '',
  inputLabel: 'Código de verificación',
  inputPlaceholder: 'Ingresa el código recibido',
  submitLabel: 'Confirmar código',
  code: '',
  error: null,
  submitting: false
});

const resetConfirmationDialog = () => {
  confirmationDialog.visible = false;
  confirmationDialog.user = null;
  confirmationDialog.userId = null;
  confirmationDialog.channel = null;
  confirmationDialog.title = '';
  confirmationDialog.description = '';
  confirmationDialog.successMessageText = '';
  confirmationDialog.cancelMessage = '';
  confirmationDialog.inputLabel = 'Código de verificación';
  confirmationDialog.inputPlaceholder = 'Ingresa el código recibido';
  confirmationDialog.submitLabel = 'Confirmar código';
  confirmationDialog.code = '';
  confirmationDialog.error = null;
  confirmationDialog.submitting = false;
};

const openConfirmationDialog = (user, channel, options = {}) => {
  resetConfirmationDialog();
  confirmationDialog.user = user || null;
  confirmationDialog.userId = user?.id ?? null;
  confirmationDialog.channel = channel;
  confirmationDialog.title =
    options.title || (channel === 'email' ? 'Confirmar correo electrónico' : 'Confirmar teléfono móvil');
  confirmationDialog.description = options.description || '';
  confirmationDialog.successMessageText =
    options.successMessageText || 'Canal verificado exitosamente';
  confirmationDialog.cancelMessage =
    options.cancelMessage || 'Se envió el código. Ingresa el token cuando estés listo.';
  confirmationDialog.inputLabel = options.inputLabel || 'Código de verificación';
  confirmationDialog.inputPlaceholder = options.inputPlaceholder || 'Ingresa el código recibido';
  confirmationDialog.submitLabel = options.submitLabel || 'Validar código';
  confirmationDialog.code = '';
  confirmationDialog.error = null;
  confirmationDialog.submitting = false;
  confirmationDialog.visible = true;
};

const closeConfirmationDialog = () => {
  resetConfirmationDialog();
};

const handleDialogCancel = () => {
  const cancelMessage = confirmationDialog.cancelMessage;
  closeConfirmationDialog();
  if (cancelMessage) {
    showToast(cancelMessage, 'info');
  }
};

const submitConfirmationCode = async () => {
  if (!confirmationDialog.visible || confirmationDialog.submitting) return;

  const sanitizedToken = confirmationDialog.code?.trim();
  if (!sanitizedToken) {
    confirmationDialog.error = 'Debes ingresar un código válido para confirmar.';
    return;
  }

  confirmationDialog.submitting = true;
  confirmationDialog.error = null;
  apiError.value = null;

  const { userId, channel } = confirmationDialog;
  const targetUser = confirmationDialog.user || users.value.find((item) => item.id === userId);

  try {
    await verifyConfirmationCode(userId, channel, sanitizedToken);
    if (targetUser) {
      if (channel === 'email') {
        targetUser.emailConfirmed = true;
      }
      if (channel === 'mobile') {
        targetUser.mobileNumberConfirmed = true;
      }
    }

    let message = confirmationDialog.successMessageText;
    if (targetUser?.emailConfirmed && targetUser?.mobileNumberConfirmed) {
      message = 'El usuario ahora tiene ambos canales verificados.';
    }

    closeConfirmationDialog();
    showToast(message, 'success');
  } catch (error) {
    console.error('❌ Error durante la confirmación:', error);
    if (error.response?.data?.error?.message) {
      confirmationDialog.error = error.response.data.error.message;
    } else if (error.response?.status === 400) {
      confirmationDialog.error = 'El código ingresado no es válido o ya expiró.';
    } else if (error.response?.status) {
      confirmationDialog.error = `Error ${error.response.status}. No se pudo validar el código.`;
    } else {
      confirmationDialog.error = 'No se pudo completar la confirmación. Intenta nuevamente.';
    }
  } finally {
    confirmationDialog.submitting = false;
  }
};

const normalizeUserData = (rawUser) => {
  const emailConfirmed = rawUser.emailConfirmed ?? rawUser.emailConfirmado ?? rawUser.email_confirmation ?? false;
  const mobileNumberConfirmed = rawUser.mobileNumberConfirmed ?? rawUser.telefonoMovilConfirmado ?? rawUser.mobile_number_confirmed ?? false;

  const idTypeId =
    pickIdValue(rawUser, [
      'idTypeId',
      'idType',
      'tipoIdentificacionId',
      'tipoIdentificacion'
    ]) || null;

  const cityId =
    pickIdValue(rawUser, [
      'homeCityId',
      'homeCity',
      'ciudadResidenciaId',
      'ciudadResidencia',
      'cityId',
      'homeCity.cityId',
      'ciudadId',
      'ciudad.id'
    ]) || null;

  const departmentId =
    pickIdValue(rawUser, [
      'departmentId',
      'department',
      'departamentoId',
      'departamento',
      'homeDepartmentId',
      'homeDepartment',
      'homeCity.departamento',
      'homeCity.department'
    ]) || null;

  const countryId =
    pickIdValue(rawUser, [
      'countryId',
      'country',
      'paisId',
      'pais',
      'homeCountryId',
      'homeCountry',
      'homeCity.departamento.pais',
      'homeCity.department.country'
    ]) || null;

  const idTypeName =
    pickTextValue(rawUser, [
      'idTypeName',
      'tipoIdentificacionNombre',
      'tipoDocumento',
      'tipoIdentificacion',
      'idType'
    ]) || 'N/A';

  const cityName =
    pickTextValue(rawUser, [
      'homeCityName',
      'ciudadResidenciaNombre',
      'ciudadResidencia',
      'cityName',
      'homeCity',
      'ciudad',
      'city',
      'homeCity.nombre',
      'homeCity.name',
      'homeCity.descripcion'
    ]) || 'N/A';

  const departmentName =
    pickTextValue(rawUser, [
      'homeDepartmentName',
      'departamentoResidencia',
      'departmentName',
      'homeCity.departamento',
      'homeCity.department',
      'departamento',
      'department',
      'homeCity.departmentName'
    ]) || null;

  const userId =
    pickIdValue(rawUser, [
      'id',
      'userId',
      'usuarioId',
      'idUsuario',
      'uuid',
      'codigo',
      'code',
      'identifier'
    ]) || rawUser.idNumber || rawUser.email || null;

  return {
    id: userId,
    idTypeId,
    idTypeName,
    idNumber: rawUser.idNumber ?? rawUser.numeroIdentificacion ?? null,
    firstName: rawUser.firstName ?? rawUser.primerNombre ?? null,
    secondName: rawUser.secondName ?? rawUser.segundoNombre ?? null,
    firstSurname: rawUser.firstSurname ?? rawUser.primerApellido ?? null,
    secondSurname: rawUser.secondSurname ?? rawUser.segundoApellido ?? null,
    cityId,
    cityName,
    departmentId,
    departmentName,
    countryId,
    email: rawUser.email ?? '—',
    mobileNumber: rawUser.mobileNumber ?? rawUser.telefonoMovil ?? null,
    emailConfirmed,
    mobileNumberConfirmed,
    confirmingEmail: false,
    confirmingMobile: false,
    raw: rawUser
  };
};

const fetchData = async () => {
  isLoading.value = true;
  apiError.value = null;
  showToast(null);

  try {
    const response = await axiosInstance.get('/api/v1/usuarios');
    const rawUsers = unwrapCollection(response.data) || [];
    users.value = rawUsers.map(normalizeUserData).filter((user) => !!user.id);
    await populateCatalogData(users.value);
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  } catch (error) {
    apiError.value = error.response
      ? `Error ${error.response.status}`
      : 'Error de conexión';
  } finally {
    isLoading.value = false;
  }
};

const markUserConfirmationState = (user, channel, value) => {
  if (!user) return;
  if (channel === 'email') {
    user.confirmingEmail = value;
  } else if (channel === 'mobile') {
    user.confirmingMobile = value;
  }
};

const requestConfirmationCode = async (userId, channel) => {
  return axiosInstance.post(`/api/v1/usuarios/${userId}/confirmaciones/${channel}`);
};

const verifyConfirmationCode = async (userId, channel, token) => {
  return axiosInstance.post(`/api/v1/usuarios/${userId}/confirmaciones/${channel}/verificacion`, {
    token
  });
};

const handleConfirmation = async (userId, channel, { promptMessage, successMessageText }) => {
  clearMessages();
  const user = users.value.find((item) => item.id === userId);
  if (!user) return;
  markUserConfirmationState(user, channel, true);
  try {
    await requestConfirmationCode(userId, channel);
    openConfirmationDialog(user, channel, {
      title: channel === 'email' ? 'Confirmar correo electrónico' : 'Confirmar teléfono móvil',
      description: promptMessage,
      successMessageText,
      inputLabel: channel === 'email' ? 'Código recibido por correo' : 'Código recibido por SMS',
      inputPlaceholder: 'Ej: 123456',
      submitLabel: 'Validar código'
    });
  } catch (error) {
    console.error('❌ Error durante la confirmación:', error);
    const messageFromServer = error.response?.data?.error?.message;
    let feedbackMessage = messageFromServer;

    if (!feedbackMessage) {
      if (error.response?.status) {
        feedbackMessage = `Error ${error.response.status}. No se pudo enviar el código de confirmación.`;
      } else {
        feedbackMessage = 'No se pudo enviar el código de confirmación. Intenta nuevamente.';
      }
    }
    showToast(feedbackMessage, 'error');  
  } finally {
    markUserConfirmationState(user, channel, false);
  }
};

const confirmEmail = async (userId) => {
  await handleConfirmation(userId, 'email', {
    promptMessage: 'Ingresa el código de verificación que recibiste por correo electrónico',
    successMessageText: 'Correo electrónico verificado exitosamente'
  });
};

const confirmPhone = async (userId) => {
  await handleConfirmation(userId, 'mobile', {
    promptMessage: 'Ingresa el código que recibiste por SMS',
    successMessageText: 'Teléfono móvil verificado exitosamente'
  });
};

const getStatusText = (user) => {
  if (user.emailConfirmed && user.mobileNumberConfirmed) {
    return '✓ Autenticado';
  }
  if (user.emailConfirmed || user.mobileNumberConfirmed) {
    return '⚠ Verificación parcial';
  }
  return '✗ Pendiente';
};

const getStatusClass = (user) => {
  if (user.emailConfirmed && user.mobileNumberConfirmed) {
    return 'status-badge authenticated';
  }
  if (user.emailConfirmed || user.mobileNumberConfirmed) {
    return 'status-badge partial';
  }
  return 'status-badge pending';
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

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

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(0.5px);
  opacity: 0.7;
}

.orb-one {
  width: 420px;
  height: 420px;
  top: -160px;
  right: -120px;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.18), transparent 70%);
}

.orb-two {
  width: 340px;
  height: 340px;
  bottom: -120px;
  left: -80px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.16), transparent 70%);
  animation: breathe 16s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.dashboard-hero {
  background: rgba(255, 255, 255, 0.88);
  border-radius: 24px;
  padding: 2.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 2.5rem;
  box-shadow: 0 30px 80px -40px rgba(15, 42, 90, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.eyebrow {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  color: #7c3aed;
  font-weight: 700;
  margin: 0;
}

.dashboard-hero h1 {
  margin: 0;
  font-size: clamp(2rem, 3.5vw, 2.6rem);
  color: #15294a;
  line-height: 1.2;
}

.dashboard-hero p {
  margin: 0;
  color: #4f5b72;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 0.5rem;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.4rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(120deg, #7c3aed, #4f46e5);
  color: #fff;
  box-shadow: 0 16px 36px -22px rgba(76, 29, 149, 0.65);
}

.btn-primary:hover {
  box-shadow: 0 20px 45px -20px rgba(79, 70, 229, 0.6);
}

.btn-ghost {
  background: rgba(79, 70, 229, 0.08);
  color: #4f46e5;
}

.btn-ghost:hover {
  background: rgba(79, 70, 229, 0.12);
}

.hero-summary {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.summary-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  padding: 1.5rem;
  border: 1px solid rgba(21, 41, 74, 0.08);
  box-shadow: 0 15px 40px -30px rgba(15, 42, 90, 0.4);
}

.summary-label {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #6b7b95;
  letter-spacing: 0.12em;
}

.summary-value {
  margin: 0.35rem 0 0;
  font-size: 2.1rem;
  font-weight: 700;
  color: #15294a;
}

.summary-value.positive {
  color: #059669;
}

.summary-value.warning {
  color: #d97706;
}

.summary-foot {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: #6b7b95;
}

.state-card {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20px;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  border: 1px solid rgba(21, 41, 74, 0.08);
  box-shadow: 0 20px 60px -40px rgba(15, 42, 90, 0.4);
  backdrop-filter: blur(8px);
  text-align: center;
  flex-direction: column;
}

.state-card.error {
  color: #b91c1c;
}

.state-card.empty h2 {
  margin: 0;
  color: #15294a;
}

.state-card.empty p {
  margin: 0 0 1rem;
  color: #4f5b72;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 3px solid rgba(79, 70, 229, 0.2);
  border-top-color: #4f46e5;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.data-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 26px;
  border: 1px solid rgba(21, 41, 74, 0.08);
  box-shadow: 0 24px 60px -38px rgba(15, 42, 90, 0.35);
  overflow: hidden;
}

.data-header {
  padding: 2rem 2.2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
}

.data-header h2 {
  margin: 0;
  color: #15294a;
  font-size: 1.5rem;
}

.data-header p {
  margin: 0.35rem 0 0;
  color: #6b7b95;
}

.table-wrapper {
  overflow-x: auto;
}

.table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  min-width: 960px;
}

th {
  text-align: left;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #7c8ba7;
  padding: 0 2.2rem 1rem;
}

td {
  padding: 1.25rem 2.2rem;
  border-top: 1px solid rgba(21, 41, 74, 0.06);
  color: #2f3e57;
  vertical-align: top;
}

.name-cell .primary {
  margin: 0;
  font-weight: 600;
  color: #15294a;
}

.primary {
  margin: 0;
  font-weight: 500;
}

.secondary {
  margin: 0.2rem 0 0;
  color: #6b7b95;
  font-size: 0.9rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  margin-right: 0.45rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}

.status-badge.authenticated {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.status-badge.partial {
  background: rgba(234, 179, 8, 0.14);
  color: #92400e;
}

.status-badge.pending {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.btn-action {
  border: none;
  border-radius: 0.75rem;
  padding: 0.55rem 0.95rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  text-align: left;
}

.btn-action:hover {
  transform: translateY(-1px);
}

.btn-action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.btn-action:disabled:hover {
  background: inherit;
  transform: none;
}

.btn-action.email {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.btn-action.email:hover {
  background: rgba(59, 130, 246, 0.18);
}

.btn-action.phone {
  background: rgba(244, 114, 182, 0.12);
  color: #be185d;
}

.btn-action.phone:hover {
  background: rgba(244, 114, 182, 0.18);
}

.pagination {
  padding: 1.5rem 2.2rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: rgba(248, 250, 252, 0.6);
}

.page-info {
  font-size: 0.95rem;
  color: #4f5b72;
}

.range {
  color: #7c8ba7;
  font-size: 0.85rem;
  margin-left: 0.4rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.4rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  color: #0f172a;
  box-shadow: 0 18px 38px -22px rgba(15, 23, 42, 0.35);
  z-index: 20;
  font-weight: 600;
}

.toast.success {
  background: rgba(16, 185, 129, 0.95);
  color: #ecfdf5;
  box-shadow: 0 18px 38px -22px rgba(16, 185, 129, 0.55);
}

.toast.info {
  background: rgba(79, 70, 229, 0.95);
  color: #ede9fe;
  box-shadow: 0 18px 38px -22px rgba(79, 70, 229, 0.45);
}

.toast.error {
  background: rgba(239, 68, 68, 0.95);
  color: #fee2e2;
  box-shadow: 0 18px 38px -22px rgba(239, 68, 68, 0.45);
}

@media (max-width: 1024px) {
  .dashboard-hero {
    grid-template-columns: 1fr;
  }

  .hero-summary {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    display: grid;
  }
}

@media (max-width: 720px) {
  .dashboard-shell {
    padding: 2.5rem 1.2rem 3rem;
  }

  .data-header {
    padding: 1.6rem 1.5rem 1.2rem;
  }

  th, td {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .pagination {
    padding: 1.4rem 1.5rem 1.6rem;
  }
}

@media (max-width: 600px) {
  .table-wrapper table {
    min-width: 720px;
  }

  .dashboard-hero {
    padding: 2rem;
  }
}
</style>