/**
 * Universal safe storage adapter for React Native Web & Native
 */

const memoryStorage = new Map<string, string>();

export const appStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStorage.get(key) || null;
    } catch (e) {
      return memoryStorage.get(key) || null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      memoryStorage.set(key, value);
    } catch (e) {
      memoryStorage.set(key, value);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      memoryStorage.delete(key);
    } catch (e) {
      memoryStorage.delete(key);
    }
  }
};
