<template>
  <div class="login-container">
    <h2>Inicio de Sesión Delegado (Auth0)</h2>
    <button v-if="!isAuthenticated && !isLoading" @click="login">
        Ingresar con Auth0
    </button>
    <p v-else-if="isLoading">Cargando estado de la sesión...</p>
    <p v-else>Sesión activa. Redirigiendo a Dashboard...</p> 
  </div>
</template>

<script setup>
import { onMounted } from 'vue'; // ✅ Necesitas onMounted
import { useRouter } from 'vue-router'; // ✅ Necesitas useRouter
import { useAuth0 } from '@auth0/auth0-vue';

const router = useRouter();
const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0(); // ✅ Importa isAuthenticated e isLoading

// Función de redirección
const login = () => {
  loginWithRedirect(); 
};

// 🛑 Lógica Clave: Redireccionar al Dashboard si ya está autenticado
onMounted(() => {
    // Si ya está autenticado (el SDK ya lo procesó), redirige.
    if (isAuthenticated.value && !isLoading.value) {
        router.push({ name: 'dashboard' }); 
    }
    // Nota: El SDK de Auth0 maneja la redirección inicial tras el login.
    // Esta guardia es para cuando el usuario intenta volver a esta URL.
});
</script>

<style scoped>
/* Estilos solo de referencia */
.login-container {
    text-align: center;
    padding: 50px;
}
</style>