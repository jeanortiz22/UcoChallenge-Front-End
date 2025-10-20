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
import { onMounted, watch } from 'vue'; // ✅ Importar watch también
import { useRouter } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';

const router = useRouter();
const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

// Función de redirección
const login = () => {
  loginWithRedirect(); 
};

// 🔄 Observar cambios en la autenticación
watch([isAuthenticated, isLoading], ([auth, loading]) => {
  // Redirigir solo cuando termine de cargar Y esté autenticado
  if (!loading && auth) {
    console.log('✅ Usuario autenticado, redirigiendo al panel de control...');
    router.push({ name: 'Dashboard' });
  }
}, { immediate: true }); // immediate: true ejecuta inmediatamente al montar

</script>

<style scoped>
.login-container {
    text-align: center;
    padding: 50px;
}
</style>