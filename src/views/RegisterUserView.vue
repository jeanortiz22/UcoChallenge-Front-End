<template>
  <div class="register-container">
    <div class="header">
      <h2>Registrar Nuevo Usuario</h2>
      <button @click="goBack" class="btn-back">← Volver al Dashboard</button>
    </div>

    <form @submit.prevent="handleSubmit" class="register-form">
      <!-- Nombres -->
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

      <!-- Apellidos -->
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

      <!-- Identificación -->
      <div class="form-row">
        <div class="form-group">
          <label for="idType">Tipo de Identificación *</label>
          <select 
            id="idType" 
            v-model="formData.idType" 
            required
            @change="loadIdentificationTypes"
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

      <!-- Email -->
      <div class="form-group full-width">
        <label for="email">Correo Electrónico *</label>
        <input 
          id="email"
          v-model="formData.email" 
          type="email" 
          required
          placeholder="usuario@ucochallenge.com"
        />
      </div>

      <!-- Teléfono y Ciudad -->
      <div class="form-row">
        <div class="form-group">
          <label for="mobileNumber">Teléfono Móvil</label>
          <input 
            id="mobileNumber"
            v-model="formData.mobileNumber" 
            type="tel"
            placeholder="3001234567"
          />
        </div>

        <div class="form-group">
          <label for="homeCity">Ciudad de Residencia *</label>
          <select 
            id="homeCity" 
            v-model="formData.homeCity" 
            required
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

      <!-- Botones -->
      <div class="form-actions">
        <button type="submit" class="btn-submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Registrando...' : 'Registrar Usuario' }}
        </button>
        <button type="button" @click="resetForm" class="btn-reset">
          Limpiar Formulario
        </button>
      </div>

      <!-- Mensajes -->
      <div v-if="successMessage" class="message success">
        {{ successMessage }}
      </div>
      
      <div v-if="errorMessage" class="message error">
        {{ errorMessage }}
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from '../http/axiosInstance';

const router = useRouter();

// Form data matching RegisterUserDomain
const formData = ref({
  idType: '',        // UUID
  idNumber: '',      // String
  firstName: '',     // String
  secondName: '',    // String
  firstSurname: '',  // String
  secondSurname: '', // String
  homeCity: '',      // UUID
  email: '',         // String
  mobileNumber: ''   // String
});

// Catálogos
const tiposIdentificacion = ref([]);
const ciudades = ref([]);

// Estados
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const goBack = () => {
  router.push({ name: 'Dashboard' });
};

// Cargar tipos de identificación desde el backend
const loadIdentificationTypes = async () => {
  try {
    const response = await axiosInstance.get('/api/v1/tipos-identificacion');
    tiposIdentificacion.value = response.data;
    console.log('✅ Tipos de identificación cargados:', response.data);
  } catch (error) {
    console.error('❌ Error al cargar tipos de identificación:', error);
    // Si falla, usar valores por defecto (temporal)
    tiposIdentificacion.value = [
      { id: '00000000-0000-0000-0000-000000000001', nombre: 'Cédula de Ciudadanía' },
      { id: '00000000-0000-0000-0000-000000000002', nombre: 'Cédula de Extranjería' },
      { id: '00000000-0000-0000-0000-000000000003', nombre: 'Tarjeta de Identidad' },
      { id: '00000000-0000-0000-0000-000000000004', nombre: 'Pasaporte' }
    ];
  }
};

// Cargar ciudades desde el backend
const loadCities = async () => {
  try {
    const response = await axiosInstance.get('/api/v1/ciudades');
    ciudades.value = response.data;
    console.log('✅ Ciudades cargadas:', response.data);
  } catch (error) {
    console.error('❌ Error al cargar ciudades:', error);
    // Si falla, usar valores por defecto (temporal)
    ciudades.value = [
      { id: '00000000-0000-0000-0000-000000000010', nombre: 'Rionegro' },
      { id: '00000000-0000-0000-0000-000000000011', nombre: 'Medellín' },
      { id: '00000000-0000-0000-0000-000000000012', nombre: 'Bogotá' },
      { id: '00000000-0000-0000-0000-000000000013', nombre: 'Cali' },
      { id: '00000000-0000-0000-0000-000000000014', nombre: 'Barranquilla' }
    ];
  }
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    // Enviar datos con la estructura exacta de RegisterUserDomain
    const payload = {
      idType: formData.value.idType,
      idNumber: formData.value.idNumber,
      firstName: formData.value.firstName,
      secondName: formData.value.secondName || null,
      firstSurname: formData.value.firstSurname,
      secondSurname: formData.value.secondSurname || null,
      homeCity: formData.value.homeCity,
      email: formData.value.email,
      mobileNumber: formData.value.mobileNumber || null
    };

    console.log('📤 Enviando payload:', payload);
    
    const response = await axiosInstance.post('/api/v1/usuarios/register', payload);
    
    successMessage.value = '✅ Usuario registrado exitosamente';
    console.log('✅ Usuario creado:', response.data);
    
    // Redirigir al dashboard después de 2 segundos
    setTimeout(() => {
      router.push({ name: 'Dashboard' });
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
    homeCity: '',
    email: '',
    mobileNumber: ''
  };
  successMessage.value = '';
  errorMessage.value = '';
};

// Cargar catálogos al montar el componente
onMounted(() => {
  loadIdentificationTypes();
  loadCities();
});
</script>

<style scoped>
.register-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  color: #333;
}

.btn-back {
  padding: 10px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-back:hover {
  background-color: #5a6268;
}

.register-form {
  background-color: #f8f9fa;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  margin-bottom: 20px;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.btn-submit,
.btn-reset {
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-submit {
  background-color: #4CAF50;
  color: white;
  flex: 1;
}

.btn-submit:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-submit:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-reset {
  background-color: #f44336;
  color: white;
}

.btn-reset:hover {
  background-color: #da190b;
}

.message {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
  font-weight: 500;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}
</style>