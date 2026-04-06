import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../../components/AnimatedGradientBackground';
import { apiFetch, safeJson } from '../../api';
import { useLocale } from '../../i18n/LocaleContext';

const MINT = '#2ec4b6';

const ACTION_COLORS = {
    create: { bg: '#dcfce7', text: '#16a34a', label: 'Создание' },
    update: { bg: '#dbeafe', text: '#1d4ed8', label: 'Обновление' },
    delete: { bg: '#fee2e2', text: '#dc2626', label: 'Удаление' },
    login: { bg: '#f3f4f6', text: '#6b7280', label: 'Вход' },
    view: { bg: '#f3f4f6', text: '#6b7280', label: 'Просмотр' },
    download: { bg: '#fef3c7', text: '#d97706', label: 'Скачивание' },
};

const ACTION_FILTERS = [
    { key: '', label: 'Все' },
    { key: 'create', label: 'Создание' },
    { key: 'update', label: 'Обновление' },
    { key: 'delete', label: 'Удаление' },
    { key: 'login', label: 'Вход' },
];

export default function AuditLogScreen({ navigation }) {
    const { formatDateTime } = useLocale();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);

    const loadLogs = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/audit-log/?page=${page}`;
            if (actionFilter) url += `&action=${actionFilter}`;
            
            const res = await apiFetch(url);
            const data = await safeJson(res);
            
            if (data?.results) {
                setLogs(data.results);
                setHasNext(!!data.next);
            } else {
                setLogs(Array.isArray(data) ? data : []);
                setHasNext(false);
            }
        } catch (error) {
            console.log('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, actionFilter]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const handleFilterChange = (filter) => {
        setActionFilter(filter);
        setPage(1);
    };

    const renderItem = ({ item }) => {
        const action = ACTION_COLORS[item.action] || ACTION_COLORS.view;

        return (
            <View style={s.logCard}>
                <View style={s.logHeader}>
                    <View style={[s.actionBadge, { backgroundColor: action.bg }]}>
                        <Text style={[s.actionText, { color: action.text }]}>{action.label}</Text>
                    </View>
                    <Text style={s.timestamp}>
                        {formatDateTime(item.created_at || item.timestamp)}
                    </Text>
                </View>
                
                <View style={s.logContent}>
                    <Text style={s.userName}>{item.user_name || item.user || 'Система'}</Text>
                    <Text style={s.objectInfo}>
                        {item.object_type || item.entity_type}
                        {(item.object_id || item.entity_id) && ` #${item.object_id || item.entity_id}`}
                    </Text>
                </View>
                
                {item.details && (
                    <Text style={s.details} numberOfLines={2}>{item.details}</Text>
                )}
            </View>
        );
    };

    return (
        <View style={s.container}>
            <AnimatedGradientBackground />
            <SafeAreaView style={s.safeArea}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <View>
                        <Text style={s.title}>Журнал аудита</Text>
                        <Text style={s.subtitle}>Действия пользователей</Text>
                    </View>
                    <View style={{ width: 28 }} />
                </View>

                <View style={s.filterRow}>
                    {ACTION_FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[s.filterBtn, actionFilter === filter.key && s.filterBtnActive]}
                            onPress={() => handleFilterChange(filter.key)}
                        >
                            <Text style={[s.filterText, actionFilter === filter.key && s.filterTextActive]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <View style={s.loadingContainer}>
                        <ActivityIndicator size="large" color={MINT} />
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={logs}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={renderItem}
                            contentContainerStyle={s.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={s.emptyState}>
                                    <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
                                    <Text style={s.emptyTitle}>Нет записей</Text>
                                </View>
                            }
                        />

                        <View style={s.pagination}>
                            <TouchableOpacity
                                style={[s.pageBtn, page <= 1 && s.pageBtnDisabled]}
                                onPress={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                <Ionicons name="chevron-back" size={18} color={page <= 1 ? '#94a3b8' : '#1f2937'} />
                                <Text style={[s.pageBtnText, page <= 1 && s.pageBtnTextDisabled]}>Назад</Text>
                            </TouchableOpacity>
                            
                            <Text style={s.pageInfo}>Страница {page}</Text>
                            
                            <TouchableOpacity
                                style={[s.pageBtn, !hasNext && s.pageBtnDisabled]}
                                onPress={() => setPage(p => p + 1)}
                                disabled={!hasNext}
                            >
                                <Text style={[s.pageBtnText, !hasNext && s.pageBtnTextDisabled]}>Далее</Text>
                                <Ionicons name="chevron-forward" size={18} color={!hasNext ? '#94a3b8' : '#1f2937'} />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
    subtitle: { fontSize: 13, color: '#64748b' },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 8,
        flexWrap: 'wrap',
    },
    filterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterBtnActive: {
        backgroundColor: MINT,
        borderColor: MINT,
    },
    filterText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    filterTextActive: { color: '#fff' },
    listContent: { paddingHorizontal: 16, paddingBottom: 20, gap: 10 },
    logCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    actionText: { fontSize: 11, fontWeight: '500' },
    timestamp: { fontSize: 12, color: '#94a3b8' },
    logContent: { marginBottom: 6 },
    userName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
    objectInfo: { fontSize: 13, color: '#64748b', marginTop: 2 },
    details: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    pageBtnDisabled: { opacity: 0.5 },
    pageBtnText: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
    pageBtnTextDisabled: { color: '#94a3b8' },
    pageInfo: { fontSize: 14, color: '#64748b' },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginTop: 16 },
});
