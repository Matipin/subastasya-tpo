// IMPORTANTE: IP correcta para tu Wi-Fi u URL del tunnel. Usa 10.0.2.2 para emulador Android.
export const API_BASE_URL = 'http://10.0.2.2:8080/api/v1/auth';

// Interceptor global para saltear las pantallas de advertencia de los túneles (Localtunnel, Ngrok, etc.)
const originalFetch = global.fetch;
global.fetch = function (uri, options = {}) {
  options.headers = {
    ...options.headers,
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
  };
  return originalFetch(uri, options);
};