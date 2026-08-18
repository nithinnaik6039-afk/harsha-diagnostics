import { create } from 'zustand';
import { mltStorage } from '../utils/storage';
import { ThemeMode } from '../constants/theme';

export interface ActiveOrder {
  _id: string;
  patient: {
    name: string;
    age: number;
    gender: string;
  };
  tests: Array<{
    _id: string;
    name: string;
    price: number;
    sampleType: string;
  }>;
  address: {
    addressLine: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  slot: {
    date: string;
    time: string;
  };
  status: string;
  payment: {
    status: string;
    amount: number;
    method: string;
  };
  safetyPin: string;
  distanceFromCenter?: number;
  collectionCharge?: number;
}

export interface MltProfile {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  rating?: number;
  isVerified?: boolean;
}

interface MltState {
  token: string | null;
  mlt: MltProfile | null;
  isOnline: boolean;
  theme: ThemeMode;
  activeOrder: ActiveOrder | null;
  setMltAuth: (token: string, mlt: MltProfile) => void;
  logout: () => void;
  setTheme: (theme: ThemeMode) => void;
  loadAuth: () => Promise<void>;
  toggleOnline: () => void;
  setActiveOrder: (order: ActiveOrder | null) => void;
}

export const useMltStore = create<MltState>((set) => ({
  token: null,
  mlt: null,
  isOnline: false,
  theme: 'midnight',
  activeOrder: null,

  setTheme: (theme) => {
    set({ theme });
    mltStorage.setItem('harsha_mlt_theme', theme);
  },

  setMltAuth: (token, mlt) => {
    set({ token, mlt });
    mltStorage.setItem('mlt_token', token);
    mltStorage.setItem('mlt_user', JSON.stringify(mlt));
  },
  
  logout: () => {
    set({ token: null, mlt: null, isOnline: false, activeOrder: null });
    mltStorage.removeItem('mlt_token');
    mltStorage.removeItem('mlt_user');
  },

  loadAuth: async () => {
    try {
      const token = await mltStorage.getItem('mlt_token');
      const userStr = await mltStorage.getItem('mlt_user');
      if (token && userStr) {
        set({ token, mlt: JSON.parse(userStr) });
      }
    } catch (e) {
      console.error('Error loading MLT auth from storage:', e);
    }
  },
  
  toggleOnline: () => set((state) => ({ isOnline: !state.isOnline })),
  
  setActiveOrder: (activeOrder) => set({ activeOrder })
}));
