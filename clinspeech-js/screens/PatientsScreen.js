import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Modal, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, safeJson } from '../api';
import { useLocale } from '../i18n/LocaleContext';

const PRIMARY = '#2ec4b6';

export default function PatientsScreen({ navigation }) {
  const { t } = useLocale();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [orgs, setOrgs] = useState([]);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', middle_name: '', birth_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyPatientId, setHistoryPatientId] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    apiFetch('/me/').then(safeJson).then(setUser).catch(() => {});
    apiFetch('/organizations/').then(safeJson).then(data => {
      setOrgs(Array.isArray(data) ? data : (data?.results || []));
    }).catch(() => {});
    loadPatients();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadPatients(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const url = search ? `/patients/?search=${encodeURIComponent(search)}` : '/patients/';
      const res = await apiFetch(url);
      const data = await safeJson(res);
      setPatients(Array.isArray(data) ? data : (data?.results || []));
    } catch {} finally { setLoading(false); }
  }, [search]);

  const handleCreate = async () => {
    if (!form.last_name || !form.first_name || !form.birth_date) {
      setError(t('Заполните обязательные поля'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await apiFetch('/patients/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await safeJson(res);
        throw new Error(typeof d === 'object' ? Object.values(d).flat().join('; ') : t('Ошибка'));
      }
      setShowCreate(false);
      setForm({ first_name: '', last_name: '', middle_name: '', birth_date: '' });
      loadPatients();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert(t('Удалить пациента?'), t('Это действие нельзя отменить'), [
      { text: t('Отмена'), style: 'cancel' },
      {
        text: t('Удалить'), style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/patients/${id}/`, { method: 'DELETE' });
            loadPatients();
          } catch { Alert.alert(t('Ошибка'), t('Не удалось удалить пациента')); }
        }
      },
    ]);
  };

  const loadHistory = async (patientId) => {
    setHistoryPatientId(patientId);
    setShowHistory(true);
    setHistoryLoading(true);
    setHistoryError('');
    setHistory(null);
    try {
      const res = await apiFetch(`/patients/${patientId}/history/`);
      if (!res.ok) {
        const d = await safeJson(res);
        throw new Error(d.error || d.detail || `${t('Ошибка')} ${res.status}`);
      }
      const data = await safeJson(res);
      setHistory(data);
    } catch (err) {
      setHistoryError(err.message || t('Ошибка загрузки'));
    } finally { setHistoryLoading(false); }
  };

  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

  const renderPatient = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.patientName}>
            {item.last_name} {item.first_name} {item.middle_name || ''}
          </Text>
          <Text style={s.patientInfo}>
            {t('Дата рождения')}: {item.birth_date || '—'}
          </Text>
          <Text style={s.patientInfo}>
            {t('Организация')}: {orgs.find(o => o.id === item.organization)?.name || '—'}
          </Text>
        </View>
      </View>
      <View style={s.cardActions}>
        <TouchableOpacity style={s.actionBtn} onPress={() => loadHistory(item.id)}>
          <Ionicons name="time-outline" size={16} color={PRIMARY} />
          <Text style={s.actionText}>{t('История')}</Text>
        </TouchableOpacity>
        {isDoctor && (
          <TouchableOpacity style={[s.actionBtn, { borderColor: '#E74C3C' }]} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={16} color="#E74C3C" />
            <Text style={[s.actionText, { color: '#E74C3C' }]}>{t('Удалить')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>{t('Пациенты')}</Text>
          <Text style={s.subtitle}>{patients.length} {t('записей')}</Text>
        </View>
        {isDoctor && (
          <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={s.addBtnText}>{t('Добавить')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={s.searchBar}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={s.searchInput}
          placeholder={t('Поиск по ФИО...')}
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
      ) : patients.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="people-outline" size={48} color="#ccc" />
          <Text style={s.emptyTitle}>{t('Нет пациентов')}</Text>
          <Text style={s.emptyText}>{t('Добавьте первого пациента')}</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={item => String(item.id)}
          renderItem={renderPatient}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('Новый пациент')}</Text>
              <TouchableOpacity onPress={() => { setShowCreate(false); setError(''); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.modalBody}>
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Text style={s.label}>{t('Фамилия')} *</Text>
              <TextInput style={s.input} value={form.last_name} onChangeText={v => setForm({...form, last_name: v})} />
              <Text style={s.label}>{t('Имя')} *</Text>
              <TextInput style={s.input} value={form.first_name} onChangeText={v => setForm({...form, first_name: v})} />
              <Text style={s.label}>{t('Отчество')}</Text>
              <TextInput style={s.input} value={form.middle_name} onChangeText={v => setForm({...form, middle_name: v})} />
              <Text style={s.label}>{t('Дата рождения')} * (ГГГГ-ММ-ДД)</Text>
              <TextInput style={s.input} value={form.birth_date} onChangeText={v => setForm({...form, birth_date: v})} placeholder="2000-01-15" placeholderTextColor="#bbb" />
            </ScrollView>
            <View style={s.modalFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowCreate(false); setError(''); }}>
                <Text style={s.cancelBtnText}>{t('Отмена')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryBtn, saving && { opacity: 0.6 }]} onPress={handleCreate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t('Создать')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modal, { maxHeight: '80%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {t('История болезни')}{history ? `: ${history.patient_name}` : ''}
              </Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.modalBody}>
              {historyLoading && <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 20 }} />}
              {historyError ? <Text style={s.errorText}>{historyError}</Text> : null}
              {history && (
                <>
                  <Text style={s.historyMeta}>
                    {t('Дата рождения')}: {history.birth_date || '—'} · {t('Всего консультаций')}: {history.total_consultations}
                  </Text>
                  {history.consultations?.length === 0 ? (
                    <Text style={s.emptyText}>{t('Нет консультаций')}</Text>
                  ) : (
                    history.consultations?.map(c => (
                      <TouchableOpacity key={c.id} style={s.historyCard} onPress={() => {
                        setShowHistory(false);
                        navigation.navigate('Detail', { consultationId: c.id });
                      }}>
                        <View>
                          <Text style={s.historyDate}>{new Date(c.created_at).toLocaleDateString('ru-RU')}</Text>
                          <Text style={s.historyInfo}>{c.doctor_name} · {c.diagnosis || t('Без диагноза')}</Text>
                        </View>
                        <Text style={[s.badge, c.status === 'ready' && s.badgeSuccess]}>
                          {c.has_pdf ? '📄 PDF' : c.status}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '600', marginLeft: 4, fontSize: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e8e8e8' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  patientName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  patientInfo: { fontSize: 13, color: '#666', marginTop: 2 },
  cardActions: { flexDirection: 'row', marginTop: 10, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: PRIMARY },
  actionText: { fontSize: 13, color: PRIMARY, marginLeft: 4, fontWeight: '500' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#bbb', marginTop: 4 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  modalBody: { paddingHorizontal: 20, paddingTop: 10 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: '#fafafa' },
  errorText: { color: '#E74C3C', fontSize: 13, marginBottom: 8, backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f0f0f0' },
  cancelBtnText: { color: '#555', fontWeight: '600' },
  primaryBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: PRIMARY },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  // History
  historyMeta: { fontSize: 13, color: '#888', marginBottom: 14 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 8 },
  historyDate: { fontSize: 14, fontWeight: '500', color: '#333' },
  historyInfo: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { fontSize: 12, fontWeight: '600', color: '#888', backgroundColor: '#eee', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeSuccess: { backgroundColor: '#d4edda', color: '#28a745' },
});
