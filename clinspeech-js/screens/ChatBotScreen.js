import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson } from '../api';
import { useLocale } from '../i18n/LocaleContext';

const MINT = '#2ec4b6';

export default function ChatBotScreen() {
    const { t } = useLocale();
    const QUICK_PROMPTS = [
        t('Как получить консультацию?'),
        t('Где мои результаты?'),
        t('Как изменить приём?'),
    ];

    const [draft, setDraft] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const flatListRef = useRef(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const res = await apiFetch('/chat/');
            const data = await safeJson(res);
            const messageList = data.results || data || [];
            setMessages(Array.isArray(messageList) ? messageList : []);
        } catch (error) {
            console.log('Error loading chat history:', error);
            setMessages([{
                id: 'bot-welcome',
                is_user: false,
                message: t('Задайте вопрос или выберите быстрый вопрос'),
            }]);
        } finally {
            setInitialLoading(false);
        }
    };

    const listData = useMemo(
        () => messages.map((item, index) => ({ ...item, key: `${item.id}-${index}` })),
        [messages]
    );

    const sendMessage = async (sourceText) => {
        const text = String(sourceText ?? draft).trim();
        if (!text || loading) return;

        const tempUserMsg = {
            id: `user-${Date.now()}`,
            is_user: true,
            message: text,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempUserMsg]);
        setDraft('');
        setLoading(true);

        try {
            const res = await apiFetch('/chat/', {
                method: 'POST',
                body: JSON.stringify({ message: text }),
            });
            const data = await safeJson(res);
            
            setMessages((prev) => {
                const filtered = prev.filter(m => m.id !== tempUserMsg.id);
                if (data.user_message && data.ai_message) {
                    return [...filtered, data.user_message, data.ai_message];
                }
                return [...filtered, tempUserMsg, {
                    id: `bot-${Date.now()}`,
                    is_user: false,
                    message: data.message || data.response || 'Спасибо за вопрос. Я обработаю его и отвечу.',
                }];
            });
        } catch (error) {
            console.log('Error sending message:', error);
            setMessages((prev) => [...prev, {
                id: `bot-error-${Date.now()}`,
                is_user: false,
                message: t('Ошибка'),
            }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = async () => {
        try {
            await apiFetch('/chat/clear/', { method: 'DELETE' });
            setMessages([]);
        } catch (error) {
            console.log('Error clearing chat:', error);
        }
    };

    if (initialLoading) {
        return (
            <View style={s.container}>
                <AnimatedGradientBackground />
                <SafeAreaView style={s.safeArea}>
                    <View style={s.loadingContainer}>
                        <ActivityIndicator size="large" color={MINT} />
                        <Text style={s.loadingText}>{t('Загрузка')}...</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <AnimatedGradientBackground />
            <SafeAreaView style={s.safeArea}>
                <KeyboardAvoidingView
                    style={s.keyboard}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={s.header}>
                        <View style={s.headerTop}>
                            <Text style={s.title}>{t('AI Ассистент')}</Text>
                            {messages.length > 0 && (
                                <TouchableOpacity onPress={clearChat} style={s.clearBtn}>
                                    <Text style={s.clearBtnText}>{t('Очистить чат')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={s.subtitle}>{t('Задайте вопрос или выберите быстрый вопрос')}</Text>
                    </View>

                    <View style={s.quickRow}>
                        {QUICK_PROMPTS.map((prompt) => (
                            <TouchableOpacity
                                key={prompt}
                                style={s.quickChip}
                                onPress={() => sendMessage(prompt)}
                            >
                                <Text style={s.quickChipText}>{prompt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={listData}
                        style={s.list}
                        contentContainerStyle={s.listContent}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        renderItem={({ item }) => (
                            <View
                                style={[
                                    s.bubble,
                                    item.is_user ? s.bubbleUser : s.bubbleBot,
                                ]}
                            >
                                <Text
                                    style={[
                                        s.bubbleText,
                                        item.is_user && s.bubbleTextUser,
                                    ]}
                                >
                                    {item.message}
                                </Text>
                                {item.timestamp && (
                                    <Text style={[s.timestamp, item.is_user && s.timestampUser]}>
                                        {new Date(item.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                )}
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={s.emptyState}>
                                <Ionicons name="chatbubbles-outline" size={48} color="#94a3b8" />
                                <Text style={s.emptyTitle}>Начните разговор</Text>
                                <Text style={s.emptySubtitle}>
                                    Напишите вопрос о здоровье или выберите один из быстрых запросов выше
                                </Text>
                            </View>
                        }
                    />

                    {loading && (
                        <View style={s.typingIndicator}>
                            <Text style={s.typingText}>AI печатает...</Text>
                        </View>
                    )}

                    <View style={s.inputRow}>
                        <TextInput
                            style={s.input}
                            placeholder="Напишите вопрос о здоровье..."
                            placeholderTextColor="#94a3b8"
                            value={draft}
                            onChangeText={setDraft}
                            onSubmitEditing={() => sendMessage()}
                            returnKeyType="send"
                            multiline
                        />
                        <TouchableOpacity 
                            style={[s.sendBtn, (!draft.trim() || loading) && s.sendBtnDisabled]} 
                            onPress={() => sendMessage()}
                            disabled={!draft.trim() || loading}
                        >
                            <Ionicons name="send" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={s.disclaimer}>
                        <Ionicons name="shield-checkmark-outline" size={14} color="#64748b" />
                        <Text style={s.disclaimerText}>
                            AI может ошибаться. Для лечения всегда консультируйтесь с врачом.
                        </Text>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    safeArea: { flex: 1 },
    keyboard: { flex: 1, position: 'relative', zIndex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
    header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 26, fontWeight: '700', color: '#1a1a2e' },
    subtitle: { marginTop: 4, fontSize: 13, color: '#64748b' },
    clearBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 },
    clearBtnText: { fontSize: 12, color: '#ef4444', fontWeight: '500' },
    quickRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    quickChip: {
        borderWidth: 1,
        borderColor: 'rgba(46,196,182,0.35)',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    quickChipText: {
        color: '#0f766e',
        fontSize: 12,
        fontWeight: '500',
    },
    list: { flex: 1 },
    listContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
    bubble: {
        maxWidth: '82%',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    bubbleBot: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    bubbleUser: {
        alignSelf: 'flex-end',
        backgroundColor: MINT,
    },
    bubbleText: {
        fontSize: 14,
        color: '#1f2937',
        lineHeight: 20,
    },
    bubbleTextUser: {
        color: '#fff',
    },
    timestamp: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 4,
    },
    timestampUser: {
        color: 'rgba(255,255,255,0.7)',
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
        paddingHorizontal: 40,
    },
    typingIndicator: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    typingText: {
        fontSize: 12,
        color: '#64748b',
        fontStyle: 'italic',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 14 : 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 110,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        color: '#1f2937',
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: MINT,
    },
    sendBtnDisabled: {
        backgroundColor: '#94a3b8',
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingBottom: 50,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    disclaimerText: {
        fontSize: 11,
        color: '#64748b',
    },
});
