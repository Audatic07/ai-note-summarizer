import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import { User, NoteListItem } from '../types';

export const storage = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Storage get error for ${key}:`, error);
      return null;
    }
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Storage set error for ${key}:`, error);
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage remove error for ${key}:`, error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },
};

export const guestStorage = {
  getGuestId: (): Promise<string | null> => storage.get<string>(STORAGE_KEYS.GUEST_ID),
  setGuestId: (guestId: string): Promise<void> => storage.set(STORAGE_KEYS.GUEST_ID, guestId),
  clearGuestId: (): Promise<void> => storage.remove(STORAGE_KEYS.GUEST_ID),
};

export const userStorage = {
  getUser: (): Promise<User | null> => storage.get<User>(STORAGE_KEYS.USER_DATA),
  setUser: (user: User): Promise<void> => storage.set(STORAGE_KEYS.USER_DATA, user),
  clearUser: (): Promise<void> => storage.remove(STORAGE_KEYS.USER_DATA),
};

export const notesCache = {
  getNotes: async (): Promise<NoteListItem[]> => {
    const cached = await storage.get<{ notes: NoteListItem[]; timestamp: number }>(STORAGE_KEYS.NOTES_CACHE);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) return cached.notes;
    return [];
  },
  setNotes: (notes: NoteListItem[]): Promise<void> => 
    storage.set(STORAGE_KEYS.NOTES_CACHE, { notes, timestamp: Date.now() }),
  clearCache: (): Promise<void> => storage.remove(STORAGE_KEYS.NOTES_CACHE),
};

export interface AppSettings {
  defaultSummaryLength: 'short' | 'medium' | 'long';
  defaultSummaryType: 'summary' | 'key_points' | 'flashcards';
  darkMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultSummaryLength: 'medium',
  defaultSummaryType: 'summary',
  darkMode: false,
};

export const settingsStorage = {
  getSettings: async (): Promise<AppSettings> => {
    const settings = await storage.get<AppSettings>(STORAGE_KEYS.SETTINGS);
    return settings || DEFAULT_SETTINGS;
  },
  setSettings: async (settings: Partial<AppSettings>): Promise<void> => {
    const current = await settingsStorage.getSettings();
    return storage.set(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
  },
  resetSettings: (): Promise<void> => storage.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
};
