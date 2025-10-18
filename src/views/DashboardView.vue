<template>
  <div class="container">
    <h1>✅ Panel de Control de Administrador</h1>
    <p>¡Bienvenido! (Autenticado con Auth0)</p>
    
    <button @click="fetchData">Cargar Usuarios Protegidos</button>
    <button @click="logout">Cerrar Sesión</button>

    <div v-if="users.length">
        <h3>Datos de API Protegida (/api/v1/usuarios)</h3>
        <ul>
            <li v-for="user in users" :key="user.id">{{ user.email }}</li>
        </ul>
    </div>
    <p v-if="apiError" class="error">Error al cargar datos: {{ apiError }} (¿Backend corriendo y token válido?)</p>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';
import axiosInstance from '../http/axiosInstance'; // ⬅️ Importar la instancia de Axios

const router = useRouter();
const { logout: auth0Logout } = useAuth0();
const users = ref([]); // Usar ref si estás usando composition API
const apiError = ref(null);

// Función de logout que usa el SDK de Auth0
const logout = () => {
  auth0Logout({ 
    logoutParams: { 
      returnTo: window.location.origin // Redirigir a la URL de tu app
    } 
  });
};

// Función para llamar a la API protegida
const fetchData = async () => {
    apiError.value = null;
    try {
        // AxiosInstance automáticamente adjunta el token
        const response = await axiosInstance.get('/api/v1/usuarios'); 
        users.value = response.data;
    } catch (error) {
        // Si hay error (ej. 401/403), el token falló la validación en Spring Boot
        apiError.value = error.response ? error.response.status : 'Error de conexión';
        console.error('Error al obtener usuarios:', error);
    }
}
</script>