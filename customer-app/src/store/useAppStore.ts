import { create } from 'zustand';
import { appStorage } from '../utils/storage';
import { ThemeMode } from '../constants/theme';

export interface TestItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  sampleType: string;
  fastingRequirement?: string;
  turnaroundTime?: string;
  description?: string;
}

interface UserProfile {
  _id: string;
  name: string;
  phone: string;
  addresses: any[];
  familyMembers: any[];
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  dob?: string;
  emergencyContact?: string;
  firebaseUid?: string;
  profilePic?: string | null;
}

interface AppState {
  token: string | null;
  user: UserProfile | null;
  language: 'en' | 'te';
  theme: ThemeMode;
  cart: TestItem[];
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
  setLanguage: (lang: 'en' | 'te') => void;
  toggleLanguage: () => void;
  setTheme: (theme: ThemeMode) => void;
  addToCart: (item: TestItem) => void;
  removeFromCart: (itemId: string) => void;
  isInCart: (itemId: string) => boolean;
  clearCart: () => void;
  setProfilePic: (pic: string | null) => void;
  loadAuth: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  token: null,
  user: null,
  language: 'en',
  theme: 'midnight',
  cart: [],

  setTheme: (theme) => {
    set({ theme });
    appStorage.setItem('harsha_customer_theme', theme);
  },

  setAuth: (token, user) => {
    set({ token, user });
    appStorage.setItem('authToken', token);
    appStorage.setItem('authUser', JSON.stringify(user));
  },

  setProfilePic: (pic) => set((state) => ({
    user: state.user ? { ...state.user, profilePic: pic } : null
  })),
  
  logout: () => {
    set({ token: null, user: null, cart: [] });
    appStorage.removeItem('authToken');
    appStorage.removeItem('authUser');
  },
  
  // Load persisted auth on store init
  loadAuth: async () => {
    const token = await appStorage.getItem('authToken');
    const userStr = await appStorage.getItem('authUser');
    if (token && userStr) {
      try {
        set({ token, user: JSON.parse(userStr) });
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  },
  
  setLanguage: (language) => set({ language }),
  
  toggleLanguage: () => set((state) => ({ 
    language: state.language === 'en' ? 'te' : 'en' 
  })),

  addToCart: (item) => set((state) => {
    // Prevent duplicate entries of the same test in the cart
    if (state.cart.some((cartItem) => cartItem._id === item._id)) {
      return { cart: state.cart };
    }
    return { cart: [...state.cart, item] };
  }),

  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter((item) => item._id !== itemId)
  })),

  isInCart: (itemId) => {
    return get().cart.some((item) => item._id === itemId);
  },

  clearCart: () => set({ cart: [] })
}));
