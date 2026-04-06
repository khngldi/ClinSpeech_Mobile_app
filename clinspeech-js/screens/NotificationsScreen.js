import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson } from '../api';

const MINT = '#2ec4b6';

const TYPE_ICONS = {
    report_ready: { name: 'checkmark-circle', color: '#22c55e' },
    appointment_reminder: { name: 'calendar', color: '#3b82f6' },
    consultation_shared: { name: 'link', color: '#8b5cf6' },
    error: { name: 'close-circle', color: '#ef4444' },
    default: { name: 'notifications', color: '#64748b' },
};

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const res = await apiFetch('/notifications/');
            const data = await safeJson(res);
            setNotifications(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.log('Error loading notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadNotifications();
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await apiFetch(`/notifications/${id}/mark_read/`, { method: 'POST' });
            loadNotifications();
        } catch (error) {
            console.log('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiFetch('/notifications/mark_all_read/', { method: 'POST' });
            loadNotifications();
        } catch (error) {
            console.log('Error marking all as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getIcon = (type) => {
        return TYPE_ICONS[type] || TYPE_ICONS.default;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderItem = ({ item }) => {
        const icon = getIcon(item.notification_type || item.type);
        
        return (
            <TouchableOpacity
                style={[
                    s.notificationCard,
                    !item.is_read && s.notificationUnread,
                ]}
                onPress={() => !item.is_read && handleMarkRead(item.id)}
                activeOpacity={item.is_read ? 1 : 0.7}
            >
                {!item.is_read && <View style={s.unreadIndicator} />}
                
                <View style={[s.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                    <Ionicons name={icon.name} size={22} color={icon.color} />
                </View>
                
                <View style={s.contentContainer}>
                    <Text style={[s.notificationTitle, !item.is_read && s.notificationTitleUnread]}>
                        {item.title || item.message}
                    </Text>
                    {item.message && item.title && (
                        <Text style={s.notificationMessage}>{item.message}</Text>
                    )}
                    <Text style={s.notificationDate}>{formatDate(item.created_at)}</Text>
                </View>
                
                {!item.is_read && (
                    <View style={s.unreadDot} />
                )}
            </TouchableOpacity>
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
                    <View>
                        <Text style={s.title}>Уведомления</Text>
                        <Text style={s.subtitle}>
                            {unreadCount > 0 
                                ? `${unreadCount} непрочитанных` 
                                : 'Все прочитаны'}
                        </Text>
                    </View>
                    {unreadCount > 0 && (
                        <TouchableOpacity style={s.markAllBtn} onPress={handleMarkAllRead}>
                            <Text style={s.markAllText}>Прочитать все</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={notifications}
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
                            <Ionicons name="notifications-off-outline" size={48} color="#94a3b8" />
                            <Text style={s.emptyTitle}>Нет уведомлений</Text>
                            <Text style={s.emptySubtitle}>
                                Уведомления появятся здесь
                            </Text>
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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 16,
    },
    title: { fontSize: 26, fontWeight: '700', color: '#1a1a2e' },
    subtitle: { marginTop: 4, fontSize: 13, color: '#64748b' },
    markAllBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(46,196,182,0.1)',
        borderRadius: 8,
    },
    markAllText: {
        fontSize: 13,
        color: MINT,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
        gap: 8,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    notificationUnread: {
        backgroundColor: 'rgba(99, 102, 241, 0.04)',
        borderLeftWidth: 3,
        borderLeftColor: MINT,
    },
    unreadIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: MINT,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '400',
        color: '#1f2937',
    },
    notificationTitleUnread: {
        fontWeight: '600',
    },
    notificationMessage: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    notificationDate: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: MINT,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 8,
    },
});
