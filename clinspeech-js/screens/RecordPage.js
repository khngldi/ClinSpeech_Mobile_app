import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    TextInput, ActivityIndicator, Alert, Animated, Easing, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson } from '../api';
import { useLocale } from '../i18n/LocaleContext';

const MINT = '#2ec4b6';
const MINT_LIGHT = '#5eead4';
const MINT_DARK = '#14b8a6';
const MINT_BG = '#f0fdfa';
const PURPLE = '#a78bfa';
const { width: SW } = Dimensions.get('window');

// NCS-style circular visualizer settings
const VISUALIZER_BARS = 64;
const BUTTON_SIZE = 130;
const INNER_RADIUS = 80; // Start of bars from center
const BAR_WIDTH = 3;

/* ── NCS-style Circular Audio Visualizer ── */
function NCSVisualizer({ waveAnims, isActive }) {
    const containerSize = INNER_RADIUS * 2 + 80;
    
    return (
        <View style={{
            position: 'absolute',
            width: containerSize,
            height: containerSize,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {waveAnims.map((anim, i) => {
                const angle = (i / VISUALIZER_BARS) * 2 * Math.PI - Math.PI / 2;
                const rotation = (i / VISUALIZER_BARS) * 360;
                
                // Create color gradient effect around the circle
                const hue = 170 + (i / VISUALIZER_BARS) * 30; // Teal to cyan
                const barColor = isActive ? `hsl(${hue}, 70%, 55%)` : 'rgba(46,196,182,0.15)';
                
                return (
                    <Animated.View
                        key={i}
                        style={{
                            position: 'absolute',
                            width: BAR_WIDTH,
                            height: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [6, 40],
                            }),
                            backgroundColor: barColor,
                            borderRadius: BAR_WIDTH / 2,
                            // Position at center, then translate outward
                            transform: [
                                { rotate: `${rotation}deg` },
                                { translateY: -INNER_RADIUS - 10 },
                            ],
                            opacity: isActive ? anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.5, 1],
                            }) : 0.3,
                            // Glow effect
                            shadowColor: MINT,
                            shadowOpacity: isActive ? 0.6 : 0,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 0 },
                        }}
                    />
                );
            })}
            
            {/* Inner glow ring */}
            {isActive && (
                <View style={{
                    position: 'absolute',
                    width: INNER_RADIUS * 2 + 10,
                    height: INNER_RADIUS * 2 + 10,
                    borderRadius: INNER_RADIUS + 5,
                    borderWidth: 2,
                    borderColor: 'rgba(46,196,182,0.3)',
                    backgroundColor: 'transparent',
                }} />
            )}
        </View>
    );
}

/* ── Pulsing glow ring during recording ── */
function PulsingRing({ delay }) {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 1.8, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
                ]),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={{
            position: 'absolute',
            width: BUTTON_SIZE + 20, 
            height: BUTTON_SIZE + 20, 
            borderRadius: (BUTTON_SIZE + 20) / 2,
            borderWidth: 3, 
            borderColor: MINT_LIGHT,
            opacity, 
            transform: [{ scale }],
        }} />
    );
}

export default function RecordPage({ navigation }) {
    const { t } = useLocale();
    const [step, setStep] = useState(1);
    const [patients, setPatients] = useState([]);
    const [patientsLoading, setPatientsLoading] = useState(true);
    const [patientSearch, setPatientSearch] = useState('');
    const [patientId, setPatientId] = useState(null);

    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUri, setAudioUri] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [micError, setMicError] = useState('');
    const timerRef = useRef(null);

    // Circular visualizer animations
    const waveAnims = useRef(
        [...Array(VISUALIZER_BARS)].map(() => new Animated.Value(0.2))
    ).current;

    // Mic button pulse
    const btnPulse = useRef(new Animated.Value(1)).current;

    const [uploading, setUploading] = useState(false);
    const [autoProcess, setAutoProcess] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch('/patients/')
            .then(safeJson)
            .then(data => setPatients(Array.isArray(data) ? data : (data?.results || [])))
            .catch(() => {})
            .finally(() => setPatientsLoading(false));
    }, []);

    useEffect(() => {
        checkPermissions();
        return () => {
            clearInterval(timerRef.current);
            stopWaveAnimation();
        };
    }, []);

    // Pulse the mic button when recording
    useEffect(() => {
        if (isRecording && !isPaused) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(btnPulse, { toValue: 1.08, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(btnPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            ).start();
        } else {
            btnPulse.stopAnimation();
            btnPulse.setValue(1);
        }
    }, [isRecording, isPaused]);

    const checkPermissions = async () => {
        try {
            const { status } = await Audio.getPermissionsAsync();
            setPermissionGranted(status === 'granted');
        } catch {}
    };

    const requestPermissions = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status === 'granted') {
                setPermissionGranted(true);
                setMicError('');
                return true;
            } else {
                setMicError(t('Разрешение на микрофон не предоставлено. Проверьте настройки.'));
                return false;
            }
        } catch (e) {
            setMicError(t('Не удалось запросить разрешение на микрофон'));
            return false;
        }
    };

    const startWaveAnimation = () => {
        waveAnims.forEach((anim, i) => {
            // Create wave-like pattern - bars next to each other have similar values
            const baseDelay = (i % 8) * 15; // Group bars for wave effect
            
            const loop = () => {
                const peakValue = 0.4 + Math.random() * 0.6;
                const valleyValue = 0.05 + Math.random() * 0.2;
                const duration = 80 + Math.random() * 120;
                
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: peakValue,
                        duration: duration,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: false,
                    }),
                    Animated.timing(anim, {
                        toValue: valleyValue,
                        duration: duration * 1.2,
                        easing: Easing.in(Easing.quad),
                        useNativeDriver: false,
                    }),
                ]).start(loop);
            };
            setTimeout(loop, baseDelay);
        });
    };

    const stopWaveAnimation = () => {
        waveAnims.forEach(anim => {
            anim.stopAnimation();
            anim.setValue(0.2);
        });
    };

    const startRecording = async () => {
        setMicError('');
        setError('');
        if (!permissionGranted) {
            const granted = await requestPermissions();
            if (!granted) return;
        }
        try {
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const rec = new Audio.Recording();
            await rec.prepareToRecordAsync({
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                isMeteringEnabled: true,
            });
            await rec.startAsync();
            setRecording(rec);
            setIsRecording(true);
            setIsPaused(false);
            setDuration(0);
            setAudioUri(null);
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
            startWaveAnimation();
        } catch (e) {
            setMicError(t('Не удалось запустить запись. Проверьте доступность микрофона.'));
        }
    };

    const pauseRecording = async () => {
        if (!recording) return;
        try {
            await recording.pauseAsync();
            setIsPaused(true);
            clearInterval(timerRef.current);
            stopWaveAnimation();
        } catch (e) { setMicError(t('Ошибка при паузе записи')); }
    };

    const resumeRecording = async () => {
        if (!recording) return;
        try {
            await recording.startAsync();
            setIsPaused(false);
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
            startWaveAnimation();
        } catch (e) { setMicError(t('Ошибка при возобновлении записи')); }
    };

    const stopRecording = async () => {
        if (!recording) return;
        try {
            clearInterval(timerRef.current);
            stopWaveAnimation();
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setAudioUri(uri);
            setIsRecording(false);
            setIsPaused(false);
            setRecording(null);
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        } catch (e) { setMicError(t('Ошибка при остановке записи')); }
    };

    const resetRecording = () => {
        setAudioUri(null);
        setDuration(0);
        setIsRecording(false);
        setIsPaused(false);
        setRecording(null);
        setMicError('');
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    const handleSubmit = async () => {
        if (!audioUri || !patientId) return;
        setUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('audio_file', {
                uri: audioUri,
                type: 'audio/m4a',
                name: `consultation_${Date.now()}.m4a`,
            });
            formData.append('patient', String(patientId));
            const res = await apiFetch('/consultations/', { method: 'POST', body: formData });
            if (!res.ok) {
                const d = await safeJson(res);
                throw new Error(typeof d === 'object' ? JSON.stringify(d) : t('Ошибка создания консультации'));
            }
            const data = await safeJson(res);
            if (autoProcess && data.id) {
                try { await apiFetch(`/consultations/${data.id}/start_processing/`, { method: 'POST' }); } catch {}
            }
            Alert.alert(t('Успешно'), t('Консультация создана'), [
                { text: 'OK', onPress: () => {
                    navigation.navigate('MainTabs', { screen: 'Главная', params: { screen: 'HomeList' } });
                }}
            ]);
        } catch (err) {
            setError(err.message || t('Ошибка отправки'));
        } finally { setUploading(false); }
    };

    const filtered = patients.filter(p =>
        `${p.last_name} ${p.first_name} ${p.middle_name || ''}`.toLowerCase().includes(patientSearch.toLowerCase())
    );
    const selectedPatient = patients.find(p => p.id === patientId);

    return (
        <View style={st.container}>
            <AnimatedGradientBackground />

            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={st.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color="#1a1a2e" />
                    </TouchableOpacity>
                    <Text style={st.headerTitle}>{t('Новая запись')}</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Steps indicator */}
                <View style={st.steps}>
                    {[1, 2, 3].map(s => (
                        <View key={s} style={st.stepRow}>
                            <View style={[st.stepCircle, step >= s && st.stepActive]}>
                                <Text style={[st.stepNum, step >= s && { color: '#fff' }]}>{s}</Text>
                            </View>
                            <Text style={[st.stepLabel, step >= s && { color: MINT_DARK }]}>
                                {{ 1: t('Пациент'), 2: t('Запись'), 3: t('Отправка') }[s]}
                            </Text>
                            {s < 3 && <View style={[st.stepLine, step > s && st.stepLineActive]} />}
                        </View>
                    ))}
                </View>

                {(error || micError) ? (
                    <View style={st.errorBanner}>
                        <Ionicons name="warning" size={16} color="#E74C3C" />
                        <Text style={st.errorText}>{error || micError}</Text>
                    </View>
                ) : null}

                {/* ── Step 1: Patient ── */}
                {step === 1 && (
                    <View style={st.stepContent}>
                        <View style={st.card}>
                            <Text style={st.cardTitle}>{t('Выберите пациента')}</Text>
                            <Text style={st.cardSubtitle}>{t('Для начала записи приёма')}</Text>
                            <View style={st.searchBar}>
                                <Ionicons name="search" size={16} color={MINT} />
                                <TextInput
                                    style={st.searchInput}
                                    placeholder={t('Поиск по ФИО...')}
                                    placeholderTextColor="#999"
                                    value={patientSearch}
                                    onChangeText={setPatientSearch}
                                />
                            </View>
                            {patientsLoading ? (
                                <ActivityIndicator color={MINT} style={{ marginTop: 20 }} />
                            ) : (
                                <FlatList
                                    data={filtered}
                                    keyExtractor={item => String(item.id)}
                                    style={{ maxHeight: 300 }}
                                    showsVerticalScrollIndicator={false}
                                    ListEmptyComponent={<Text style={st.emptyText}>{t('Пациенты не найдены')}</Text>}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[st.patientItem, patientId === item.id && st.patientSelected]}
                                            onPress={() => setPatientId(item.id)}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={st.patientName}>
                                                    {item.last_name} {item.first_name} {item.middle_name || ''}
                                                </Text>
                                                <Text style={st.patientMeta}>{t('Дата рождения:')} {item.birth_date || '—'}</Text>
                                            </View>
                                            {patientId === item.id && (
                                                <Ionicons name="checkmark-circle" size={22} color={MINT} />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>
                        <TouchableOpacity
                            style={[st.nextBtn, !patientId && { opacity: 0.5 }]}
                            disabled={!patientId}
                            onPress={() => setStep(2)}
                        >
                            <LinearGradient colors={[MINT, MINT_DARK]} style={st.nextBtnGrad}>
                                <Text style={st.nextBtnText}>{t('Далее →')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Step 2: Modern Recording with NCS-style Visualizer ── */}
                {step === 2 && (
                    <View style={st.recordContainer}>
                        {!audioUri ? (
                            <>
                                {/* Timer */}
                                <Text style={st.shazamTimer}>{formatTime(duration)}</Text>

                                {/* Center: NCS-style circular visualizer + mic button */}
                                <View style={st.shazamCenter}>
                                    {/* Pulsing rings when recording */}
                                    {isRecording && !isPaused && (
                                        <>
                                            <PulsingRing delay={0} />
                                            <PulsingRing delay={500} />
                                            <PulsingRing delay={1000} />
                                        </>
                                    )}

                                    {/* NCS-style circular visualizer */}
                                    <NCSVisualizer 
                                        waveAnims={waveAnims} 
                                        isActive={isRecording && !isPaused} 
                                    />

                                    {/* Central mic button with Main_Button.png */}
                                    <Animated.View style={[st.mainButtonWrapper, { transform: [{ scale: btnPulse }] }]}>
                                        <TouchableOpacity
                                            style={[st.shazamBtn, isRecording && st.shazamBtnRecording]}
                                            onPress={!isRecording ? startRecording : undefined}
                                            disabled={isRecording}
                                            activeOpacity={0.8}
                                        >
                                            <Image
                                                source={require('../assets/Main_Button.png')}
                                                style={st.mainButtonImage}
                                            />
                                        </TouchableOpacity>
                                    </Animated.View>
                                </View>

                                <Text style={st.shazamHint}>
                                    {isRecording ? (isPaused ? t('На паузе') : t('Идёт запись...')) : t('Нажмите для начала записи')}
                                </Text>

                                {/* Controls */}
                                {isRecording && (
                                    <View style={st.shazamControls}>
                                        <TouchableOpacity
                                            style={st.shazamCtrlBtn}
                                            onPress={isPaused ? resumeRecording : pauseRecording}
                                        >
                                            <Ionicons name={isPaused ? 'play' : 'pause'} size={22} color={MINT_DARK} />
                                            <Text style={st.shazamCtrlText}>{isPaused ? t('Продолжить') : t('Пауза')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[st.shazamCtrlBtn, st.shazamStopBtn]}
                                            onPress={stopRecording}
                                        >
                                            <Ionicons name="stop" size={22} color="#EF4444" />
                                            <Text style={[st.shazamCtrlText, { color: '#EF4444' }]}>{t('Остановить')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        ) : (
                            /* ── Playback after recording ── */
                            <>
                                <Text style={st.shazamTimer}>{formatTime(duration)}</Text>

                                <View style={st.recordedBadge}>
                                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                    <Text style={st.recordedText}>{t('Запись завершена')}</Text>
                                </View>

                                {/* Play button */}
                                <TouchableOpacity style={st.playBtn} activeOpacity={0.8}>
                                    <LinearGradient colors={[MINT, MINT_LIGHT]} style={st.playBtnGrad}>
                                        <Ionicons name="play" size={32} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={st.shazamControls}>
                                    <TouchableOpacity style={st.shazamCtrlBtn} onPress={resetRecording}>
                                        <Ionicons name="refresh" size={20} color={MINT_DARK} />
                                        <Text style={st.shazamCtrlText}>{t('Отменить')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[st.shazamCtrlBtn, st.shazamNextBtn]}
                                        onPress={() => setStep(3)}
                                    >
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                        <Text style={[st.shazamCtrlText, { color: '#fff' }]}>{t('Готово → Отправить')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        <TouchableOpacity style={st.backBtnFloat} onPress={() => { stopRecording(); resetRecording(); setStep(1); }}>
                            <Text style={st.backBtnText}>{t('← Назад')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Step 3: Confirm & Submit ── */}
                {step === 3 && (
                    <View style={st.stepContent}>
                        <View style={st.card}>
                            <Text style={st.cardTitle}>{t('Подтвердите отправку')}</Text>

                            <View style={st.confirmItem}>
                                <Text style={st.confirmLabel}>{t('Пациент:')}</Text>
                                <Text style={st.confirmValue}>
                                    {selectedPatient ? `${selectedPatient.last_name} ${selectedPatient.first_name}` : '—'}
                                </Text>
                            </View>

                            <View style={st.confirmItem}>
                                <Text style={st.confirmLabel}>{t('Длительность:')}</Text>
                                <Text style={st.confirmValue}>{formatTime(duration)}</Text>
                            </View>

                            <TouchableOpacity style={st.checkboxRow} onPress={() => setAutoProcess(!autoProcess)}>
                                <Ionicons name={autoProcess ? 'checkbox' : 'square-outline'} size={22} color={MINT} />
                                <Text style={st.checkboxText}>{t('Авто-обработка ИИ')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[st.submitBtn, uploading && { opacity: 0.6 }]}
                                onPress={handleSubmit}
                                disabled={uploading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={[MINT, MINT_DARK]} style={st.submitBtnGrad}>
                                    {uploading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={st.submitText}>🚀 {t('Отправить')}</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={st.backBtn} onPress={() => setStep(2)}>
                            <Text style={st.backBtnTextAlt}>{t('← Назад')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
    steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginBottom: 20 },
    stepRow: { flexDirection: 'row', alignItems: 'center' },
    stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(46,196,182,0.15)', justifyContent: 'center', alignItems: 'center' },
    stepActive: { backgroundColor: MINT },
    stepNum: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
    stepLabel: { fontSize: 12, color: '#94a3b8', marginLeft: 4, fontWeight: '500' },
    stepLine: { width: 20, height: 2, backgroundColor: 'rgba(46,196,182,0.2)', marginHorizontal: 6 },
    stepLineActive: { backgroundColor: MINT },
    stepContent: { flex: 1, paddingHorizontal: 16, justifyContent: 'center' },
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 10, gap: 8 },
    errorText: { color: '#E74C3C', fontSize: 13, flex: 1 },
    // Card
    card: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 24, shadowColor: MINT_DARK, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
    cardSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: MINT_BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: MINT_LIGHT + '40' },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },
    emptyText: { textAlign: 'center', color: '#bbb', paddingVertical: 24, fontSize: 14 },
    patientItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 6 },
    patientSelected: { borderColor: MINT, backgroundColor: MINT_BG },
    patientName: { fontSize: 14, fontWeight: '600', color: '#333' },
    patientMeta: { fontSize: 12, color: '#888', marginTop: 2 },
    nextBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
    nextBtnGrad: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    // Step 2: NCS-style recording with circular visualizer
    recordContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    shazamTimer: { fontSize: 56, fontWeight: '200', letterSpacing: 4, color: '#1a1a2e', marginBottom: 24 },
    shazamCenter: { 
        width: 280, 
        height: 280, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 16,
    },
    mainButtonWrapper: {
        position: 'absolute',
        zIndex: 10,
    },
    shazamBtn: { 
        width: BUTTON_SIZE, 
        height: BUTTON_SIZE, 
        borderRadius: BUTTON_SIZE / 2, 
        shadowColor: MINT, 
        shadowOpacity: 0.4, 
        shadowRadius: 25, 
        shadowOffset: { width: 0, height: 8 }, 
        elevation: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    shazamBtnRecording: { 
        shadowOpacity: 0.6, 
        shadowRadius: 35,
        shadowColor: MINT_LIGHT,
    },
    mainButtonImage: { 
        width: BUTTON_SIZE, 
        height: BUTTON_SIZE, 
        borderRadius: BUTTON_SIZE / 2,
    },
    shazamHint: { color: '#64748b', fontSize: 14, marginBottom: 28, marginTop: 12 },
    shazamControls: { flexDirection: 'row', gap: 14 },
    shazamCtrlBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 22, paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    shazamCtrlText: { fontSize: 14, fontWeight: '500', color: MINT_DARK },
    shazamStopBtn: { backgroundColor: '#FEF2F2' },
    shazamNextBtn: { backgroundColor: MINT },
    // Playback
    recordedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(240,253,244,0.9)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginBottom: 24 },
    recordedText: { color: '#22C55E', fontWeight: '600', fontSize: 15 },
    playBtn: { width: 72, height: 72, borderRadius: 36, marginBottom: 24, shadowColor: MINT, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
    playBtnGrad: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    backBtnFloat: { position: 'absolute', bottom: 24, left: 24 },
    backBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
    backBtn: { alignItems: 'center', paddingVertical: 14 },
    backBtnTextAlt: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
    // Confirm
    confirmItem: { backgroundColor: MINT_BG, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: MINT_LIGHT + '30' },
    confirmLabel: { fontSize: 12, color: '#888' },
    confirmValue: { fontSize: 15, fontWeight: '600', color: '#333', marginTop: 2 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16 },
    checkboxText: { fontSize: 14, color: '#555' },
    submitBtn: { borderRadius: 14, overflow: 'hidden' },
    submitBtnGrad: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
