<script>
import { UserService } from "@/services/user.service.js";

export default {
  name: "oauth-callback",
  data() {
    return {
      userService: new UserService(),
      loading: true,
      error: null,
      statusMessage: 'Procesando autenticación con Google...'
    }
  },
  async mounted() {
    await this.handleCallback();
  },
  methods: {
    async handleCallback() {
      try {
        this.statusMessage = 'Obteniendo código de autorización...';

        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        // También obtener el userId del path (si viene así: /connect/{userId})
        const userId = this.$route.params.userId;

        console.log('🔍 Parámetros recibidos:');
        console.log('  - code:', code);
        console.log('  - userId:', userId);
        console.log('  - error:', error);
        console.log('  - URL completa:', window.location.href);

        if (error) {
          console.error('Error en OAuth:', error);
          this.error = `Error en la autenticación: ${error}`;
          setTimeout(() => {
            this.$router.push('/login');
          }, 3000);
          return;
        }

        // Si viene userId en la ruta (caso: /connect/{userId})
        if (userId && !code) {
          console.log('✓ UserId recibido directamente en la URL:', userId);

          this.statusMessage = 'Obteniendo token de autenticación...';

          try {
            // GET /api/v1/authorize/token/{userId}
            const tokenResponse = await this.userService.getTokenByUserId(userId);

            console.log('✓ Respuesta del token:', tokenResponse);

            if (tokenResponse && tokenResponse.status === 200 && tokenResponse.data.token) {
              this.$store.commit('setToken', tokenResponse.data.token);
              this.$store.commit('setUser', userId);

              this.statusMessage = '¡Autenticación exitosa! Redirigiendo...';
              setTimeout(() => {
                this.$router.push('/home');
              }, 1000);
              return;
            } else {
              throw new Error('No se pudo obtener el token de autenticación');
            }
          } catch (tokenError) {
            console.error('❌ Error al obtener token:', tokenError);
            throw tokenError;
          }
        }

        // Si viene code (caso tradicional: /oauth/callback?code=xxx)
        if (code) {
          console.log('✓ Código de autorización recibido:', code.substring(0, 20) + '...');

          this.statusMessage = 'Validando con el servidor...';

          // Enviar el código al backend para procesarlo
          const callbackResponse = await this.userService.handleGoogleCallback(code);

          console.log('✓ Respuesta del callback:', callbackResponse);

          if (callbackResponse && callbackResponse.status === 200) {
            const callbackData = callbackResponse.data;

            if (callbackData.token) {
              console.log('✓ Token recibido directamente del callback');
              this.$store.commit('setToken', callbackData.token);

              if (callbackData.id || callbackData.userId) {
                this.$store.commit('setUser', callbackData.id || callbackData.userId);
              }

              this.statusMessage = '¡Autenticación exitosa! Redirigiendo...';
              setTimeout(() => {
                this.$router.push('/home');
              }, 1000);

            } else if (callbackData.userId || callbackData.id) {
              const userId = callbackData.userId || callbackData.id;
              console.log('✓ UserId recibido:', userId);

              this.statusMessage = 'Obteniendo token de autenticación...';

              const tokenResponse = await this.userService.getTokenByUserId(userId);

              console.log('✓ Respuesta del token:', tokenResponse);

              if (tokenResponse && tokenResponse.status === 200 && tokenResponse.data.token) {
                this.$store.commit('setToken', tokenResponse.data.token);
                this.$store.commit('setUser', userId);

                this.statusMessage = '¡Autenticación exitosa! Redirigiendo...';
                setTimeout(() => {
                  this.$router.push('/home');
                }, 1000);
              } else {
                throw new Error('No se pudo obtener el token de autenticación');
              }
            } else {
              throw new Error('Respuesta del servidor no contiene token ni userId');
            }
          } else {
            throw new Error('Error en la respuesta del servidor');
          }
          return;
        }

        // Si no hay ni code ni userId
        console.error('No se encontró código ni userId en la URL');
        this.error = 'No se recibieron los parámetros de autenticación';
        setTimeout(() => {
          this.$router.push('/login');
        }, 3000);

      } catch (error) {
        console.error('❌ Error en el callback de OAuth:', error);

        let errorMessage = 'Error al procesar la autenticación de Google';

        if (error.response) {
          console.error('Error response:', error.response);
          errorMessage = error.response.data?.message || error.response.data || errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.error = errorMessage;

        setTimeout(() => {
          this.$router.push('/login');
        }, 3000);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<template>
  <div class="callback-container">
    <div v-if="loading" class="loading-container">
      <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: #02513D;"></i>
      <p class="loading-text">{{ statusMessage }}</p>
      <div class="progress-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
    <div v-else-if="error" class="error-container">
      <i class="pi pi-exclamation-circle" style="font-size: 3rem; color: #e74c3c;"></i>
      <p class="error-text">{{ error }}</p>
      <p class="redirect-text">Redirigiendo al login en 3 segundos...</p>
    </div>
    <div v-else class="success-container">
      <i class="pi pi-check-circle" style="font-size: 3rem; color: #02513D;"></i>
      <p class="success-text">{{ statusMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #E6F4E2;
}

.loading-container,
.error-container,
.success-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 450px;
  text-align: center;
  min-width: 300px;
}

.loading-text,
.error-text,
.success-text {
  font-size: 1.2rem;
  color: #02513D;
  font-weight: 500;
  margin: 0;
}

.redirect-text {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.progress-dots {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #02513D;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-container {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>