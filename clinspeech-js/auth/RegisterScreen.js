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
    Animated,
    Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

export default function RegisterScreen() {
    const navigation = useNavigation();
    const [step, setStep] = useState(1); // 1=email, 2=code, 3=form, 4=success
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [form, setForm] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        phone: '',
        role: 'doctor',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
    }, [step]);

    const handleSendCode = async () => {
        if (!email.includes('@')) {
            setError('Введите корректный email');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/send-code/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const d = await safeJson(res);
                throw new Error(d.detail || d.email?.[0] || 'Ошибка отправки кода');
            }
            setStep(2);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = () => {
        if (code.length !== 6) {
            setError('Введите 6-значный код');
            return;
        }
        setError('');
        setStep(3);
    };

    const handleRegister = async () => {
        if (!form.last_name || !form.first_name || !form.username || form.password.length < 8) {
            setError('Заполните все обязательные поля. Пароль минимум 8 символов.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    email,
                }),
            });
            if (!res.ok) {
                const d = await safeJson(res);
                const msg = d.detail || d.username?.[0] || d.email?.[0] || d.password?.[0] || 'Ошибка регистрации';
                throw new Error(msg);
            }
            setStep(4);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {[1, 2, 3].map((s) => (
                <View
                    key={s}
                    style={[
                        styles.stepDot,
                        s <= step && s < 4 && styles.stepDotActive,
                    ]}
                />
            ))}
        </View>
    );

    const getStepTitle = () => {
        switch (step) {
            case 1: return 'Подтвердите email';
            case 2: return 'Введите код';
            case 3: return 'Создать аккаунт';
            case 4: return 'Готово!';
            default: return '';
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
                        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.title}>{getStepTitle()}</Text>
                            
                            {step < 4 && renderStepIndicator()}

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            {/* Step 1: Email */}
                            {step === 1 && (
                                <>
                                    <Text style={styles.subtitle}>На указанный адрес будет отправлен код подтверждения</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email"
                                        placeholderTextColor="#999"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                        editable={!isLoading}
                                    />
                                    <TouchableOpacity
                                        style={[styles.button, isLoading && { opacity: 0.6 }]}
                                        onPress={handleSendCode}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <Text style={styles.buttonText}>ОТПРАВИТЬ КОД</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Step 2: Code */}
                            {step === 2 && (
                                <>
                                    <Text style={styles.subtitle}>Код отправлен на {email}</Text>
                                    <TextInput
                                        style={[styles.input, styles.codeInput]}
                                        placeholder="000000"
                                        placeholderTextColor="#999"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        value={code}
                                        onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                                    />
                                    <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
                                        <Text style={styles.buttonText}>ПОДТВЕРДИТЬ</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setStep(1); setError(''); }}>
                                        <Text style={styles.link}>Изменить email</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Step 3: Registration form */}
                            {step === 3 && (
                                <>
                                    <Text style={styles.emailConfirmed}>Email: {email}</Text>
                                    <View style={styles.row}>
                                        <TextInput
                                            style={[styles.input, styles.halfInput]}
                                            placeholder="Фамилия *"
                                            placeholderTextColor="#999"
                                            value={form.last_name}
                                            onChangeText={(v) => setForm({ ...form, last_name: v })}
                                        />
                                        <TextInput
                                            style={[styles.input, styles.halfInput]}
                                            placeholder="Имя *"
                                            placeholderTextColor="#999"
                                            value={form.first_name}
                                            onChangeText={(v) => setForm({ ...form, first_name: v })}
                                        />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Отчество"
                                        placeholderTextColor="#999"
                                        value={form.middle_name}
                                        onChangeText={(v) => setForm({ ...form, middle_name: v })}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Имя пользователя *"
                                        placeholderTextColor="#999"
                                        autoCapitalize="none"
                                        value={form.username}
                                        onChangeText={(v) => setForm({ ...form, username: v })}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Телефон"
                                        placeholderTextColor="#999"
                                        keyboardType="phone-pad"
                                        value={form.phone}
                                        onChangeText={(v) => setForm({ ...form, phone: v })}
                                    />
                                    <View style={styles.roleSelector}>
                                        <TouchableOpacity
                                            style={[styles.roleBtn, form.role === 'doctor' && styles.roleBtnActive]}
                                            onPress={() => setForm({ ...form, role: 'doctor' })}
                                        >
                                            <Text style={[styles.roleText, form.role === 'doctor' && styles.roleTextActive]}>Врач</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.roleBtn, form.role === 'patient' && styles.roleBtnActive]}
                                            onPress={() => setForm({ ...form, role: 'patient' })}
                                        >
                                            <Text style={[styles.roleText, form.role === 'patient' && styles.roleTextActive]}>Пациент</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Пароль * (мин. 8 символов)"
                                        placeholderTextColor="#999"
                                        secureTextEntry
                                        value={form.password}
                                        onChangeText={(v) => setForm({ ...form, password: v })}
                                    />
                                    <TouchableOpacity
                                        style={[styles.button, isLoading && { opacity: 0.6 }]}
                                        onPress={handleRegister}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <Text style={styles.buttonText}>ЗАРЕГИСТРИРОВАТЬСЯ</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setStep(1); setError(''); }}>
                                        <Text style={styles.link}>Назад</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Step 4: Success */}
                            {step === 4 && (
                                <>
                                    <Text style={styles.successText}>
                                        Ваш аккаунт успешно создан!{'\n'}Теперь вы можете войти в систему.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.button}
                                        onPress={() => navigation.navigate('Login')}
                                    >
                                        <Text style={styles.buttonText}>ВОЙТИ</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {step < 4 && (
                                <>
                                    <View style={styles.dividerContainer}>
                                        <View style={styles.divider} />
                                        <Text style={styles.dividerText}>или</Text>
                                        <View style={styles.divider} />
                                    </View>

                                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                        <Text style={styles.registerText}>
                                            Уже есть аккаунт?{' '}
                                            <Text style={{ color: MINT }}>Войти</Text>
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </Animated.View>
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
    logoWrapper: { alignItems: 'center', marginBottom: 30 },
    logo: { width: 60, height: 60 },
    appTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginTop: 10 },
    card: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 5 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: '#1F2937', textAlign: 'center' },
    subtitle: { color: '#666', marginBottom: 20, textAlign: 'center', fontSize: 14 },
    stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
    stepDot: { width: 32, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
    stepDotActive: { backgroundColor: MINT },
    input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
    codeInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 10 },
    halfInput: { flex: 1 },
    button: { backgroundColor: MINT, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    errorText: { color: '#EF4444', marginBottom: 10, textAlign: 'center' },
    link: { color: MINT, textAlign: 'center', marginTop: 15 },
    emailConfirmed: { color: '#666', marginBottom: 16, textAlign: 'center', fontSize: 13 },
    roleSelector: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    roleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
    roleBtnActive: { borderColor: MINT, backgroundColor: MINT + '15' },
    roleText: { fontSize: 15, color: '#666' },
    roleTextActive: { color: MINT, fontWeight: '600' },
    successText: { textAlign: 'center', fontSize: 16, color: '#444', marginBottom: 20, lineHeight: 24 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    divider: { flex: 1, height: 1, backgroundColor: '#DDD' },
    dividerText: { marginHorizontal: 10, color: '#999' },
    registerText: { textAlign: 'center', color: '#666' },
});