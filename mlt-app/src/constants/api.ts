/**
 * Centralized API Backend URL Configuration
 * - Localhost / Local LAN IP: points to local backend on port 5005
 * - Vercel / Cloud Domain: points to live production backend on Render
 * - Native Android APK / iOS: uses EXPO_PUBLIC_BACKEND_URL or Render fallback
 */
const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.');

    if (isLocal) {
      return `http://${host}:5005`;
    }
  }

  return (
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    'https://harsha-diagnostics.onrender.com'
  );
};

export const BACKEND_URL = getBackendUrl();
