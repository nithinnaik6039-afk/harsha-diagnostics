import { create } from 'zustand';
import axios from 'axios';

export const useAuthStore = create((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null,
  
  setAuth: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
    set({ token });
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
    set({ token: null });
  }
}));

// Global Axios response interceptor to handle expired sessions
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
