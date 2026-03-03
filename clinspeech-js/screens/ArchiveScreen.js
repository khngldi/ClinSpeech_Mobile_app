import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, safeJson } from '../api';

const PRIMARY = '#00C0E8';
const STATUS_COLORS = { created: '#9CA3AF', processing: '#3B82F6', generating: '#F59E0B', ready: '#22C55E', error: '#EF4444' };
const STATUS_LABELS = { created: 'Создано', processing: 'Обработка', generating: 'Генерация', ready: 'Готово', error: 'Ошибка' };
const STATUSES = ['', 'created', 'processing', 'generating', 'ready', 'error'];

export default function ArchiveScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    apiFetch('/me/').then(safeJson).then(setUser).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await apiFetch(`/consultations/${params}`);
      const data = await safeJson(res);
      setItems(Array.isArray(data) ? data : (data?.results || []));
    } catch {} finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const isPatient = user?.role === 'patient';

  const filtered = items.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    const pName = `${c.patient_info?.last_name || ''} ${c.patient_info?.first_name || ''}`.toLowerCase();
    return pName.includes(q) || String(c.id).includes(q);
  });

  const renderItem = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || '#9CA3AF';
    const statusLabel = STATUS_LABELS[item.status] || item.status;

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Detail', { consultation: item })}
      >
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.patientName}>
              {item.patient_info?.last_name} {item.patient_info?.first_name}
            </Text>
            <Text style={s.cardId}>#{item.id}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <View style={s.cardMeta}>
          <View style={s.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#888" />
            <Text style={s.metaText}>{new Date(item.created_at).toLocaleDateString('ru-RU')}</Text>
          </View>
          <View style={s.metaItem}>
            <Ionicons name="person-outline" size={14} color="#888" />
            <Text style={s.metaText}>{item.doctor_name || '—'}</Text>
          </View>
          {item.images_count > 0 && (
            <View style={s.metaItem}>
              <Ionicons name="image-outline" size={14} color="#888" />
              <Text style={s.metaText}>{item.images_count} снимков</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>{isPatient ? 'Мои консультации' : 'Архив'}</Text>
          <Text style={s.subtitle}>{items.length} записей</Text>
        </View>
        {!isPatient && (
          <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('RecordPage')}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={s.newBtnText}>Новый приём</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      {!isPatient && (
        <View style={s.searchBar}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={s.searchInput}
            placeholder="Поиск по пациенту или ID..."
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
      )}

      {/* Status filters */}
      {!isPatient && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {STATUSES.map(st => (
            <TouchableOpacity
              key={st}
              style={[s.filterChip, filter === st && s.filterChipActive]}
              onPress={() => setFilter(st)}
            >
              <Text style={[s.filterChipText, filter === st && s.filterChipTextActive]}>
                {st ? STATUS_LABELS[st] : 'Все'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="document-text-outline" size={48} color="#ccc" />
          <Text style={s.emptyTitle}>Нет консультаций</Text>
          <Text style={s.emptyText}>
            {isPatient ? 'У вас пока нет записей о консультациях' : 'Создайте новый приём для начала работы'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  newBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  newBtnText: { color: '#fff', fontWeight: '600', marginLeft: 4, fontSize: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e8e8e8' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },
  filterRow: { marginBottom: 12, maxHeight: 44 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  filterChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#555' },
  filterChipTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  patientName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  cardId: { fontSize: 12, color: '#aaa', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', marginTop: 10, gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#888' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#bbb', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
});
