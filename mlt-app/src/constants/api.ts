/**
 * Centralized API Backend URL Configuration
 * Prioritizes:
 * 1. EXPO_PUBLIC_BACKEND_URL from environment / cloud build (.env or EAS secret)
 * 2. Browser window location (if running on web)
 * 3. Fallback LAN IP for real Android APK devices on local WiFi
 */
export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location?.hostname
    ? `http://${window.location.hostname}:5005`
    : 'http://192.168.0.158:5005');
