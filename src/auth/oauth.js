// File: `src/auth/oauth.js`
export function loginWithOAuth(provider = 'google') {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const base = import.meta.env.VITE_OAUTH_BASE || `${window.location.origin}/api/v1/auth`;
    const clientId = import.meta.env[`VITE_${provider.toUpperCase()}_CLIENT_ID`] || '';
    const state = Math.random().toString(36).substring(2); // simple state
    const scope = encodeURIComponent(import.meta.env.VITE_OAUTH_SCOPE || 'profile email');
    const authUrl = `${base}/authorize?provider=${encodeURIComponent(provider)}&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

    const w = 600;
    const h = 700;
    const left = window.screenX + (window.innerWidth - w) / 2;
    const top = window.screenY + (window.innerHeight - h) / 2;

    const popup = window.open(authUrl, 'oauth', `width=${w},height=${h},left=${left},top=${top},resizable,scrollbars`);

    if (!popup) {
        console.warn('Popup blocked. Redirecting instead.');
        window.location.href = authUrl;
        return;
    }

    // Optional: monitor popup and close when done (callback must communicate back)
    const timer = setInterval(() => {
        if (popup.closed) {
            clearInterval(timer);
            // Optionally emit an event or call a callback to refresh auth state
        }
    }, 500);
}

export function parseOAuthCallbackUrl(url = window.location.href) {
    const u = new URL(url);
    const params = Object.fromEntries(u.searchParams.entries());
    return params; // contains code, state, error, etc.
}