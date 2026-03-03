import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, safeJson } from '../api';

const PRIMARY = '#00C0E8';
const STATUS_COLORS = { created: '#9CA3AF', processing: '#3B82F6', generating: '#F59E0B', ready: '#22C55E', error: '#EF4444' };
const STATUS_LABELS = { created: 'Создано', processing: 'Обработка', generating: 'Генерация', ready: 'Готово', error: 'Ошибка' };

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentConsults, setRecentConsults] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [meRes, consultsRes] = await Promise.all([
        apiFetch('/me/').then(safeJson).catch(() => null),
        apiFetch('/consultations/?page_size=5').then(safeJson).catch(() => ({ results: [] })),
      ]);
      setUser(meRes);
      const items = Array.isArray(consultsRes) ? consultsRes : (consultsRes?.results || []);
      setRecentConsults(items.slice(0, 5));

      const isPatient = meRes?.role === 'patient';
      if (!isPatient) {
        const [statsRes, apptsRes] = await Promise.all([
          apiFetch('/stats/').then(safeJson).catch(() => null),
          apiFetch('/appointments/today/').then(safeJson).catch(() => []),
        ]);
        setStats(statsRes);
        setTodayAppts(Array.isArray(apptsRes) ? apptsRes : (apptsRes?.results || []));
      }
    } finally { setLoading(false); }
  };

  if (loading) return (
    <View style={s.loadingContainer}>
      <ActivityIndicator size="large" color={PRIMARY} />
    </View>
  );

  const isPatient = user?.role === 'patient';
  const displayName = user?.first_name || user?.full_name || user?.username || 'Доктор';
  const statusData = stats?.consultations_by_status || {};

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Добро пожаловать,</Text>
            <Text style={s.name}>{displayName}!</Text>
            <Text style={s.subtitle}>Обзор активности и статистики</Text>
          </View>
          {!isPatient && (
            <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('RecordPage')}>
              <Ionicons name="mic" size={18} color="#fff" />
              <Text style={s.newBtnText}>Новый приём</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stat Cards */}
        {!isPatient && stats && (
          <View style={s.statGrid}>
            <View style={[s.statCard, { borderLeftColor: PRIMARY }]}>
              <Ionicons name="document-text-outline" size={24} color={PRIMARY} />
              <Text style={s.statValue}>{stats.total_consultations}</Text>
              <Text style={s.statLabel}>Всего консультаций</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#22C55E' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#22C55E" />
              <Text style={s.statValue}>{statusData.ready || 0}</Text>
              <Text style={s.statLabel}>Завершённых</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#3B82F6' }]}>
              <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
              <Text style={s.statValue}>{stats.consultations_this_month}</Text>
              <Text style={s.statLabel}>В этом месяце</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#A855F7' }]}>
              <Ionicons name="people-outline" size={24} color="#A855F7" />
              <Text style={s.statValue}>{stats.total_patients}</Text>
              <Text style={s.statLabel}>Пациентов</Text>
            </View>
          </View>
        )}

        {/* Status breakdown */}
        {!isPatient && stats && Object.keys(statusData).length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>По статусам</Text>
            <View style={s.statusGrid}>
              {Object.entries(statusData).map(([key, val]) => (
                <View key={key} style={s.statusItem}>
                  <View style={[s.statusBar, { backgroundColor: STATUS_COLORS[key] || '#9CA3AF' }]}>
                    <Text style={s.statusBarText}>{val}</Text>
                  </View>
                  <Text style={s.statusBarLabel}>{STATUS_LABELS[key] || key}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent consultations */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Последние консультации</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Архив')}>
              <Text style={s.seeAll}>Все →</Text>
            </TouchableOpacity>
          </View>
          {recentConsults.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>Нет консультаций</Text>
            </View>
          ) : (
            recentConsults.map(c => (
              <TouchableOpacity
                key={c.id}
                style={s.listItem}
                onPress={() => navigation.navigate('Detail', { consultation: c })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.listItemName}>
                    {c.patient_info?.last_name} {c.patient_info?.first_name}
                  </Text>
                  <Text style={s.listItemMeta}>
                    {new Date(c.created_at).toLocaleDateString('ru-RU')}
                  </Text>
                </View>
                <View style={[s.badge, { backgroundColor: (STATUS_COLORS[c.status] || '#9CA3AF') + '20' }]}>
                  <Text style={[s.badgeText, { color: STATUS_COLORS[c.status] || '#9CA3AF' }]}>
                    {STATUS_LABELS[c.status] || c.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Today appointments */}
        {!isPatient && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Приёмы на сегодня</Text>
            </View>
            {todayAppts.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>На сегодня приёмов нет</Text>
              </View>
            ) : (
              todayAppts.map(a => (
                <View key={a.id} style={s.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.listItemName}>{a.patient_name}</Text>
                    <Text style={s.listItemMeta}>
                      {new Date(a.scheduled_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · {a.reason || 'Приём'}
                    </Text>
                  </View>
                  <View style={[s.badge, {
                    backgroundColor: a.status === 'scheduled' ? '#3B82F620' : a.status === 'completed' ? '#22C55E20' : '#9CA3AF20',
                  }]}>
                    <Text style={[s.badgeText, {
                      color: a.status === 'scheduled' ? '#3B82F6' : a.status === 'completed' ? '#22C55E' : '#9CA3AF',
                    }]}>
                      {a.status === 'scheduled' ? 'Ожидается' : a.status === 'completed' ? 'Завершён' : a.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
  greeting: { fontSize: 16, color: '#888' },
  name: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginTop: 2 },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 4 },
  newBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 6 },
  newBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  // Stats
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  statValue: { fontSize: 28, fontWeight: '700', color: '#1a1a2e', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  // Sections
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  seeAll: { fontSize: 13, color: PRIMARY, fontWeight: '500' },
  // Status grid
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusItem: { alignItems: 'center', minWidth: 60 },
  statusBar: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, minWidth: 50, alignItems: 'center' },
  statusBarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statusBarLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  // List items
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  listItemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  listItemMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#bbb' },
});
