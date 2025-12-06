<script>
import { UserService } from "@/services/user.service.js";

export default {
  name: "oauth-callback",
  data() {
    return {
      userService: new UserService(),
      loading: true,
      error: null,
      statusMessage: 'Procesando autenticación con Google...',
      oauthUser: null,
      oauthToken: null,
      showRoleSelection: false,
      selectedRole: '',
      orgInput: {
        orgName: '',
        country: '',
        email: '',
        orgCode: ''
      },
      isSubmittingOrg: false,
      countries: ['Spain', 'USA', 'UK', 'Germany', 'France', 'Italy', 'Portugal', 'Other']
    }
  },
  async mounted() {
    // Parse ?data=... from the URL if present (for /auth/callback)
    const dataParam = this.$route.query.data;
    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam));
        console.log('✅ OAuth data received:', data);
        
        // Store user and token temporarily
        if (data.user) {
          this.oauthUser = data.user;
          localStorage.setItem('user', JSON.stringify(data.user));
          this.$store.state.user = data.user;
        }
        if (data.credential && data.credential.accessToken) {
          this.oauthToken = data.credential.accessToken;
          localStorage.setItem('token', data.credential.accessToken);
          this.$store.state.token = data.credential.accessToken;
        }
        
        // Show role selection instead of redirecting
        this.showRoleSelection = true;
        this.loading = false;
        return;
      } catch (e) {
        console.error('❌ Error parsing OAuth data:', e);
        this.error = 'Error al procesar los datos de autenticación.';
        setTimeout(() => {
          this.$router.push('/login');
        }, 3000);
        return;
      }
    }
    await this.handleCallback();
  },
  methods: {
    selectRole(role) {
      this.selectedRole = role;
      this.orgInput = { orgName: '', country: '', email: '', orgCode: '' };
    },
    async submitManagerOrg() {
      if (!this.orgInput.orgName || !this.orgInput.country || !this.orgInput.email) {
        this.error = 'Please fill in all required fields.';
        return;
      }
      this.isSubmittingOrg = true;
      this.error = null;
      try {
        const payload = {
          firstName: this.oauthUser.firstName || '',
          lastName: this.oauthUser.lastName || '',
          profileImg: this.oauthUser.profileImg || '',
          role: 0,
          companyName: this.orgInput.orgName,
          companyEmail: this.orgInput.email,
          companyCountry: this.orgInput.country,
          companyCode: null
        };
        
        console.log('📤 Sending complete-oauth request:', {
          userId: this.oauthUser.id,
          payload,
          tokenPreview: this.oauthToken ? this.oauthToken.substring(0, 20) + '...' : 'MISSING'
        });
        
        // Call complete-oauth with OAuth token
        const result = await this.userService.completeOAuth(this.oauthUser.id, payload, this.oauthToken);
        console.log('✅ Complete OAuth response:', result);
        
        // Extract user data from response - backend may return different structures
        const userData = result.user || result.data || result;
        
        // Store the complete user data returned from backend
        const completeUser = {
          id: userData.id || this.oauthUser.id,
          email: userData.email || this.oauthUser.email,
          firstName: userData.firstName || payload.firstName,
          lastName: userData.lastName || payload.lastName,
          profileImg: userData.profileImg || this.oauthUser.profileImg,
          role: userData.role !== undefined ? userData.role : 0,
          companyId: userData.companyId || result.companyId
        };
        
        console.log('📝 Final user object to store:', completeUser);
        
        // Verify companyId exists before proceeding
        if (!completeUser.companyId) {
          console.error('⚠️ Warning: companyId is missing from response');
          this.error = 'Company setup incomplete. Missing company ID.';
          this.isSubmittingOrg = false;
          return;
        }
        
        this.$store.commit('setUser', completeUser);
        localStorage.setItem('user', JSON.stringify(completeUser));
        localStorage.setItem('token', this.oauthToken);
        this.$store.commit('setToken', this.oauthToken);
        
        this.statusMessage = 'Setup completed! Redirecting...';
        setTimeout(() => {
          this.$router.push('/home');
        }, 1500);
      } catch (e) {
        console.error('❌ Error completing manager setup:', e);
        console.error('Error details:', {
          message: e.message,
          response: e.response?.data,
          status: e.response?.status
        });
        this.error = e.response?.data?.message || e.message || 'Error completing setup. Please try again.';
      } finally {
        this.isSubmittingOrg = false;
      }
    },
    async submitTeamMemberOrg() {
      if (!this.orgInput.orgCode) {
        this.error = 'Please enter an organization code.';
        return;
      }
      this.isSubmittingOrg = true;
      this.error = null;
      try {
        const payload = {
          firstName: this.oauthUser.firstName || '',
          lastName: this.oauthUser.lastName || '',
          profileImg: this.oauthUser.profileImg || '',
          role: 1,
          companyName: null,
          companyEmail: null,
          companyCountry: null,
          companyCode: this.orgInput.orgCode
        };
        
        console.log('📤 Sending complete-oauth request:', {
          userId: this.oauthUser.id,
          payload,
          tokenPreview: this.oauthToken ? this.oauthToken.substring(0, 20) + '...' : 'MISSING'
        });
        
        // Call complete-oauth with OAuth token
        const result = await this.userService.completeOAuth(this.oauthUser.id, payload, this.oauthToken);
        console.log('✅ Complete OAuth response:', result);
        
        // Extract user data from response - backend may return different structures
        const userData = result.user || result.data || result;
        
        // Store the complete user data returned from backend
        const completeUser = {
          id: userData.id || this.oauthUser.id,
          email: userData.email || this.oauthUser.email,
          firstName: userData.firstName || payload.firstName,
          lastName: userData.lastName || payload.lastName,
          profileImg: userData.profileImg || this.oauthUser.profileImg,
          role: userData.role !== undefined ? userData.role : 1,
          companyId: userData.companyId || result.companyId
        };
        
        console.log('📝 Final user object to store:', completeUser);
        
        // Verify companyId exists before proceeding
        if (!completeUser.companyId) {
          console.error('⚠️ Warning: companyId is missing from response');
          this.error = 'Company setup incomplete. Missing company ID.';
          this.isSubmittingOrg = false;
          return;
        }
        
        this.$store.commit('setUser', completeUser);
        localStorage.setItem('user', JSON.stringify(completeUser));
        localStorage.setItem('token', this.oauthToken);
        this.$store.commit('setToken', this.oauthToken);
        
        this.statusMessage = 'Setup completed! Redirecting...';
        setTimeout(() => {
          this.$router.push('/home');
        }, 1500);
      } catch (e) {
        console.error('❌ Error completing team member setup:', e);
        console.error('Error details:', {
          message: e.message,
          response: e.response?.data,
          status: e.response?.status
        });
        this.error = e.response?.data?.message || e.message || 'Error completing setup. Please try again.';
      } finally {
        this.isSubmittingOrg = false;
      }
    },
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

            // El backend puede devolver 'token', 'AccessToken', o 'access_token'
            const token = tokenResponse?.data?.token || 
                         tokenResponse?.data?.AccessToken || 
                         tokenResponse?.data?.access_token;

            if (tokenResponse && tokenResponse.status === 200 && token) {
              console.log('✓ Token extraído:', token.substring(0, 20) + '...');
              
              // Guardar el token primero
              this.$store.commit('setToken', token);
              
              // Si el backend devuelve el objeto user completo, usarlo directamente
              if (tokenResponse.data.user) {
                console.log('✓ Objeto user recibido del backend:', tokenResponse.data.user);
                localStorage.setItem('user', JSON.stringify(tokenResponse.data.user));
                this.$store.state.user = tokenResponse.data.user;
              } else {
                // Si no, llamar a getUserById (esto requiere que el token sea válido)
                console.log('⚠️ No se recibió objeto user, llamando a getUserById');
                this.$store.commit('setUser', userId);
              }

              this.statusMessage = '¡Autenticación exitosa! Redirigiendo...';
              setTimeout(() => {
                this.$router.push('/home');
              }, 1000);
              return;
            } else {
              console.error('❌ No se encontró token en la respuesta');
              console.error('❌ Datos recibidos:', tokenResponse?.data);
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

              // El backend puede devolver 'token', 'AccessToken', o 'access_token'
              const token = tokenResponse?.data?.token || 
                           tokenResponse?.data?.AccessToken || 
                           tokenResponse?.data?.access_token;

              if (tokenResponse && tokenResponse.status === 200 && token) {
                console.log('✓ Token extraído:', token.substring(0, 20) + '...');
                
                // Guardar el token primero
                this.$store.commit('setToken', token);
                
                // Si el backend devuelve el objeto user completo, usarlo directamente
                if (tokenResponse.data.user) {
                  console.log('✓ Objeto user recibido del backend:', tokenResponse.data.user);
                  localStorage.setItem('user', JSON.stringify(tokenResponse.data.user));
                  this.$store.state.user = tokenResponse.data.user;
                } else {
                  // Si no, llamar a getUserById (esto requiere que el token sea válido)
                  console.log('⚠️ No se recibió objeto user, llamando a getUserById');
                  this.$store.commit('setUser', userId);
                }

                this.statusMessage = '¡Autenticación exitosa! Redirigiendo...';
                setTimeout(() => {
                  this.$router.push('/home');
                }, 1000);
              } else {
                console.error('❌ No se encontró token en la respuesta');
                console.error('❌ Datos recibidos:', tokenResponse?.data);
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
  <div class="oauth-callback-container">
    <!-- Loading State -->
    <div v-if="loading && !showRoleSelection" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>{{ statusMessage }}</p>
    </div>

    <!-- Error State -->
    <div v-if="error && !showRoleSelection" class="error-state">
      <i class="pi pi-exclamation-circle"></i>
      <h2>Authentication Error</h2>
      <p>{{ error }}</p>
      <p>Redirecting to login...</p>
    </div>

    <!-- Role Selection State -->
    <div v-if="showRoleSelection" class="role-selection-container">
      <div class="role-card">
        <i class="pi pi-check-circle card-icon"></i>
        <h2>Welcome to Aid Manager</h2>
        <p>Please select your role to complete the setup:</p>
        
        <div class="role-buttons">
          <button class="role-btn manager-btn" @click="selectRole('Manager')">
            <i class="pi pi-chart-bar"></i>
            <span class="role-title">Manager</span>
            <span class="role-desc">Create & manage organizations</span>
          </button>
          <button class="role-btn member-btn" @click="selectRole('TeamMember')">
            <i class="pi pi-users"></i>
            <span class="role-title">Team Member</span>
            <span class="role-desc">Join an existing organization</span>
          </button>
        </div>

        <!-- Manager Form -->
        <form v-if="selectedRole === 'Manager'" class="org-form" @submit.prevent="submitManagerOrg">
          <h3>Create Your Organization</h3>
          <div class="form-group">
            <label>Organization Name</label>
            <input v-model="orgInput.orgName" type="text" placeholder="e.g., My Non-Profit" required />
          </div>
          <div class="form-group">
            <label>Country</label>
            <select v-model="orgInput.country" required>
              <option value="">Select Country</option>
              <option v-for="country in countries" :key="country" :value="country">{{ country }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Organization Email</label>
            <input v-model="orgInput.email" type="email" placeholder="org@example.com" required />
          </div>
          <button type="submit" class="submit-btn" :disabled="isSubmittingOrg">
            <i v-if="!isSubmittingOrg" class="pi pi-check"></i>
            <i v-else class="pi pi-spin pi-spinner"></i>
            {{ isSubmittingOrg ? 'Creating...' : 'Create Organization' }}
          </button>
        </form>

        <!-- Team Member Form -->
        <form v-if="selectedRole === 'TeamMember'" class="org-form" @submit.prevent="submitTeamMemberOrg">
          <h3>Join Organization</h3>
          <div class="form-group">
            <label>Organization Code</label>
            <input v-model="orgInput.orgCode" type="text" placeholder="e.g., ORG-ABC123" required />
          </div>
          <button type="submit" class="submit-btn" :disabled="isSubmittingOrg">
            <i v-if="!isSubmittingOrg" class="pi pi-check"></i>
            <i v-else class="pi pi-spin pi-spinner"></i>
            {{ isSubmittingOrg ? 'Joining...' : 'Join Organization' }}
          </button>
        </form>

        <!-- Error in form -->
        <div v-if="error && selectedRole" class="form-error">
          <i class="pi pi-exclamation-triangle"></i>
          {{ error }}
        </div>

        <!-- Success State -->
        <div v-if="statusMessage === 'Setup completed! Redirecting...'" class="success-state">
          <i class="pi pi-check-circle"></i>
          {{ statusMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.oauth-callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d4f1e4 0%, #a8e6d3 100%);
  padding: 20px;
}

.loading-state,
.error-state {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
}

.loading-state i,
.error-state i {
  font-size: 3rem;
  color: #02513D;
  display: block;
  margin-bottom: 1rem;
}

.error-state {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef5350;
}

.error-state i {
  color: #c62828;
}

.error-state h2 {
  margin: 0.5rem 0;
  color: #c62828;
}

.role-selection-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 600px;
}

.role-card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 100%;
}

.role-card h2 {
  color: #02513D;
  font-size: 2rem;
  margin: 0.5rem 0;
  text-align: center;
}

.card-icon {
  font-size: 3rem;
  color: #02513D;
  margin-bottom: 0.5rem;
  display: block;
}

.role-card p {
  color: #666;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.05rem;
}

.role-buttons {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.role-btn {
  flex: 1;
  min-width: 150px;
  padding: 1.2rem 1.5rem;
  border: 2px solid #02513D;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  color: #02513D;
}

.role-btn i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.role-title {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.role-desc {
  font-size: 0.85rem;
  font-weight: 400;
  opacity: 0.7;
  display: block;
}

.role-btn:hover {
  border-color: #02513D;
  background: #02513D;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(2, 81, 61, 0.15);
}

.role-btn:hover .role-desc {
  opacity: 0.9;
}

.org-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
  margin-top: 2rem;
}

.org-form h3 {
  color: #02513D;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #02513D;
  box-shadow: 0 0 4px rgba(2, 81, 61, 0.2);
}

.submit-btn {
  width: 100%;
  padding: 0.9rem;
  background: #02513D;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: #037c5a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(2, 81, 61, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  border: 1px solid #ef5350;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-error i {
  font-size: 1.2rem;
}

.success-state {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 1.5rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
  border: 1px solid #a5d6a7;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.success-state i {
  font-size: 1.5rem;
}

@media (max-width: 600px) {
  .role-card {
    padding: 1.5rem;
  }

  .role-card h2 {
    font-size: 1.5rem;
  }

  .role-buttons {
    flex-direction: column;
    gap: 1rem;
  }

  .role-btn {
    min-width: unset;
  }
}
</style>
