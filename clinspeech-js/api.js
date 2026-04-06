import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const ENABLE_MOCK_API = true;
export const MOCK_CREDENTIALS = Object.freeze({
    username: 'user',
    password: 'user123',
});
export const MOCK_PATIENT_CREDENTIALS = Object.freeze({
    username: 'pacient',
    password: 'pacient123',
});

const MOCK_STATE_KEY = '@clinspeech_mock_state_v1';
const MOCK_ACCESS_TOKEN = 'mock-access-token';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token';
const MOCK_LATENCY_MS = 180;

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

let mockState = null;
let mockStateInitPromise = null;

const toIso = (deltaMs = 0) => new Date(Date.now() + deltaMs).toISOString();

const fullDoctorName = (user) => {
    const fullName = `${user?.last_name || ''} ${user?.first_name || ''}`.trim();
    return fullName || user?.username || 'Доктор';
};

const createDefaultAccounts = (organizationName = 'ClinSpeech Demo Clinic') => {
    const doctorUser = {
        id: 1,
        username: MOCK_CREDENTIALS.username,
        email: 'user@clinspeech.local',
        first_name: 'Demo',
        last_name: 'Doctor',
        middle_name: '',
        role: 'doctor',
        phone: '+7 777 000 00 00',
        specialization: 'Терапевт',
        organization: 1,
        organization_name: organizationName,
        full_name: 'Demo Doctor',
    };

    const patientUser = {
        id: 2,
        username: MOCK_PATIENT_CREDENTIALS.username,
        email: 'pacient@clinspeech.local',
        first_name: 'Demo',
        last_name: 'Patient',
        middle_name: '',
        role: 'patient',
        phone: '+7 777 111 11 11',
        specialization: '',
        organization: 1,
        organization_name: organizationName,
        full_name: 'Demo Patient',
    };

    return {
        [doctorUser.username]: {
            user: doctorUser,
            password: MOCK_CREDENTIALS.password,
        },
        [patientUser.username]: {
            user: patientUser,
            password: MOCK_PATIENT_CREDENTIALS.password,
        },
    };
};

const normalizeMockAccounts = (state) => {
    let changed = false;
    const orgName = state?.organizations?.[0]?.name || 'ClinSpeech Demo Clinic';
    const defaults = createDefaultAccounts(orgName);
    const nextAccounts = {};

    Object.entries(state?.accounts || {}).forEach(([key, value]) => {
        if (!value?.user) return;
        const username = String(value.user.username || key || '').trim();
        if (!username) return;
        nextAccounts[username] = {
            user: {
                ...value.user,
                username,
                role: value.user.role || 'doctor',
                organization_name: value.user.organization_name || orgName,
                full_name: value.user.full_name || `${value.user.first_name || ''} ${value.user.last_name || ''}`.trim(),
            },
            password: String(value.password || ''),
        };
    });

    const legacyUser = state?.user && typeof state.user === 'object' ? state.user : null;
    const legacyUsername = String(legacyUser?.username || '').trim();
    if (legacyUser && legacyUsername && !nextAccounts[legacyUsername]) {
        nextAccounts[legacyUsername] = {
            user: {
                ...defaults[MOCK_CREDENTIALS.username].user,
                ...legacyUser,
                username: legacyUsername,
                role: legacyUser.role || 'doctor',
                organization_name: legacyUser.organization_name || orgName,
                full_name: legacyUser.full_name || `${legacyUser.first_name || ''} ${legacyUser.last_name || ''}`.trim(),
            },
            password: String(state?.password || defaults[MOCK_CREDENTIALS.username].password),
        };
        changed = true;
    }

    if (!nextAccounts[MOCK_CREDENTIALS.username]) {
        nextAccounts[MOCK_CREDENTIALS.username] = defaults[MOCK_CREDENTIALS.username];
        changed = true;
    }
    if (!nextAccounts[MOCK_PATIENT_CREDENTIALS.username]) {
        nextAccounts[MOCK_PATIENT_CREDENTIALS.username] = defaults[MOCK_PATIENT_CREDENTIALS.username];
        changed = true;
    }

    const active = state?.activeAccount && nextAccounts[state.activeAccount]
        ? state.activeAccount
        : (legacyUsername && nextAccounts[legacyUsername] ? legacyUsername : Object.keys(nextAccounts)[0]);

    if (!state?.activeAccount || state.activeAccount !== active) {
        changed = true;
    }

    if (!state?.accounts || Object.keys(state.accounts).length !== Object.keys(nextAccounts).length) {
        changed = true;
    }

    state.accounts = nextAccounts;
    state.activeAccount = active;
    state.user = { ...nextAccounts[active].user };
    state.password = String(nextAccounts[active].password || '');
    if (!state.user.full_name) {
        state.user.full_name = `${state.user.first_name || ''} ${state.user.last_name || ''}`.trim();
        changed = true;
    }

    return changed;
};

const buildDefaultReport = (patient, suffix = '') => ({
    complaints: `Пациент ${patient?.last_name || ''} ${patient?.first_name || ''} жалуется на общую слабость и утомляемость.${suffix}`,
    anamnesis: 'Симптомы наблюдаются несколько дней, без выраженного ухудшения.',
    diagnosis: 'Предварительно: ОРВИ лёгкой степени.',
    recommendations: 'Обильное питьё, отдых, симптоматическая терапия, контроль состояния в динамике.',
});

const createInitialMockState = () => {
    const organizations = [{ id: 1, name: 'ClinSpeech Demo Clinic' }];
    const accounts = createDefaultAccounts(organizations[0].name);
    const activeAccount = MOCK_CREDENTIALS.username;
    const user = { ...accounts[activeAccount].user };

    const patients = [
        { id: 1, first_name: 'Айгерим', last_name: 'Ермекова', middle_name: 'Сериковна', birth_date: '1990-04-12', organization: 1 },
        { id: 2, first_name: 'Иван', last_name: 'Петров', middle_name: 'Алексеевич', birth_date: '1985-09-01', organization: 1 },
        { id: 3, first_name: 'Мария', last_name: 'Соколова', middle_name: '', birth_date: '1997-11-23', organization: 1 },
    ];

    const consultations = [
        {
            id: 1001,
            patient_id: 1,
            doctor_name: fullDoctorName(user),
            created_at: toIso(-26 * 60 * 60 * 1000),
            status: 'ready',
            raw_transcription: 'Пациент жалуется на слабость, боль в горле и периодическую температуру.',
            final_report: JSON.stringify(buildDefaultReport(patients[0])),
            diagnosis: 'ОРВИ',
            diagnosis_code: 'J06.9',
            images_count: 1,
            analysis_images: [{ id: 1, description: 'Рентген грудной клетки' }],
            has_pdf: true,
            processing_started_at: null,
        },
        {
            id: 1002,
            patient_id: 2,
            doctor_name: fullDoctorName(user),
            created_at: toIso(-2 * 60 * 60 * 1000),
            status: 'processing',
            raw_transcription: 'Выполняется транскрибация аудиозаписи...',
            final_report: '',
            diagnosis: '',
            diagnosis_code: '',
            images_count: 0,
            analysis_images: [],
            has_pdf: false,
            processing_started_at: toIso(-1500),
        },
        {
            id: 1003,
            patient_id: 3,
            doctor_name: fullDoctorName(user),
            created_at: toIso(-30 * 60 * 1000),
            status: 'error',
            raw_transcription: 'Запись распознана частично.',
            final_report: '',
            diagnosis: '',
            diagnosis_code: '',
            images_count: 0,
            analysis_images: [],
            has_pdf: false,
            processing_started_at: null,
        },
    ];

    return {
        accounts,
        activeAccount,
        user,
        password: MOCK_CREDENTIALS.password,
        organizations,
        patients,
        consultations,
        nextPatientId: 4,
        nextConsultationId: 1004,
    };
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const normalizePath = (path) => {
    const input = String(path || '/');
    if (/^https?:\/\//i.test(input)) {
        try {
            const url = new URL(input);
            const base = new URL(BASE_URL);
            if (url.origin === base.origin && url.pathname.startsWith(base.pathname)) {
                const sliced = url.pathname.slice(base.pathname.length);
                const localPath = sliced.startsWith('/') ? sliced : `/${sliced}`;
                return `${localPath || '/'}${url.search}`;
            }
            return `${url.pathname}${url.search}`;
        } catch {
            return input;
        }
    }
    return input;
};

const normalizePathname = (pathname) => {
    const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
};

const parseJsonBody = (body) => {
    if (!body) return {};
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch {
            return {};
        }
    }
    if (typeof body === 'object' && !Array.isArray(body)) return body;
    return {};
};

const getFormDataValue = (body, key) => {
    if (!body || typeof body !== 'object') return undefined;

    if (typeof body.get === 'function') {
        const value = body.get(key);
        if (value !== undefined && value !== null) return value;
    }

    if (Array.isArray(body._parts)) {
        const pair = body._parts.find(([k]) => k === key);
        if (pair) return pair[1];
    }

    return undefined;
};

const parseReport = (reportString) => {
    if (!reportString) return {};
    try {
        return JSON.parse(reportString);
    } catch {
        return {};
    }
};

const createMockResponse = (status, payload = {}) => {
    const textPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return {
        ok: status >= 200 && status < 300,
        status,
        async text() {
            return textPayload;
        },
        async json() {
            try {
                return JSON.parse(textPayload || '{}');
            } catch {
                return {};
            }
        },
    };
};

const findPatient = (id) => mockState.patients.find(p => p.id === Number(id));

const consultationToDto = (consultation) => {
    const patient = findPatient(consultation.patient_id);
    const dto = {
        ...consultation,
        patient: patient?.id ?? consultation.patient_id ?? null,
        patient_info: patient ? { ...patient } : null,
    };
    delete dto.patient_id;
    return dto;
};

const sortConsultationsDesc = (items) => (
    [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
);

const persistMockState = async () => {
    if (!mockState) return;
    await AsyncStorage.setItem(MOCK_STATE_KEY, JSON.stringify(mockState));
};

const advanceConsultationStatus = (consultation) => {
    if (!consultation.processing_started_at) return false;
    if (!['processing', 'generating'].includes(consultation.status)) return false;

    const elapsed = Date.now() - new Date(consultation.processing_started_at).getTime();
    let changed = false;

    if (consultation.status === 'processing' && elapsed >= 2500) {
        consultation.status = 'generating';
        changed = true;
    }

    if (elapsed >= 5500) {
        const patient = findPatient(consultation.patient_id);
        consultation.status = 'ready';
        consultation.final_report = consultation.final_report || JSON.stringify(buildDefaultReport(patient, ' Отчёт сгенерирован в mock-режиме.'));
        consultation.diagnosis = consultation.diagnosis || 'ОРВИ';
        consultation.diagnosis_code = consultation.diagnosis_code || 'J06.9';
        consultation.has_pdf = true;
        consultation.processing_started_at = null;
        changed = true;
    }

    return changed;
};

const syncConsultations = async () => {
    let changed = false;
    mockState.consultations.forEach((consultation) => {
        if (advanceConsultationStatus(consultation)) changed = true;
    });
    if (changed) await persistMockState();
};

const ensureMockState = async () => {
    if (mockState) return;

    if (!mockStateInitPromise) {
        mockStateInitPromise = (async () => {
            try {
                const raw = await AsyncStorage.getItem(MOCK_STATE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed?.user && Array.isArray(parsed?.patients) && Array.isArray(parsed?.consultations)) {
                        mockState = parsed;
                        return;
                    }
                }
            } catch {
                // ignore broken cache and reinitialize
            }
            mockState = createInitialMockState();
            await persistMockState();
        })();
    }

    await mockStateInitPromise;
    const migrated = normalizeMockAccounts(mockState);
    if (migrated) {
        await persistMockState();
    }
};

const buildTodayAppointments = () => {
    const now = new Date();
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return mockState.patients.slice(0, 3).map((patient, index) => ({
        id: index + 1,
        patient_name: `${patient.last_name} ${patient.first_name}`,
        scheduled_at: new Date(day.getTime() + (10 + index * 2) * 60 * 60 * 1000).toISOString(),
        reason: index === 0 ? 'Контрольный осмотр' : 'Повторный приём',
        status: index === 1 ? 'completed' : 'scheduled',
    }));
};

const resolvePatientIdFromBody = (body) => {
    const raw = getFormDataValue(body, 'patient');
    const parsed = Number.parseInt(String(raw ?? ''), 10);
    if (Number.isInteger(parsed) && findPatient(parsed)) return parsed;
    return mockState.patients[0]?.id ?? null;
};

const mockApiFetch = async (path, options = {}) => {
    await ensureMockState();
    await delay(MOCK_LATENCY_MS);

    const method = (options.method || 'GET').toUpperCase();
    const normalizedPath = normalizePath(path);
    const url = new URL(normalizedPath, 'http://mock.local');
    const pathname = normalizePathname(url.pathname);
    const searchParams = url.searchParams;

    await syncConsultations();

    if (pathname === '/auth/login/' && method === 'POST') {
        const body = parseJsonBody(options.body);
        const username = String(body.username || '').trim();
        const password = String(body.password || '');
        const accountByUsername = mockState.accounts?.[username];
        const accountByEmail = Object.values(mockState.accounts || {}).find(
            ({ user }) => user?.email && String(user.email).toLowerCase() === username.toLowerCase()
        );
        const account = accountByUsername || accountByEmail;

        if (!account || password !== String(account.password || '')) {
            return createMockResponse(401, { detail: 'Неверный логин или пароль.' });
        }

        mockState.activeAccount = account.user.username;
        mockState.user = { ...account.user };
        mockState.password = String(account.password || '');
        await persistMockState();

        return createMockResponse(200, { access: MOCK_ACCESS_TOKEN, refresh: MOCK_REFRESH_TOKEN });
    }

    if (pathname === '/send-code/' && method === 'POST') {
        const body = parseJsonBody(options.body);
        const email = String(body.email || '');
        if (!email.includes('@')) {
            return createMockResponse(400, { detail: 'Введите корректный email.' });
        }
        return createMockResponse(200, { detail: 'Код подтверждения отправлен (mock).' });
    }

    if (pathname === '/register/' && method === 'POST') {
        const body = parseJsonBody(options.body);
        const username = body.username || body.email;
        const password = body.password;

        if (!username || !password) {
            return createMockResponse(400, { detail: 'Логин и пароль обязательны.' });
        }

        const baseUser = {
            ...mockState.accounts?.[MOCK_CREDENTIALS.username]?.user,
            ...mockState.user,
        };
        const registeredUser = {
            ...baseUser,
            username,
            email: body.email || baseUser.email,
            first_name: body.first_name || baseUser.first_name,
            last_name: body.last_name || baseUser.last_name,
            middle_name: body.middle_name || baseUser.middle_name || '',
            role: body.role || baseUser.role || 'doctor',
            phone: body.phone ?? baseUser.phone,
            full_name: `${body.first_name || baseUser.first_name} ${body.last_name || baseUser.last_name}`.trim(),
        };
        mockState.accounts[username] = {
            user: registeredUser,
            password: String(password),
        };
        mockState.activeAccount = username;
        mockState.user = { ...registeredUser };
        mockState.password = String(password);
        await persistMockState();

        return createMockResponse(201, {
            id: mockState.user.id,
            username: mockState.user.username,
            email: mockState.user.email,
        });
    }

    if (pathname === '/auth/logout/' && method === 'POST') {
        return createMockResponse(200, { detail: 'Сессия завершена (mock).' });
    }

    if (pathname === '/auth/change-password/' && method === 'POST') {
        const body = parseJsonBody(options.body);
        const oldPassword = String(body.old_password || '');
        const newPassword = String(body.new_password || '');

        if (oldPassword !== String(mockState.password || '')) {
            return createMockResponse(400, { detail: 'Неверный текущий пароль.' });
        }
        if (newPassword.length < 8) {
            return createMockResponse(400, { detail: 'Минимум 8 символов.' });
        }

        mockState.password = newPassword;
        if (mockState.activeAccount && mockState.accounts[mockState.activeAccount]) {
            mockState.accounts[mockState.activeAccount].password = newPassword;
        }
        await persistMockState();
        return createMockResponse(200, { detail: 'Пароль успешно изменён.' });
    }

    if (pathname === '/me/') {
        if (method === 'GET') {
            return createMockResponse(200, mockState.user);
        }

        if (method === 'PATCH') {
            const body = parseJsonBody(options.body);
            const editable = ['first_name', 'last_name', 'middle_name', 'phone', 'specialization'];
            editable.forEach((key) => {
                if (body[key] !== undefined) mockState.user[key] = body[key];
            });
            mockState.user.full_name = `${mockState.user.first_name || ''} ${mockState.user.last_name || ''}`.trim();
            if (mockState.activeAccount && mockState.accounts[mockState.activeAccount]) {
                mockState.accounts[mockState.activeAccount].user = { ...mockState.user };
            }
            await persistMockState();
            return createMockResponse(200, mockState.user);
        }
    }

    if (pathname === '/organizations/' && method === 'GET') {
        return createMockResponse(200, mockState.organizations);
    }

    if (pathname === '/patients/' && method === 'GET') {
        const search = String(searchParams.get('search') || '').trim().toLowerCase();
        const filtered = !search
            ? mockState.patients
            : mockState.patients.filter((patient) => (
                `${patient.last_name} ${patient.first_name} ${patient.middle_name || ''}`.toLowerCase().includes(search)
            ));
        return createMockResponse(200, { results: filtered });
    }

    if (pathname === '/patients/' && method === 'POST') {
        const body = parseJsonBody(options.body);
        if (!body.last_name || !body.first_name || !body.birth_date) {
            return createMockResponse(400, { detail: 'Заполните обязательные поля пациента.' });
        }

        const patient = {
            id: mockState.nextPatientId++,
            first_name: body.first_name,
            last_name: body.last_name,
            middle_name: body.middle_name || '',
            birth_date: body.birth_date,
            organization: mockState.user.organization || 1,
        };
        mockState.patients.unshift(patient);
        await persistMockState();
        return createMockResponse(201, patient);
    }

    const patientByIdMatch = pathname.match(/^\/patients\/(\d+)\/$/);
    if (patientByIdMatch && method === 'DELETE') {
        const patientId = Number(patientByIdMatch[1]);
        const index = mockState.patients.findIndex(patient => patient.id === patientId);
        if (index === -1) return createMockResponse(404, { detail: 'Пациент не найден.' });

        mockState.patients.splice(index, 1);
        mockState.consultations = mockState.consultations.filter(c => c.patient_id !== patientId);
        await persistMockState();
        return createMockResponse(204, {});
    }

    const historyMatch = pathname.match(/^\/patients\/(\d+)\/history\/$/);
    if (historyMatch && method === 'GET') {
        const patientId = Number(historyMatch[1]);
        const patient = findPatient(patientId);
        if (!patient) return createMockResponse(404, { detail: 'Пациент не найден.' });

        const consultations = sortConsultationsDesc(
            mockState.consultations.filter(c => c.patient_id === patientId)
        ).map((consultation) => {
            const report = parseReport(consultation.final_report);
            return {
                id: consultation.id,
                created_at: consultation.created_at,
                doctor_name: consultation.doctor_name,
                diagnosis: consultation.diagnosis || report.diagnosis || 'Без диагноза',
                status: consultation.status,
                has_pdf: Boolean(consultation.has_pdf),
            };
        });

        return createMockResponse(200, {
            patient_name: `${patient.last_name} ${patient.first_name} ${patient.middle_name || ''}`.trim(),
            birth_date: patient.birth_date,
            total_consultations: consultations.length,
            consultations,
        });
    }

    if (pathname === '/consultations/' && method === 'GET') {
        let consultations = sortConsultationsDesc(mockState.consultations).map(consultationToDto);

        const status = searchParams.get('status');
        if (status) consultations = consultations.filter(c => c.status === status);

        const pageSize = Number.parseInt(searchParams.get('page_size') || '', 10);
        if (Number.isFinite(pageSize) && pageSize > 0) {
            consultations = consultations.slice(0, pageSize);
        }

        return createMockResponse(200, { results: consultations });
    }

    if (pathname === '/consultations/' && method === 'POST') {
        const patientId = resolvePatientIdFromBody(options.body);
        if (!patientId) {
            return createMockResponse(400, { detail: 'Нет пациента для привязки консультации.' });
        }

        const patient = findPatient(patientId);
        const report = buildDefaultReport(patient, ' Черновик для предпросмотра дизайна.');

        const consultation = {
            id: mockState.nextConsultationId++,
            patient_id: patientId,
            doctor_name: fullDoctorName(mockState.user),
            created_at: toIso(),
            status: 'created',
            raw_transcription: 'Аудиозапись получена. Серверная обработка временно отключена.',
            final_report: JSON.stringify(report),
            diagnosis: report.diagnosis,
            diagnosis_code: 'Z00.0',
            images_count: 0,
            analysis_images: [],
            has_pdf: false,
            processing_started_at: null,
        };

        mockState.consultations.unshift(consultation);
        await persistMockState();
        return createMockResponse(201, consultationToDto(consultation));
    }

    const consultationByIdMatch = pathname.match(/^\/consultations\/(\d+)\/$/);
    if (consultationByIdMatch && method === 'GET') {
        const consultationId = Number(consultationByIdMatch[1]);
        const consultation = mockState.consultations.find(c => c.id === consultationId);
        if (!consultation) return createMockResponse(404, { detail: 'Консультация не найдена.' });
        return createMockResponse(200, consultationToDto(consultation));
    }

    const startProcessingMatch = pathname.match(/^\/consultations\/(\d+)\/start_processing\/$/);
    if (startProcessingMatch && method === 'POST') {
        const consultationId = Number(startProcessingMatch[1]);
        const consultation = mockState.consultations.find(c => c.id === consultationId);
        if (!consultation) return createMockResponse(404, { detail: 'Консультация не найдена.' });

        consultation.status = 'processing';
        consultation.processing_started_at = toIso();
        await persistMockState();
        return createMockResponse(200, consultationToDto(consultation));
    }

    const regenerateMatch = pathname.match(/^\/consultations\/(\d+)\/regenerate\/$/);
    if (regenerateMatch && method === 'POST') {
        const consultationId = Number(regenerateMatch[1]);
        const consultation = mockState.consultations.find(c => c.id === consultationId);
        if (!consultation) return createMockResponse(404, { detail: 'Консультация не найдена.' });

        consultation.status = 'processing';
        consultation.processing_started_at = toIso();
        consultation.has_pdf = false;
        consultation.raw_transcription = 'Выполняется повторная обработка отчёта (mock)...';
        await persistMockState();
        return createMockResponse(200, consultationToDto(consultation));
    }

    const editReportMatch = pathname.match(/^\/consultations\/(\d+)\/edit_report\/$/);
    if (editReportMatch && method === 'POST') {
        const consultationId = Number(editReportMatch[1]);
        const consultation = mockState.consultations.find(c => c.id === consultationId);
        if (!consultation) return createMockResponse(404, { detail: 'Консультация не найдена.' });

        const body = parseJsonBody(options.body);
        consultation.final_report = JSON.stringify(body || {});
        consultation.status = 'ready';
        consultation.has_pdf = true;
        consultation.processing_started_at = null;
        await persistMockState();
        return createMockResponse(200, consultationToDto(consultation));
    }

    const pdfMatch = pathname.match(/^\/consultations\/(\d+)\/download_pdf\/$/);
    if (pdfMatch && method === 'GET') {
        const consultationId = Number(pdfMatch[1]);
        const consultation = mockState.consultations.find(c => c.id === consultationId);
        if (!consultation) return createMockResponse(404, { detail: 'Консультация не найдена.' });
        return createMockResponse(200, {
            detail: 'PDF готов (mock).',
            filename: `consultation_${consultationId}.pdf`,
        });
    }

    if (pathname === '/stats/' && method === 'GET') {
        const consultations = mockState.consultations;
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

        const consultationsByStatus = consultations.reduce((acc, consultation) => {
            acc[consultation.status] = (acc[consultation.status] || 0) + 1;
            return acc;
        }, {});

        return createMockResponse(200, {
            total_consultations: consultations.length,
            consultations_this_month: consultations.filter(c => new Date(c.created_at).getTime() >= monthStart).length,
            total_patients: mockState.patients.length,
            consultations_by_status: consultationsByStatus,
        });
    }

    if (pathname === '/appointments/today/' && method === 'GET') {
        return createMockResponse(200, buildTodayAppointments());
    }

    return createMockResponse(404, {
        detail: `Mock endpoint not found: ${method} ${pathname}`,
    });
};

// Безопасный парсинг JSON — если сервер вернул HTML/пустой ответ, покажет понятную ошибку
export async function safeJson(response) {
    const text = await response.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch {
        console.warn('Сервер вернул не-JSON:', text.slice(0, 300));
        throw new Error(`Ошибка сервера (${response.status}). Проверьте подключение и формат ответа.`);
    }
}

// Запрос с токеном авторизации (поддерживает JSON и FormData)
export async function apiFetch(path, options = {}) {
    if (ENABLE_MOCK_API) {
        return mockApiFetch(path, options);
    }

    const token = await AsyncStorage.getItem('access_token');
    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    return fetch(`${BASE_URL}${path}`, { ...options, headers });
}
