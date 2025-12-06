<script>
import {UserService} from "@/services/user.service.js";
import {mapState} from "vuex";
import {fetchAllTaskDataByUserId} from "@/services/projects-api.services.js";

export default {
  name: "ProfileContent",
  computed: {
    user() {
      return this.$store.state.user;
    },
    filteredTasks() {
    return this.tasks
      .filter(task => !this.taskFilters.status || task.status === this.taskFilters.status)
      .filter(task => !this.taskFilters.date || task.dueDate === this.taskFilters.date);
  }
  },
  data() {
    return {
      isFieldsEmpty: false,
      userService: new UserService(),
      showPopUp: false,
      showImageUrlInput: false,
      inputUpdateInfo: {
        firstName: "",
        lastName: "",
        email: "",
        age: "",
        phone: "",
        occupation: "",
        bio: "",
        profileImg: ""
      },
      editField: {
        fullName: false,
        email: false,
        age: false,
        phone: false,
        occupation: false,
        bio: false,
        profileImg: false
      },
      tasks: [],
      taskFilters: {
        status: '',
        date: ''
      },
      roleUpdateStatus: '',
      selectedRole: '',
      orgInput: {
        orgName: '',
        country: '',
        email: '',
        orgCode: ''
      },
      isSubmittingOrg: false,
      countries: ['Spain', 'USA', 'UK', 'Germany', 'France', 'Italy', 'Portugal', 'Other']
    };
  },
  methods: {
    clearInputUpdateInfo() {
      this.inputUpdateInfo = {
        firstName: "",
        lastName: "",
        email: "",
        age: "",
        phone: "",
        occupation: "",
        bio: "",
        profileImg: ""
      };
    },

    togglePopUp() {
      this.showPopUp = !this.showPopUp;
      this.editField = {
        fullName: false,
        email: false,
        age: false,
        phone: false,
        occupation: false,
        bio: false,
        profileImg: false
      };
    },
    async updateProfileImg() {
      if(this.inputUpdateInfo.profileImg === "") {
        return;
      }

      const newUser = {
        ...this.user,
        profileImg: this.inputUpdateInfo.profileImg,
        id: this.$route.params.id
      };

      const response = this.userService.updateUser(newUser);
      response.then((data) => {

        console.log('data updated', data)

        const user = data;

        this.$store.dispatch('updateUser', user);

        this.clearInputUpdateInfo(); // limpamos el form luego de enviado
        this.togglePopUp(); // cerramos el popap >.<
      })
          .catch((error) => {
            console.error('Error al actualizar el usuario:', error);
          });
    },

    ToggleInputProfileImage() {
      this.showImageUrlInput = !this.showImageUrlInput;
      this.updateProfileImg();
    },

    toggleEditField(field) {
      this.editField[field] = true;
    },

    async updateProfile() {
      // Validate that at least one field was edited and has a value
      const hasChanges = (
        (this.editField.fullName && this.inputUpdateInfo.firstName && this.inputUpdateInfo.lastName) ||
        (this.editField.email && this.inputUpdateInfo.email)
      );

      if (!hasChanges) {
        this.isFieldsEmpty = true;
        return;
      }

      try {
        // Build update payload with edited fields
        const updatePayload = {
          firstName: this.editField.fullName ? this.inputUpdateInfo.firstName : this.user.firstName,
          lastName: this.editField.fullName ? this.inputUpdateInfo.lastName : this.user.lastName,
          email: this.editField.email ? this.inputUpdateInfo.email : this.user.email,
          profileImg: this.editField.profileImg ? this.inputUpdateInfo.profileImg : this.user.profileImg
        };

        console.log('📝 Updating user profile with:', updatePayload);

        // Call service to update user
        const response = await this.userService.updateUserProfile(this.user.id, updatePayload);
        console.log('✅ Profile updated:', response);

        // Update store with new user data
        const updatedUser = {
          ...this.user,
          ...response
        };
        this.$store.commit('setUser', updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Reset form
        this.clearInputUpdateInfo();
        this.togglePopUp();
      } catch (error) {
        console.error('❌ Error updating profile:', error);
        this.isFieldsEmpty = true;
      }

    },
    async fetchUserTasks() {
      // Reemplaza esto por tu servicio real
      const allTasks = await fetchAllTaskDataByUserId(1, this.user.id);
      this.tasks = allTasks;
    },
    selectRole(role) {
      this.selectedRole = role;
      this.roleUpdateStatus = '';
      this.orgInput = { orgName: '', country: '', email: '', orgCode: '' };
    },
    async submitManagerOrg() {
      if (!this.orgInput.orgName || !this.orgInput.country || !this.orgInput.email) {
        this.roleUpdateStatus = 'error';
        return;
      }
      this.isSubmittingOrg = true;
      try {
        const payload = {
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          profileImg: this.user.profileImg,
          role: 0,
          companyName: this.orgInput.orgName,
          companyEmail: this.orgInput.email,
          companyCountry: this.orgInput.country,
          companyCode: null
        };
        const result = await this.userService.completeOAuth(this.user.id, payload);
        this.$store.dispatch('updateUser', result);
        localStorage.setItem('user', JSON.stringify(result));
        this.roleUpdateStatus = 'success';
        setTimeout(() => {
          this.$router.push('/home');
        }, 1500);
      } catch (e) {
        console.error('Error completing manager setup:', e);
        this.roleUpdateStatus = 'error';
      } finally {
        this.isSubmittingOrg = false;
      }
    },
    async submitTeamMemberOrg() {
      if (!this.orgInput.orgCode) {
        this.roleUpdateStatus = 'error';
        return;
      }
      this.isSubmittingOrg = true;
      try {
        const payload = {
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          profileImg: this.user.profileImg,
          role: 1,
          companyName: null,
          companyEmail: null,
          companyCountry: null,
          companyCode: this.orgInput.orgCode
        };
        const result = await this.userService.completeOAuth(this.user.id, payload);
        this.$store.dispatch('updateUser', result);
        localStorage.setItem('user', JSON.stringify(result));
        this.roleUpdateStatus = 'success';
        setTimeout(() => {
          this.$router.push('/home');
        }, 1500);
      } catch (e) {
        console.error('Error completing team member setup:', e);
        this.roleUpdateStatus = 'error';
      } finally {
        this.isSubmittingOrg = false;
      }
    },
    goToProject(projectId) {
      this.$router.push({ name: 'projectTodo', params: { id: projectId } });
    }
  },
  
  mounted() {
  this.fetchUserTasks();
}

}


</script>

<template>

  <div class="content">
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img :src="user.profileImg || 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'" alt="User Photo" class="avatar-img">
            <div class="avatar-overlay" @click="ToggleInputProfileImage">
              <i class="pi pi-camera"></i>
            </div>
          </div>
        </div>
        <div class="profile-header-info">
          <h2 class="profile-name">{{ (user.firstName || '') + ' ' + (user.lastName || '') }}</h2>
          <p class="profile-email">{{ user.email || 'No email' }}</p>
          <span class="profile-role-badge" :class="user.role ? 'active' : 'inactive'">
            <i :class="user.role === 'Manager' ? 'pi pi-chart-bar' : 'pi pi-users'"></i>
            {{ user.role || 'No role assigned' }}
          </span>
        </div>
      </div>
      
      <div class="profile-body">
        <div class="info-grid">
          <div class="info-item">
            <i class="pi pi-user info-icon"></i>
            <div class="info-content">
              <span class="info-label">First Name</span>
              <span class="info-value">{{ user.firstName || 'No info' }}</span>
            </div>
          </div>
          <div class="info-item">
            <i class="pi pi-user info-icon"></i>
            <div class="info-content">
              <span class="info-label">Last Name</span>
              <span class="info-value">{{ user.lastName || 'No info' }}</span>
            </div>
          </div>
          <div class="info-item">
            <i class="pi pi-building info-icon"></i>
            <div class="info-content">
              <span class="info-label">Company ID</span>
              <span class="info-value">{{ user.companyId !== undefined ? user.companyId : 'No info' }}</span>
            </div>
          </div>
          <div class="info-item">
            <i class="pi pi-briefcase info-icon"></i>
            <div class="info-content">
              <span class="info-label">Role</span>
              <span class="info-value">{{ user.role || 'Not set' }}</span>
            </div>
          </div>
        </div>
        
        <div class="profile-actions">
          <button v-if="!showPopUp" class="edit-button" @click="togglePopUp">
            <i class="pi pi-user-edit"></i>
            Edit Profile
          </button>
          <button v-else class="edit-button save-btn" type="submit" @click="updateProfile">
            <i class="pi pi-check"></i>
            Save Changes
          </button>
        </div>

        <!-- Edit Form Modal -->
        <div v-if="showPopUp" class="edit-form-modal">
          <h3>Edit Profile</h3>
          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label>First Name</label>
              <input 
                v-model="inputUpdateInfo.firstName" 
                type="text" 
                :placeholder="user.firstName || 'First Name'"
                @focus="editField.fullName = true"
              />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input 
                v-model="inputUpdateInfo.lastName" 
                type="text" 
                :placeholder="user.lastName || 'Last Name'"
                @focus="editField.fullName = true"
              />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input 
                v-model="inputUpdateInfo.email" 
                type="email" 
                :placeholder="user.email || 'Email'"
                @focus="editField.email = true"
              />
            </div>
            <div class="form-group">
              <label>Profile Image URL</label>
              <input 
                v-model="inputUpdateInfo.profileImg" 
                type="text" 
                :placeholder="user.profileImg || 'Image URL'"
                @focus="editField.profileImg = true"
              />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-save">
                <i class="pi pi-check"></i>
                Save Changes
              </button>
              <button type="button" class="btn-cancel" @click="togglePopUp">
                <i class="pi pi-times"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Onboarding Stepper for missing role -->
    <div v-if="!user.role" class="onboarding-container">
      <div class="onboarding-stepper">
        <i class="pi pi-user-plus card-icon"></i>
        <h3>Welcome to Aid Manager</h3>
        <p>Please select your role to continue:</p>
        <div class="role-select">
          <button class="role-btn" @click="selectRole('Manager')">
            <i class="pi pi-chart-bar"></i>
            <span>Manager</span>
          </button>
          <button class="role-btn" @click="selectRole('TeamMember')">
            <i class="pi pi-users"></i>
            <span>Team Member</span>
          </button>
        </div>

        <!-- Manager Form -->
        <form v-if="selectedRole === 'Manager'" class="onboarding-form" @submit.prevent="submitManagerOrg">
          <h4>Create Your Organization</h4>
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
          <button type="submit" class="submit-role-btn" :disabled="isSubmittingOrg">
            <i v-if="!isSubmittingOrg" class="pi pi-check"></i>
            <i v-else class="pi pi-spin pi-spinner"></i>
            {{ isSubmittingOrg ? 'Creating...' : 'Create Organization' }}
          </button>
        </form>

        <!-- Team Member Form -->
        <form v-if="selectedRole === 'TeamMember'" class="onboarding-form" @submit.prevent="submitTeamMemberOrg">
          <h4>Join Organization</h4>
          <div class="form-group">
            <label>Organization Code</label>
            <input v-model="orgInput.orgCode" type="text" placeholder="e.g., ORG-ABC123" required />
          </div>
          <button type="submit" class="submit-role-btn" :disabled="isSubmittingOrg">
            <i v-if="!isSubmittingOrg" class="pi pi-check"></i>
            <i v-else class="pi pi-spin pi-spinner"></i>
            {{ isSubmittingOrg ? 'Joining...' : 'Join Organization' }}
          </button>
        </form>

        <!-- Status Messages -->
        <div v-if="roleUpdateStatus === 'success'" class="role-success">
          <i class="pi pi-check-circle"></i>
          Setup completed! Redirecting...
        </div>
        <div v-if="roleUpdateStatus === 'error'" class="role-error">
          <i class="pi pi-exclamation-triangle"></i>
          Error: Please check your inputs and try again.
        </div>
      </div>
    </div>


    <pv-dialog :style="{margin: '0 10px'}" :visible.sync="showImageUrlInput" :modal="true" :closable="false">
      <div class="p-5 flex flex-column align-items-center gap-5 text-center">
        <h2>Enter your profile image url: </h2>
        <input type="text" placeholder="Profile Image Url" v-model="inputUpdateInfo['profileImg']" >
        <pv-button class="py-3 px-5" label="OK" @click="ToggleInputProfileImage"/>
      </div>
    </pv-dialog>




    <pv-dialog :style="{margin: '0 10px'}" :visible.sync="isFieldsEmpty" :modal="true" :closable="false">
      <div class="error-modal p-5 flex flex-column align-items-center gap-5 text-center">
        <i class="text-7xl pi pi-times-circle text-red-500"></i>
        <h1>Fill the formulary!</h1>
        <p class="text-md">There is no information to update a user</p>
        <pv-button class="py-3 px-5" label="OK" @click="isFieldsEmpty = false"/>
      </div>
    </pv-dialog>
<div class="container-for-task" v-if="this.$store.state.user.role !== 'Manager'">
  <div class="user-tasks" style="margin-top: 2rem;">
    <h1 style="margin-bottom: 1rem;">My Tasks</h1>
    <!-- Filtros -->
    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
      <select v-model="taskFilters.status" style="padding: 0.3rem; border-radius: 5px;">
        <option value="">All Status</option>
        <option value="Pendiente">Pendiente</option>
        <option value="En progreso">En progreso</option>
        <option value="Completada">Completada</option>
      </select>
      <input type="date" v-model="taskFilters.date" style="padding: 0.3rem; border-radius: 5px;" />
    </div>
    <!-- Lista de tareas -->
    <div v-if="filteredTasks.length">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-card"
        style="margin-bottom: 1rem; border-left: 4px solid #4CAF50; box-shadow: 0 2px 8px rgba(0,0,0,0.06); cursor:pointer;"
        @click="goToProject(task.projectId)"
      >
        <div class="title" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="task-title" style="font-weight: bold;">{{ task.title }}</span>
          <span style="font-size: 0.9em; color: #888;">{{ task.status }}</span>
        </div>
        <div style="color: #555;">{{ task.description }}</div>
        <div style="font-size: 0.9em; color: #888;">
          Due: <i class="pi pi-calendar" style="color: #02513D; margin-right: 4px;"></i>{{ task.dueDate }}
        </div>
      </div>
    </div>
    <div v-else style="color: #888;">No tasks found.</div>
  </div>

</div>

  </div>

<!-- Se agrega Experiment card feature-->


</template>

<style scoped>

/* Modern Profile Card Design */
.profile-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  max-width: 900px;
  margin: 0 auto;
}

.profile-header {
  background: linear-gradient(135deg, #d4f1e4 0%, #a8e6d3 100%);
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.avatar-section {
  flex-shrink: 0;
}

.avatar-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.avatar-overlay:hover {
  opacity: 1;
}

.avatar-overlay i {
  font-size: 2rem;
  color: white;
}

.profile-header-info {
  flex: 1;
  min-width: 200px;
}

.profile-name {
  font-size: 1.8rem;
  font-weight: 700;
  color: #02513D;
  margin: 0 0 0.5rem 0;
}

.profile-email {
  color: #555;
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
}

.profile-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.profile-role-badge.active {
  background: #02513D;
  color: white;
}

.profile-role-badge.inactive {
  background: #e0e0e0;
  color: #666;
}

.profile-body {
  padding: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #02513D;
}

.info-icon {
  font-size: 1.5rem;
  color: #02513D;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  color: #333;
  font-weight: 500;
}

.profile-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.content {
  padding: 30px;
}

.edit-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  border: 2px solid #02513D;
  background-color: transparent;
  color: #02513D;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.edit-button:hover {
  background-color: #02513D;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(2, 81, 61, 0.3);
}

.edit-button.save-btn {
  background-color: #02513D;
  color: white;
}

.edit-button.save-btn:hover {
  background-color: #037c5a;
}



/* Onboarding Container and Stepper Styles */
.onboarding-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  padding: 0 20px;
}

.onboarding-stepper {
  width: 100%;
  max-width: 500px;
  padding: 2.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  text-align: center;
}

.card-icon {
  font-size: 3rem;
  color: #02513D;
  margin-bottom: 1rem;
}

.onboarding-stepper h3 {
  font-size: 1.8rem;
  margin: 0.5rem 0;
  color: #02513D;
  font-weight: 700;
}

.onboarding-stepper p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.role-select {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.role-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.2rem 2rem;
  border: 2px solid #02513D;
  border-radius: 12px;
  background: white;
  color: #02513D;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
}

.role-btn i {
  font-size: 1.8rem;
}

.role-btn:hover:not(:disabled) {
  background: #02513D;
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(2, 81, 61, 0.3);
}

.role-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-role-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem;
  border: none;
  border-radius: 8px;
  background: #02513D;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.submit-role-btn:hover:not(:disabled) {
  background: #037c5a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(2, 81, 61, 0.3);
}

.submit-role-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Edit Form Modal Styles */
.edit-form-modal {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  margin-top: 1.5rem;
  border: 2px solid #d4f1e4;
}

.edit-form-modal h3 {
  margin: 0 0 1.5rem 0;
  color: #02513D;
  font-weight: 700;
  font-size: 1.3rem;
}

.edit-form-modal .form-group {
  margin-bottom: 1.3rem;
}

.edit-form-modal .form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.95rem;
}

.edit-form-modal .form-group input {
  width: 100%;
  padding: 0.85rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;
  box-sizing: border-box;
  background: white;
}

.edit-form-modal .form-group input:focus {
  border-color: #02513D;
  outline: none;
  box-shadow: 0 0 0 3px rgba(2, 81, 61, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-save,
.btn-cancel {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-save {
  background: linear-gradient(135deg, #02513D 0%, #03754F 100%);
  color: white;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(2, 81, 61, 0.3);
}

.btn-cancel {
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
}

.btn-cancel:hover {
  border-color: #666;
  background: #f5f5f5;
}

.onboarding-form {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  text-align: left;
  margin-bottom: 1rem;
}

.onboarding-form h4 {
  margin: 0 0 1.5rem 0;
  color: #02513D;
  font-weight: 700;
  font-size: 1.2rem;
}

.form-group {
  margin-bottom: 1.3rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.95rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.85rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;
  box-sizing: border-box;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #02513D;
  box-shadow: 0 0 0 3px rgba(2, 81, 61, 0.1);
}

.role-success {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  margin-top: 1rem;
  border: 1px solid #a5d6a7;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.role-success i {
  font-size: 1.2rem;
}

.role-error {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  margin-top: 1rem;
  border: 1px solid #ef5350;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.role-error i {
  font-size: 1.2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-header-info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .onboarding-stepper {
    padding: 1.5rem;
    margin: 0 10px;
  }

  .onboarding-stepper h3 {
    font-size: 1.5rem;
  }

  .role-select {
    flex-direction: column;
    width: 100%;
  }

  .role-btn {
    width: 100%;
  }

  .onboarding-form {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .profile-card {
    border-radius: 0;
    margin: 0;
  }

  .profile-header {
    padding: 1.5rem;
  }

  .profile-body {
    padding: 1.5rem;
  }

  .avatar-wrapper {
    width: 100px;
    height: 100px;
  }

  .profile-name {
    font-size: 1.5rem;
  }

  .info-item {
    padding: 0.75rem;
  }

  .onboarding-stepper {
    padding: 1.25rem;
  }

  .card-icon {
    font-size: 2.5rem;
  }
}

</style>
