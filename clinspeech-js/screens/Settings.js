import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Switch,
    ScrollView, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, safeJson } from '../api';

const PRIMARY = '#2ec4b6';

export default function SettingsScreen({ navigation }) {
    const [language, setLanguage] = useState('RUS');
    const [notifications, setNotifications] = useState(true);
    const [autoProcess, setAutoProcess] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        apiFetch('/me/').then(safeJson).then(setUser).catch(() => {});
        AsyncStorage.getItem('setting_language').then(v => v && setLanguage(v));
        AsyncStorage.getItem('setting_notifications').then(v => v !== null && setNotifications(v === 'true'));
        AsyncStorage.getItem('setting_autoprocess').then(v => v !== null && setAutoProcess(v === 'true'));
    }, []);

    const saveSetting = async (key, value) => {
        await AsyncStorage.setItem(key, String(value));
    };

    const handleLogout = () => {
        Alert.alert('Выйти из аккаунта?', '', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Выйти', style: 'destructive',
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

    const Section = ({ title, children }) => (
        <View style={s.section}>
            <Text style={s.sectionTitle}>{title}</Text>
            <View style={s.sectionBody}>{children}</View>
        </View>
    );

    const Row = ({ icon, iconColor, label, right, onPress, danger }) => (
        <TouchableOpacity
            style={s.row}
            activeOpacity={onPress ? 0.6 : 1}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={[s.iconWrap, { backgroundColor: (iconColor || PRIMARY) + '18' }]}>
                <Ionicons name={icon} size={18} color={iconColor || PRIMARY} />
            </View>
            <Text style={[s.rowLabel, danger && { color: '#EF4444' }]}>{label}</Text>
            <View style={s.rowRight}>{right}</View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Настройки</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <Section title="Общие">
                    <Row
                        icon="language-outline"
                        label="Язык"
                        right={
                            <View style={s.langSwitch}>
                                {['RUS', 'KZ'].map(l => (
                                    <TouchableOpacity
                                        key={l}
                                        style={[s.langBtn, language === l && s.langBtnActive]}
                                        onPress={() => { setLanguage(l); saveSetting('setting_language', l); }}
                                    >
                                        <Text style={[s.langText, language === l && s.langTextActive]}>{l}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        }
                    />
                    <Row
                        icon="notifications-outline"
                        label="Уведомления"
                        right={
                            <Switch
                                value={notifications}
                                onValueChange={v => { setNotifications(v); saveSetting('setting_notifications', v); }}
                                trackColor={{ true: PRIMARY }}
                            />
                        }
                    />
                    <Row
                        icon="flash-outline"
                        iconColor="#F59E0B"
                        label="Авто-обработка ИИ"
                        right={
                            <Switch
                                value={autoProcess}
                                onValueChange={v => { setAutoProcess(v); saveSetting('setting_autoprocess', v); }}
                                trackColor={{ true: PRIMARY }}
                            />
                        }
                    />
                </Section>

                <Section title="О приложении">
                    <Row
                        icon="information-circle-outline"
                        iconColor="#3B82F6"
                        label="Версия"
                        right={<Text style={s.versionText}>1.0.0</Text>}
                    />
                    <Row
                        icon="help-circle-outline"
                        iconColor="#22C55E"
                        label="Поддержка"
                        right={<Ionicons name="chevron-forward" size={18} color="#ccc" />}
                        onPress={() => Linking.openURL('mailto:support@clinspeech.kz')}
                    />
                </Section>

                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    <Text style={s.logoutText}>Выйти из аккаунта</Text>
                </TouchableOpacity>

                {user && (
                    <Text style={s.userInfo}>
                        {user.email} · {user.role}
                    </Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 50 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
    scroll: { paddingHorizontal: 16, paddingBottom: 100 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
    sectionBody: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
    iconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rowLabel: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
    rowRight: {},
    langSwitch: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 2 },
    langBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
    langBtnActive: { backgroundColor: PRIMARY },
    langText: { fontSize: 13, fontWeight: '600', color: '#888' },
    langTextActive: { color: '#fff' },
    versionText: { fontSize: 14, color: '#aaa' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 10, backgroundColor: '#FEF2F2', borderRadius: 12 },
    logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
    userInfo: { textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 16 },
});