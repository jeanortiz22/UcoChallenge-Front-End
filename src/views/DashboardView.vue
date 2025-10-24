<template>
  <div class="dashboard-container">
    <!-- Header -->
    <div class="header">
      <div>
        <h1>Panel de Control de Administrador</h1>
        <p class="welcome-text">¡Bienvenido! (Autenticado con Auth0)</p>
      </div>
      <div class="header-actions">
        <button @click="goToRegister" class="btn-primary">
          + Agregar Usuario
        </button>
        <button @click="logout" class="btn-logout">
          Cerrar Sesión
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading">
      <p>Cargando usuarios...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="apiError" class="error-message">
      <p>❌ Error al cargar datos: {{ apiError }}</p>
      <button @click="fetchData" class="btn-retry">Reintentar</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="users.length === 0" class="empty-state">
      <p>📋 No hay usuarios registrados en el sistema</p>
      <button @click="goToRegister" class="btn-primary">
        Registrar Primer Usuario
      </button>
    </div>

    <!-- Users Table -->
    <div v-else class="users-section">
      <div class="table-header">
        <h3>Usuarios Registrados ({{ users.length }} total)</h3>
        <button @click="fetchData" class="btn-refresh">🔄 Actualizar</button>
      </div>

      <div class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Identificación</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id">
              <td class="name-column">
                {{ user.primerNombre }} {{ user.segundoNombre || '' }} 
                {{ user.primerApellido }} {{ user.segundoApellido || '' }}
              </td>
              <td>
                <span class="id-badge">{{ user.tipoIdentificacion }}</span>
                {{ user.numeroIdentificacion }}
              </td>
              <td>{{ user.email }}</td>
              <td>{{ user.telefonoMovil || 'N/A' }}</td>
              <td>{{ user.ciudadResidencia || 'N/A' }}</td>
              <td>
                <span :class="getStatusClass(user)">
                  {{ getStatusText(user) }}
                </span>
              </td>
              <td class="actions-column">
                <button 
                  v-if="!user.emailConfirmado"
                  @click="confirmEmail(user.id)"
                  class="btn-action btn-email"
                  title="Confirmar Email"
                >
                  📧 Email
                </button>
                <button 
                  v-if="!user.telefonoMovilConfirmado && user.telefonoMovil"
                  @click="confirmPhone(user.id)"
                  class="btn-action btn-phone"
                  title="Confirmar Teléfono"
                >
                  📱 Teléfono
                </button>
                <span v-if="user.emailConfirmado && user.telefonoMovilConfirmado" class="authenticated">
                  ✓ Autenticado
                </span>
                <span v-else-if="user.emailConfirmado && !user.telefonoMovilConfirmado" class="partial">
                  ✓ Email OK
                </span>
                <span v-else-if="!user.emailConfirmado && user.telefonoMovilConfirmado" class="partial">
                  ✓ Tel OK
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1"
          class="btn-page"
        >
          ← Anterior
        </button>
        
        <div class="page-info">
          Página {{ currentPage }} de {{ totalPages }}
          <span class="page-range">
            ({{ rangeStart }} - {{ rangeEnd }} de {{ users.length }})
          </span>
        </div>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="btn-page"
        >
          Siguiente →
        </button>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';
import axiosInstance from '../http/axiosInstance';


const router = useRouter();
const { logout: auth0Logout } = useAuth0();
const { getAccessTokenSilently } = useAuth0();

const users = ref([]);
const isLoading = ref(false);
const apiError = ref(null);
const successMessage = ref(null);
const currentPage = ref(1);
const itemsPerPage = 10;

// Computed properties
const totalPages = computed(() => Math.ceil(users.value.length / itemsPerPage));

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

// Methods
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

const fetchData = async () => {
  isLoading.value = true;
  apiError.value = null;
  successMessage.value = null;
  
  try {
    const response = await axiosInstance.get('/api/v1/usuarios');
    users.value = response.data;
    console.log('✅ Usuarios cargados:', response.data);
  } catch (error) {
    apiError.value = error.response 
      ? `Error ${error.response.status}` 
      : 'Error de conexión';
    console.error('❌ Error al obtener usuarios:', error);
  } finally {
    isLoading.value = false;
  }
};

const confirmEmail = async (userId) => {
  try {
    await axiosInstance.patch(`/api/v1/usuarios/${userId}/confirm-email`);
    successMessage.value = '✅ Email confirmado exitosamente';
    
    // Actualizar el usuario en la lista local
    const user = users.value.find(u => u.id === userId);
    if (user) user.emailConfirmado = true;
    
    setTimeout(() => successMessage.value = null, 3000);
  } catch (error) {
    apiError.value = 'Error al confirmar email';
    console.error('❌ Error:', error);
  }
};

const confirmPhone = async (userId) => {
  try {
    await axiosInstance.patch(`/api/v1/usuarios/${userId}/confirm-phone`);
    successMessage.value = '✅ Teléfono confirmado exitosamente';
    
    // Actualizar el usuario en la lista local
    const user = users.value.find(u => u.id === userId);
    if (user) user.telefonoMovilConfirmado = true;
    
    setTimeout(() => successMessage.value = null, 3000);
  } catch (error) {
    apiError.value = 'Error al confirmar teléfono';
    console.error('❌ Error:', error);
  }
};

const getStatusText = (user) => {
  if (user.emailConfirmado && user.telefonoMovilConfirmado) {
    return '✓ Autenticado';
  }
  if (user.emailConfirmado || user.telefonoMovilConfirmado) {
    return '⚠ Parcial';
  }
  return '✗ Pendiente';
};

const getStatusClass = (user) => {
  if (user.emailConfirmado && user.telefonoMovilConfirmado) {
    return 'status-badge authenticated';
  }
  if (user.emailConfirmado || user.telefonoMovilConfirmado) {
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
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE
      }
    });
    
    console.log('🔐 Access Token Auth0:', token);

    await fetchData(); // ← ahora se ejecuta después del token
  } catch (e) {
    console.error('❌ Error obteniendo token en dashboard:', e);
  }
});

</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.header h1 {
  margin: 0 0 5px 0;
  color: #81c784;
  font-size: 28px;
}

.welcome-text {
  color: #81c784;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-primary {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-logout {
  padding: 10px 20px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-logout:hover {
  background-color: #da190b;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

.error-message {
  background-color: #ffebee;
  border: 1px solid #ef5350;
  color: #c62828;
  padding: 20px;
  border-radius: 4px;
  text-align: center;
}

.btn-retry {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.empty-state p {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.users-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.table-header h3 {
  margin: 0;
  color: #333;
}

.btn-refresh {
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh:hover {
  background-color: #0b7dda;
}

.table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background-color: #f8f9fa;
}

.users-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  font-size: 14px;
}

.users-table td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
  font-size: 14px;
}

.users-table tbody tr:hover {
  background-color: #f8f9fa;
}

.name-column {
  font-weight: 500;
  color: #333;
}

.id-badge {
  display: inline-block;
  padding: 2px 6px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 5px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.authenticated {
  background-color: #c8e6c9;
  color: #2e7d32;
}

.status-badge.partial {
  background-color: #fff9c4;
  color: #f57f17;
}

.status-badge.pending {
  background-color: #ffcdd2;
  color: #c62828;
}

.actions-column {
  white-space: nowrap;
}

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 5px;
  transition: opacity 0.3s;
}

.btn-action:hover {
  opacity: 0.8;
}

.btn-email {
  background-color: #2196F3;
  color: white;
}

.btn-phone {
  background-color: #FF9800;
  color: white;
}

.authenticated, .partial {
  font-size: 12px;
  font-weight: 600;
  color: #4CAF50;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.btn-page {
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-page:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #495057;
}

.page-range {
  color: #6c757d;
  font-size: 13px;
}

.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #c8e6c9;
  color: #2e7d32;
  padding: 15px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
  }
  
  .table-container {
    font-size: 12px;
  }
  
  .users-table th,
  .users-table td {
    padding: 8px;
  }
}

.text-green {
  color: #00b37e; /* verde elegante */
}

.text-green-light {
  color: #00d68f; /* un poco más claro para el subtítulo */
}

.welcome-text {
  font-size: 1rem;
  margin-top: 0.3rem;
}

</style>