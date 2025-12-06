import axios from "axios";
import {environment} from "@/environment/environment.js";

export class UserService {

    http = null;
    constructor() {
        this.http = axios.create({
            baseURL: environment.baseUrl
        })
    }

    async signUpUser(user) {
        try {
            const response = await this.http.post('users/sign-up',user);
            console.log('response', response)
            return response;
        }catch(e) {
            console.log('Error to sign up user', e)
            return null;
        }
    }

    async signInUser(username, password) {
        try {
            return await this.http.post('authentication/sign-in', {
                email: username,
                password: password
            })
        }catch(e) {
            return e;
        }
    }

    // Método para iniciar el flujo de Google OAuth2
    // Este endpoint NO requiere bearer token
    async initiateGoogleOAuth() {
        try {
            console.log('🔷 UserService: Llamando a GET api/v1/authorize');
            console.log('🔷 baseURL:', this.http.defaults.baseURL);
            console.log('🔷 URL completa:', `${this.http.defaults.baseURL}/api/v1/authorize`);

            // GET /api/v1/authorize - devuelve la URL de autorización de Google
            const response = await this.http.get('api/v1/authorize', {
                validateStatus: function (status) {
                    // Aceptar cualquier status para poder manejarlo nosotros
                    return status < 600;
                }
            });

            console.log('✅ UserService: Respuesta recibida');
            console.log('✅ Status:', response.status);
            console.log('✅ Data:', response.data);
            console.log('✅ Data type:', typeof response.data);

            // Si el status no es 200, lanzar error
            if (response.status !== 200) {
                console.error('❌ Status code no exitoso:', response.status);
                console.error('❌ Response data:', response.data);

                const error = new Error(`Server error: ${response.status}`);
                error.response = response;
                throw error;
            }

            return response;
        } catch(e) {
            console.error('❌ UserService: Error al iniciar Google OAuth');
            console.error('❌ Error completo:', e);
            console.error('❌ Error message:', e.message);

            if (e.response) {
                console.error('❌ Response status:', e.response.status);
                console.error('❌ Response data:', e.response.data);
                console.error('❌ Response headers:', e.response.headers);
            }

            if (e.request) {
                console.error('❌ Request:', e.request);
            }

            throw e;
        }
    }

    // Método para manejar el callback de Google OAuth2 con el código
    async handleGoogleCallback(code) {
        try {
            // GET /api/v1/authorize/callback?code={code}
            // Este endpoint procesa el código de Google
            const response = await this.http.get('api/v1/authorize/callback', {
                params: { code }
            });
            console.log('Respuesta del callback:', response);
            return response;
        } catch(e) {
            console.error('Error en callback de Google OAuth:', e);
            throw e;
        }
    }

    // Método para obtener el token usando el userId
    // GET /api/v1/authorize/token/{userId}
    // IMPORTANTE: Este endpoint NO debe requerir bearer token
    async getTokenByUserId(userId) {
        try {
            console.log('🔷 UserService: Llamando a GET api/v1/authorize/token/' + userId);
            console.log('🔷 URL completa:', `${this.http.defaults.baseURL}/api/v1/authorize/token/${userId}`);

            // NO enviar headers de autorización para este endpoint
            // porque es parte del flujo de login
            const response = await this.http.get(`api/v1/authorize/token/${userId}`, {
                // Sin headers de autorización
                headers: {
                    'Content-Type': 'application/json'
                },
                validateStatus: function (status) {
                    return status < 600;
                }
            });

            console.log('✅ UserService: Respuesta recibida de token endpoint');
            console.log('✅ Status:', response.status);
            console.log('✅ Data:', response.data);
            console.log('✅ Data type:', typeof response.data);

            if (response.status !== 200) {
                console.error('❌ Status code no exitoso:', response.status);
                console.error('❌ Response data:', response.data);

                if (response.status === 401) {
                    console.error('🔴 ERROR 401: El backend requiere que configures [AllowAnonymous]');
                    console.error('🔴 en el endpoint /api/v1/authorize/token/{userId}');
                }

                const error = new Error(`Server error: ${response.status}`);
                error.response = response;
                throw error;
            }

            return response;
        } catch(e) {
            console.error('❌ UserService: Error al obtener token por userId');
            console.error('❌ Error completo:', e);
            console.error('❌ Error message:', e.message);

            if (e.response) {
                console.error('❌ Response status:', e.response.status);
                console.error('❌ Response data:', e.response.data);
            }

            throw e;
        }
    }

    async getAllUsers() {
        try {
            const headers = this.getHeadersAuthorization();
            const response = await this.http.get('users', { headers });
            return response;
        } catch (error) {
            console.error('Error al obtener todos los usuarios:', error);
            throw error;
        }
    }

    async getCompanyInformationByCode(identificationCode) {
        try {
            const companyResponse = await this.http.get(`companies/?identificationCode=${identificationCode}`);
            return companyResponse.data[0];
        } catch (error) {
            console.error(`Error al obtener la información de la compañía con el código de identificación ${identificationCode}:`, error);
            throw error;
        }
    }

    async getUserById( id ){
        const headers = this.getHeadersAuthorization();
        console.log('headers', headers)
        console.log('user id to retrieve', id)
        try {
            const response = await this.http.get(`users/user/${id}`, { headers });
            console.log('response', response)
            return response;
        } catch (error) {
            console.error(`Error al obtener el usuario con id ${id}:`, error);
            throw error;
        }
    }

    async getUsersByRole( role ) {
        try {
            const response = await this.http.get(`users/?role=${role}`);
            return response;
        } catch (error) {
            console.error(`Error al obtener usuarios con el rol ${role}:`, error);
            throw error;
        }
    }

    async createNewUser( user ) {
        try {
            const headers = this.getHeadersAuthorization();
            console.log('user to create', user)
            return await this.http.post('users', user, { headers });
        } catch (error) {
            console.error('Error al crear un nuevo usuario:', error);
            throw error;
        }
    }

    async updateUser(user) {
        try {
            const headers = this.getHeadersAuthorization();
            console.log('user to update', user)

            const parts = user.name.trim().split(' ');
            const firstName = parts[0] || '';
            const lastName = parts.slice(1).join(' ') || '';

            const userbody = {
                firstName: firstName,
                lastName: lastName,
                age: user.age,
                phone: user.phone,
                email: user.email,
                password: user.password,
                profileImg: user.profileImg,
            }
            console.log('userbody', userbody)
            const response = await this.http.put(`users/${user.id}`, userbody, { headers });
            return response.data;
        } catch (error) {
            console.error('Error al actualizar el usuario:', error);
            throw error;
        }
    }

    async updateUserByEmail(email, body) {
        const newBody = {
            firstName: body.firstName,
            lastName: body.lastName,
            age: body.age,
            phone: body.phone,
            occupation: body.occupation,
            password: body.password,
            profileImg: body.profileImg,
            role: body.role,
            companyName: body.companyName,
            bio: body.bio,
            companyId: body.companyId,
        }

        try {
            const headers = this.getHeadersAuthorization();
            const response = await this.http.put(`users?email=${email}`, newBody, { headers });
            return response;
        }catch(e) {
            console.log('Error to update user')
            return null;
        }
    }

    getHeadersAuthorization() {
        return {
            "Authorization": `Bearer ${localStorage.getItem('token')}`,
            "Content-Type": "application/json"
        }
    }
}