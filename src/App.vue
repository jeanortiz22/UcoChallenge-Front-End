<script setup>
import { useAuth0 } from "@auth0/auth0-vue";
import { useRouter } from "vue-router";

const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();
const router = useRouter();

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
  <div class="app-shell">
    <nav class="main-nav">
      <div class="nav-content">
        <div class="brand" @click="router.push('/')">
          <span class="brand-mark">U</span>
          <div>
            <p class="brand-title">UcoChallenge</p>
            <p class="brand-subtitle">Gestión de delegados</p>
          </div>
        </div>

        <div class="nav-actions">
          <button
            v-if="!isAuthenticated"
            @click="loginWithRedirect"
            class="nav-btn nav-primary"
          >
            Iniciar sesión
          </button>

          <div v-else class="user-actions">
            <span class="greeting">Hola, {{ user.name }}</span>
            <button @click="logoutUser" class="nav-btn nav-danger">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>

    <router-view />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, #ffffff 50%, rgba(248, 250, 252, 0.95) 100%);
}

.main-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(14px);
  background: rgba(255, 255, 255, 0.75);
  border-bottom: 1px solid rgba(15, 42, 90, 0.08);
}

.nav-content {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.15rem 1.5rem;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
}

.brand-mark {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.9rem;
  background: linear-gradient(140deg, #7c3aed, #4f46e5);
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 1.35rem;
  box-shadow: 0 18px 35px -22px rgba(76, 29, 149, 0.5);
}

.brand-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #15294a;
}

.brand-subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: #70819b;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.greeting {
  font-size: 0.95rem;
  color: #405272;
}

.nav-btn {
  border: none;
  border-radius: 999px;
  padding: 0.65rem 1.35rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.nav-btn:hover {
  transform: translateY(-1px);
}

.nav-primary {
  background: linear-gradient(120deg, #7c3aed, #4f46e5);
  color: #fff;
  box-shadow: 0 16px 32px -20px rgba(76, 29, 149, 0.6);
}

.nav-primary:hover {
  box-shadow: 0 18px 40px -18px rgba(79, 70, 229, 0.55);
}

.nav-ghost {
  background: rgba(124, 58, 237, 0.08);
  color: #4f46e5;
}

.nav-ghost:hover {
  background: rgba(124, 58, 237, 0.12);
}

.nav-danger {
  background: rgba(220, 53, 69, 0.12);
  color: #c41e3a;
}

.nav-danger:hover {
  background: rgba(220, 53, 69, 0.18);
}

@media (max-width: 720px) {
  .nav-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .nav-actions,
  .user-actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .user-actions {
    justify-content: space-between;
  }

  .nav-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
