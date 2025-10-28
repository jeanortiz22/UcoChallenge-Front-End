<script setup>
import { useAuth0 } from '@auth0/auth0-vue';
import { watch } from 'vue';
import { useRouter } from 'vue-router';

const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
const router = useRouter();

watch([isLoading, isAuthenticated], () => {
  if (!isLoading.value && isAuthenticated.value) {
    router.push('/dashboard');
  }
});
</script>

<template>
  <div class="landing-shell">
    <div class="visual-layer" aria-hidden="true">
      <div class="visual-gradient"></div>
      <div class="visual-pulse"></div>
    </div>

    <main class="landing-content">
      <section class="intro">
        <span class="badge">Plataforma Delegados</span>
        <h1>Controla la experiencia de tus usuarios desde un solo lugar</h1>
        <p>
          Centraliza el registro, seguimiento y verificación de usuarios de forma
          segura y moderna gracias a la autenticación delegada con Auth0.
        </p>
      </section>

      <section class="auth-card">
        <header>
          <h2>Inicia sesión para continuar</h2>
          <p v-if="!isLoading.value">Autenticación delegada a través de Auth0</p>
        </header>

        <div v-if="isLoading.value" class="loading-state">
          <span class="spinner" aria-hidden="true"></span>
          <p>Comprobando tu sesión…</p>
        </div>

        <div v-else-if="!isAuthenticated.value" class="action">
          <button @click="loginWithRedirect()" class="btn-login">
            Acceder con Auth0
          </button>
        </div>

        <div v-else class="action">
          <p>Redirigiendo a tu panel…</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.landing-shell {
  position: relative;
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background: radial-gradient(circle at top left, #f0f8ff 0%, #eaf6ff 35%, #f4f8ff 70%, #ffffff 100%);
  overflow: hidden;
}

.visual-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.visual-gradient {
  position: absolute;
  width: 60rem;
  height: 60rem;
  background: radial-gradient(circle, rgba(23, 162, 184, 0.18), transparent 60%);
  top: -20rem;
  right: -25rem;
  filter: blur(0.5px);
}

.visual-pulse {
  position: absolute;
  width: 35rem;
  height: 35rem;
  bottom: -12rem;
  left: -8rem;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.2), transparent 65%);
  animation: float 12s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-18px) scale(1.05);
  }
}

.landing-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3rem;
  align-items: center;
  width: min(1100px, 100%);
}

.intro {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.badge {
  align-self: flex-start;
  background: rgba(23, 162, 184, 0.12);
  color: #0f7a8c;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
}

.intro h1 {
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 700;
  color: #15294a;
  line-height: 1.15;
  margin: 0;
}

.intro p {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #4f5b72;
  margin: 0;
  max-width: 32rem;
}

.auth-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 0 25px 60px -30px rgba(15, 42, 90, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.auth-card header h2 {
  margin: 0 0 0.35rem;
  font-size: 1.65rem;
  color: #15294a;
}

.auth-card header p {
  margin: 0;
  color: #70819b;
  font-size: 0.95rem;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  color: #4f5b72;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  border: 3px solid rgba(124, 58, 237, 0.2);
  border-top-color: #7c3aed;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.action {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-login {
  border: none;
  border-radius: 999px;
  background: linear-gradient(120deg, #7c3aed, #4f46e5);
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.95rem 1.25rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  box-shadow: 0 18px 30px -15px rgba(79, 70, 229, 0.7);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 40px -18px rgba(76, 29, 149, 0.6);
}

.btn-login:active {
  transform: translateY(1px);
}

@media (max-width: 900px) {
  .landing-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .intro {
    align-items: center;
  }

  .badge {
    align-self: center;
  }

  .intro p {
    max-width: 100%;
  }
}

@media (max-width: 600px) {
  .landing-shell {
    padding: 2.5rem 1.25rem;
  }

  .auth-card {
    padding: 2rem;
  }
}
</style>
