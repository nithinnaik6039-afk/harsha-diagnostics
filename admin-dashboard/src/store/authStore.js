import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('admin_token') || null,
  
  setAuth: (token) => {
    localStorage.setItem('admin_token', token);
    set({ token });
  },
  
  logout: () => {
    localStorage.removeItem('admin_token');
    set({ token: null });
  }
}));
