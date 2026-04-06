import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, safeJson, ENABLE_MOCK_API, MOCK_CREDENTIALS } from '../api';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';

const MINT = '#2ec4b6';
const MINT_DARK = '#14b8a6';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState(ENABLE_MOCK_API ? MOCK_CREDENTIALS.username : '');
    const [password, setPassword] = useState(ENABLE_MOCK_API ? MOCK_CREDENTIALS.password : '');
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setError(false);
        setErrorMessage('');

        try {
            const response = await apiFetch('/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password }),
            });

            const data = await safeJson(response);

            if (!response.ok) {
                throw new Error(data.detail || 'Неверный логин или пароль.');
            }

            await AsyncStorage.setItem('access_token', data.access);
            await AsyncStorage.setItem('refresh_token', data.refresh);

            navigation.replace('MainTabs');
        } catch (err) {
            setError(true);
            setErrorMessage(err.message || 'Ошибка подключения к серверу.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.gradientContainer}>
            <AnimatedGradientBackground />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.container}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.logoWrapper}>
                            <Image
                                source={require('../assets/App_logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={styles.appTitle}>ClinSpeech</Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.title}>Вход</Text>
                            <Text style={styles.subtitle}>
                                Введите ваши учётные данные
                            </Text>

                            {ENABLE_MOCK_API && (
                                <Text style={styles.mockHint}>
                                    Тесты: врач {MOCK_CREDENTIALS.username} / {MOCK_CREDENTIALS.password} · пациент pacient / pacient123
                                </Text>
                            )}

                            <TextInput
                                style={styles.input}
                                placeholder="Логин или email"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                editable={!isLoading}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Пароль"
                                placeholderTextColor="#999"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                editable={!isLoading}
                            />

                            {error && (
                                <Text style={styles.errorText}>
                                    {errorMessage}
                                </Text>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    isLoading && { opacity: 0.6 },
                                ]}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.buttonText}>ВОЙТИ</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('PasswordForgot')}
                            >
                                <Text style={styles.link}>
                                    Я не могу вспомнить свой пароль
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>или</Text>
                                <View style={styles.divider} />
                            </View>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Register')}
                            >
                                <Text style={styles.registerText}>
                                    Нет аккаунта?{' '}
                                    <Text style={{ color: MINT }}>
                                        Зарегистрироваться
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    gradientContainer: { flex: 1, backgroundColor: '#f8fafc' },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        position: 'relative',
        zIndex: 1,
    },
    logoWrapper: { alignItems: 'center', marginBottom: 40 },
    logo: { width: 60, height: 60 },
    appTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginTop: 10 },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
    },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#1F2937' },
    subtitle: { color: '#666', marginBottom: 10 },
    mockHint: { color: MINT_DARK, marginBottom: 12, fontSize: 13, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        padding: 14,
        marginBottom: 15,
        fontSize: 16,
    },
    button: { backgroundColor: MINT, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    errorText: { color: 'red', marginBottom: 10 },
    link: { color: MINT, textAlign: 'center', marginTop: 15 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    divider: { flex: 1, height: 1, backgroundColor: '#DDD' },
    dividerText: { marginHorizontal: 10, color: '#999' },
    registerText: { textAlign: 'center', color: '#666' },
});
