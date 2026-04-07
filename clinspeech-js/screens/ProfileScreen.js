import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, Alert, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, safeJson, BASE_URL } from '../api';
import { useLocale } from '../i18n/LocaleContext';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';

const PRIMARY = '#2ec4b6';

export default function ProfileScreen({ navigation }) {
  const { t } = useLocale();
  const ROLE_LABELS = { admin: t('Администратор'), doctor: t('Врач'), patient: t('Пациент') };

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password modal
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', new_password2: '' });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await apiFetch('/me/');
      const data = await safeJson(res);
      setProfile(data);
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        middle_name: data.middle_name || '',
        phone: data.phone || '',
        specialization: data.specialization || '',
      });
    } catch {} finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    setError(''); setSuccess('');
    setSaving(true);
    try {
      const res = await apiFetch('/me/', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await safeJson(res);
        throw new Error(typeof d === 'object' ? Object.values(d).flat().join('; ') : t('Ошибка'));
      }
      await loadProfile();
      setEditing(false);
      setSuccess(t('Профиль обновлён'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setError(''); setSuccess('');
    if (pwdForm.new_password !== pwdForm.new_password2) {
      setError(t('Пароли не совпадают'));
      return;
    }
    if (pwdForm.new_password.length < 8) {
      setError(t('Минимум 8 символов'));
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          old_password: pwdForm.old_password,
          new_password: pwdForm.new_password,
        }),
      });
      if (!res.ok) {
        const d = await safeJson(res);
        throw new Error(typeof d === 'object' ? Object.values(d).flat().join('; ') : t('Неверный текущий пароль'));
      }
      setShowPwd(false);
      setPwdForm({ old_password: '', new_password: '', new_password2: '' });
      setSuccess(t('Пароль изменён'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    Alert.alert(t('Выйти из аккаунта?'), t('Завершить текущую сессию'), [
      { text: t('Отмена'), style: 'cancel' },
      {
        text: t('Выйти'), style: 'destructive',
        onPress: async () => {
          try {
            const refresh = await AsyncStorage.getItem('refresh_token');
            await apiFetch('/auth/logout/', {
              method: 'POST',
              body: JSON.stringify(refresh ? { refresh } : {}),
            });
          } catch {}
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        }
      },
    ]);
  };

  if (loading) return (
    <View style={s.loadingContainer}>
      <AnimatedGradientBackground />
      <ActivityIndicator size="large" color={PRIMARY} />
    </View>
  );

  const initials = `${(profile?.first_name?.[0] || '').toUpperCase()}${(profile?.last_name?.[0] || '').toUpperCase()}`;

  return (
    <View style={s.container}>
      <AnimatedGradientBackground />
      <SafeAreaView style={s.safeArea}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.pageTitle}>{t('Профиль')}</Text>

        {success ? (
          <View style={s.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            <Text style={s.successText}>{success}</Text>
          </View>
        ) : null}
        {error && !showPwd ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Avatar & Info */}
        <View style={s.card}>
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.profileName}>
                {profile?.last_name} {profile?.first_name} {profile?.middle_name || ''}
              </Text>
              <View style={s.roleBadgeRow}>
                <View style={s.roleBadge}>
                  <Text style={s.roleBadgeText}>{ROLE_LABELS[profile?.role] || profile?.role}</Text>
                </View>
                <Text style={s.email}>{profile?.email}</Text>
              </View>
            </View>
          </View>

          {!editing ? (
            <>
              <View style={s.infoGrid}>
                {[
                  { label: t('Фамилия'), val: profile?.last_name },
                  { label: t('Имя'), val: profile?.first_name },
                  { label: t('Отчество'), val: profile?.middle_name || '—' },
                  { label: t('Телефон'), val: profile?.phone || '—' },
                  { label: t('Email'), val: profile?.email },
                  // Организация только для врачей и админов (не для пациентов)
                  ...(profile?.role !== 'patient' ? [{ label: t('Организация'), val: profile?.organization_name || '—' }] : []),
                  ...(profile?.role === 'doctor' ? [{ label: t('Специализация'), val: profile?.specialization || '—' }] : []),
                ].map(({ label, val }) => (
                  <View key={label} style={s.infoItem}>
                    <Text style={s.infoLabel}>{label}</Text>
                    <Text style={s.infoValue}>{val}</Text>
                  </View>
                ))}
              </View>
              <View style={s.btnRow}>
                <TouchableOpacity style={s.primaryBtn} onPress={() => { setEditing(true); setError(''); }}>
                  <Ionicons name="create-outline" size={16} color="#fff" />
                  <Text style={s.primaryBtnText}>{t('Редактировать')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => setShowPwd(true)}>
                  <Ionicons name="lock-closed-outline" size={16} color={PRIMARY} />
                  <Text style={s.secondaryBtnText}>{t('Сменить пароль')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={{ marginTop: 16 }}>
              <Text style={s.label}>{t('Фамилия')}</Text>
              <TextInput style={s.input} value={form.last_name} onChangeText={v => setForm({...form, last_name: v})} />
              <Text style={s.label}>{t('Имя')}</Text>
              <TextInput style={s.input} value={form.first_name} onChangeText={v => setForm({...form, first_name: v})} />
              <Text style={s.label}>{t('Отчество')}</Text>
              <TextInput style={s.input} value={form.middle_name} onChangeText={v => setForm({...form, middle_name: v})} />
              <Text style={s.label}>{t('Телефон')}</Text>
              <TextInput style={s.input} value={form.phone} onChangeText={v => setForm({...form, phone: v})} keyboardType="phone-pad" />
              {profile?.role === 'doctor' && (
                <>
                  <Text style={s.label}>{t('Специализация')}</Text>
                  <TextInput style={s.input} value={form.specialization} onChangeText={v => setForm({...form, specialization: v})} placeholder="Терапевт, Кардиолог..." placeholderTextColor="#bbb" />
                </>
              )}
              <View style={s.btnRow}>
                <TouchableOpacity style={[s.primaryBtn, saving && { opacity: 0.6 }]} onPress={handleUpdate} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>{t('Сохранить')}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => { setEditing(false); setError(''); }}>
                  <Text style={s.secondaryBtnText}>{t('Отмена')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Logout card */}
        <View style={s.card}>
          <View style={s.logoutRow}>
            <View>
              <Text style={s.logoutTitle}>{t('Выход из системы')}</Text>
              <Text style={s.logoutSub}>{t('Завершить текущую сессию')}</Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={s.logoutBtnText}>{t('Выйти')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>

      {/* Password Modal */}
      <Modal visible={showPwd} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('Смена пароля')}</Text>
              <TouchableOpacity onPress={() => { setShowPwd(false); setError(''); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={s.modalBody}>
              {error ? <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View> : null}
              <Text style={s.label}>{t('Текущий пароль')} *</Text>
              <TextInput style={s.input} secureTextEntry value={pwdForm.old_password} onChangeText={v => setPwdForm({...pwdForm, old_password: v})} />
              <Text style={s.label}>{t('Новый пароль')} *</Text>
              <TextInput style={s.input} secureTextEntry value={pwdForm.new_password} onChangeText={v => setPwdForm({...pwdForm, new_password: v})} />
              <Text style={s.label}>{t('Подтвердите новый пароль')} *</Text>
              <TextInput style={s.input} secureTextEntry value={pwdForm.new_password2} onChangeText={v => setPwdForm({...pwdForm, new_password2: v})} />
            </View>
            <View style={s.modalFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowPwd(false); setError(''); }}>
                <Text style={s.cancelBtnText}>{t('Отмена')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryBtn, saving && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>{t('Сменить')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginTop: 10, marginBottom: 16 },
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10, marginBottom: 12, gap: 8 },
  successText: { color: '#22C55E', fontSize: 14, fontWeight: '500' },
  errorBanner: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, marginBottom: 12 },
  errorText: { color: '#EF4444', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  roleBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  roleBadge: { backgroundColor: PRIMARY + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleBadgeText: { fontSize: 12, fontWeight: '600', color: PRIMARY },
  email: { fontSize: 12, color: '#888' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  infoItem: { width: '50%', marginBottom: 14 },
  infoLabel: { fontSize: 11, color: '#aaa', marginBottom: 2, textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#333' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  secondaryBtnText: { color: PRIMARY, fontWeight: '600', fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: '#fafafa' },
  logoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoutTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  logoutSub: { fontSize: 12, color: '#888', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FEF2F2' },
  logoutBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  modalBody: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f0f0f0' },
  cancelBtnText: { color: '#555', fontWeight: '600' },
});
