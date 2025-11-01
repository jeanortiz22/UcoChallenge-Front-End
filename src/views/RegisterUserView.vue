<template>
  <div class="register-page">
    <div class="ambient-light ambient-light--primary"></div>
    <div class="ambient-light ambient-light--secondary"></div>

    <section class="register-layout">
      <aside class="register-hero">
        <h1>Impulsa el talento con una experiencia memorable</h1>
        <p>
          Gestiona el registro de nuevos usuarios con un flujo claro, envolvente y
          pensado para crear confianza desde el primer clic.
        </p>

        <ul class="hero-highlights">
          <li>
            <span class="icon">⚡</span>
            Validaciones en tiempo real sobre la información clave.
          </li>
          <li>
            <span class="icon">🌍</span>
            Catálogos dinámicos conectados con la base de datos oficial.
          </li>
          <li>
            <span class="icon">🛡️</span>
            Seguridad reforzada con autenticación y trazabilidad.
          </li>
        </ul>
      </aside>

      <div class="register-container">
        <div class="header">
          <div>
            <p class="badge">Nuevo ingreso</p>
            <h2>Registrar Nuevo Usuario</h2>
            <p class="subheading">
              Completa los datos del participante para activar su cuenta en la
              plataforma.
            </p>
          </div>
          <button @click="goBack" class="btn-back">← Volver al Panel de control</button>
        </div>

        <form @submit.prevent="handleSubmit" class="register-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Primer Nombre *</label>
              <input
                id="firstName"
                v-model="formData.firstName"
                type="text"
                :maxlength="NAME_MAX_LENGTH"
                required
                placeholder="Juan"
                @keydown="onNameKeydown"
                @paste.prevent="handleNamePaste('firstName', $event)"
                @input="handleNameInput('firstName')"
                @blur="handleNameBlur('firstName')"
              />
            </div>

            <div class="form-group">
              <label for="secondName">Segundo Nombre</label>
              <input
                id="secondName"
                v-model="formData.secondName"
                type="text"
                placeholder="Carlos"
                :maxlength="NAME_MAX_LENGTH"
                @keydown="onNameKeydown"
                @paste.prevent="handleNamePaste('secondName', $event)"
                @input="handleNameInput('secondName')"
                @blur="handleNameBlur('secondName')"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="firstSurname">Primer Apellido *</label>
              <input
                id="firstSurname"
                v-model="formData.firstSurname"
                type="text"
                :maxlength="NAME_MAX_LENGTH"
                required
                placeholder="Pérez"
                @keydown="onNameKeydown"
                @paste.prevent="handleNamePaste('firstSurname', $event)"
                @input="handleNameInput('firstSurname')"
                @blur="handleNameBlur('firstSurname')"
              />
            </div>

            <div class="form-group">
              <label for="secondSurname">Segundo Apellido</label>
              <input
                id="secondSurname"
                v-model="formData.secondSurname"
                type="text"
                placeholder="Naranjo"
                :maxlength="NAME_MAX_LENGTH"
                @keydown="onNameKeydown"
                @paste.prevent="handleNamePaste('secondSurname', $event)"
                @input="handleNameInput('secondSurname')"
                @blur="handleNameBlur('secondSurname')"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="idType">Tipo de Identificación *</label>
              <select
                id="idType"
                v-model="formData.idType"
                required
              >
                <option value="">Seleccione...</option>
                <option
                  v-for="tipo in tiposIdentificacion"
                  :key="tipo.id"
                  :value="tipo.id"
                >
                  {{ tipo.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="idNumber">Número de Identificación *</label>
                <input
                  id="idNumber"
                  v-model="formData.idNumber"
                  type="text"
                  required
                  placeholder="1234567890"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  :maxlength="IDNUMBER_MAX_LENGTH"
                  @keydown="onIdKeydown"
                  @paste.prevent="handleIdPaste"
                  @input="handleIdInput"
                  @blur="handleIdBlur"
              />
            </div>

          </div>
          <div class="form-row location-row">
            <div class="form-group">
              <label for="country">País de Residencia *</label>
              <select
                id="country"
                v-model="formData.country"
                required
                @change="loadDepartments(formData.country)"
              >
                <option value="">Seleccione...</option>
                <option
                  v-for="pais in paises"
                  :key="pais.id"
                  :value="pais.id"
                >
                  {{ pais.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="department">Departamento/Estado *</label>
              <select
                id="department"
                v-model="formData.department"
                required
                :disabled="!formData.country"
                @change="loadCities(formData.department)"
              >
                <option value="">Seleccione...</option>
                <option
                  v-for="dep in departamentos"
                  :key="dep.id"
                  :value="dep.id"
                >
                  {{ dep.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="homeCity">Ciudad de Residencia *</label>
              <select
                id="homeCity"
                v-model="formData.homeCity"
                required
                :disabled="!formData.department"
              >
                <option value="">Seleccione...</option>
                <option
                  v-for="ciudad in ciudades"
                  :key="ciudad.id"
                  :value="ciudad.id"
                >
                  {{ ciudad.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email">Correo Electrónico *</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                :maxlength="EMAIL_MAX_LENGTH"
                required
                placeholder="usuario@ucochallenge.com"
                @input="handleEmailInput"
                @blur="handleEmailBlur"
              />
            </div>

            <div class="form-group">
              <label for="mobileNumber">Teléfono Móvil *</label>
              <input
                id="mobileNumber"
                v-model="formData.mobileNumber"
                type="tel"
                placeholder="3001234567"
                required
                inputmode="numeric"
                pattern="[0-9]*"
                :maxlength="PHONE_MAX_LENGTH"
                @keydown="onPhoneKeydown"
                @paste.prevent="handlePhonePaste($event)"
                @input="handlePhoneInput"
                @blur="handlePhoneBlur"
              />
            </div>
          </div>



          <div class="form-actions">
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Registrando...' : 'Registrar Usuario' }}
            </button>
            <button type="button" @click="resetForm" class="btn-reset">
              Limpiar Formulario
            </button>
          </div>

          <div v-if="successMessage" class="message success">
            {{ successMessage }}
          </div>

          <div v-if="errorMessage" class="message error">
            {{ errorMessage }}
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from '../http/axiosInstance'; 

const router = useRouter();

// Form data matching RegisterUserDomain + new location fields
const formData = ref({
  idType: '',
  idNumber: '',
  firstName: '',
  secondName: '',
  firstSurname: '',
  secondSurname: '',
  country: '',
  department: '',
  homeCity: '',
  email: '',
  mobileNumber: ''
});

const NAME_MAX_LENGTH = 20;
const EMAIL_MAX_LENGTH = 255;
const PHONE_MAX_LENGTH = 20;
const IDNUMBER_MAX_LENGTH = 25; 
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeName = (value = '') => {
  if (!value) return '';

  let sanitized = value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ');
  sanitized = sanitized.trim();

  if (!sanitized) return '';

  return sanitized.slice(0, NAME_MAX_LENGTH);
};

const sanitizeEmail = (value = '') => {
  if (!value) return '';

  let sanitized = value.replace(/\s+/g, '');
  if (sanitized.length > EMAIL_MAX_LENGTH) {
    sanitized = sanitized.slice(0, EMAIL_MAX_LENGTH);
  }

  return sanitized;
};

// ── ID NUMBER: solo dígitos y máx 25 ──────────────────────────────────────────
const sanitizeIdNumber = (value = '') => {
  if (!value) return '';
  let sanitized = value.replace(/\D/g, '');
  if (sanitized.length > IDNUMBER_MAX_LENGTH) {
    sanitized = sanitized.slice(0, IDNUMBER_MAX_LENGTH);
  }
  return sanitized;
};

const onIdKeydown = (event) => {
  const { key, target } = event;

  if (CONTROL_KEYS.has(key) || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (/^\d$/.test(key)) {
    if (!target || typeof target.value !== 'string') {
      event.preventDefault();
      return;
    }
    const input = target;
    const currentLength = input.value.length;
    const selStart = input.selectionStart ?? currentLength;
    const selEnd   = input.selectionEnd ?? currentLength;
    const selLen   = selEnd - selStart;

    if (currentLength - selLen >= IDNUMBER_MAX_LENGTH) {
      event.preventDefault();
    }
    return;
  }

  // Bloquea todo lo que no sea dígito
  event.preventDefault();
};

const handleIdInput = () => {
  formData.value.idNumber = sanitizeIdNumber(formData.value.idNumber);
};

const handleIdBlur = () => {
  formData.value.idNumber = sanitizeIdNumber(formData.value.idNumber);
};

const handleIdPaste = (event) => {
  const pasted = event.clipboardData?.getData('text') ?? '';
  const target = event.target;

  if (!target || typeof target.value !== 'string') {
    formData.value.idNumber = sanitizeIdNumber(formData.value.idNumber);
    return;
  }

  const { selectionStart = 0, selectionEnd = selectionStart, value } = target;
  const combined = value.slice(0, selectionStart) + pasted + value.slice(selectionEnd);

  formData.value.idNumber = sanitizeIdNumber(combined);
};


const sanitizePhone = (value = '') => {
  if (!value) return '';

  let sanitized = value.replace(/\D/g, '');
  if (sanitized.length > PHONE_MAX_LENGTH) {
    sanitized = sanitized.slice(0, PHONE_MAX_LENGTH);
  }

  return sanitized;
};

const CONTROL_KEYS = new Set([
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'Tab',
  'Enter',
  'Escape'
]);

const isLetterKey = (key = '') => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(key);

const onNameKeydown = (event) => {
  const { key, target } = event;

  if (CONTROL_KEYS.has(key) || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (key === ' ') {
    if (!target || typeof target.value !== 'string') {
      event.preventDefault();
      return;
    }

    const input = target;
    const value = input.value;
    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const selectionCollapsed = selectionStart === selectionEnd;
    const cursorAtStart = selectionStart === 0;
    const cursorAtEnd = selectionEnd === value.length;

    if (cursorAtStart || (selectionCollapsed && cursorAtEnd)) {
      event.preventDefault();
      return;
    }

    const previousChar = selectionCollapsed ? value.charAt(selectionStart - 1) : '';
    if (previousChar === ' ') {
      event.preventDefault();
    }
    return;
  }

  if (!isLetterKey(key)) {
    event.preventDefault();
  }
};

const handleNameInput = (field) => {
  formData.value[field] = sanitizeName(formData.value[field]);
};

const handleNameBlur = (field) => {
  formData.value[field] = sanitizeName(formData.value[field]);
};

const handleNamePaste = (field, event) => {
  const pasted = event.clipboardData?.getData('text') ?? '';
  const target = event.target;

  if (!target || typeof target.value !== 'string') {
    formData.value[field] = sanitizeName(formData.value[field]);
    return;
  }

  const { selectionStart = 0, selectionEnd = selectionStart, value } = target;
  const combined = value.slice(0, selectionStart) + pasted + value.slice(selectionEnd);

  formData.value[field] = sanitizeName(combined);
};

const handleEmailInput = () => {
  formData.value.email = sanitizeEmail(formData.value.email);
};

const handleEmailBlur = () => {
  formData.value.email = sanitizeEmail(formData.value.email);
};

const onPhoneKeydown = (event) => {
  const { key, target } = event;

  if (CONTROL_KEYS.has(key) || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (/^\d$/.test(key)) {
    if (!target || typeof target.value !== 'string') {
      event.preventDefault();
      return;
    }

    const input = target;
    const currentLength = input.value.length;
    const selectionStart = input.selectionStart ?? currentLength;
    const selectionEnd = input.selectionEnd ?? currentLength;
    const selectionLength = selectionEnd - selectionStart;

    if (currentLength - selectionLength >= PHONE_MAX_LENGTH) {
      event.preventDefault();
    }
    return;
  }

  event.preventDefault();
};

const handlePhoneInput = () => {
  formData.value.mobileNumber = sanitizePhone(formData.value.mobileNumber);
};

const handlePhoneBlur = () => {
  formData.value.mobileNumber = sanitizePhone(formData.value.mobileNumber);
};

const handlePhonePaste = (event) => {
  const pasted = event.clipboardData?.getData('text') ?? '';
  const target = event.target;

  if (!target || typeof target.value !== 'string') {
    formData.value.mobileNumber = sanitizePhone(formData.value.mobileNumber);
    return;
  }

  const { selectionStart = 0, selectionEnd = selectionStart, value } = target;
  const combined = value.slice(0, selectionStart) + pasted + value.slice(selectionEnd);

  formData.value.mobileNumber = sanitizePhone(combined);
};

const isValidEmail = (value = '') => EMAIL_REGEX.test(value);


// Catálogos
const tiposIdentificacion = ref([]);
const paises = ref([]);
const departamentos = ref([]);
const ciudades = ref([]);

const unwrapCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const candidateKeys = ['data', 'content', 'results', 'items', 'value', 'values'];
    for (const key of candidateKeys) {
      if (Array.isArray(payload[key])) {
        return payload[key];
      }
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
    if (label) {
      return label;
    }
  }
  return '';
};

const pickIdValue = (item, keys = []) => {
  const defaultKeys = ['id', 'uuid', 'codigo', 'code', 'value', 'valor'];
  for (const key of [...keys, ...defaultKeys]) {
    const raw = item?.[key];
    if (raw !== undefined && raw !== null && raw !== '') {
      return String(raw);
    }
  }
  return undefined;
};

const normalizeCatalog = (payload, { labelKeys = [], idKeys = [] } = {}) => {
  const collection = unwrapCollection(payload);
  return collection
    .map((entry) => {
      const id = pickIdValue(entry, idKeys);
      if (!id) return null;

      const label =
        pickFirstAvailable(entry, [...labelKeys, 'nombre', 'name', 'descripcion', 'description', 'detalle', 'label']) || id;

      return {
        id,
        label,
        raw: entry
      };
    })
    .filter(Boolean);
};

// Estados
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const goBack = () => {
  router.push({ name: 'dashboard' });
};

// Cargar tipos de identificaciOn
const loadIdentificationTypes = async () => {
  try {
    const response = await axiosInstance.get('/api/v1/catalogo/tipos-documento');
    const catalog = normalizeCatalog(response.data, {
      labelKeys: ['nombre', 'descripcion', 'descripcionCorta', 'abreviatura', 'tipoDocumento'],
      idKeys: ['id', 'uuid', 'codigo', 'code']
    });
    tiposIdentificacion.value = catalog;
    if (errorMessage.value.startsWith('No se pudieron cargar los tipos de identificación')) {
      errorMessage.value = '';
    }
    if (!catalog.length) {
      console.warn('⚠️ Catálogo de tipos de identificación vacío o con formato desconocido:', response.data);
    }
  } catch (error) {
    console.error('❌ Error al cargar tipos de identificación:', error);
    tiposIdentificacion.value = [];
    errorMessage.value = 'No se pudieron cargar los tipos de identificación. Intenta nuevamente.';
  }
};

// Cargar países
const loadCountries = async () => {
  try {
    const response = await axiosInstance.get('/api/v1/catalogo/paises');
    const catalog = normalizeCatalog(response.data, {
      labelKeys: ['nombre', 'descripcion', 'name', 'pais'],
      idKeys: ['id', 'uuid', 'codigo', 'code']
    });
    paises.value = catalog;
    if (errorMessage.value.startsWith('No se pudieron cargar los países')) {
      errorMessage.value = '';
    }
    if (!catalog.length) {
      console.warn('⚠️ Catálogo de países vacío o con formato desconocido:', response.data);
    }
  } catch (error) {
    console.error('❌ Error al cargar países:', error);
    paises.value = [];
    errorMessage.value = 'No se pudieron cargar los países. Intenta nuevamente.';
  }
};

// Cargar departamentos
const loadDepartments = async (countryId) => {
  // Limpiar selecciones dependientes
  departamentos.value = [];
  formData.value.department = '';
  ciudades.value = [];
  formData.value.homeCity = '';
  
  if (!countryId) return;

  try {
    const response = await axiosInstance.get('/api/v1/catalogo/departamentos', { params: { paisId: countryId }});
    const catalog = normalizeCatalog(response.data, {
      labelKeys: ['nombre', 'descripcion', 'name', 'departamento'],
      idKeys: ['id', 'uuid', 'codigo', 'code']
    });
    departamentos.value = catalog;
    if (errorMessage.value.startsWith('No se pudieron cargar los departamentos')) {
      errorMessage.value = '';
    }
    if (!catalog.length) {
      console.warn('⚠️ Catálogo de departamentos vacío o con formato desconocido:', response.data);
    }
  } catch (error) {
    console.error('❌ Error al cargar departamentos:', error);
    departamentos.value = [];
    errorMessage.value = 'No se pudieron cargar los departamentos. Intenta nuevamente.';
  }
};

// Cargar ciudades (depende del departamento)
const loadCities = async (departmentId) => {
  // Limpiar selección dependiente
  ciudades.value = [];
  formData.value.homeCity = '';

  if (!departmentId) return;

  try {
    const response = await axiosInstance.get('/api/v1/catalogo/ciudades', { params: { departamentoId: departmentId }});
    const catalog = normalizeCatalog(response.data, {
      labelKeys: ['nombre', 'descripcion', 'name', 'ciudad'],
      idKeys: ['id', 'uuid', 'codigo', 'code']
    });
    ciudades.value = catalog;
    if (errorMessage.value.startsWith('No se pudieron cargar las ciudades')) {
      errorMessage.value = '';
    }
    if (!catalog.length) {
      console.warn('⚠️ Catálogo de ciudades vacío o con formato desconocido:', response.data);
    }
  } catch (error) {
    console.error('❌ Error al cargar ciudades:', error);
    ciudades.value = [];
    errorMessage.value = 'No se pudieron cargar las ciudades. Intenta nuevamente.';
  }
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {

    const sanitizedFirstName = sanitizeName(formData.value.firstName);
    const sanitizedSecondName = sanitizeName(formData.value.secondName);
    const sanitizedFirstSurname = sanitizeName(formData.value.firstSurname);
    const sanitizedSecondSurname = sanitizeName(formData.value.secondSurname);
    const sanitizedEmail = sanitizeEmail(formData.value.email);
    const sanitizedMobileNumber = sanitizePhone(formData.value.mobileNumber);

    if (!sanitizedFirstName) {
      errorMessage.value = 'El primer nombre es obligatorio y solo debe contener letras (máximo 20 caracteres).';
      isSubmitting.value = false;
      formData.value.firstName = '';
      return;
    }

    if (!sanitizedFirstSurname) {
      errorMessage.value = 'El primer apellido es obligatorio y solo debe contener letras (máximo 20 caracteres).';
      isSubmitting.value = false;
      formData.value.firstSurname = '';
      return;
    }

    if (!sanitizedEmail || !isValidEmail(sanitizedEmail)) {
      errorMessage.value = 'Ingresa un correo electrónico válido (máximo 255 caracteres).';
      isSubmitting.value = false;
      formData.value.email = sanitizedEmail;
      return;
    }

    if (!sanitizedMobileNumber) {
      errorMessage.value = 'El teléfono móvil es obligatorio y solo debe contener números (máximo 20 dígitos).';
      isSubmitting.value = false;
      formData.value.mobileNumber = sanitizedMobileNumber;
      return;
    }

    formData.value.firstName = sanitizedFirstName;
    formData.value.secondName = sanitizedSecondName;
    formData.value.firstSurname = sanitizedFirstSurname;
    formData.value.secondSurname = sanitizedSecondSurname;
    formData.value.email = sanitizedEmail;
    formData.value.mobileNumber = sanitizedMobileNumber;

    // Se envían los identificadores seleccionados para compatibilidad con las versiones vieja y nueva del API.
    const payload = {
      idType: formData.value.idType,
      idNumber: formData.value.idNumber,
      firstName: sanitizedFirstName,
      secondName: sanitizedSecondName,
      firstSurname: sanitizedFirstSurname,
      secondSurname: sanitizedSecondSurname,
      country: formData.value.country || null, // compatibilidad legado
      countryId: formData.value.country || null,
      department: formData.value.department || null, // compatibilidad legado
      departmentId: formData.value.department || null,
      homeCity: formData.value.homeCity, // UUID de la ciudad (legado)
      homeCityId: formData.value.homeCity,
      cityId: formData.value.homeCity,
      email: sanitizedEmail,
      mobileNumber: sanitizedMobileNumber
    };

    console.log(' Enviando payload:', payload);
    
    const response = await axiosInstance.post('/api/v1/usuarios', payload);
    
    successMessage.value = '✅ Usuario registrado exitosamente';
    
    // Redirigir al dashboard después de 2 segundos
    setTimeout(() => {
      router.push({ name: 'dashboard' });
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 400) {
        errorMessage.value = `Datos inválidos: ${data.message || 'Verifica los campos'}`;
      } else if (status === 409) {
        errorMessage.value = 'El email o número de identificación ya está registrado';
      } else {
        errorMessage.value = `Error ${status}: ${data.message || 'No se pudo registrar'}`;
      }
    } else {
      errorMessage.value = 'Error de conexión. Verifica que el backend esté corriendo.';
    }
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  formData.value = {
    idType: '',
    idNumber: '',
    firstName: '',
    secondName: '',
    firstSurname: '',
    secondSurname: '',
    country: '', 
    department: '', 
    homeCity: '',
    email: '',
    mobileNumber: ''
  };
  departamentos.value = []; 
  ciudades.value = []; 
  successMessage.value = '';
  errorMessage.value = '';
};

// Cargar catálogos iniciales al montar el componente
onMounted(() => {
  loadIdentificationTypes();
  loadCountries(); 
});
</script>

<style scoped>
.register-page {
  position: relative;
  min-height: 100vh;
  padding: 70px 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top left, rgba(32, 94, 67, 0.45), transparent 55%),
    radial-gradient(circle at bottom right, rgba(11, 34, 24, 0.7), rgba(5, 13, 10, 0.95));
  overflow: hidden;
}

.ambient-light {
  position: absolute;
  width: 520px;
  height: 520px;
  filter: blur(110px);
  opacity: 0.6;
  animation: pulse 10s ease-in-out infinite alternate;
  z-index: 0;
}

.ambient-light--primary {
  background: #0f766e;
  top: -120px;
  left: -150px;
}

.ambient-light--secondary {
  background: #6366f1;
  bottom: -140px;
  right: -120px;
  animation-delay: 2.5s;
}

@keyframes pulse {
  from {
    transform: scale(1) translateY(0px);
  }
  to {
    transform: scale(1.1) translateY(-20px);
  }
}

.register-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 48px;
  max-width: 1180px;
  width: 100%;
  backdrop-filter: blur(8px);
}

.register-hero {
  padding: 48px;
  border-radius: 28px;
  background: linear-gradient(200deg, rgba(30, 64, 55, 0.9), rgba(17, 24, 39, 0.85));
  color: #f0fdf4;
  box-shadow: 0 24px 60px rgba(15, 118, 110, 0.25);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.register-hero h1 {
  font-size: 34px;
  line-height: 1.2;
  font-weight: 700;
}

.register-hero p {
  color: #cbd5f5;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
}

.hero-highlights {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-highlights li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(15, 23, 42, 0.35);
  border-radius: 14px;
  padding: 16px 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.hero-highlights .icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.register-container {
  background: rgba(10, 14, 12, 0.85);
  padding: 42px 44px;
  border-radius: 26px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(30, 64, 55, 0.35);
  color: #e8f0e6;
  transition: transform 0.5s ease, box-shadow 0.5s ease;
}

.register-container:hover {
  transform: translateY(-6px);
  box-shadow: 0 32px 90px rgba(15, 118, 110, 0.25);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  gap: 18px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(45, 212, 191, 0.18);
  color: #5eead4;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 12px;
  font-weight: 700;
}

.header h2 {
  font-size: 30px;
  font-weight: 700;
  color: #a3e635;
  margin: 12px 0 6px;
  letter-spacing: 0.4px;
}

.subheading {
  margin: 0;
  color: #cdd5cc;
  font-size: 15px;
}

.btn-back {
  padding: 12px 20px;
  background: linear-gradient(120deg, rgba(56, 189, 248, 0.25), rgba(129, 140, 248, 0.35));
  color: #e0f2fe;
  border: 1px solid rgba(125, 211, 252, 0.4);
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(56, 189, 248, 0.25);
}

.register-form {
  background: rgba(17, 24, 39, 0.6);
  padding: 32px;
  border-radius: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.12);
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 20px;
}

.location-row {
  grid-template-columns: repeat(3, 1fr);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #a5d6a7;
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 12px 14px;
  border: 1.5px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: rgba(15, 23, 42, 0.65);
  color: #f1f5f9;
}

.form-group input::placeholder {
  color: rgba(226, 232, 240, 0.45);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #34d399;
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.18);
}

.form-group select:disabled {
  background: rgba(15, 23, 42, 0.4);
  color: rgba(148, 163, 184, 0.4);
  cursor: not-allowed;
  border-style: dashed;
}

.form-group select option,
.form-group select optgroup {
  background: #0f172a;   /* fondo oscuro */
  color: #a7f3d0;        /* texto verde menta */
}

.form-group select:focus option:checked {
  background-color: #22c55e; /* verde seleccionado */
  color: #ffffff;
}

.form-actions {
  display: flex;
  gap: 14px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.btn-submit,
.btn-reset {
  flex: 1;
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
}

.btn-submit {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #f8fafc;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 20px 35px rgba(34, 197, 94, 0.35);
}

.btn-submit:disabled {
  background: rgba(38, 38, 38, 0.5);
  cursor: not-allowed;
  color: rgba(226, 232, 240, 0.45);
  box-shadow: none;
}

.btn-reset {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.9), rgba(239, 68, 68, 0.9));
  color: #fff5f5;
}

.btn-reset:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 35px rgba(248, 113, 113, 0.35);
}

.message {
  margin-top: 24px;
  padding: 16px 18px;
  border-radius: 14px;
  font-weight: 600;
  animation: fadeIn 0.4s ease;
}

.message.success {
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
  border: 1px solid rgba(134, 239, 172, 0.4);
}

.message.error {
  background: rgba(248, 113, 113, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(248, 113, 113, 0.35);
}

@media (max-width: 1100px) {
  .register-layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .register-hero {
    order: 2;
  }

  .register-container {
    order: 1;
  }
}

@media (max-width: 900px) {
  .location-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .register-page {
    padding: 48px 18px;
  }

  .register-hero {
    padding: 32px;
  }

  .register-container {
    padding: 32px 26px;
  }

  .register-form {
    padding: 26px 22px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .register-page {
    padding: 32px 14px;
  }

  .register-hero h1 {
    font-size: 28px;
  }

  .register-container {
    padding: 26px 20px;
  }

  /* ==== FIX VISIBILIDAD DE OPCIONES EN SELECT ==== */

/* fuerza esquema claro en el menú nativo */
.form-group select {
  background-color: #ffffff !important;
  color: #0f172a !important; /* texto oscuro */
  color-scheme: light; /* usa menú claro del sistema */
  -webkit-appearance: none;
  appearance: none;
}

/* estilos del popup (opciones desplegadas) */
.form-group select option {
  background-color: #ffffff !important;
  color: #0f172a !important;
}

/* color de la opción seleccionada */
.form-group select:focus option:checked {
  background-color: #22c55e !important;
  color: #ffffff !important;
}

/* fallback: Windows oscuro + Chrome */
@media (prefers-color-scheme: dark) {
  select,
  option {
    background-color: #ffffff !important;
    color: #0f172a !important;
  }
}

}
</style>