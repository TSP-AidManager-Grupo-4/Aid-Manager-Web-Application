import {createStore} from "vuex";
import {User} from "@/models/user.entity.js";
import {UserService} from "@/services/user.service.js";
import { authService } from "@/services/auth.service.js";

const userService = new UserService();

export const store = createStore({

    state: {
        user: authService.getUser() || JSON.parse(localStorage.getItem('user')) || User,
        form: {},
        selectedProject: null
    },
    mutations: {
        setToken(state, token) {
            sessionStorage.setItem('accessToken', token);
        },
        setUser(state, userId) {
            console.log('Trying to get user with ID:', userId);
            userService.getUserById(userId).then((response)=>{
                state.user = response.data;
                localStorage.setItem('user', JSON.stringify(response.data));
                console.log('User data retrieved:', response.data);
            })
        },
        removeUser( state ) {
            state.user = User;
            localStorage.removeItem('user');
        },
        removeToken( state ) {
            sessionStorage.removeItem('accessToken');
        },
        updateUserCompanyName(state, companyName) {
            state.user.companyName = companyName;
            localStorage.setItem('user', JSON.stringify(state.user));
        },
        updateForm(state, form) {
            console.log(form);
            state.form = form;
        },
        clearForm(state) {
            state.form = {};
        },
        setSelectedProject(state, project) {
            state.selectedProject = project;
        },
        clearSelectedProject(state) {
            state.selectedProject = null;
        },
    },
    actions: {
        async updateUser({ commit }, updatedUser) {
            console.log('Updating user:', updatedUser);
            commit('setUser', updatedUser.id);
        },
        async logout({ commit }) {
            await authService.logout();
            commit('removeUser');
            commit('removeToken');
        }
    }
});