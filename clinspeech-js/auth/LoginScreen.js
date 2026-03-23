import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Image,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Animated,
    Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, safeJson } from '../api';

const { width: SW } = Dimensions.get('window');
const MINT = '#2ec4b6';
const MINT_LIGHT = '#5eead4';
const MINT_DARK = '#14b8a6';
const PURPLE = '#a78bfa';

/* ── Animated floating blob ── */
function FloatingBlob({ color, size, startX, startY, delay }) {
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: 80, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: -60, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1.2, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: -50, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: 90, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 0.85, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: 60, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: 40, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1.1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={{
            position: 'absolute', left: startX, top: startY,
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color, opacity: 0.25,
            transform: [{ translateX }, { translateY }, { scale }],
        }} />
    );
}

export default function LoginScreen({ navigation }) {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setError(false);
        setErrorMessage('');

        try {
            const response = await fetch(`${BASE_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password }),
            });

            const data = await safeJson(response);

            if (!response.ok) {
                throw new Error(data.detail || 'Неверный логин или пароль.');
            }

            // Сохраняем токены
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
            {/* Animated gradient blobs */}
            <View style={styles.blobLayer} pointerEvents="none">
                <FloatingBlob color={MINT} size={280} startX={-70} startY={30} delay={0} />
                <FloatingBlob color={MINT_LIGHT} size={220} startX={SW - 120} startY={150} delay={2000} />
                <FloatingBlob color={PURPLE} size={200} startX={20} startY={400} delay={4500} />
                <FloatingBlob color={MINT_DARK} size={240} startX={SW - 180} startY={500} delay={7000} />
            </View>

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.container}
                        keyboardShouldPersistTaps="handled"
                    >

                        {/* LOGO */}
                        <View style={styles.logoWrapper}>
                            <Image
                                source={require('../assets/App_logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={styles.appTitle}>ClinSpeech</Text>
                        </View>

                        {/* CARD */}
                        <View style={styles.card}>
                            <Text style={styles.title}>Вход</Text>
                            <Text style={styles.subtitle}>
                                Введите ваши учётные данные
                            </Text>

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
                                    isLoading && { opacity: 0.6 }
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
    blobLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, position: 'relative', zIndex: 1 },
    logoWrapper: { alignItems: 'center', marginBottom: 40 },
    logo: { width: 60, height: 60 },
    appTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginTop: 10 },
    card: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 5 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#1F2937' },
    subtitle: { color: '#666', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 14, marginBottom: 15, fontSize: 16 },
    button: { backgroundColor: MINT, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    errorText: { color: 'red', marginBottom: 10 },
    link: { color: MINT, textAlign: 'center', marginTop: 15 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    divider: { flex: 1, height: 1, backgroundColor: '#DDD' },
    dividerText: { marginHorizontal: 10, color: '#999' },
    registerText: { textAlign: 'center', color: '#666' }
});