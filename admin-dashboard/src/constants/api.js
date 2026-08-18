export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')
    ? `http://${window.location.hostname}:5005`
    : 'https://harsha-diagnostics.onrender.com');
