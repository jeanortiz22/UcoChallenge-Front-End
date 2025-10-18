<script setup>
// Puedes eliminar o comentar la importación de HelloWorld si no la usas,
// ya que el router manejará el contenido principal.
// import HelloWorld from './components/HelloWorld.vue' 
</script>

<template>
  <router-view /> 
</template>

<style scoped>
/* Puedes mantener o eliminar los estilos por defecto (.logo, .logo.vue, etc.) */
/* Por ahora, es seguro eliminar los estilos si no los vas a usar en las nuevas vistas. */

/* Ejemplo de estilos básicos */
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