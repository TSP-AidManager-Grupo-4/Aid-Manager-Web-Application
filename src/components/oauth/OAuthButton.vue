<!-- File: src/components/oauth/OAuthButton.vue -->
<template>
  <Button :class="['oauth-btn', provider]" @click="redirect">
    <span class="oauth-icon">{{ providerChar }}</span>
    <span class="oauth-label">{{ labelComputed }}</span>
  </Button>
</template>

<script>
import { defineComponent, computed } from 'vue';
import Button from 'primevue/button';
import { environment } from '@/environment/environment.js';

export default defineComponent({
  name: 'OAuthButton',
  components: { Button },
  props: {
    provider: { type: String, required: true }, // e.g. "google" or "github"
    label: { type: String, default: '' }
  },
  setup(props) {
    const labelComputed = computed(() => props.label || `Continuar con ${capitalize(props.provider)}`);
    const providerChar = computed(() => {
      // small visual hint (G for Google, GH for GitHub, etc.)
      const map = { google: 'G', github: 'GH' };
      return map[props.provider] || props.provider.charAt(0).toUpperCase();
    });

    function redirect() {
      // Ajusta la URL según tu backend OAuth
      const url = `${environment.baseUrl}/oauth2/authorize/${props.provider}`;
      window.location.href = url;
    }

    function capitalize(s) {
      return s && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }

    return { labelComputed, providerChar, redirect };
  }
});
</script>

<style scoped>
.oauth-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  justify-content: center;
  padding: 0.6rem 1rem;
  font-weight: 600;
  text-transform: none;
}

/* small circular icon area */
.oauth-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  font-size: 0.95rem;
}

/* provider specific colors */
.oauth-btn.google { background: #db4437; color: white; }
.oauth-btn.github { background: #24292f; color: white; }

/* label spacing */
.oauth-label { pointer-events: none; }
</style>