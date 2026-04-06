import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';

const MINT = '#2ec4b6';

const QUICK_PROMPTS = [
    'Как подготовиться к приёму?',
    'Какие документы взять в клинику?',
    'Напомни про приём лекарств',
];

const BOT_TEMPLATE = [
    'Спасибо за вопрос. Я временный Бот-ассистент для пациента.',
    'Сейчас это demo-версия: я сохраняю переписку локально и помогаю с общими вопросами.',
    'Для срочных состояний обратитесь к врачу или в экстренную службу.',
];

function createBotAnswer(text) {
    const normalized = String(text || '').toLowerCase();
    if (normalized.includes('лекар')) {
        return 'Рекомендую свериться с назначением врача и не менять дозировку самостоятельно.';
    }
    if (normalized.includes('приём') || normalized.includes('запис')) {
        return 'Откройте вкладку "Консультации", чтобы посмотреть последние консультации и детали визитов.';
    }
    if (normalized.includes('документ') || normalized.includes('анализ')) {
        return 'Возьмите удостоверение личности, выписки и актуальные результаты анализов.';
    }
    return BOT_TEMPLATE[Math.floor(Math.random() * BOT_TEMPLATE.length)];
}

export default function ChatBotScreen() {
    const [draft, setDraft] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 'bot-welcome',
            role: 'bot',
            text: 'Здравствуйте! Я Бот-ассистент пациента. Задайте вопрос, и я помогу с навигацией по приложению.',
        },
    ]);

    const listData = useMemo(
        () => messages.map((item, index) => ({ ...item, key: `${item.id}-${index}` })),
        [messages]
    );

    const sendMessage = (sourceText) => {
        const text = String(sourceText ?? draft).trim();
        if (!text) return;

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            text,
        };
        const botMessage = {
            id: `bot-${Date.now() + 1}`,
            role: 'bot',
            text: createBotAnswer(text),
        };

        setMessages((prev) => [...prev, userMessage, botMessage]);
        setDraft('');
    };

    return (
        <View style={s.container}>
            <AnimatedGradientBackground />
            <SafeAreaView style={s.safeArea}>
                <KeyboardAvoidingView
                    style={s.keyboard}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={s.header}>
                        <Text style={s.title}>Чат-бот</Text>
                        <Text style={s.subtitle}>Бот-ассистент пациента (временный)</Text>
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
                        data={listData}
                        style={s.list}
                        contentContainerStyle={s.listContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View
                                style={[
                                    s.bubble,
                                    item.role === 'user' ? s.bubbleUser : s.bubbleBot,
                                ]}
                            >
                                <Text
                                    style={[
                                        s.bubbleText,
                                        item.role === 'user' && s.bubbleTextUser,
                                    ]}
                                >
                                    {item.text}
                                </Text>
                            </View>
                        )}
                    />

                    <View style={s.inputRow}>
                        <TextInput
                            style={s.input}
                            placeholder="Введите сообщение..."
                            placeholderTextColor="#94a3b8"
                            value={draft}
                            onChangeText={setDraft}
                            onSubmitEditing={() => sendMessage()}
                            returnKeyType="send"
                        />
                        <TouchableOpacity style={s.sendBtn} onPress={() => sendMessage()}>
                            <Ionicons name="send" size={18} color="#fff" />
                        </TouchableOpacity>
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
    header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
    title: { fontSize: 26, fontWeight: '700', color: '#1a1a2e' },
    subtitle: { marginTop: 4, fontSize: 13, color: '#64748b' },
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
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 40,
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
});
