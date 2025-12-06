<script>
import {UserService} from "@/services/user.service.js";

export default {
  name: "login-content",
  data() {
    return {
      userService: new UserService(),
      users: [],
      email: '',
      formValid: false,
      password: '',
      passwordFieldType: 'password',
      isRegistered: false,
      showDialog: false,
      message_error: "",
      loadingGoogle: false
    }
  },
  methods: {
    async handleSubmitLogin() {
      this.isRegistered = false;

      await this.userService.signInUser(this.email, this.password)
          .then(async(res) => {
            console.log('res', res)

            if(res.status === 200) {
              this.$store.commit('setToken', res.data.token);
              this.$store.commit('setUser', res.data.id);
              this.isRegistered = true;
              this.$router.push('/home');
            } else {
              this.message_error = res.response?.data || 'Error al iniciar sesión';
              this.showDialog = true;
            }
          })
          .catch(error => {
            console.error('Error en login:', error);
            this.message_error = error.response?.data || 'Error de conexión';
            this.showDialog = true;
          });

      if (!this.isRegistered) {
        this.showDialog = true;
      }
    },

    // Método para iniciar el flujo de Google OAuth2
    async handleGoogleLogin() {
      this.loadingGoogle = true;
      console.log('🔵 Iniciando flujo de Google OAuth...');

      try {
        // Solicitar la URL de autorización al backend
        // GET /api/v1/authorize (NO requiere bearer token)
        console.log('📤 Llamando a: api/v1/authorize');
        const response = await this.userService.initiateGoogleOAuth();

        console.log('📥 Respuesta completa de authorize:', response);
        console.log('📥 response.data:', response.data);
        console.log('📥 response.status:', response.status);

        if (!response) {
          throw new Error('No se recibió respuesta del servidor');
        }

        if (response.status !== 200) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        // El backend puede devolver la URL en diferentes formatos
        let authUrl = null;

        // Intentar extraer la URL de diferentes posibles estructuras
        if (typeof response.data === 'string') {
          console.log('🔍 Tipo de respuesta: string directo');
          authUrl = response.data;
        } else if (typeof response.data === 'object') {
          console.log('🔍 Tipo de respuesta: objeto');
          console.log('🔍 Claves del objeto:', Object.keys(response.data));

          // Buscar en diferentes posibles propiedades
          authUrl = response.data.authUrl ||
              response.data.url ||
              response.data.authorization_url ||
              response.data.redirectUrl ||
              response.data.redirect_url;

          console.log('🔍 authUrl encontrada:', authUrl);
        }

        console.log('🎯 URL de autorización extraída:', authUrl);

        if (!authUrl) {
          console.error('❌ No se encontró URL en la respuesta');
          console.error('❌ response.data completo:', JSON.stringify(response.data, null, 2));
          throw new Error('El servidor no devolvió una URL de autorización');
        }

        if (typeof authUrl !== 'string') {
          console.error('❌ authUrl no es un string:', typeof authUrl);
          throw new Error('La URL de autorización no tiene el formato correcto');
        }

        // Limpiar la URL de posibles espacios o caracteres extraños
        authUrl = authUrl.trim();
        console.log('🧹 URL limpia:', authUrl);

        // Validar que sea una URL válida
        try {
          const urlObj = new URL(authUrl);
          console.log('✅ URL válida parseada:', urlObj.href);
          authUrl = urlObj.href; // Usar la versión normalizada
        } catch (urlError) {
          console.error('❌ URL inválida:', urlError);
          console.error('❌ authUrl que falló:', authUrl);
          throw new Error(`La URL devuelta no es válida: ${urlError.message}`);
        }

        if (!authUrl.includes('google') && !authUrl.includes('accounts')) {
          console.warn('⚠️ La URL no parece ser de Google:', authUrl);
          console.warn('⚠️ Continuando de todos modos...');
        }

        console.log('✅ URL final para redirección:', authUrl);
        console.log('🚀 Iniciando redirección en 100ms...');

        // Pequeño delay para que se vean los logs
        setTimeout(() => {
          console.log('🚀🚀 Ejecutando window.location.href');
          window.location.href = authUrl;
        }, 100);

      } catch (error) {
        console.error('❌ Error al iniciar Google OAuth:', error);
        console.error('❌ Error completo:', error);

        if (error.response) {
          console.error('❌ Error response:', error.response);
          console.error('❌ Error response.data:', error.response.data);
          console.error('❌ Error response.status:', error.response.status);
          console.error('❌ Error response.headers:', error.response.headers);
        }

        if (error.request) {
          console.error('❌ Error request:', error.request);
        }

        this.loadingGoogle = false;

        let errorMessage = 'Error al conectar con Google. Por favor, intenta de nuevo.';

        if (error.response) {
          const status = error.response.status;

          if (status === 500) {
            errorMessage = 'Error interno del servidor (500). Verifica que el backend esté configurado correctamente con las credenciales de Google OAuth2.';
            console.error('🔴 ERROR 500: El backend tiene un problema. Posibles causas:');
            console.error('   - GOOGLE_CLIENT_ID no está configurado');
            console.error('   - GOOGLE_CLIENT_SECRET no está configurado');
            console.error('   - GOOGLE_REDIRECT_URI no está configurado');
            console.error('   - El endpoint /api/v1/authorize tiene un bug');
          } else if (status === 404) {
            errorMessage = 'Endpoint no encontrado (404). Verifica que el backend tenga el endpoint /api/v1/authorize';
          } else if (status === 401 || status === 403) {
            errorMessage = 'No autorizado. Verifica las configuraciones de CORS y autenticación.';
          }

          if (error.response.data) {
            if (typeof error.response.data === 'string') {
              errorMessage += '\n\nDetalle: ' + error.response.data;
            } else if (error.response.data.message) {
              errorMessage += '\n\nDetalle: ' + error.response.data.message;
            } else {
              errorMessage += '\n\nDetalle: ' + JSON.stringify(error.response.data);
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.message_error = errorMessage;
        this.showDialog = true;
      }
    },

    validateForm() {
      this.formValid = this.email !== '' && this.password !== '';
    },

    togglePasswordFieldType() {
      this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    }
  },
  mounted() {
    const gtagId = import.meta.env.VITE_GTAG;
    console.log('Google Analytics in Login ID:', gtagId);
    console.log('NODE_ENV:', import.meta.env.MODE);
  }
}
</script>

<template>
  <div class="login-container h-screen flex">
    <div class="logo-container flex">
      <img src="../../assets/logoAidManager.png" alt="logo"/>
      <span class="font-bold text-3xl">AidManager</span>
    </div>
    <div class="card flex">
      <span class="title font-normal text-xl" style="color: #02513D;">Welcome!</span>

      <form class="flex flex-column gap-3" @submit.prevent="handleSubmitLogin">

        <input type="email" placeholder="Email"
               class="input-field p-3" v-model="email"
               @input="validateForm"
        />
        <div class="password-field">
          <input :type="passwordFieldType" placeholder="Password"
                 class="input-field p-3" v-model="password"
                 @input="validateForm"
          />
          <i :class="passwordFieldType === 'password' ? 'pi pi-eye' : 'pi pi-eye-slash'"
             @click="togglePasswordFieldType"
             class="toggle-icon"
          ></i>
        </div>

        <a class="link" href="#" style="color: #02513D; font-style:italic; font-size: 0.8rem;">Forgot your password?</a>

        <div class="buttons-container">
          <button :disabled="!formValid" type="submit" class="button p-3" style="color: #fff; margin-top:30px">
            Sign in
          </button>

          <button
              type="button"
              class="button button-google p-3"
              @click="handleGoogleLogin"
              :disabled="loadingGoogle"
          >
            <i v-if="!loadingGoogle" class="pi pi-google" style="margin-right: 8px;"></i>
            <i v-else class="pi pi-spin pi-spinner" style="margin-right: 8px;"></i>
            {{ loadingGoogle ? 'Connecting...' : 'Login with Google' }}
          </button>
        </div>
      </form>
    </div>
    <h3 class="card-footer">New to AidManager?
      <router-link to="/register" class="link" style="font-weight: 600">Join now</router-link>
    </h3>
  </div>

  <pv-dialog :style="{margin: '0 10px'}" :visible.sync="showDialog" :modal="true" :closable="false">
    <div class="error-modal p-5 flex flex-column align-items-center gap-5 text-center">
      <i class="text-7xl pi pi-exclamation-circle text-red-500"></i>
      <h1>Login Failed!</h1>
      <p class="text-md">{{ message_error }}</p>
      <pv-button class="py-3 px-5" label="OK" @click="showDialog = false"/>
    </div>
  </pv-dialog>
</template>

<style scoped>

.login-container {
  background-color: #E6F4E2;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
}

.logo-container {
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 4rem;
}

.card {
  width: 100%;
  max-width: 700px;
  background-color: #fff;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  height: auto;
  text-align: center;
  justify-content: center;
  padding: 40px;
  margin: 40px;
  flex-direction: column;
}

.title {
  margin-bottom: 40px;
}

.input-field {
  align-self: center;
  width: 90%;
  border-radius: 20px;
  border: 1px solid #BDBDBD;
  color: #0009;
}

.input-field:focus {
  background-color: #F7F7F7;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  align-items: center;
}

.button {
  width: 40%;
  align-self: center;
  background-color: #02513D;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button:hover:not(:disabled) {
  background-color: #024030;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-google {
  background-color: #fff;
  color: #02513D;
  border: 2px solid #02513D;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0;
}

.button-google:hover:not(:disabled) {
  background-color: #f5f5f5;
  border-color: #024030;
  color: #024030;
}

.link {
  width: 90%;
  align-self: center;
  text-align: right;
  color: #02513D;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.card-footer {
  font-weight: normal;
  font-size: 1rem;
}

.password-field {
  align-self: center;
  position: relative;
  width: 90%;
  display: flex;
  align-items: center;
}

.password-field .input-field {
  flex: 1;
  padding-right: 2.5rem;
}

.toggle-icon {
  color: #575757;
  position: absolute;
  right: 15px;
  cursor: pointer;
}

.toggle-icon:hover {
  color: #02513D;
}

@media screen and (max-width: 500px) {
  .logo-container {
    flex-direction: column;
    text-align: center;
  }

  .input-field {
    width: 100%;
  }

  .password-field {
    width: 100%;
  }

  .link {
    width: 100%;
  }
}

@media screen and (max-width: 560px) {
  .button {
    width: 100%;
  }
}

</style>