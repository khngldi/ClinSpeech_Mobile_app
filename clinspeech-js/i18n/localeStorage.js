import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCALE_STORAGE_KEY = '@clinspeech_locale';
export const SUPPORTED_LOCALES = ['ru', 'kk'];

export function normalizeLocale(value) {
  return value === 'kk' ? 'kk' : 'ru';
}

export async function getStoredLocale() {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    return normalizeLocale(stored);
  } catch {
    return 'ru';
  }
}

export function getStoredLocaleSync() {
  return 'ru';
}

export function getLocaleCode(locale) {
  return normalizeLocale(locale);
}

export async function setStoredLocale(locale) {
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale));
  } catch {
    // Ignore storage failures
  }
}
