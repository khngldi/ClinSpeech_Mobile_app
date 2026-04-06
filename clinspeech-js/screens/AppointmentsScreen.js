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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson } from '../api';

const MINT = '#2ec4b6';

const STATUS_COLORS = {
    scheduled: { bg: '#dbeafe', text: '#1d4ed8', label: 'Запланировано' },
    completed: { bg: '#dcfce7', text: '#16a34a', label: 'Завершено' },
    cancelled: { bg: '#f3f4f6', text: '#6b7280', label: 'Отменено' },
};

const TABS = [
    { key: 'upcoming', label: 'Предстоящие' },
    { key: 'today', label: 'Сегодня' },
    { key: 'all', label: 'Все' },
];

export default function AppointmentsScreen() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientPicker, setShowPatientPicker] = useState(false);
    const [form, setForm] = useState({ date: '', time: '', notes: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAppointments();
        loadPatients();
    }, [activeTab]);

    const loadAppointments = async () => {
        setLoading(true);
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
            console.log('Error loading appointments:', error);
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
            console.log('Error loading patients:', error);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadAppointments();
    }, [activeTab]);

    const handleCreate = async () => {
        if (!selectedPatient || !form.date || !form.time) {
            Alert.alert('Ошибка', 'Заполните все обязательные поля');
            return;
        }

        setSaving(true);
        try {
            const datetime = `${form.date}T${form.time}:00`;
            await apiFetch('/appointments/', {
                method: 'POST',
                body: JSON.stringify({
                    patient: selectedPatient.id,
                    scheduled_at: datetime,
                    notes: form.notes,
                }),
            });
            setShowCreateModal(false);
            setForm({ date: '', time: '', notes: '' });
            setSelectedPatient(null);
            loadAppointments();
        } catch (error) {
            console.log('Error creating appointment:', error);
            Alert.alert('Ошибка', 'Не удалось создать запись');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (id) => {
        Alert.alert(
            'Отменить приём',
            'Вы уверены, что хотите отменить этот приём?',
            [
                { text: 'Нет', style: 'cancel' },
                {
                    text: 'Да, отменить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiFetch(`/appointments/${id}/cancel/`, { method: 'POST' });
                            loadAppointments();
                        } catch (error) {
                            console.log('Error cancelling appointment:', error);
                            Alert.alert('Ошибка', 'Не удалось отменить приём');
                        }
                    },
                },
            ]
        );
    };

    const handleComplete = async (id) => {
        try {
            await apiFetch(`/appointments/${id}/complete/`, { method: 'POST' });
            loadAppointments();
        } catch (error) {
            console.log('Error completing appointment:', error);
            Alert.alert('Ошибка', 'Не удалось завершить приём');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderItem = ({ item }) => {
        const status = STATUS_COLORS[item.status] || STATUS_COLORS.scheduled;
        
        return (
            <View style={s.appointmentCard}>
                <View style={s.cardContent}>
                    <Text style={s.patientName}>
                        {item.patient_name || `Пациент #${item.patient}`}
                    </Text>
                    <View style={s.dateRow}>
                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                        <Text style={s.dateText}>
                            {formatDate(item.scheduled_at)} в {formatTime(item.scheduled_at)}
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
                        <Text style={s.title}>Расписание</Text>
                        <Text style={s.subtitle}>Приёмы и записи</Text>
                    </View>
                    <TouchableOpacity style={s.addBtn} onPress={() => setShowCreateModal(true)}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={s.addBtnText}>Новый приём</Text>
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
                                <Text style={s.emptyTitle}>Нет приёмов</Text>
                                <Text style={s.emptySubtitle}>Запланируйте новый приём</Text>
                            </View>
                        }
                    />
                )}

                {/* Create Modal */}
                <Modal
                    visible={showCreateModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowCreateModal(false)}
                >
                    <View style={s.modalOverlay}>
                        <View style={s.modalContent}>
                            <View style={s.modalHeader}>
                                <Text style={s.modalTitle}>Новый приём</Text>
                                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={s.modalBody}>
                                <Text style={s.inputLabel}>Пациент *</Text>
                                <TouchableOpacity
                                    style={s.pickerBtn}
                                    onPress={() => setShowPatientPicker(true)}
                                >
                                    <Text style={selectedPatient ? s.pickerText : s.pickerPlaceholder}>
                                        {selectedPatient
                                            ? `${selectedPatient.last_name} ${selectedPatient.first_name}`
                                            : 'Выберите пациента...'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                </TouchableOpacity>

                                <Text style={s.inputLabel}>Дата *</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="ГГГГ-ММ-ДД"
                                    value={form.date}
                                    onChangeText={(text) => setForm({ ...form, date: text })}
                                />

                                <Text style={s.inputLabel}>Время *</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="ЧЧ:ММ"
                                    value={form.time}
                                    onChangeText={(text) => setForm({ ...form, time: text })}
                                />

                                <Text style={s.inputLabel}>Заметки</Text>
                                <TextInput
                                    style={[s.input, s.textArea]}
                                    placeholder="Дополнительная информация..."
                                    value={form.notes}
                                    onChangeText={(text) => setForm({ ...form, notes: text })}
                                    multiline
                                    numberOfLines={3}
                                />
                            </ScrollView>

                            <View style={s.modalFooter}>
                                <TouchableOpacity
                                    style={s.cancelButton}
                                    onPress={() => setShowCreateModal(false)}
                                >
                                    <Text style={s.cancelButtonText}>Отмена</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.createButton, saving && s.createButtonDisabled]}
                                    onPress={handleCreate}
                                    disabled={saving}
                                >
                                    <Text style={s.createButtonText}>
                                        {saving ? 'Создание...' : 'Создать'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Patient Picker Modal */}
                <Modal
                    visible={showPatientPicker}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowPatientPicker(false)}
                >
                    <View style={s.modalOverlay}>
                        <View style={s.modalContent}>
                            <View style={s.modalHeader}>
                                <Text style={s.modalTitle}>Выберите пациента</Text>
                                <TouchableOpacity onPress={() => setShowPatientPicker(false)}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={patients}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={s.patientItem}
                                        onPress={() => {
                                            setSelectedPatient(item);
                                            setShowPatientPicker(false);
                                        }}
                                    >
                                        <Text style={s.patientItemText}>
                                            {item.last_name} {item.first_name}
                                        </Text>
                                        {item.birth_date && (
                                            <Text style={s.patientItemDate}>{item.birth_date}</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        </View>
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
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
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
    modalBody: { padding: 16 },
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
