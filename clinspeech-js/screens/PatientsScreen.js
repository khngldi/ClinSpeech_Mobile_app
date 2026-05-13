import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Modal, ScrollView,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson } from '../api';
import { useLocale } from '../i18n/LocaleContext';
import StatusChip from '../components/StatusChip';
import { getFriendlyApiError } from '../utils/apiErrors';

const PRIMARY = '#2ec4b6';
const EMPTY_FORM = { first_name: '', last_name: '', middle_name: '', birth_date: '', organization: '' };
const EMPTY_APPOINTMENT_FORM = { date: '', time: '', notes: '' };

const pad = (value) => String(value).padStart(2, '0');
const toISODate = (date) => {
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const toTimeValue = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const getTodayDate = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};
const parseFutureDate = (value) => {
  if (!value) return getTodayDate();
  const parts = String(value).split('-').map(Number);
  if (parts.length === 3 && parts.every(Boolean)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? getTodayDate() : parsed;
};
const parseISODate = (value) => {
  if (!value) return new Date(1990, 0, 1);
  const parts = String(value).split('-').map(Number);
  if (parts.length === 3 && parts.every(Boolean)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(1990, 0, 1) : parsed;
};
const parseTimeValue = (value) => {
  const date = new Date();
  const [hours, minutes] = String(value || '').split(':').map(Number);
  if (Number.isFinite(hours)) date.setHours(hours);
  if (Number.isFinite(minutes)) date.setMinutes(minutes);
  date.setSeconds(0, 0);
  return date;
};
const getPatientFullName = (patient) => (
  `${patient?.last_name || ''} ${patient?.first_name || ''} ${patient?.middle_name || ''}`.trim()
);

export default function PatientsScreen({ navigation }) {
  const { t, formatDate } = useLocale();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [orgs, setOrgs] = useState([]);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Create from existing patient user
  const [showFromUser, setShowFromUser] = useState(false);
  const [patientUsers, setPatientUsers] = useState([]);
  const [patientUsersLoading, setPatientUsersLoading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateSaving, setCandidateSaving] = useState(null);
  const [fromUserSaving, setFromUserSaving] = useState(false);
  const [fromUserError, setFromUserError] = useState('');

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyPatientId, setHistoryPatientId] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Appointment modal
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedulePatient, setSchedulePatient] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState(EMPTY_APPOINTMENT_FORM);
  const [showAppointmentDatePicker, setShowAppointmentDatePicker] = useState(false);
  const [showAppointmentTimePicker, setShowAppointmentTimePicker] = useState(false);
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [appointmentError, setAppointmentError] = useState('');

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

  const loadPatients = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const url = search ? `/patients/?search=${encodeURIComponent(search)}` : '/patients/';
      const res = await apiFetch(url);
      const data = await safeJson(res);
      setPatients(Array.isArray(data) ? data : (data?.results || []));
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPatients(false);
  }, [loadPatients]);

  const defaultOrganizationId = user?.organization
    ? String(user.organization)
    : (orgs.length === 1 ? String(orgs[0].id) : '');

  const getOrgName = (id, fallback) => {
    if (!id) return fallback;
    return orgs.find((org) => String(org.id) === String(id))?.name || fallback;
  };

  const openCreate = () => {
    setEditingPatient(null);
    setForm({ ...EMPTY_FORM, organization: defaultOrganizationId });
    setError('');
    setShowOrgPicker(false);
    setShowCreate(true);
  };

  const openAppointmentModal = (patient) => {
    setSchedulePatient(patient);
    setAppointmentForm(EMPTY_APPOINTMENT_FORM);
    setAppointmentError('');
    setShowAppointmentDatePicker(false);
    setShowAppointmentTimePicker(false);
    setShowSchedule(true);
  };

  const closeAppointmentModal = () => {
    setShowSchedule(false);
    setSchedulePatient(null);
    setAppointmentForm(EMPTY_APPOINTMENT_FORM);
    setAppointmentError('');
    setShowAppointmentDatePicker(false);
    setShowAppointmentTimePicker(false);
  };

  const handleAppointmentDateChange = (event, selectedDate) => {
    if (Platform.OS !== 'ios') setShowAppointmentDatePicker(false);
    if (event?.type === 'dismissed') return;
    if (selectedDate) {
      setAppointmentForm((prev) => ({ ...prev, date: toISODate(selectedDate) }));
    }
  };

  const handleAppointmentTimeChange = (event, selectedTime) => {
    if (Platform.OS !== 'ios') setShowAppointmentTimePicker(false);
    if (event?.type === 'dismissed') return;
    if (selectedTime) {
      setAppointmentForm((prev) => ({ ...prev, time: toTimeValue(selectedTime) }));
    }
  };

  const openAppointmentDatePicker = () => {
    setShowAppointmentTimePicker(false);

    const minimumDate = getTodayDate();
    let value = parseFutureDate(appointmentForm.date);
    if (value < minimumDate) value = minimumDate;

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        display: 'calendar',
        minimumDate,
        onChange: handleAppointmentDateChange,
      });
      return;
    }

    if (!appointmentForm.date) {
      setAppointmentForm((prev) => ({ ...prev, date: toISODate(value) }));
    }
    setShowAppointmentDatePicker(true);
  };

  const openAppointmentTimePicker = () => {
    setShowAppointmentDatePicker(false);

    const value = parseTimeValue(appointmentForm.time);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'time',
        display: 'clock',
        is24Hour: true,
        onChange: handleAppointmentTimeChange,
      });
      return;
    }

    if (!appointmentForm.time) {
      setAppointmentForm((prev) => ({ ...prev, time: toTimeValue(value) }));
    }
    setShowAppointmentTimePicker(true);
  };

  const handleCreateAppointment = async () => {
    if (!schedulePatient?.id || !appointmentForm.date || !appointmentForm.time) {
      setAppointmentError(t('Заполните дату и время приёма'));
      return;
    }

    setAppointmentSaving(true);
    setAppointmentError('');
    try {
      const res = await apiFetch('/appointments/', {
        method: 'POST',
        body: JSON.stringify({
          patient: schedulePatient.id,
          scheduled_at: `${appointmentForm.date}T${appointmentForm.time}:00`,
          notes: appointmentForm.notes,
        }),
      });
      if (!res.ok) {
        const payload = await safeJson(res);
        throw { status: res.status, payload };
      }
      closeAppointmentModal();
      Alert.alert(t('Успешно'), t('Приём записан'), [
        {
          text: 'OK',
          onPress: () => {
            if (user?.role === 'doctor') navigation.navigate('Расписание');
          },
        },
      ]);
    } catch (err) {
      console.error('Appointment create from patient failed:', err);
      setAppointmentError(getFriendlyApiError(err, t, 'Не удалось создать запись'));
    } finally {
      setAppointmentSaving(false);
    }
  };

  const closeForm = () => {
    setShowCreate(false);
    setShowBirthPicker(false);
    setShowOrgPicker(false);
    setEditingPatient(null);
    setError('');
  };

  const handleSavePatient = async () => {
    if (!form.last_name || !form.first_name || !form.birth_date || !form.organization) {
      setError(t('Заполните обязательные поля'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await apiFetch(editingPatient ? `/patients/${editingPatient.id}/` : '/patients/', {
        method: editingPatient ? 'PATCH' : 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await safeJson(res);
        throw { status: res.status, payload: d };
      }
      closeForm();
      setForm(EMPTY_FORM);
      loadPatients();
    } catch (err) {
      console.error('Patient save failed:', err);
      setError(getFriendlyApiError(err, t, 'Не удалось сохранить пациента'));
    } finally { setSaving(false); }
  };

  const candidateName = (candidate) => {
    const fullName = `${candidate.last_name || ''} ${candidate.first_name || ''} ${candidate.middle_name || ''}`.trim();
    return fullName || candidate.username || candidate.email || t('Пациент');
  };

  const loadPatientCandidates = useCallback(async (value = '') => {
    setPatientUsersLoading(true);
    setFromUserError('');
    try {
      const query = value ? `?search=${encodeURIComponent(value)}` : '';
      const res = await apiFetch(`/patients/search_candidates/${query}`);
      if (!res.ok) {
        const payload = await safeJson(res);
        throw { status: res.status, payload };
      }
      const data = await safeJson(res);
      setPatientUsers(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      console.error('Patient candidates load failed:', err);
      setFromUserError(getFriendlyApiError(err, t, 'Не удалось загрузить пациентов'));
      setPatientUsers([]);
    } finally {
      setPatientUsersLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!showFromUser) return undefined;
    const timer = setTimeout(() => loadPatientCandidates(candidateSearch), 250);
    return () => clearTimeout(timer);
  }, [showFromUser, candidateSearch, loadPatientCandidates]);

  const openFromUser = () => {
    setShowFromUser(true);
    setCandidateSearch('');
    setPatientUsers([]);
    setFromUserError('');
  };

  const closeFromUser = () => {
    setShowFromUser(false);
    setCandidateSearch('');
    setPatientUsers([]);
    setCandidateSaving(null);
    setFromUserError('');
  };

  const handleAddCandidate = async (candidate) => {
    if (candidate.status === 'other_organization') {
      Alert.alert(
        t('Пациент в другой организации'),
        t('Пациент находится в другой организации: {{org}}', 'Пациент находится в другой организации: {{org}}', { org: candidate.organization_name || '—' })
      );
      return;
    }
    if (candidate.status === 'same_organization') {
      Alert.alert(t('Пациент уже добавлен'), t('Пациент уже находится в вашей организации'));
      return;
    }
    if (!candidate.can_add) {
      Alert.alert(t('Нельзя добавить пациента'), candidate.message || t('Пациента нельзя добавить'));
      return;
    }

    setFromUserError('');
    const savingKey = String(candidate.id || candidate.user_id);
    setCandidateSaving(savingKey);
    setFromUserSaving(true);
    try {
      const isUser = candidate.type === 'user_without_profile';
      const res = await apiFetch(isUser ? '/patients/from_user/' : '/patients/attach/', {
        method: 'POST',
        body: JSON.stringify(isUser
          ? { user_id: candidate.user_id }
          : { patient_id: candidate.patient_id || candidate.id }),
      });
      if (!res.ok) {
        const data = await safeJson(res);
        throw { status: res.status, payload: data };
      }
      closeFromUser();
      loadPatients();
    } catch (err) {
      console.error('Patient add candidate failed:', err);
      setFromUserError(getFriendlyApiError(err, t, 'Не удалось добавить пациента'));
    } finally {
      setFromUserSaving(false);
      setCandidateSaving(null);
    }
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
          } catch (error) {
            console.error('Patient delete failed:', error);
            Alert.alert(t('Ошибка'), t('Не удалось удалить пациента'));
          }
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
        throw { status: res.status, payload: d };
      }
      const data = await safeJson(res);
      setHistory(data);
    } catch (err) {
      console.error('Patient history load failed:', err);
      setHistoryError(getFriendlyApiError(err, t, 'Ошибка загрузки'));
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
            {t('Дата рождения')}: {item.birth_date ? formatDate(item.birth_date) : '—'}
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
          <>
            <TouchableOpacity style={[s.actionBtn, s.recordBtn]} onPress={() => openAppointmentModal(item)}>
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={s.recordActionText}>{t('Записать')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { borderColor: '#E74C3C' }]} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={16} color="#E74C3C" />
              <Text style={[s.actionText, { color: '#E74C3C' }]}>{t('Удалить')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <AnimatedGradientBackground />
      <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>{t('Пациенты')}</Text>
          <Text style={s.subtitle}>{patients.length} {t('записей')}</Text>
        </View>
      </View>

      {isDoctor && (
        <View style={s.topActions}>
          <TouchableOpacity style={[s.addBtn, s.addPatientBtn]} onPress={openFromUser} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={s.addBtnText}>{t('Добавить пациента')}</Text>
          </TouchableOpacity>
        </View>
      )}

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
        <ScrollView
          contentContainerStyle={s.emptyScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
        >
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={s.emptyTitle}>{t('Нет пациентов')}</Text>
            <Text style={s.emptyText}>{t('Добавьте первого пациента')}</Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={item => String(item.id)}
          renderItem={renderPatient}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingPatient ? t('Редактирование пациента') : t('Новый пациент')}</Text>
              <TouchableOpacity onPress={closeForm}>
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
              <Text style={s.label}>{t('Дата рождения')} *</Text>
              <TouchableOpacity style={s.dateButton} onPress={() => setShowBirthPicker(true)} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={18} color={PRIMARY} />
                <Text style={[s.dateButtonText, !form.birth_date && s.datePlaceholder]}>
                  {form.birth_date ? formatDate(form.birth_date) : t('Выберите дату')}
                </Text>
              </TouchableOpacity>
              {showBirthPicker && (
                <>
                  <DateTimePicker
                    value={parseISODate(form.birth_date)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS !== 'ios') setShowBirthPicker(false);
                      if (event?.type === 'dismissed') return;
                      if (selectedDate) setForm({ ...form, birth_date: toISODate(selectedDate) });
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={s.dateDoneBtn} onPress={() => setShowBirthPicker(false)}>
                      <Text style={s.dateDoneText}>{t('Готово')}</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              <Text style={s.label}>{t('Организация')} *</Text>
              <TouchableOpacity
                style={s.selectButton}
                onPress={() => setShowOrgPicker((value) => !value)}
                activeOpacity={0.8}
              >
                <View style={s.selectButtonLeft}>
                  <Ionicons name="business-outline" size={18} color={PRIMARY} />
                  <Text style={[s.selectButtonText, !form.organization && s.datePlaceholder]}>
                    {getOrgName(form.organization, t('Выберите организацию'))}
                  </Text>
                </View>
                <Ionicons name={showOrgPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
              </TouchableOpacity>
              {showOrgPicker && (
                <View style={s.inlineSelect}>
                  {orgs.length === 0 ? (
                    <Text style={s.inlineSelectEmpty}>{t('Организации не найдены')}</Text>
                  ) : orgs.map((org) => (
                    <TouchableOpacity
                      key={org.id}
                      style={[
                        s.inlineSelectItem,
                        String(form.organization) === String(org.id) && s.inlineSelectItemActive,
                      ]}
                      onPress={() => {
                        setForm({ ...form, organization: String(org.id) });
                        setShowOrgPicker(false);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={s.inlineSelectText}>{org.name}</Text>
                      {String(form.organization) === String(org.id) && (
                        <Ionicons name="checkmark-circle" size={20} color={PRIMARY} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
            <View style={s.modalFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeForm}>
                <Text style={s.cancelBtnText}>{t('Отмена')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryBtn, saving && { opacity: 0.6 }]} onPress={handleSavePatient} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{editingPatient ? t('Сохранить') : t('Создать')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Appointment Modal */}
      <Modal visible={showSchedule} animationType="slide" transparent onRequestClose={closeAppointmentModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('Записать на приём')}</Text>
              <TouchableOpacity onPress={closeAppointmentModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={s.modalBody}
              contentContainerStyle={s.modalBodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {appointmentError ? <Text style={s.errorText}>{appointmentError}</Text> : null}

              <View style={s.appointmentPatientCard}>
                <View style={s.appointmentPatientIcon}>
                  <Ionicons name="person-outline" size={20} color={PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.appointmentPatientName}>
                    {getPatientFullName(schedulePatient) || t('Пациент')}
                  </Text>
                  <Text style={s.appointmentPatientMeta}>
                    {t('Пациент будет добавлен в расписание')}
                  </Text>
                </View>
              </View>

              <Text style={s.label}>{t('Дата')} *</Text>
              <TouchableOpacity style={s.dateButton} onPress={openAppointmentDatePicker} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={18} color={PRIMARY} />
                <Text style={[s.dateButtonText, !appointmentForm.date && s.datePlaceholder]}>
                  {appointmentForm.date ? formatDate(appointmentForm.date) : t('Выберите дату')}
                </Text>
              </TouchableOpacity>
              {Platform.OS === 'ios' && showAppointmentDatePicker && (
                <View style={s.iosPickerFrame}>
                  <DateTimePicker
                    value={parseFutureDate(appointmentForm.date)}
                    mode="date"
                    display="spinner"
                    minimumDate={getTodayDate()}
                    textColor="#111827"
                    accentColor={PRIMARY}
                    themeVariant="light"
                    locale="ru-RU"
                    style={s.iosPicker}
                    onChange={handleAppointmentDateChange}
                  />
                  <TouchableOpacity style={s.dateDoneBtn} onPress={() => setShowAppointmentDatePicker(false)}>
                    <Text style={s.dateDoneText}>{t('Готово')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={s.label}>{t('Время')} *</Text>
              <TouchableOpacity style={s.dateButton} onPress={openAppointmentTimePicker} activeOpacity={0.8}>
                <Ionicons name="time-outline" size={18} color={PRIMARY} />
                <Text style={[s.dateButtonText, !appointmentForm.time && s.datePlaceholder]}>
                  {appointmentForm.time || t('Выберите время')}
                </Text>
              </TouchableOpacity>
              {Platform.OS === 'ios' && showAppointmentTimePicker && (
                <View style={s.iosPickerFrame}>
                  <DateTimePicker
                    value={parseTimeValue(appointmentForm.time)}
                    mode="time"
                    display="spinner"
                    is24Hour
                    textColor="#111827"
                    accentColor={PRIMARY}
                    themeVariant="light"
                    locale="ru-RU"
                    style={s.iosPicker}
                    onChange={handleAppointmentTimeChange}
                  />
                  <TouchableOpacity style={s.dateDoneBtn} onPress={() => setShowAppointmentTimePicker(false)}>
                    <Text style={s.dateDoneText}>{t('Готово')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={s.label}>{t('Заметки')}</Text>
              <TextInput
                style={[s.input, s.notesInput]}
                value={appointmentForm.notes}
                onChangeText={(value) => setAppointmentForm((prev) => ({ ...prev, notes: value }))}
                placeholder={t('Дополнительная информация...')}
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ScrollView>
            <View style={s.modalFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeAppointmentModal}>
                <Text style={s.cancelBtnText}>{t('Отмена')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.primaryBtn, appointmentSaving && { opacity: 0.6 }]}
                onPress={handleCreateAppointment}
                disabled={appointmentSaving}
              >
                {appointmentSaving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t('Записать')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* From User Modal */}
      <Modal visible={showFromUser} animationType="slide" transparent onRequestClose={closeFromUser}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('Добавить пациента')}</Text>
              <TouchableOpacity onPress={closeFromUser}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.modalBody} contentContainerStyle={s.modalBodyContent}>
              {fromUserError ? <Text style={s.errorText}>{fromUserError}</Text> : null}

              <Text style={s.label}>{t('Поиск пациента по ФИО')}</Text>
              <View style={s.modalSearchBar}>
                <Ionicons name="search" size={18} color="#94a3b8" />
                <TextInput
                  style={s.modalSearchInput}
                  value={candidateSearch}
                  onChangeText={setCandidateSearch}
                  placeholder={t('Поиск по ФИО...')}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              {patientUsersLoading ? (
                <ActivityIndicator color={PRIMARY} style={{ marginVertical: 18 }} />
              ) : patientUsers.length === 0 ? (
                <View style={s.inlineEmptyCard}>
                  <Ionicons name="people-outline" size={28} color="#94a3b8" />
                  <Text style={s.inlineEmptyTitle}>{t('Пациенты не найдены')}</Text>
                </View>
              ) : (
                <View style={s.userPickerList}>
                  {patientUsers.map((item) => {
                    const isOtherOrg = item.status === 'other_organization';
                    const isSameOrg = item.status === 'same_organization';
                    const isFree = item.status === 'free';
                    const savingKey = String(item.id || item.user_id);
                    return (
                      <View
                        key={`${item.type}-${savingKey}`}
                        style={[
                          s.userPickerItem,
                          isFree && s.userPickerItemFree,
                          isOtherOrg && s.userPickerItemBlocked,
                        ]}
                      >
                        <View style={s.userAvatar}>
                          <Text style={s.userAvatarText}>
                            {(item.first_name?.[0] || item.last_name?.[0] || item.email?.[0] || '?').toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.userPickerName}>{candidateName(item)}</Text>
                          <Text style={s.userPickerMeta}>{item.email || item.username || '—'}</Text>
                          <Text style={[s.candidateStatusText, isOtherOrg && s.candidateStatusDanger]}>
                            {isOtherOrg
                              ? t('Пациент находится в другой организации: {{org}}', 'Пациент находится в другой организации: {{org}}', { org: item.organization_name || '—' })
                              : isSameOrg
                                ? t('Пациент уже находится в вашей организации')
                                : t('Свободный пациент, можно добавить')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[s.candidateAddBtn, !item.can_add && s.candidateAddBtnDisabled]}
                          onPress={() => handleAddCandidate(item)}
                          disabled={fromUserSaving}
                          activeOpacity={0.8}
                        >
                          {candidateSaving === savingKey ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={[s.candidateAddText, !item.can_add && s.candidateAddTextDisabled]}>
                              {item.can_add ? t('Добавить') : t('Проверить')}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
            <View style={s.modalFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeFromUser}>
                <Text style={s.cancelBtnText}>{t('Отмена')}</Text>
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
                  <View style={s.historySummary}>
                    <Text style={s.historyPatient}>{history.patient_name}</Text>
                    <Text style={s.historyMeta}>
                      {t('Дата рождения')}: {history.birth_date ? formatDate(history.birth_date) : '—'} · {t('Всего консультаций')}: {history.total_consultations || 0}
                    </Text>
                  </View>
                  {(!history.consultations || history.consultations.length === 0) ? (
                    <View style={s.historyEmpty}>
                      <Ionicons name="document-text-outline" size={34} color="#94a3b8" />
                      <Text style={s.emptyTitle}>{t('Нет консультаций')}</Text>
                      <Text style={s.emptyText}>{t('У пациента пока нет консультаций')}</Text>
                    </View>
                  ) : (
                    history.consultations?.map(c => (
                      <TouchableOpacity key={c.id} style={s.historyCard} onPress={() => {
                        setShowHistory(false);
                        navigation.navigate('Detail', { consultationId: c.id });
                      }}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={s.historyDate}>{formatDate(c.created_at)}</Text>
                          <Text style={s.historyInfo} numberOfLines={2}>{c.doctor_name || t('Врач')} · {c.diagnosis || t('Без диагноза')}</Text>
                        </View>
                        <StatusChip status={c.status} compact />
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
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  topActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addPatientBtn: { flex: 1, justifyContent: 'center', paddingVertical: 11 },
  addBtnText: { color: '#fff', fontWeight: '600', marginLeft: 4, fontSize: 14 },
  secondaryAddBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: '#bdeee8' },
  secondaryAddBtnText: { color: PRIMARY, fontWeight: '700', marginLeft: 6, fontSize: 13 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e8e8e8' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  patientName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  patientInfo: { fontSize: 13, color: '#666', marginTop: 2 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: PRIMARY },
  actionText: { fontSize: 13, color: PRIMARY, marginLeft: 4, fontWeight: '500' },
  recordBtn: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  recordActionText: { fontSize: 13, color: '#fff', marginLeft: 4, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyScroll: { flexGrow: 1 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#bbb', marginTop: 4 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  modalBody: { paddingHorizontal: 20, paddingTop: 10 },
  modalBodyContent: { paddingBottom: 18 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: '#fafafa' },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#dbeafe', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#f8fafc' },
  dateButtonText: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
  datePlaceholder: { color: '#94a3b8', fontWeight: '400' },
  appointmentPatientCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 8, marginBottom: 4, borderRadius: 14, borderWidth: 1, borderColor: '#ccfbf1', backgroundColor: '#f0fdfa' },
  appointmentPatientIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  appointmentPatientName: { fontSize: 15, fontWeight: '800', color: '#1f2937' },
  appointmentPatientMeta: { fontSize: 12, color: '#0f766e', marginTop: 3, lineHeight: 17 },
  notesInput: { minHeight: 86 },
  iosPickerFrame: { marginTop: 8, paddingBottom: 10, borderWidth: 1, borderColor: '#dbeafe', borderRadius: 14, backgroundColor: '#ffffff', overflow: 'hidden' },
  iosPicker: { height: 190, backgroundColor: '#ffffff' },
  selectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderWidth: 1, borderColor: '#dbeafe', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#f8fafc' },
  selectButtonLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectButtonText: { flex: 1, fontSize: 15, color: '#1f2937', fontWeight: '500' },
  inlineSelect: { marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  inlineSelectItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  inlineSelectItemActive: { backgroundColor: '#f0fdfa' },
  inlineSelectText: { flex: 1, fontSize: 14, color: '#1f2937', fontWeight: '500' },
  inlineSelectEmpty: { padding: 14, textAlign: 'center', color: '#94a3b8', fontSize: 14 },
  dateDoneBtn: { alignSelf: 'flex-end', marginTop: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: PRIMARY },
  dateDoneText: { color: '#fff', fontWeight: '700' },
  errorText: { color: '#E74C3C', fontSize: 13, marginBottom: 8, backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f0f0f0' },
  cancelBtnText: { color: '#555', fontWeight: '600' },
  primaryBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  modalSearchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#dbeafe', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#f8fafc' },
  modalSearchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1f2937' },
  userPickerList: { gap: 8 },
  userPickerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  userPickerItemActive: { borderColor: PRIMARY, backgroundColor: '#f0fdfa' },
  userPickerItemFree: { borderColor: '#99f6e4', backgroundColor: '#f0fdfa' },
  userPickerItemBlocked: { borderColor: '#fecaca', backgroundColor: '#fff1f2' },
  userAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY },
  userAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  userPickerName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  userPickerMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  candidateStatusText: { fontSize: 12, color: '#0f766e', marginTop: 5, lineHeight: 17 },
  candidateStatusDanger: { color: '#dc2626' },
  candidateAddBtn: { minWidth: 78, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: PRIMARY },
  candidateAddBtnDisabled: { backgroundColor: '#e2e8f0' },
  candidateAddText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  candidateAddTextDisabled: { color: '#64748b' },
  inlineEmptyCard: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  inlineEmptyTitle: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  // History
  historySummary: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  historyPatient: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  historyMeta: { fontSize: 12, color: '#64748b' },
  historyEmpty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 18, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  historyDate: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  historyInfo: { fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 17 },
});
