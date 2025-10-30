<template>
  <transition name="modal-fade">
    <div
      v-if="modelValue"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      @keydown.esc.prevent="emitCancel"
    >
      <div class="modal-backdrop" @click.self="emitCancel">
        <div class="modal-container" role="document">
          <button
            type="button"
            class="modal-close"
            aria-label="Cerrar"
            @click="emitCancel"
          >
            ×
          </button>

          <header class="modal-header">
            <h2 class="modal-title">{{ title }}</h2>
            <p v-if="description" class="modal-description">{{ description }}</p>
          </header>

          <form class="modal-form" @submit.prevent="emitSubmit">
            <label class="modal-label" :for="inputId">{{ inputLabel }}</label>
            <input
              :id="inputId"
              v-model="localCode"
              class="modal-input"
              :placeholder="inputPlaceholder"
              autocomplete="one-time-code"
              inputmode="text"
              spellcheck="false"
              ref="inputElement"
              @keyup.enter="emitSubmit"
            />

            <p v-if="error" class="modal-error">{{ error }}</p>

            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" @click="emitCancel">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="pending">
                <span v-if="pending" class="loader" aria-hidden="true"></span>
                <span>{{ pending ? 'Validando…' : submitLabel }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  inputLabel: { type: String, default: 'Código de verificación' },
  inputPlaceholder: { type: String, default: 'Ingresa el código recibido' },
  submitLabel: { type: String, default: 'Confirmar código' },
  pending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  code: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'update:code', 'submit', 'cancel']);

const localCode = ref(props.code);
const inputId = `confirmation-code-${Math.random().toString(36).slice(2, 10)}`;
const inputElement = ref(null);

watch(
  () => props.code,
  (value) => {
    if (value !== localCode.value) {
      localCode.value = value;
    }
  }
);

watch(localCode, (value) => {
  emit('update:code', value);
});

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await nextTick();
      inputElement.value?.focus();
    } else {
      localCode.value = '';
    }
  }
);

const emitCancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
};

const emitSubmit = () => {
  emit('submit');
};
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(14, 19, 31, 0.56);
  z-index: 50;
  padding: 1.5rem;
}

.modal-backdrop {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-container {
  position: relative;
  width: min(420px, 100%);
  background-color: #ffffff;
  border-radius: 18px;
  padding: 2rem;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
}

.modal-close:hover {
  color: #0f172a;
}

.modal-header {
  margin-bottom: 1.5rem;
}

.modal-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal-description {
  margin-top: 0.5rem;
  color: #475569;
  font-size: 0.95rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-label {
  font-weight: 600;
  color: #1e293b;
}

.modal-input {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid #cbd5f5;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.modal-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.modal-error {
  color: #b91c1c;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: none;
  padding: 0.6rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-ghost {
  background-color: transparent;
  color: #475569;
}

.btn-ghost:hover {
  color: #0f172a;
  background-color: rgba(15, 23, 42, 0.04);
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #ffffff;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
}

.loader {
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>