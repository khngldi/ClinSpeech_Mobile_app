import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    SafeAreaView,
    Platform,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Alert,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { useLocale } from '../i18n/LocaleContext';

const MINT = '#2ec4b6';
const MINT_DARK = '#14b8a6';
const MINT_LIGHT = '#5eead4';
const { width: SW } = Dimensions.get('window');

export default function PasswordForgotScreen() {
    const { t } = useLocale();
    const [step, setStep] = useState(1);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const codeInputRef = useRef(null);
    const navigation = useNavigation();

    const [form, setForm] = useState({
        email: '',
        code: '',
        password: '',
        confirmPassword: ''
    });

    const [isSendingCode, setIsSendingCode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true })
        ]).start();
    }, [step]);

    const isCodeValid = () => form.code.length === 6;
    const isPasswordValid = () => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(form.password);

    const canProceed = () => {
        switch (step) {
            case 1: return form.email.includes('@');
            case 2: return isCodeValid();
            case 3: return isPasswordValid() && form.password === form.confirmPassword;
            default: return true;
        }
    };

    const sendCode = () => {
        if (!form.email.includes('@')) return;
        setIsSendingCode(true);
        setTimeout(() => {
            setIsSendingCode(false);
            Alert.alert(t('Код отправлен'), t('На ваш email отправлен 6-значный код.'));
            setStep(2);
        }, 1500);
    };

    const renderCodeInputs = () => (
        <View style={styles.codeWrapper}>
            <TouchableOpacity activeOpacity={1} onPress={() => codeInputRef.current?.focus()} style={styles.codeContainer}>
                {[0,1,2,3,4,5].map(i => (
                    <View key={i} style={[styles.codeBox, form.code[i] && styles.codeBoxFilled]}>
                        <Text style={styles.codeDigit}>{form.code[i] || ''}</Text>
                    </View>
                ))}
            </TouchableOpacity>
            <TextInput
                ref={codeInputRef}
                value={form.code}
                onChangeText={text => setForm(prev => ({ ...prev, code: text.replace(/[^0-9]/g,'').slice(0,6) }))}
                keyboardType="numeric"
                maxLength={6}
                style={{ position:'absolute', opacity:0 }}
            />
        </View>
    );

    const nextStep = () => {
        if (step === 1) sendCode();
        else setStep(prev => prev + 1);
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {[1, 2, 3, 4].map(s => (
                <View key={s} style={styles.stepDotWrapper}>
                    <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                        {step > s ? (
                            <Ionicons name="checkmark" size={12} color="#fff" />
                        ) : (
                            <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>{s}</Text>
                        )}
                    </View>
                    {s < 4 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
                </View>
            ))}
        </View>
    );

    const renderWizard = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {renderStepIndicator()}
            
            {/* STEP 1 - Email */}
            {step === 1 && (
                <Animated.View style={[styles.stepCard, {opacity:fadeAnim, transform:[{translateY:slideAnim}]}]}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="mail-outline" size={32} color={MINT} />
                    </View>
                    <Text style={styles.stepTitle}>{t('Восстановление пароля')}</Text>
                    <Text style={styles.stepSubtitle}>{t('Введите email, привязанный к вашему аккаунту')}</Text>
                    
                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('Email')}
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={form.email}
                            onChangeText={v=>setForm({...form,email:v})}
                        />
                    </View>
                </Animated.View>
            )}

            {/* STEP 2 - Код */}
            {step === 2 && (
                <Animated.View style={[styles.stepCard, {opacity:fadeAnim, transform:[{translateY:slideAnim}]}]}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="keypad-outline" size={32} color={MINT} />
                    </View>
                    <Text style={styles.stepTitle}>{t('Код подтверждения')}</Text>
                    <Text style={styles.stepSubtitle}>{t('Введите 6-значный код, отправленный на')} {form.email}</Text>
                    {renderCodeInputs()}
                    
                    <TouchableOpacity style={styles.resendBtn} onPress={sendCode}>
                        <Ionicons name="refresh-outline" size={16} color={MINT} />
                        <Text style={styles.resendText}>{t('Отправить код повторно')}</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* STEP 3 - Новый пароль */}
            {step === 3 && (
                <Animated.View style={[styles.stepCard, {opacity:fadeAnim, transform:[{translateY:slideAnim}]}]}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="lock-closed-outline" size={32} color={MINT} />
                    </View>
                    <Text style={styles.stepTitle}>{t('Новый пароль')}</Text>
                    <Text style={styles.passwordHint}>{t('Минимум 8 символов, 1 буква, 1 цифра и 1 спецсимвол')}</Text>
                    
                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('Новый пароль')}
                            placeholderTextColor="#94a3b8"
                            secureTextEntry={!showPassword}
                            value={form.password}
                            onChangeText={v=>setForm({...form,password:v})}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('Подтвердите пароль')}
                            placeholderTextColor="#94a3b8"
                            secureTextEntry={!showConfirmPassword}
                            value={form.confirmPassword}
                            onChangeText={v=>setForm({...form,confirmPassword:v})}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                    
                    {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
                        <Text style={styles.errorText}>{t('Пароли не совпадают')}</Text>
                    )}
                </Animated.View>
            )}

            {/* STEP 4 - Завершение */}
            {step === 4 && (
                <Animated.View style={[styles.stepCard, styles.successCard, {opacity:fadeAnim, transform:[{translateY:slideAnim}]}]}>
                    <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
                        <Ionicons name="checkmark" size={40} color="#fff" />
                    </View>
                    <Text style={styles.stepTitle}>{t('Пароль обновлён!')}</Text>
                    <Text style={styles.stepSubtitle}>{t('Теперь вы можете войти с новым паролем')}</Text>
                    
                    <TouchableOpacity style={styles.loginBtn} onPress={()=>navigation.navigate('Login')}>
                        <LinearGradient colors={[MINT, MINT_DARK]} style={styles.loginBtnGrad}>
                            <Text style={styles.loginBtnText}>{t('ВОЙТИ')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {step <= 3 && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
                        disabled={!canProceed() || isSendingCode}
                        onPress={nextStep}
                    >
                        <LinearGradient 
                            colors={canProceed() ? [MINT, MINT_DARK] : ['#e2e8f0', '#e2e8f0']} 
                            style={styles.nextBtnGrad}
                        >
                            {isSendingCode ? (
                                <Text style={styles.nextBtnText}>{t('Отправка...')}</Text>
                            ) : (
                                <Text style={[styles.nextBtnText, !canProceed() && styles.nextBtnTextDisabled]}>
                                    {step === 1 ? t('ОТПРАВИТЬ КОД') : step === 3 ? t('СОХРАНИТЬ') : t('ДАЛЕЕ')}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                    
                    {step > 1 && (
                        <TouchableOpacity style={styles.backLink} onPress={() => setStep(step - 1)}>
                            <Ionicons name="arrow-back" size={16} color="#64748b" />
                            <Text style={styles.backLinkText}>{t('Назад')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <AnimatedGradientBackground />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Clin<Text style={styles.headerTitleAccent}>Speech</Text></Text>
                    <View style={{ width: 40 }} />
                </View>
                <KeyboardAvoidingView style={styles.content} behavior={Platform.OS==='ios'?'padding':undefined}>
                    {renderWizard()}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 16, 
        paddingVertical: 16 
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' },
    headerTitleAccent: { color: MINT },
    content: { flex: 1, width: '100%', paddingHorizontal: 20 },
    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    
    // Step indicator
    stepIndicator: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    stepDotWrapper: { flexDirection: 'row', alignItems: 'center' },
    stepDot: { 
        width: 28, 
        height: 28, 
        borderRadius: 14, 
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    stepDotActive: { backgroundColor: MINT, borderColor: MINT },
    stepDotText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
    stepDotTextActive: { color: '#fff' },
    stepLine: { width: 30, height: 2, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
    stepLineActive: { backgroundColor: MINT },
    
    // Step card
    stepCard: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 24,
        padding: 28,
        shadowColor: MINT_DARK,
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        alignItems: 'center',
    },
    successCard: {
        backgroundColor: 'rgba(240,253,244,0.98)',
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(46,196,182,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    iconCircleSuccess: {
        backgroundColor: MINT,
    },
    stepTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: '#1a1a2e', marginBottom: 8 },
    stepSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    passwordHint: { 
        fontSize: 13, 
        color: '#64748b', 
        textAlign: 'center', 
        marginBottom: 20,
        backgroundColor: 'rgba(46,196,182,0.08)',
        padding: 12,
        borderRadius: 12,
        width: '100%',
    },
    
    // Input
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 14,
        width: '100%',
    },
    inputIcon: { marginRight: 12 },
    input: { 
        flex: 1, 
        paddingVertical: 16, 
        fontSize: 16, 
        color: '#1a1a2e' 
    },
    
    // Code input
    codeWrapper: { alignItems: 'center', marginBottom: 20 },
    codeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    codeBox: { 
        width: 48, 
        height: 56, 
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        alignItems: 'center', 
        justifyContent: 'center',
    },
    codeBoxFilled: { borderColor: MINT, backgroundColor: 'rgba(46,196,182,0.05)' },
    codeDigit: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
    
    resendBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6,
        paddingVertical: 12,
    },
    resendText: { color: MINT, fontSize: 14, fontWeight: '500' },
    
    // Buttons
    buttonContainer: { marginTop: 24, alignItems: 'center' },
    nextBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    nextBtnDisabled: { opacity: 0.7 },
    nextBtnGrad: { 
        paddingVertical: 18, 
        alignItems: 'center', 
        borderRadius: 16,
    },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    nextBtnTextDisabled: { color: '#94a3b8' },
    
    backLink: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4, 
        marginTop: 16,
        paddingVertical: 8,
    },
    backLinkText: { color: '#64748b', fontSize: 14 },
    
    loginBtn: { width: '100%', marginTop: 24, borderRadius: 16, overflow: 'hidden' },
    loginBtnGrad: { paddingVertical: 18, alignItems: 'center', borderRadius: 16 },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    
    errorText: { color: '#EF4444', fontSize: 13, marginTop: 4 },
});