// javascript
// File: src/services/auth.service.js

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const TOKEN_PATH = import.meta.env.VITE_OAUTH_TOKEN_PATH || '/oauth/token';
const CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID || ''; // optional for some backends

const STORAGE_KEYS = {
    ACCESS: 'access_token',
    REFRESH: 'refresh_token',
    EXPIRES_AT: 'token_expires_at'
};

class AuthService {
    constructor() {
        this.axios = axios.create({ baseURL: API_BASE });
        this.isRefreshing = false;
        this.refreshSubscribers = [];
        this._setupInterceptor();
    }

    // Helper: decode JWT payload
    _parseJwt(token) {
        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            return payload;
        } catch (e) {
            return null;
        }
    }

    // Save tokens & compute expiry
    _storeTokens({ access_token, refresh_token, expires_in }) {
        if (access_token) localStorage.setItem(STORAGE_KEYS.ACCESS, access_token);
        if (refresh_token) localStorage.setItem(STORAGE_KEYS.REFRESH, refresh_token);
        if (expires_in) {
            const expiresAt = Date.now() + expires_in * 1000;
            localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt));
        }
    }

    // Remove tokens
    signOut() {
        localStorage.removeItem(STORAGE_KEYS.ACCESS);
        localStorage.removeItem(STORAGE_KEYS.REFRESH);
        localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    }

    getAccessToken() {
        return localStorage.getItem(STORAGE_KEYS.ACCESS);
    }

    getRefreshToken() {
        return localStorage.getItem(STORAGE_KEYS.REFRESH);
    }

    isAuthenticated() {
        const token = this.getAccessToken();
        const exp = Number(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || 0);
        return !!token && Date.now() < exp;
    }

    getUser() {
        const token = this.getAccessToken();
        const payload = token ? this._parseJwt(token) : null;
        return payload || null;
    }

    // OAuth2 password grant (common for SPAs with backend support)
    async signIn(email, password) {
        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'password');
            params.append('username', email);
            params.append('password', password);
            if (CLIENT_ID) params.append('client_id', CLIENT_ID);

            const res = await this.axios.post(TOKEN_PATH, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const data = res.data;
            this._storeTokens({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in
            });

            return {
                success: true,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                user: this._parseJwt(data.access_token)
            };
        } catch (err) {
            const message = err?.response?.data?.error_description || err?.response?.data?.message || err.message || 'Login failed';
            return { success: false, message };
        }
    }

    // Refresh token flow
    async refreshToken() {
        const refresh = this.getRefreshToken();
        if (!refresh) {
            throw new Error('No refresh token available');
        }

        // Prevent multiple concurrent refresh calls
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.refreshSubscribers.push({ resolve, reject });
            });
        }

        this.isRefreshing = true;

        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token');
            params.append('refresh_token', refresh);
            if (CLIENT_ID) params.append('client_id', CLIENT_ID);

            const res = await this.axios.post(TOKEN_PATH, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const data = res.data;
            this._storeTokens({
                access_token: data.access_token,
                refresh_token: data.refresh_token || refresh, // some servers don't return a new refresh token
                expires_in: data.expires_in
            });

            // notify queued requests
            this.refreshSubscribers.forEach(s => s.resolve(data.access_token));
            this.refreshSubscribers = [];
            this.isRefreshing = false;
            return data.access_token;
        } catch (err) {
            this.refreshSubscribers.forEach(s => s.reject(err));
            this.refreshSubscribers = [];
            this.isRefreshing = false;
            this.signOut();
            throw err;
        }
    }

    // Axios interceptor: attaches token and refreshes on 401
    _setupInterceptor() {
        // attach token
        this.axios.interceptors.request.use((config) => {
            const token = this.getAccessToken();
            if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
            return config;
        });

        // response interceptor for 401 -> try refresh
        this.axios.interceptors.response.use(
            (resp) => resp,
            async (error) => {
                const originalRequest = error.config;
                if (!originalRequest) return Promise.reject(error);

                const status = error.response?.status;
                // if unauthorized and we haven't already retried
                if (status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        const newToken = await this.refreshToken();
                        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newToken}` };
                        return this.axios(originalRequest);
                    } catch (refreshErr) {
                        // refresh failed; sign out
                        this.signOut();
                        return Promise.reject(refreshErr);
                    }
                }
                return Promise.reject(error);
            }
        );
    }
}

export default new AuthService();