<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';
import { getMergedUserRoles } from '../utils/auth/mergedAuthz.js';
import { extractUserRoles } from '../utils/auth/roles.js';

const route = useRoute();
const router = useRouter();
const { user, idTokenClaims, getAccessTokenSilently, loginWithRedirect, logout } = useAuth0();

const required = computed(() => {
  const q = route.query.need ?? '';
  return String(q).split(',').map(s => s.trim()).filter(Boolean);
});
const from = computed(() => route.query.from || '/');

// estado local
const loading = ref(true);
const assigned = ref([]);

// cargar roles sin hacer async setup
onMounted(async () => {
  try {
    // 1) intento “mergeado” (ID token + /userinfo o lo que uses)
    const merged = await getMergedUserRoles(
      { getAccessTokenSilently, getUser: async () => user.value, user, idTokenClaims },
      import.meta.env.VITE_AUTH0_AUDIENCE
    );
    assigned.value = Array.isArray(merged) ? merged : [];
  } catch (_e) {
    // 2) fallback: solo claims locales
    const currentUser = user?.value ?? user ?? null;
    const claims = idTokenClaims?.value ?? idTokenClaims ?? null;
    assigned.value = extractUserRoles(currentUser, claims);
  } finally {
    loading.value = false;
  }
});

const assignedSorted = computed(() => assigned.value.slice().sort());

const doRelogin = async () => {
  await loginWithRedirect({
    authorizationParams: { prompt: 'login' },
    appState: { targetUrl: from.value }
  });
};
const doLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });
const goHome = () => router.push({ name: 'login' });
</script>

<template>
  <div class="unauth-shell">
    <div class="bg" aria-hidden="true">
      <div class="orb orb-a"></div>
      <div class="orb orb-b"></div>
    </div>

    <section class="card">
      <header class="head">
        <h1>Permisos insuficientes</h1>
        <p>Tu sesión está activa, pero tu cuenta no tiene los permisos necesarios para acceder a este recurso.</p>
      </header>

      <div v-if="loading" class="loading">
        <span class="spinner" aria-hidden="true"></span>
        <p>Comprobando tus permisos…</p>
      </div>

      <div v-else class="content">
        <div class="block">
          <h3>Roles requeridos</h3>
          <div class="chips">
            <span v-for="r in required" :key="r" class="chip chip-need">{{ r }}</span>
            <span v-if="!required.length" class="muted">No especificados por la ruta</span>
          </div>
        </div>

        <div class="block">
          <h3>Tus roles actuales</h3>
          <div class="chips">
            <span v-for="r in assignedSorted" :key="r" class="chip chip-have">{{ r }}</span>
            <span v-if="!assignedSorted.length" class="muted">No se detectaron roles</span>
          </div>
        </div>
      </div>

      <footer class="actions">
        <button class="btn ghost" @click="goHome">Volver al inicio</button>
        <div class="spacer"></div>
        <button class="btn outline" @click="doRelogin">Cambiar de cuenta</button>
        <button class="btn danger" @click="doLogout">Cerrar sesión</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.unauth-shell{min-height:calc(100vh - 70px);display:grid;place-items:center;padding:2.5rem 1.25rem;position:relative}
.bg{position:fixed;inset:0;z-index:-1;background:radial-gradient(circle at 20% 15%, rgba(124,58,237,.10), transparent 50%),radial-gradient(circle at 80% 85%, rgba(16,185,129,.10), transparent 50%)}
.orb{position:absolute;border-radius:50%;filter:blur(.6px);opacity:.6}
.orb-a{width:380px;height:380px;top:-100px;right:-120px;background:radial-gradient(circle, rgba(79,70,229,.16), transparent 70%)}
.orb-b{width:300px;height:300px;bottom:-80px;left:-90px;background:radial-gradient(circle, rgba(16,185,129,.14), transparent 70%)}
.card{width:min(880px,100%);background:rgba(255,255,255,.92);border:1px solid rgba(21,41,74,.08);border-radius:22px;box-shadow:0 28px 70px -35px rgba(15,42,90,.38);padding:2rem}
.head h1{margin:0;font-size:1.9rem;color:#15294a}
.head p{margin:.35rem 0 0;color:#4f5b72}
.loading{display:flex;align-items:center;gap:.8rem;color:#4f5b72;margin-top:1rem}
.spinner{width:1.25rem;height:1.25rem;border-radius:999px;border:3px solid rgba(124,58,237,.2);border-top-color:#7c3aed;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.content{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;margin-top:1.25rem}
.block h3{margin:0 0 .5rem;color:#1f2a44;font-size:1rem}
.chips{display:flex;flex-wrap:wrap;gap:.5rem}
.chip{border-radius:999px;padding:.35rem .7rem;font-weight:600;font-size:.85rem;border:1px solid transparent}
.chip-need{background:rgba(239,68,68,.10);color:#b91c1c;border-color:rgba(239,68,68,.25)}
.chip-have{background:rgba(59,130,246,.10);color:#1d4ed8;border-color:rgba(59,130,246,.25)}
.muted{color:#70819b}
.actions{display:flex;align-items:center;gap:.6rem;margin-top:1.2rem}
.spacer{flex:1}
.btn{border:0;border-radius:12px;padding:.7rem 1rem;font-weight:700;cursor:pointer}
.ghost{background:rgba(79,70,229,.08);color:#4f46e5}
.outline{background:transparent;border:1px solid rgba(15,42,90,.15);color:#1f2a44}
.danger{background:#ef4444;color:#fff}
.btn:hover{filter:brightness(1.02);transform:translateY(-1px);transition:.2s}
@media (max-width:760px){.content{grid-template-columns:1fr}}
</style>
