<script setup>
import { useAuth0 } from '@auth0/auth0-vue'
import { watch } from 'vue'
import { useRouter } from 'vue-router'

const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
const router = useRouter()

// Si Auth0 termina de cargar y el usuario está autenticado → dashboard
watch([isLoading, isAuthenticated], () => {
  if (!isLoading.value && isAuthenticated.value) {
    router.push('/dashboard')
  }
})
</script>

<template>
  <div class="login-container">
    <h2>Inicio de Sesion Delegado (Auth0)</h2>

    <div v-if="isLoading.value">
      <p>Cargando estado de la sesion...</p>
    </div>

    <div v-else-if="!isAuthenticated.value">
      <button @click="loginWithRedirect()">Iniciar Sesion</button>
    </div>

    <div v-else>
      <p>Redirigiendo...</p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 25px;
  border: 1px solid #ccc;
  border-radius: 10px;
  text-align: center;
}
button {
  padding: 10px 20px;
  cursor: pointer;
}
</style>
