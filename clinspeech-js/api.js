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

// Получить токен авторизации
export async function getToken() {
    return await AsyncStorage.getItem('access_token');
}

// Получить свежий токен (обновить если истёк)
export async function getFreshToken() {
    const accessToken = await AsyncStorage.getItem('access_token');
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    
    if (!accessToken || !refreshToken) {
        return accessToken;
    }
    
    // Try to refresh the token
    try {
        const response = await fetch(`${BASE_URL}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.access) {
                await AsyncStorage.setItem('access_token', data.access);
                return data.access;
            }
        }
    } catch (e) {
        console.log('Token refresh failed:', e);
    }
    
    return accessToken;
}

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
    const locale = await AsyncStorage.getItem('@clinspeech_locale') || 'ru';

    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Accept-Language': locale,
        ...options.headers,
    };

    return fetch(`${BASE_URL}${path}`, { ...options, headers });
}

// ═══ AUTH API ═══
export const authAPI = {
    login: (username, password) => apiFetch('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    }).then(safeJson),
    
    register: (data) => apiFetch('/register/', {
        method: 'POST',
        body: JSON.stringify(data),
    }).then(safeJson),
    
    sendCode: (email) => apiFetch('/send-code/', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }).then(safeJson),
    
    loginWithCode: (email, code) => apiFetch('/login-code/', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
    }).then(safeJson),
    
    refreshToken: (refresh) => apiFetch('/auth/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
    }).then(safeJson),
    
    logout: async () => {
        const refresh = await AsyncStorage.getItem('refresh_token');
        return apiFetch('/auth/logout/', {
            method: 'POST',
            body: JSON.stringify(refresh ? { refresh } : {}),
        });
    },
    
    changePassword: (old_password, new_password) => apiFetch('/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({ old_password, new_password }),
    }).then(safeJson),
};

// ═══ USER / PROFILE ═══
export const userAPI = {
    getMe: () => apiFetch('/me/').then(safeJson),
    updateMe: (data) => apiFetch('/me/', {
        method: 'PATCH',
        body: JSON.stringify(data),
    }).then(safeJson),
    getStats: () => apiFetch('/stats/').then(safeJson),
};

// ═══ PATIENTS ═══
export const patientsAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/patients/${query ? '?' + query : ''}`).then(safeJson);
    },
    getById: (id) => apiFetch(`/patients/${id}/`).then(safeJson),
    create: (data) => apiFetch('/patients/', {
        method: 'POST',
        body: JSON.stringify(data),
    }).then(safeJson),
    update: (id, data) => apiFetch(`/patients/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }).then(safeJson),
    delete: (id) => apiFetch(`/patients/${id}/`, { method: 'DELETE' }),
    attach: (patientId) => apiFetch('/patients/attach/', {
        method: 'POST',
        body: JSON.stringify({ patient_id: patientId }),
    }).then(safeJson),
    getHistory: (id) => apiFetch(`/patients/${id}/history/`).then(safeJson),
};

// ═══ CONSULTATIONS ═══
export const consultationsAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/consultations/${query ? '?' + query : ''}`).then(safeJson);
    },
    getById: (id) => apiFetch(`/consultations/${id}/`).then(safeJson),
    create: (formData) => apiFetch('/consultations/', {
        method: 'POST',
        body: formData,
    }).then(safeJson),
    update: (id, data) => apiFetch(`/consultations/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }).then(safeJson),
    delete: (id) => apiFetch(`/consultations/${id}/`, { method: 'DELETE' }),
    updateStatus: (id, status) => apiFetch(`/consultations/${id}/status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }).then(safeJson),
    regenerate: (id) => apiFetch(`/consultations/${id}/regenerate/`, { method: 'POST' }).then(safeJson),
    share: (id, shared_with, message) => apiFetch(`/consultations/${id}/share/`, {
        method: 'POST',
        body: JSON.stringify({ shared_with, message }),
    }).then(safeJson),
    getShares: (id) => apiFetch(`/consultations/${id}/share/`).then(safeJson),
    startProcessing: (id) => apiFetch(`/consultations/${id}/start_processing/`, { method: 'POST' }).then(safeJson),
    getProcessingStatus: (id) => apiFetch(`/consultations/${id}/start_processing/`).then(safeJson),
    editReport: (id, data) => apiFetch(`/consultations/${id}/edit_report/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }).then(safeJson),
    downloadPDF: (id) => apiFetch(`/consultations/${id}/download_pdf/`),
    getReportHistory: (id) => apiFetch(`/consultations/${id}/report_history/`).then(safeJson),
};

// ═══ ANALYSIS IMAGES ═══
export const imagesAPI = {
    getByConsultation: (consultationId) => 
        apiFetch(`/analysis-images/?consultation=${consultationId}`).then(safeJson),
    upload: (consultationId, file, description) => {
        const fd = new FormData();
        fd.append('consultation', consultationId);
        fd.append('image', file);
        if (description) fd.append('description', description);
        return apiFetch('/analysis-images/', {
            method: 'POST',
            body: fd,
        }).then(safeJson);
    },
    delete: (id) => apiFetch(`/analysis-images/${id}/`, { method: 'DELETE' }),
};

// ═══ APPOINTMENTS ═══
export const appointmentsAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/appointments/${query ? '?' + query : ''}`).then(safeJson);
    },
    create: (data) => apiFetch('/appointments/', {
        method: 'POST',
        body: JSON.stringify(data),
    }).then(safeJson),
    update: (id, data) => apiFetch(`/appointments/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }).then(safeJson),
    delete: (id) => apiFetch(`/appointments/${id}/`, { method: 'DELETE' }),
    getToday: () => apiFetch('/appointments/today/').then(safeJson),
    getUpcoming: () => apiFetch('/appointments/upcoming/').then(safeJson),
    cancel: (id) => apiFetch(`/appointments/${id}/cancel/`, { method: 'POST' }).then(safeJson),
    complete: (id) => apiFetch(`/appointments/${id}/complete/`, { method: 'POST' }).then(safeJson),
};

// ═══ NOTIFICATIONS ═══
export const notificationsAPI = {
    getAll: () => apiFetch('/notifications/').then(safeJson),
    markRead: (id) => apiFetch(`/notifications/${id}/mark_read/`, { method: 'POST' }).then(safeJson),
    markAllRead: () => apiFetch('/notifications/mark_all_read/', { method: 'POST' }).then(safeJson),
    getUnreadCount: () => apiFetch('/notifications/unread_count/').then(safeJson),
};

// ═══ TEMPLATES ═══
export const templatesAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/templates/${query ? '?' + query : ''}`).then(safeJson);
    },
    getById: (id) => apiFetch(`/templates/${id}/`).then(safeJson),
    create: (data) => apiFetch('/templates/', {
        method: 'POST',
        body: JSON.stringify(data),
    }).then(safeJson),
    update: (id, data) => apiFetch(`/templates/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }).then(safeJson),
    delete: (id) => apiFetch(`/templates/${id}/`, { method: 'DELETE' }),
    apply: (id, consultationId) => apiFetch(`/templates/${id}/apply/`, {
        method: 'POST',
        body: JSON.stringify({ consultation_id: consultationId }),
    }).then(safeJson),
};

// ═══ DIAGNOSES (ICD-10) ═══
export const diagnosesAPI = {
    search: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/diagnoses/${query ? '?' + query : ''}`).then(safeJson);
    },
};

// ═══ CHAT ═══
export const chatAPI = {
    getHistory: () => apiFetch('/chat/').then(safeJson),
    sendMessage: (message) => apiFetch('/chat/', {
        method: 'POST',
        body: JSON.stringify({ message }),
    }).then(safeJson),
    clearHistory: () => apiFetch('/chat/clear/', { method: 'DELETE' }),
};

// ═══ ADMIN ═══
export const adminAPI = {
    getUsers: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/users/${query ? '?' + query : ''}`).then(safeJson);
    },
    updateUser: (id, data) => apiFetch(`/users/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }).then(safeJson),
    activateUser: (id) => apiFetch(`/users/${id}/activate/`, { method: 'POST' }).then(safeJson),
    deactivateUser: (id) => apiFetch(`/users/${id}/deactivate/`, { method: 'POST' }).then(safeJson),
    getAuditLog: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/audit-log/${query ? '?' + query : ''}`).then(safeJson);
    },
    getMonthlyReport: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/reports/monthly/${query ? '?' + query : ''}`).then(safeJson);
    },
};

// ═══ FEEDBACK ═══
export const feedbackAPI = {
    getAll: () => apiFetch('/feedback/').then(safeJson),
    create: (data) => apiFetch('/feedback/', {
        method: 'POST',
        body: JSON.stringify(data),
    }).then(safeJson),
    getStats: () => apiFetch('/feedback/stats/').then(safeJson),
};

// ═══ ORGANIZATIONS ═══
export const organizationsAPI = {
    getAll: () => apiFetch('/organizations/').then(safeJson),
};
