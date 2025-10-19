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
  color: #81c784; /* verde pastel suave */
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  position: relative;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #a5d6a7; /* Verde grisáceo */
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

@media (max-width: 768px) {
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
