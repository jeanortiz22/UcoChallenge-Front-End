<template>
  <div class="register-container">
    <div v-if="!canRegisterUsers" class="unauthorized-register">
      <h2>Acceso restringido</h2>
      <p>No tienes permisos para registrar usuarios.</p>
      <button @click="goBack" class="btn-back">← Volver al Panel de control</button>
    </div>

    <div v-else class="register-content">
        <div class="header">
          <h2>Registrar Nuevo Usuario</h2>
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
                required
                placeholder="Juan"
              />
            </div>

            <div class="form-group">
              <label for="secondName">Segundo Nombre</label>
              <input 
                id="secondName"
                v-model="formData.secondName" 
                type="text"
                placeholder="Carlos"
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
                required
                placeholder="Pérez"
              />
            </div>

            <div class="form-group">
              <label for="secondSurname">Segundo Apellido</label>
              <input 
                id="secondSurname"
                v-model="formData.secondSurname" 
                type="text"
                placeholder="García"
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
                  {{ tipo.nombre }}
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
                  {{ pais.nombre }}
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
                  {{ dep.nombre }}
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
                  {{ ciudad.nombre }}
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
                required
                placeholder="usuario@ucochallenge.com"
              />
            </div>

            <div class="form-group">
              <label for="mobileNumber">Teléfono Móvil</label>
              <input 
                id="mobileNumber"
                v-model="formData.mobileNumber" 
                type="tel"
                placeholder="3001234567"
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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
// Asegúrate de que esta ruta sea correcta para tu proyecto
import axiosInstance from '../http/axiosInstance';
import { useAuthorization } from '../composables/useAuthorization';
import { DASHBOARD_REQUIRED_ROLES } from '../constants/authorization'; 

const router = useRouter();
const { hasAllRoles } = useAuthorization();
const canRegisterUsers = computed(() => hasAllRoles(DASHBOARD_REQUIRED_ROLES));

// Form data matching RegisterUserDomain + new location fields
const formData = ref({
  idType: '', 
  idNumber: '', 
  firstName: '',
  secondName: '',
  firstSurname: '',
  secondSurname: '',
  country: '',    // NUEVO: UUID del país
  department: '', // NUEVO: UUID del departamento
  homeCity: '',   // UUID de la ciudad
  email: '', 
  mobileNumber: ''
});

// Catálogos
const tiposIdentificacion = ref([]);
const paises = ref([]); 
const departamentos = ref([]); 
const ciudades = ref([]);

// Estados
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const goBack = () => {
  router.push({ name: 'dashboard' });
};

// Cargar tipos de identificación
const loadIdentificationTypes = async () => {
  try {
    const response = await axiosInstance.get('/api/v1/tipos-identificacion');
    tiposIdentificacion.value = response.data;
  } catch (error) {
    console.error('❌ Error al cargar tipos de identificación:', error);
    // Valores por defecto (Fallback)
    tiposIdentificacion.value = [
      { id: '00000000-0000-0000-0000-000000000001', nombre: 'Cédula de Ciudadanía' },
      { id: '00000000-0000-0000-0000-000000000002', nombre: 'Cédula de Extranjería' },
    ];
  }
};

// Cargar países
const loadCountries = async () => {
  try {
    const response = await axiosInstance.get('/api/v1/paises');
    paises.value = response.data;
  } catch (error) {
    console.error('❌ Error al cargar países:', error);
    // Valores por defecto (Fallback)
    paises.value = [
      { id: '00000000-0000-0000-0000-000000000099', nombre: 'Colombia' },
      { id: '00000000-0000-0000-0000-000000000098', nombre: 'México' },
    ];
  }
};

// Cargar departamentos (depende del país)
const loadDepartments = async (countryId) => {
  // Limpiar selecciones dependientes
  departamentos.value = [];
  formData.value.department = '';
  ciudades.value = [];
  formData.value.homeCity = '';
  
  if (!countryId) return;

  try {
    const response = await axiosInstance.get(`/api/v1/paises/${countryId}/departamentos`);
    departamentos.value = response.data;
  } catch (error) {
    console.error('❌ Error al cargar departamentos:', error);
    // Valores por defecto (Fallback)
    if (countryId === '00000000-0000-0000-0000-000000000099') { // Colombia
      departamentos.value = [
        { id: '00000000-0000-0000-0000-000000000080', nombre: 'Antioquia' },
        { id: '00000000-0000-0000-0000-000000000081', nombre: 'Cundinamarca' },
      ];
    } 
  }
};

// Cargar ciudades (depende del departamento)
const loadCities = async (departmentId) => {
  // Limpiar selección dependiente
  ciudades.value = [];
  formData.value.homeCity = '';

  if (!departmentId) return;

  try {
    const response = await axiosInstance.get(`/api/v1/departamentos/${departmentId}/ciudades`);
    ciudades.value = response.data;
  } catch (error) {
    console.error('❌ Error al cargar ciudades:', error);
    // Valores por defecto (Fallback)
    if (departmentId === '00000000-0000-0000-0000-000000000080') { // Antioquia
      ciudades.value = [
        { id: '00000000-0000-0000-0000-000000000010', nombre: 'Rionegro' },
        { id: '00000000-0000-0000-0000-000000000011', nombre: 'Medellín' },
      ];
    } else if (departmentId === '00000000-0000-0000-0000-000000000081') { // Cundinamarca
      ciudades.value = [
        { id: '00000000-0000-0000-0000-000000000012', nombre: 'Bogotá' },
      ];
    } 
  }
};

const handleSubmit = async () => {
  if (!canRegisterUsers.value) {
    return;
  }

  isSubmitting.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    // El payload final solo incluye homeCity, que es el UUID de la ciudad seleccionada.
    const payload = {
      idType: formData.value.idType,
      idNumber: formData.value.idNumber,
      firstName: formData.value.firstName,
      secondName: formData.value.secondName || null,
      firstSurname: formData.value.firstSurname,
      secondSurname: formData.value.secondSurname || null,
      homeCity: formData.value.homeCity, // UUID de la ciudad
      email: formData.value.email,
      mobileNumber: formData.value.mobileNumber || null
    };

    console.log('📤 Enviando payload:', payload);
    
    const response = await axiosInstance.post('/api/v1/usuarios/register', payload);
    
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

watch(
  () => canRegisterUsers.value,
  (allowed) => {
    if (!allowed) {
      return;
    }

    loadIdentificationTypes();
    loadCountries();
  },
  { immediate: true }
);

</script>

<style scoped>
/* Contenedor y Header (se mantienen igual) */
.register-container {
  max-width: 850px;
  margin: 40px auto;
  padding: 40px;
  background: linear-gradient(180deg, #101c14 0%, #0d1310 100%);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 64, 32, 0.5);
  transition: transform 0.3s ease;
  color: #e8f0e6;
}

.register-container:hover {
  transform: translateY(-3px);
}

.register-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.unauthorized-register {
  text-align: center;
  padding: 40px 20px;
  margin-bottom: 30px;
  background: rgba(255, 183, 77, 0.1);
  border: 1px solid rgba(255, 183, 77, 0.4);
  border-radius: 12px;
  color: #ffcc80;
}

.unauthorized-register h2 {
  margin-bottom: 10px;
  color: #ffa726;
}

.unauthorized-register p {
  margin-bottom: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 35px;
  flex-wrap: wrap;
  gap: 10px;
}

.header h2 {
  font-size: 26px;
  font-weight: 700;
  color: #81c784; 
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 0 5px rgba(129, 199, 132, 0.2);
}

.btn-back {
  padding: 10px 18px;
  background: linear-gradient(90deg, #2e7d32, #388e3c);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-back:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}

.register-form {
  background: #151a17;
  padding: 35px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 64, 32, 0.3);
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Estilo para las filas de 2 elementos (Nombres, Apellidos, Identificación, Teléfono/Email) */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin-bottom: 20px;
}

/* Estilo específico para la fila de 3 elementos (País, Departamento, Ciudad) */
.location-row {
  grid-template-columns: repeat(3, 1fr); /* 3 columnas iguales */
}

.form-group {
  display: flex;
  flex-direction: column;
  position: relative;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #a5d6a7; 
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 12px;
  border: 1.5px solid #2f4f4f;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background-color: #0e1a13;
  color: #e8f0e6;
}

.form-group input::placeholder {
  color: #7a8a7e;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #66bb6a;
  background-color: #132218;
  box-shadow: 0 0 10px rgba(102, 187, 106, 0.3);
}

/* Estilo para campos de selección deshabilitados */
.form-group select:disabled {
  background-color: #1a231b;
  color: #444;
  cursor: not-allowed;
  opacity: 0.6;
}


/* Acciones y Botones (se mantienen igual) */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  flex-wrap: wrap;
}

.btn-submit,
.btn-reset {
  flex: 1;
  padding: 14px 30px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 64, 32, 0.3);
}

.btn-submit {
  background: linear-gradient(90deg, #2e7d32, #388e3c);
  color: #fff;
}

.btn-submit:hover:not(:disabled) {
  background: linear-gradient(90deg, #388e3c, #2e7d32);
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(56, 142, 60, 0.4);
}

.btn-submit:disabled {
  background: #444;
  cursor: not-allowed;
  color: #888;
  box-shadow: none;
}

.btn-reset {
  background: linear-gradient(90deg, #8b0000, #b22222);
  color: #fff;
}

.btn-reset:hover {
  background: linear-gradient(90deg, #b22222, #ff4444);
  transform: scale(1.05);
}

.message {
  margin-top: 25px;
  padding: 15px 18px;
  border-radius: 8px;
  font-weight: 600;
  animation: fadeIn 0.4s ease;
}

.message.success {
  background: rgba(56, 142, 60, 0.1);
  color: #81c784;
  border-left: 4px solid #66bb6a;
}

.message.error {
  background: rgba(255, 0, 0, 0.1);
  color: #ef5350;
  border-left: 4px solid #ef5350;
}

/* Media Queries para Responsividad */
@media (max-width: 900px) {
  /* En pantallas medianas (e.g., tablets), la fila de 3 pasa a 2 columnas */
  .location-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  /* En pantallas más pequeñas, todas las filas pasan a 1 columna */
  .form-row {
    grid-template-columns: 1fr;
  }

  .register-container {
    padding: 20px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
