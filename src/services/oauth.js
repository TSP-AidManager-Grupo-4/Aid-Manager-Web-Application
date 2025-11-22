import axios from 'axios';

const AUTHORIZE_URL = '/api/v1/authorize';
const CALLBACK_EXCHANGE_URL = '/api/v1/authorize/callback';

export function startOAuth() {
    // Redirect browser to backend authorize endpoint to start OAuth2 flow
    window.location.href = AUTHORIZE_URL;
}

export async function exchangeCodeForToken(code) {
    // Call backend to exchange code for token/user payload
    // Backend should respond with JSON like { token: '...', user: {...} }.
    const resp = await axios.get(`${CALLBACK_EXCHANGE_URL}?code=${encodeURIComponent(code)}`);
    return resp.data;
}