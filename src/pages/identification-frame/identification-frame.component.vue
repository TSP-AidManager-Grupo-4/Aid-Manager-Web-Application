<template>
  <section class="identification-frame">
    <h2>Identification</h2>
    <form @submit.prevent="onSubmit">
      <label for="identifier">ID / Email</label>
      <input id="identifier" v-model="identifier" type="text" placeholder="Enter your id or email" />
      <div class="actions">
        <button type="submit" :disabled="!identifier.trim()">Continue</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const identifier = ref('')

const emit = defineEmits(['submit'])

function onSubmit() {
  const payload = identifier.value.trim()
  if (!payload) return
  emit('submit', payload)
  // optionally clear: identifier.value = ''
}
</script>

<style scoped>
.identification-frame {
  max-width: 420px;
  margin: 2rem auto;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}
input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}
.actions {
  display: flex;
  justify-content: flex-end;
}
button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>