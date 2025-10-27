<script setup>
import { computed } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useRouter } from "vue-router";
import { useAuthorization } from "./composables/useAuthorization";
import { DASHBOARD_REQUIRED_ROLES } from "./constants/authorization";

const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();
const { hasAllRoles } = useAuthorization();
const router = useRouter();

const canAccessDashboard = computed(() => hasAllRoles(DASHBOARD_REQUIRED_ROLES));

const goDashboard = () => {
  router.push("/dashboard");
};

const logoutUser = () => {
  logout({
    logoutParams: {
      returnTo: import.meta.env.VITE_AUTH0_LOGOUT_URI
    }
  });
};
</script>

<template>
  <div>
    <!-- Navbar -->
    <nav class="navbar">
      <h1 class="logo">UcoChallenge</h1>

      <div class="nav-actions">
        <button
          v-if="!isAuthenticated"
          @click="loginWithRedirect"
          class="btn-primary">
          Iniciar Sesion
        </button>

        <div v-else class="user-info">
          <span>Hola, {{ user.name }}</span>
          <button
            v-if="canAccessDashboard"
            @click="goDashboard"
            class="btn-secondary">
            Dashboard
          </button>
          <button @click="logoutUser" class="btn-danger">Cerrar Sesion</button>
        </div>
      </div>
    </nav>

    <!-- Vista actual del router -->
    <router-view />
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #1b2a4a;
  color: #ffffff;
}

.logo {
  font-size: 22px;
  font-weight: bold;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

button {
  cursor: pointer;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #17a2b8;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

/* Estilos previos por si los necesitas todavía */
.login-container, .container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  text-align: center;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
