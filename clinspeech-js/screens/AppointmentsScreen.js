import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson } from '../api';
import { useLocale } from '../i18n/LocaleContext';
import { getFriendlyApiError } from '../utils/apiErrors';

const MINT = '#2ec4b6';
const pad = (value) => String(value).padStart(2, '0');
const toISODate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toTimeValue = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const getTodayDate = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};
const parseDateValue = (value) => {
    if (!value) return getTodayDate();
    const parts = String(value).split('-').map(Number);
    if (parts.length === 3 && parts.every(Boolean)) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return getTodayDate();
};
const parseTimeValue = (value) => {
    const date = new Date();
    const [hours, minutes] = String(value || '').split(':').map(Number);
    if (Number.isFinite(hours)) date.setHours(hours);
    if (Number.isFinite(minutes)) date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

export default function AppointmentsScreen() {
    const { t, formatDate, formatTime } = useLocale();
    const STATUS_COLORS = {
        scheduled: { bg: '#dbeafe', text: '#1d4ed8', label: t('Запланировано') },
        completed: { bg: '#dcfce7', text: '#16a34a', label: t('Завершено') },
        cancelled: { bg: '#f3f4f6', text: '#6b7280', label: t('Отменено') },
    };
    const TABS = [
        { key: 'upcoming', label: t('Предстоящие') },
        { key: 'today', label: t('Сегодня') },
        { key: 'all', label: t('Все') },
    ];
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientPicker, setShowPatientPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [form, setForm] = useState({ date: '', time: '', notes: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAppointments();
        loadPatients();
    }, [activeTab]);

    useFocusEffect(
        useCallback(() => {
            loadAppointments(false);
            loadPatients();
        }, [activeTab])
    );

    const loadAppointments = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            let endpoint = '/appointments/';
            if (activeTab === 'today') {
                endpoint = '/appointments/today/';
            } else if (activeTab === 'upcoming') {
                endpoint = '/appointments/upcoming/';
            }
            
            const res = await apiFetch(endpoint);
            const data = await safeJson(res);
            setAppointments(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Appointments load failed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadPatients = async () => {
        try {
            const res = await apiFetch('/patients/');
            const data = await safeJson(res);
            setPatients(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Appointment patients load failed:', error);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([loadAppointments(false), loadPatients()]).finally(() => setRefreshing(false));
    }, [activeTab]);

    const openCreateModal = () => {
        setForm({ date: '', time: '', notes: '' });
        setSelectedPatient(null);
        setShowPatientPicker(false);
        setShowDatePicker(false);
        setShowTimePicker(false);
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setShowPatientPicker(false);
        setShowDatePicker(false);
        setShowTimePicker(false);
    };

    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS !== 'ios') setShowDatePicker(false);
        if (event?.type === 'dismissed') return;
        if (selectedDate) {
            setForm((prev) => ({ ...prev, date: toISODate(selectedDate) }));
        }
    };

    const handleTimeChange = (event, selectedTime) => {
        if (Platform.OS !== 'ios') setShowTimePicker(false);
        if (event?.type === 'dismissed') return;
        if (selectedTime) {
            setForm((prev) => ({ ...prev, time: toTimeValue(selectedTime) }));
        }
    };

    const openDatePicker = () => {
        setShowPatientPicker(false);
        setShowTimePicker(false);

        const minimumDate = getTodayDate();
        let value = parseDateValue(form.date);
        if (value < minimumDate) value = minimumDate;
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value,
                mode: 'date',
                display: 'calendar',
                minimumDate,
                onChange: handleDateChange,
            });
            return;
        }

        if (!form.date) setForm((prev) => ({ ...prev, date: toISODate(value) }));
        setShowDatePicker(true);
    };

    const openTimePicker = () => {
        setShowPatientPicker(false);
        setShowDatePicker(false);

        const value = parseTimeValue(form.time);
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value,
                mode: 'time',
                display: 'clock',
                is24Hour: true,
                onChange: handleTimeChange,
            });
            return;
        }

        if (!form.time) setForm((prev) => ({ ...prev, time: toTimeValue(value) }));
        setShowTimePicker(true);
    };

    const handleCreate = async () => {
        if (!selectedPatient || !form.date || !form.time) {
            Alert.alert(t('Ошибка'), t('Заполните все обязательные поля'));
            return;
        }

        setSaving(true);
        try {
            const datetime = `${form.date}T${form.time}:00`;
            const res = await apiFetch('/appointments/', {
                method: 'POST',
                body: JSON.stringify({
                    patient: selectedPatient.id,
                    scheduled_at: datetime,
                    notes: form.notes,
                }),
            });
            if (!res.ok) {
                const payload = await safeJson(res);
                throw { status: res.status, payload };
            }
            closeCreateModal();
            setForm({ date: '', time: '', notes: '' });
            setSelectedPatient(null);
            loadAppointments();
        } catch (error) {
            console.error('Appointment create failed:', error);
            Alert.alert(t('Ошибка'), getFriendlyApiError(error, t, 'Не удалось создать запись'));
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (id) => {
        Alert.alert(
            t('Отменить приём'),
            t('Вы уверены, что хотите отменить этот приём?'),
            [
                { text: t('Нет'), style: 'cancel' },
                {
                    text: t('Да, отменить'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await apiFetch(`/appointments/${id}/cancel/`, { method: 'POST' });
                            if (!res.ok) {
                                const payload = await safeJson(res);
                                throw { status: res.status, payload };
                            }
                            loadAppointments();
                        } catch (error) {
                            console.error('Appointment cancel failed:', error);
                            Alert.alert(t('Ошибка'), getFriendlyApiError(error, t, 'Не удалось отменить приём'));
                        }
                    },
                },
            ]
        );
    };

    const handleComplete = async (id) => {
        try {
            const res = await apiFetch(`/appointments/${id}/complete/`, { method: 'POST' });
            if (!res.ok) {
                const payload = await safeJson(res);
                throw { status: res.status, payload };
            }
            loadAppointments();
        } catch (error) {
            console.error('Appointment complete failed:', error);
            Alert.alert(t('Ошибка'), getFriendlyApiError(error, t, 'Не удалось завершить приём'));
        }
    };

    const renderItem = ({ item }) => {
        const status = STATUS_COLORS[item.status] || STATUS_COLORS.scheduled;
        
        return (
            <View style={s.appointmentCard}>
                <View style={s.cardContent}>
                    <Text style={s.patientName}>
                        {item.patient_name || `${t('Пациент')} #${item.patient}`}
                    </Text>
                    <View style={s.dateRow}>
                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                        <Text style={s.dateText}>
                            {formatDate(item.scheduled_at)} {t('в')} {formatTime(item.scheduled_at)}
                        </Text>
                    </View>
                    {item.notes && (
                        <Text style={s.notesText} numberOfLines={2}>{item.notes}</Text>
                    )}
                </View>
                
                <View style={s.cardActions}>
                    <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[s.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                    
                    {item.status === 'scheduled' && (
                        <View style={s.actionButtons}>
                            <TouchableOpacity
                                style={[s.actionBtn, s.completeBtn]}
                                onPress={() => handleComplete(item.id)}
                            >
                                <Ionicons name="checkmark" size={18} color="#16a34a" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.actionBtn, s.cancelBtn]}
                                onPress={() => handleCancel(item.id)}
                            >
                                <Ionicons name="close" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={s.container}>
            <AnimatedGradientBackground />
            <SafeAreaView style={s.safeArea}>
                <View style={s.header}>
                    <View>
                        <Text style={s.title}>{t('Расписание')}</Text>
                        <Text style={s.subtitle}>{t('Приёмы и записи')}</Text>
                    </View>
                    <TouchableOpacity style={s.addBtn} onPress={openCreateModal}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={s.addBtnText}>{t('Новый приём')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.tabs}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[s.tab, activeTab === tab.key && s.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <View style={s.loadingContainer}>
                        <ActivityIndicator size="large" color={MINT} />
                    </View>
                ) : (
                    <FlatList
                        data={appointments}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={renderItem}
                        contentContainerStyle={s.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={MINT}
                            />
                        }
                        ListEmptyComponent={
                            <View style={s.emptyState}>
                                <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
                                <Text style={s.emptyTitle}>{t('Нет приёмов')}</Text>
                                <Text style={s.emptySubtitle}>{t('Запланируйте новый приём')}</Text>
                            </View>
                        }
                    />
                )}

                {/* Create Modal */}
                <Modal
                    visible={showCreateModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={closeCreateModal}
                >
                    <View style={s.modalOverlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
                            style={s.modalKeyboard}
                        >
                        <View style={s.modalContent}>
                            <View style={s.modalHeader}>
                                <Text style={s.modalTitle}>{t('Новый приём')}</Text>
                                <TouchableOpacity onPress={closeCreateModal}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={s.modalBody}
                                contentContainerStyle={s.modalBodyContent}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={s.inputLabel}>{t('Пациент')} *</Text>
                                <TouchableOpacity
                                    style={s.pickerBtn}
                                    onPress={() => {
                                        setShowDatePicker(false);
                                        setShowTimePicker(false);
                                        setShowPatientPicker((value) => !value);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={selectedPatient ? s.pickerText : s.pickerPlaceholder}>
                                        {selectedPatient
                                            ? `${selectedPatient.last_name} ${selectedPatient.first_name}`
                                            : t('Выберите пациента...')}
                                    </Text>
                                    <Ionicons name={showPatientPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
                                </TouchableOpacity>
                                {showPatientPicker && (
                                    <View style={s.inlinePicker}>
                                        <ScrollView
                                            nestedScrollEnabled
                                            keyboardShouldPersistTaps="handled"
                                            style={s.inlinePickerList}
                                        >
                                            {patients.length === 0 ? (
                                                <Text style={s.patientPickerEmpty}>{t('Пациенты не найдены')}</Text>
                                            ) : patients.map((item) => (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    style={[
                                                        s.patientPickerItem,
                                                        selectedPatient?.id === item.id && s.patientPickerItemSelected,
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedPatient(item);
                                                        setShowPatientPicker(false);
                                                    }}
                                                    activeOpacity={0.75}
                                                >
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={s.patientItemText}>
                                                            {item.last_name} {item.first_name}
                                                        </Text>
                                                        {item.birth_date && (
                                                            <Text style={s.patientItemDate}>{formatDate(item.birth_date)}</Text>
                                                        )}
                                                    </View>
                                                    {selectedPatient?.id === item.id && (
                                                        <Ionicons name="checkmark-circle" size={20} color={MINT} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                <Text style={s.inputLabel}>{t('Дата')} *</Text>
                                <TouchableOpacity style={s.datePickerBtn} onPress={openDatePicker} activeOpacity={0.8}>
                                    <View style={s.datePickerLeft}>
                                        <Ionicons name="calendar-outline" size={18} color={MINT} />
                                        <Text style={form.date ? s.pickerText : s.pickerPlaceholder}>
                                            {form.date ? formatDate(form.date) : t('Выберите дату')}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                </TouchableOpacity>
                                {Platform.OS === 'ios' && showDatePicker && (
                                    <View style={s.iosPickerFrame}>
                                        <DateTimePicker
                                            value={parseDateValue(form.date)}
                                            mode="date"
                                            display="spinner"
                                            minimumDate={getTodayDate()}
                                            textColor="#111827"
                                            accentColor={MINT}
                                            themeVariant="light"
                                            locale="ru-RU"
                                            style={s.iosPicker}
                                            onChange={handleDateChange}
                                        />
                                        <TouchableOpacity style={s.pickerDoneBtn} onPress={() => setShowDatePicker(false)}>
                                            <Text style={s.pickerDoneText}>{t('Готово')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <Text style={s.inputLabel}>{t('Время')} *</Text>
                                <TouchableOpacity style={s.datePickerBtn} onPress={openTimePicker} activeOpacity={0.8}>
                                    <View style={s.datePickerLeft}>
                                        <Ionicons name="time-outline" size={18} color={MINT} />
                                        <Text style={form.time ? s.pickerText : s.pickerPlaceholder}>
                                            {form.time || t('Выберите время')}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                </TouchableOpacity>
                                {Platform.OS === 'ios' && showTimePicker && (
                                    <View style={s.iosPickerFrame}>
                                        <DateTimePicker
                                            value={parseTimeValue(form.time)}
                                            mode="time"
                                            display="spinner"
                                            is24Hour
                                            textColor="#111827"
                                            accentColor={MINT}
                                            themeVariant="light"
                                            locale="ru-RU"
                                            style={s.iosPicker}
                                            onChange={handleTimeChange}
                                        />
                                        <TouchableOpacity style={s.pickerDoneBtn} onPress={() => setShowTimePicker(false)}>
                                            <Text style={s.pickerDoneText}>{t('Готово')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <Text style={s.inputLabel}>{t('Заметки')}</Text>
                                <TextInput
                                    style={[s.input, s.textArea]}
                                    placeholder={t('Дополнительная информация...')}
                                    value={form.notes}
                                    onChangeText={(text) => setForm({ ...form, notes: text })}
                                    multiline
                                    numberOfLines={3}
                                />
                            </ScrollView>

                            <View style={s.modalFooter}>
                                <TouchableOpacity
                                    style={s.cancelButton}
                                    onPress={closeCreateModal}
                                >
                                    <Text style={s.cancelButtonText}>{t('Отмена')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.createButton, saving && s.createButtonDisabled]}
                                    onPress={handleCreate}
                                    disabled={saving}
                                >
                                    <Text style={s.createButtonText}>
                                        {saving ? t('Создание...') : t('Создать')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    safeArea: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
    },
    title: { fontSize: 26, fontWeight: '700', color: '#1a1a2e' },
    subtitle: { marginTop: 4, fontSize: 13, color: '#64748b' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: MINT,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tabActive: {
        backgroundColor: MINT,
        borderColor: MINT,
    },
    tabText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    tabTextActive: { color: '#fff' },
    listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
    appointmentCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardContent: { marginBottom: 12 },
    patientName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    dateText: { fontSize: 13, color: '#64748b' },
    notesText: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: { fontSize: 12, fontWeight: '500' },
    actionButtons: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeBtn: { backgroundColor: '#dcfce7' },
    cancelBtn: { backgroundColor: '#fee2e2' },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: '#64748b', marginTop: 8 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalKeyboard: {
        width: '100%',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '88%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
    modalBody: { paddingHorizontal: 16 },
    modalBodyContent: { paddingTop: 4, paddingBottom: 20 },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#1f2937',
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    pickerBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
    },
    pickerText: { fontSize: 15, color: '#1f2937' },
    pickerPlaceholder: { fontSize: 15, color: '#94a3b8' },
    inlinePicker: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#dbeafe',
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    inlinePickerList: { maxHeight: 220 },
    patientPickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    patientPickerItemSelected: { backgroundColor: '#f0fdfa' },
    patientPickerEmpty: {
        padding: 14,
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 14,
    },
    datePickerBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
    },
    datePickerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iosPickerFrame: {
        marginTop: 8,
        paddingBottom: 10,
        borderWidth: 1,
        borderColor: '#dbeafe',
        borderRadius: 14,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
    },
    iosPicker: {
        height: 190,
        backgroundColor: '#ffffff',
    },
    pickerDoneBtn: {
        alignSelf: 'flex-end',
        marginTop: 4,
        marginRight: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: MINT,
    },
    pickerDoneText: { color: '#fff', fontWeight: '700' },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
    createButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: MINT,
        alignItems: 'center',
    },
    createButtonDisabled: { backgroundColor: '#94a3b8' },
    createButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    patientItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    patientItemText: { fontSize: 15, fontWeight: '500', color: '#1f2937' },
    patientItemDate: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
