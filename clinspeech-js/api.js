import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Автоматически берём IP-адрес компьютера из Expo (работает на физическом телефоне)
const getBaseUrl = () => {
    if (__DEV__) {
        const host = Constants.expoConfig?.hostUri?.split(':')[0]
            || Constants.manifest?.debuggerHost?.split(':')[0];
        if (host) return `http://${host}:8000/api`;
    }
    return 'https://your-production-domain.com/api';
};

export const BASE_URL = getBaseUrl();

// Безопасный парсинг JSON — если сервер вернул HTML/пустой ответ, покажет понятную ошибку
export async function safeJson(response) {
    const text = await response.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch {
        console.warn('Сервер вернул не-JSON:', text.slice(0, 300));
        throw new Error(`Ошибка сервера (${response.status}). Проверь что бекенд запущен.`);
    }
}

// Запрос с токеном авторизации (поддерживает JSON и FormData)
export async function apiFetch(path, options = {}) {
    const token = await AsyncStorage.getItem('access_token');
    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    return fetch(`${BASE_URL}${path}`, { ...options, headers });
}
