import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { kkMessages } from '../i18n/kkMessages';
import { getStoredLocale, setStoredLocale, normalizeLocale, LOCALE_STORAGE_KEY } from '../i18n/localeStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LocaleContext = createContext(null);

const interpolate = (template, params = {}) => {
  if (typeof template !== 'string') return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
};

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState('ru');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocale();
  }, []);

  const loadLocale = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored) {
        setLocaleState(normalizeLocale(stored));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const setLocale = useCallback(async (nextLocale) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    await setStoredLocale(normalized);
  }, []);

  const t = useCallback((key, fallback = key, params = {}) => {
    // Сначала ищем по ключу, потом по fallback
    let translation = undefined;
    if (locale === 'kk') {
      translation = kkMessages[key] ?? kkMessages[fallback];
    }
    const value = translation ?? fallback;
    return interpolate(value, params);
  }, [locale]);

  const formatDate = useCallback((value, options = {}) => {
    if (!value) return '';
    const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU';
    return new Intl.DateTimeFormat(dateLocale, { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      ...options 
    }).format(new Date(value));
  }, [locale]);

  const formatTime = useCallback((value, options = {}) => {
    if (!value) return '';
    const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU';
    return new Intl.DateTimeFormat(dateLocale, { 
      hour: '2-digit', 
      minute: '2-digit', 
      ...options 
    }).format(new Date(value));
  }, [locale]);

  const formatDateTime = useCallback((value, options = {}) => {
    if (!value) return '';
    const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU';
    return new Intl.DateTimeFormat(dateLocale, { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      ...options 
    }).format(new Date(value));
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    formatDate,
    formatTime,
    formatDateTime,
    isRussian: locale === 'ru',
    isKazakh: locale === 'kk',
    isLoading,
  }), [locale, setLocale, t, formatDate, formatTime, formatDateTime, isLoading]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

export default LocaleContext;
