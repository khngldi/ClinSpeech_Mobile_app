import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../../components/AnimatedGradientBackground';
import { apiFetch, safeJson, adminAPI } from '../../api';
import { useLocale } from '../../i18n/LocaleContext';

const MINT = '#2ec4b6';

const ROLE_COLORS = {
    admin: { bg: '#fee2e2', text: '#dc2626', label: 'Админ' },
    doctor: { bg: '#dbeafe', text: '#1d4ed8', label: 'Врач' },
    patient: { bg: '#f3f4f6', text: '#6b7280', label: 'Пациент' },
};

const ROLE_FILTERS = [
    { key: '', label: 'Все' },
    { key: 'admin', label: 'Админы' },
    { key: 'doctor', label: 'Врачи' },
    { key: 'patient', label: 'Пациенты' },
];

export default function UsersScreen({ navigation }) {
    const { t } = useLocale();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/users/');
            const data = await safeJson(res);
            setUsers(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.log('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id) => {
        try {
            await apiFetch(`/users/${id}/activate/`, { method: 'POST' });
            loadUsers();
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось активировать пользователя');
        }
    };

    const handleDeactivate = async (id) => {
        Alert.alert(
            'Деактивировать пользователя?',
            'Пользователь не сможет войти в систему',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Деактивировать',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiFetch(`/users/${id}/deactivate/`, { method: 'POST' });
                            loadUsers();
                        } catch (error) {
                            Alert.alert('Ошибка', 'Не удалось деактивировать пользователя');
                        }
                    },
                },
            ]
        );
    };

    const filteredUsers = users.filter(u => {
        const matchRole = !roleFilter || u.role === roleFilter;
        const fullName = `${u.last_name || ''} ${u.first_name || ''} ${u.email || ''}`.toLowerCase();
        const matchSearch = !search || fullName.includes(search.toLowerCase());
        return matchRole && matchSearch;
    });

    const renderItem = ({ item }) => {
        const role = ROLE_COLORS[item.role] || ROLE_COLORS.patient;

        return (
            <View style={s.userCard}>
                <View style={s.userInfo}>
                    <View style={s.avatar}>
                        <Text style={s.avatarText}>
                            {(item.first_name?.[0] || item.email?.[0] || '?').toUpperCase()}
                        </Text>
                    </View>
                    <View style={s.userDetails}>
                        <Text style={s.userName}>
                            {item.last_name} {item.first_name}
                        </Text>
                        <Text style={s.userEmail}>{item.email}</Text>
                    </View>
                </View>
                
                <View style={s.userMeta}>
                    <View style={[s.roleBadge, { backgroundColor: role.bg }]}>
                        <Text style={[s.roleText, { color: role.text }]}>{role.label}</Text>
                    </View>
                    <View style={[s.statusBadge, item.is_active ? s.activeBadge : s.inactiveBadge]}>
                        <Text style={[s.statusText, item.is_active ? s.activeText : s.inactiveText]}>
                            {item.is_active ? 'Активен' : 'Неактивен'}
                        </Text>
                    </View>
                </View>

                <View style={s.actions}>
                    {item.is_active ? (
                        <TouchableOpacity
                            style={s.deactivateBtn}
                            onPress={() => handleDeactivate(item.id)}
                        >
                            <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                            <Text style={s.deactivateText}>Деактивировать</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={s.activateBtn}
                            onPress={() => handleActivate(item.id)}
                        >
                            <Ionicons name="checkmark-circle-outline" size={16} color="#16a34a" />
                            <Text style={s.activateText}>Активировать</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={s.container}>
                <AnimatedGradientBackground />
                <SafeAreaView style={s.safeArea}>
                    <View style={s.loadingContainer}>
                        <ActivityIndicator size="large" color={MINT} />
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <AnimatedGradientBackground />
            <SafeAreaView style={s.safeArea}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <View>
                        <Text style={s.title}>Пользователи</Text>
                        <Text style={s.subtitle}>{users.length} пользователей</Text>
                    </View>
                    <View style={{ width: 28 }} />
                </View>

                <View style={s.searchContainer}>
                    <Ionicons name="search-outline" size={18} color="#94a3b8" style={s.searchIcon} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Поиск по имени или email..."
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={s.filterRow}>
                    {ROLE_FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[s.filterBtn, roleFilter === filter.key && s.filterBtnActive]}
                            onPress={() => setRoleFilter(filter.key)}
                        >
                            <Text style={[s.filterText, roleFilter === filter.key && s.filterTextActive]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={s.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={s.emptyState}>
                            <Ionicons name="people-outline" size={48} color="#94a3b8" />
                            <Text style={s.emptyTitle}>Нет пользователей</Text>
                        </View>
                    }
                />
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchIcon: { marginLeft: 12 },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        fontSize: 15,
        color: '#1f2937',
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 8,
    },
    filterBtn: {
        paddingHorizontal: 14,
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
    filterText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    filterTextActive: { color: '#fff' },
    listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
    userCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: MINT,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    userDetails: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
    userEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
    userMeta: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    roleText: { fontSize: 11, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    activeBadge: { backgroundColor: '#dcfce7' },
    inactiveBadge: { backgroundColor: '#f3f4f6' },
    statusText: { fontSize: 11, fontWeight: '500' },
    activeText: { color: '#16a34a' },
    inactiveText: { color: '#6b7280' },
    actions: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
    activateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    activateText: { fontSize: 13, color: '#16a34a' },
    deactivateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    deactivateText: { fontSize: 13, color: '#ef4444' },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginTop: 16 },
});
